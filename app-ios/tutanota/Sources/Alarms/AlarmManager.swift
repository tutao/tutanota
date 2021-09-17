import Foundation

// iOS (13.3 at least) has a limit on saved alarms which empirically inferred to be.
// It means that only *last* 64 alarms are stored in the internal plist by SpringBoard.
// If we schedule too many some alarms will not be fired. We should be careful to not
// schedule too far into the future.
//
// Better approach would be to calculate occurences from all alarms, sort them and take
// the first 64. Or schedule later ones first so that newer ones have higher priority.
private let EVENTS_SCHEDULED_AHEAD = 24

private let MISSED_NOTIFICATION_TTL_SEC: Int64 = 30 * 24 * 60 * 60; // 30 days

enum HttpStatusCode: Int {
  case ok = 200
  case notAuthenticated = 401
  case notFound = 404
  case tooManyRequests = 429
  case serviceUnavailable = 503
}

class AlarmManager {
  private let keychainManager: KeychainManager
  private let userPreference: UserPreferenceFacade
  private let fetchQueue: OperationQueue
  
  init(keychainManager: KeychainManager, userPreference: UserPreferenceFacade) {
    self.keychainManager = keychainManager
    self.userPreference = userPreference
    self.fetchQueue = OperationQueue()
    self.fetchQueue.maxConcurrentOperationCount = 1
  }
  
  func initialize() {
    if self.hasNotificationTTLExpired() {
      self.resetStoredState()
    } else {
      self.fetchMissedNotifications { err in
        if let err = err {
          TUTSLog("Failed to fetch/process missed notification \(err)")
        } else {
          TUTSLog("Successfully processed missed notification")
        }
      }
      self.rescheduleAlarms()
    }
  }
  
  func fetchMissedNotifications(_ completionHandler: @escaping (Error?) -> Void) {
    TUTSLog("Adding fetch notificaiton operation to queue")
    self.fetchQueue.addAsyncOperation {[weak self] queueCompletionHandler in
      guard let self = self else {
        return
      }
      func complete(error: Error?) {
        queueCompletionHandler()
        completionHandler(error)
      }
      
      guard let sseInfo = self.userPreference.sseInfo else {
        TUTSLog("No stored SSE info")
        complete(error: nil)
        return
      }
      
      var additionalHeaders = [String: String]()
      addSystemModelHeaders(to: &additionalHeaders)
      
      if sseInfo.userIds.isEmpty {
        TUTSLog("No users to download missed notification with")
        self.unscheduleAllAlarms(userId: nil)
        complete(error: nil)
        return
      }
      
      let userId: String = sseInfo.userIds[0]
      additionalHeaders["userIds"] = userId
      if let lastNoficationId = self.userPreference.lastProcessedNotificationId {
        additionalHeaders["lastProcessedNotificationId"] = lastNoficationId
      }
      let configuration = URLSessionConfiguration.ephemeral
      configuration.httpAdditionalHeaders = additionalHeaders
      
      let urlSession = URLSession(configuration: configuration)
      let urlString = self.missedNotificationUrl(origin: sseInfo.sseOrigin, pushIdentifier: sseInfo.pushIdentifier)
      
      TUTSLog("Downloading missed notification with userId \(userId)")
      
      urlSession.dataTask(with: URL(string: urlString)!) { data, response, error in
        if let error = error {
          TUTSLog("Fetched missed notifications with errror \(error)")
          complete(error: error)
          return
        }
        let httpResponse = response as! HTTPURLResponse
        TUTSLog("Fetched missed notifications with status code \(httpResponse.statusCode)")
        switch (HttpStatusCode.init(rawValue: httpResponse.statusCode)) {
        case .notAuthenticated:
          TUTSLog("Not authenticated to download missed notification w/ user \(userId)")
          self.unscheduleAllAlarms(userId: userId)
          self.userPreference.removeUser(userId)
          queueCompletionHandler()
          self.fetchMissedNotifications(completionHandler)
        case .serviceUnavailable, .tooManyRequests:
          let suspensionTime = extractSuspensionTime(from: httpResponse)
          TUTSLog("SericeUnavailable when downloading missed notification, waiting for \(suspensionTime)s")
          DispatchQueue.main
            .asyncAfter(deadline: .now() + .seconds(suspensionTime)) {
              self.fetchMissedNotifications(completionHandler)
            }
          queueCompletionHandler()
        case .notFound:
          complete(error: nil)
        case .ok:
          self.userPreference.lastMissedNotificationCheckTime = Date()
          let missedNotification: MissedNotification
          do {
           missedNotification = try JSONDecoder().decode(MissedNotification.self, from: data!)
          } catch {
            TUTSLog("Failed to parse response for the missed notification request")
            complete(error: error)
            return
          }
          self.userPreference.lastProcessedNotificationId = missedNotification.lastProcessedNotificationId
          self.processNewAlarms(missedNotification.alarmNotifications, completion: complete)
        default:
          let errorId = httpResponse.allHeaderFields["Error-Id"]
          let error = NSError(domain: TUT_NETWORK_ERROR, code: httpResponse.statusCode, userInfo: [
            "message": "Failed to fetch missed notification, error id: \(errorId ?? "")"
          ])
          complete(error: error)
        }
      }.resume()
    }
  }
  
  func processNewAlarms(_ notifications: Array<EncryptedAlarmNotification>, completion: @escaping (Error?) -> Void) {
    DispatchQueue.global(qos: .utility).async {
      var savedNotifications = self.userPreference.alarms
      var resultError: Error?
      for alarmNotification in notifications {
        do {
          try self.handleAlarmNotification(alarmNotification, existringAlarms: &savedNotifications)
        } catch {
          TUTSLog("Errror while handling alarm \(error)")
          resultError = error
        }
      }
      
      TUTSLog("Finished processing \(notifications.count) alarms")
      self.userPreference.store(alarms: savedNotifications)
      completion(resultError)
    }
  }
  
  private func hasNotificationTTLExpired() -> Bool {
    guard let lastMissedNotificationCheckTime = userPreference.lastMissedNotificationCheckTime else {
      return false
    }
    let sinceNow = lastMissedNotificationCheckTime.timeIntervalSinceNow
    // Important: timeIntervalSinceNow is negative if it's in the past
    return sinceNow < 0 && Int64(abs(sinceNow)) > MISSED_NOTIFICATION_TTL_SEC
  }
  
  private func resetStoredState() {
    TUTSLog("Resetting stored state")
    self.unscheduleAllAlarms(userId: nil)
    self.userPreference.clear()
    do {
      try keychainManager.removePushIdentifierKeys()
    } catch {
      TUTSLog("Faied to remove pushIdentifier keys \(error)")
    }
  }
  
  private func rescheduleAlarms() {
    TUTSLog("Re-scheduling alarms")
    DispatchQueue.global(qos: .background).async {
      for notification in self.savedAlarms() {
        autoreleasepool {
          do {
            try self.scheduleAlarm(notification)
          } catch {
            TUTSLog("Error when re-scheduling alarm \(notification) \(error)")
          }
        }
      }
    }
  }
  
  private func savedAlarms() -> Set<EncryptedAlarmNotification> {
    let savedNotifications = self.userPreference.alarms
    let set = Set(savedNotifications)
    if set.count != savedNotifications.count {
      TUTSLog("Duplicated alarms detected, re-saving...")
      self.userPreference.store(alarms: Array(set))
    }
    return set
  }
  
  private func handleAlarmNotification(
    _ alarm: EncryptedAlarmNotification,
    existringAlarms: inout Array<EncryptedAlarmNotification>
  ) throws {
    switch alarm.operation {
    case .Create:
      do {
        try self.scheduleAlarm(alarm)
        if !existringAlarms.contains(alarm) {
          existringAlarms.append(alarm)
        }
      } catch {
        throw error
      }
    case .Delete:
      let alarmToUnschedule = existringAlarms.first { $0 == alarm } ?? alarm
      do {
        try self.unscheduleAlarm(alarmToUnschedule)
      } catch {
        TUTSLog("Failed to cancel alarm \(alarm) \(error)")
        throw error
      }
      if let index = existringAlarms.firstIndex(of: alarmToUnschedule) {
        existringAlarms.remove(at: index)
      }
    default:
      fatalError("Unexpected operation for alarm: \(alarm.operation)")
    }
  }
  
  private func unscheduleAllAlarms(userId: String?) {
    let alarms = self.userPreference.alarms
    for alarm in alarms {
      if userId != nil && userId != alarm.user {
        continue
      }
      do {
        try self.unscheduleAlarm(alarm)
      } catch {
        TUTSLog("Error while unscheduling of all alarms \(error)")
      }
    }
  }
  
  private func missedNotificationUrl(origin: String, pushIdentifier: String) -> String {
    let base64UrlId = stringToCustomId(customId: pushIdentifier)
    return "\(origin)/rest/sys/missednotification/\(base64UrlId)"
  }
  
  private func scheduleAlarm(_ encAlarmNotification: EncryptedAlarmNotification) throws {
    let sessionKey = self.resolveSessionkey(alarmNotification: encAlarmNotification)
    guard let sessionKey = sessionKey else {
      throw TUTErrorFactory.createError("Cannot resolve session key")
    }
    let alarmNotification = try AlarmNotification(encrypted: encAlarmNotification, sessionKey: sessionKey)
    var occurrences = [OcurrenceInfo]()
    
    if let repeatRule = alarmNotification.repeatRule {
      occurrences = try self.iterateRepeatingAlarm(
        eventStart: alarmNotification.eventStart,
        eventEnd: alarmNotification.eventEnd,
        trigger: alarmNotification.alarmInfo.trigger,
        repeatRule: repeatRule
      )
    } else {
      let singleOcurrence = OcurrenceInfo(occurrence: 0, ocurrenceTime: alarmNotification.eventStart)
      occurrences = [singleOcurrence]
    }
    for ocurrence in occurrences {
      self.scheduleAlarmOcurrence(
        ocurrenceInfo: ocurrence,
        trigger: alarmNotification.alarmInfo.trigger,
        summary: alarmNotification.summary,
        alarmIdentifier: alarmNotification.alarmInfo.alarmIdentifer
      )
    }
  }
  
  private func unscheduleAlarm(_ encAlarmNotification: EncryptedAlarmNotification) throws {
    let alarmIdentifier = encAlarmNotification.alarmInfo.alarmIdentifier
    let sessionKey = self.resolveSessionkey(alarmNotification: encAlarmNotification)
    guard let sessionKey = sessionKey else {
      throw TUTErrorFactory.createError("Cannot resolve session key on unschedule \(alarmIdentifier)")
    }
    let alarmNotification = try AlarmNotification(encrypted: encAlarmNotification, sessionKey: sessionKey)
    
    let occurrenceIds: [String]
    if let repeatRule = alarmNotification.repeatRule {
      let ocurrences = try self.iterateRepeatingAlarm(
        eventStart: alarmNotification.eventStart,
        eventEnd: alarmNotification.eventEnd,
        trigger: alarmNotification.alarmInfo.trigger,
        repeatRule: repeatRule
      )
      occurrenceIds = ocurrences.map { o in
        ocurrenceIdentifier(alarmIdentifier: alarmIdentifier, occurrence: o.occurrence)
      }
    } else {
      occurrenceIds = [ocurrenceIdentifier(alarmIdentifier: alarmIdentifier, occurrence: 0)]
    }
    TUTSLog("Cancelling alarm \(alarmIdentifier)")
    UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: occurrenceIds)
  }
  
  private func resolveSessionkey(alarmNotification: EncryptedAlarmNotification) -> Data? {
    var lastError: Error?
    for notificationSessionKey in alarmNotification.notificationSessionKeys {
      do {
        let pushIdentifierSessionKey = try self.keychainManager
          .getKey(keyId: notificationSessionKey.pushIdentifier.elementId)
        guard let pushIdentifierSessionKey = pushIdentifierSessionKey else {
          continue
        }
        let encSessionKey = Data(base64Encoded: notificationSessionKey.pushIdentifierSessionEncSessionKey)!
        return try TUTAes128Facade.decryptKey(encSessionKey, withEncryptionKey: pushIdentifierSessionKey)
      } catch {
        TUTSLog("Failed to decrypt key \(notificationSessionKey.pushIdentifier.elementId) \(error)")
        lastError = error
      }
    }
    TUTSLog("Failed to resolve session key \(alarmNotification.alarmInfo.alarmIdentifier), last error: \(String(describing: lastError))")
    return nil
  }
  
  private func iterateRepeatingAlarm(
    eventStart: Date,
    eventEnd: Date,
    trigger: String,
    repeatRule: RepeatRule
  ) throws -> [OcurrenceInfo] {
    let now = Date()
    var ocurrences = [OcurrenceInfo]()
    AlarmModel.iterateRepeatingAlarm(
      eventStart: eventStart,
      eventEnd: eventEnd,
      repeatRule: repeatRule,
      now: now,
      localTimeZone: TimeZone.current,
      scheduleAhead: EVENTS_SCHEDULED_AHEAD
    ) { ocurrnce, occurrenceTime in
      let info = OcurrenceInfo(
        occurrence: Int(ocurrnce),
        ocurrenceTime: occurrenceTime
      )
      ocurrences.append(info)
    }
    return ocurrences
  }
  
  private func scheduleAlarmOcurrence(
    ocurrenceInfo: OcurrenceInfo,
    trigger: String,
    summary: String,
    alarmIdentifier: String
  ) {
    let alarmTime = AlarmModel.alarmTime(trigger: trigger, eventTime: ocurrenceInfo.ocurrenceTime)
    
    if alarmTime.timeIntervalSinceNow < 0 {
      TUTSLog("Alarm is in the past \(alarmIdentifier) \(alarmTime)")
      return
    }
    let fortNightSeconds: Double = 60 * 60 * 24 * 14
    if alarmTime.timeIntervalSinceNow > fortNightSeconds {
      TUTSLog("Event alarm is too far into the future \(alarmIdentifier) \(alarmTime)")
    }
    
    let formmatedTime = DateFormatter.localizedString(
      from: ocurrenceInfo.ocurrenceTime,
      dateStyle: .short,
      timeStyle: .short
    )
    let notificationText = "\(formmatedTime): \(summary)"
    let cal = Calendar.current
    let dateComponents = cal.dateComponents(
      [.year, .month, .day, .hour, .minute],
      from: alarmTime
    )
    let notificationTrigger = UNCalendarNotificationTrigger(
      dateMatching: dateComponents,
      repeats: false
    )
    let content = UNMutableNotificationContent()
    content.title = translate("TutaoCalendarAlarmTitle", default: "Reminder")
    content.body = notificationText
    content.sound = UNNotificationSound.default
    
    let identifier = ocurrenceIdentifier(
      alarmIdentifier: alarmIdentifier,
      occurrence: ocurrenceInfo.occurrence
    )
    let request = UNNotificationRequest(
      identifier: identifier,
      content: content,
      trigger: notificationTrigger
    )
    TUTSLog("Scheduling a notification \(identifier) at \(cal.date(from: dateComponents)!)")
    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        // We should make the whole funciton async and wait for it
        TUTSLog("Failed to schedule a notification \(error)")
      }
    }
  }
}

func stringToCustomId(customId: String) -> String {
  return customId.data(using: .utf8)!
    .base64EncodedString()
    .replacingOccurrences(of: "+", with: "-")
    .replacingOccurrences(of: "/", with: "_")
    .replacingOccurrences(of: "=", with: "")
}

/**
 Gets suspension time from the request in seconds
 */
fileprivate func extractSuspensionTime(from httpResponse: HTTPURLResponse) -> Int {
  let retryAfterHeader =
    (httpResponse.allHeaderFields["Retry-After"] ?? httpResponse.allHeaderFields["Suspension-Time"])
    as! String?
  return retryAfterHeader.flatMap { Int($0) } ?? 0
}

fileprivate struct OcurrenceInfo {
  let occurrence: Int
  let ocurrenceTime: Date
}

fileprivate func ocurrenceIdentifier(alarmIdentifier: String, occurrence: Int) -> String {
  return "\(alarmIdentifier)#\(occurrence)"
}
