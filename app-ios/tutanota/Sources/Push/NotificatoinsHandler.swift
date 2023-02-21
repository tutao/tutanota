import Foundation

private let MISSED_NOTIFICATION_TTL_SEC: Int64 = 30 * 24 * 60 * 60; // 30 days

class NotificationsHandler {
  private let alarmManager: AlarmManager
  private let userPreference: UserPreferenceFacade
  private let fetchQueue: OperationQueue
  
  init(alarmManager: AlarmManager, userPreference: UserPreferenceFacade) {
    self.alarmManager = alarmManager
    self.userPreference = userPreference
    self.fetchQueue = OperationQueue()
    self.fetchQueue.maxConcurrentOperationCount = 1
  }
  
  func initialize() {
    if self.hasNotificationTTLExpired() {
      self.alarmManager.resetStoredState()
    } else {
      self.fetchMissedNotifications { result in
        switch result {
        case .success():
          TUTSLog("Successfully processed missed notification")
        case .failure(let err):
          TUTSLog("Failed to fetch/process missed notification \(err)")
        }
      }
      DispatchQueue.global(qos: .background).async {
        self.alarmManager.rescheduleAlarms()
      }
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
  
  /// Fetch and process missed notification. Will execute fetch operations one by one if it's queued multiple times.  Will wait for suspension if necessary.
  func fetchMissedNotifications(_ completionHandler: @escaping ResponseCallback<Void>) {
    TUTSLog("Adding fetch notificaiton operation to queue")
    self.fetchQueue.addOperation { [weak self] in
      let void: Void = ()
      guard let self = self else {
        completionHandler(.success(void))
        return
      }
      
      let result = Result { try self.doFetchMissedNotifications() }
      completionHandler(result)
    }
  }
  
  /// Fetch and process missed notification, actual impl without queuing which makes it easier to just call it recursively.
  private func doFetchMissedNotifications() throws {
    guard let sseInfo = self.userPreference.sseInfo else {
      TUTSLog("No stored SSE info")
      return
    }
    
    if sseInfo.userIds.isEmpty {
      TUTSLog("No users to download missed notification with")
      self.alarmManager.unscheduleAllAlarms(userId: nil)
      return
    }
    
    var additionalHeaders = [String: String]()
    addSystemModelHeaders(to: &additionalHeaders)
    
    let userId: String = sseInfo.userIds[0]
    additionalHeaders["userIds"] = userId
    if let lastNotificationId = self.userPreference.lastProcessedNotificationId {
      additionalHeaders["lastProcessedNotificationId"] = lastNotificationId
    }
    let configuration = URLSessionConfiguration.ephemeral
    configuration.httpAdditionalHeaders = additionalHeaders
    
    let urlSession = URLSession(configuration: configuration)
    let urlString = self.missedNotificationUrl(origin: sseInfo.sseOrigin, pushIdentifier: sseInfo.pushIdentifier)
    
    TUTSLog("Downloading missed notification with userId \(userId)")
    
    let (data, response) = try urlSession.synchronousDataTask(with: URL(string: urlString)!)
    let httpResponse = response as! HTTPURLResponse
    TUTSLog("Fetched missed notifications with status code \(httpResponse.statusCode)")
    
    switch (HttpStatusCode(rawValue: httpResponse.statusCode)) {
    case .notAuthenticated:
      TUTSLog("Not authenticated to download missed notification w/ user \(userId)")
      self.alarmManager.unscheduleAllAlarms(userId: userId)
      self.userPreference.removeUser(userId)
      try self.doFetchMissedNotifications()
    case .serviceUnavailable, .tooManyRequests:
      let suspensionTime = extractSuspensionTime(from: httpResponse)
      TUTSLog("ServiceUnavailable when downloading missed notification, waiting for \(suspensionTime)s")
      sleep(suspensionTime)
      try self.doFetchMissedNotifications()
    case .notFound:
      return
    case .ok:
      self.userPreference.lastMissedNotificationCheckTime = Date()
      let missedNotification: MissedNotification
      do {
        missedNotification = try JSONDecoder().decode(MissedNotification.self, from: data)
      } catch {
        throw TUTErrorFactory.createError("Failed to parse response for the missed notificaiton, \(error)")
      }
      self.userPreference.lastProcessedNotificationId = missedNotification.lastProcessedNotificationId
      try alarmManager.processNewAlarms(missedNotification.alarmNotifications)
    default:
      let errorId = httpResponse.allHeaderFields["Error-Id"]
      let error = NSError(domain: TUT_NETWORK_ERROR, code: httpResponse.statusCode, userInfo: [
        "message": "Failed to fetch missed notification, error id: \(errorId ?? "")"
      ])
      throw error
    }
  }
  
  private func missedNotificationUrl(origin: String, pushIdentifier: String) -> String {
    let base64UrlId = stringToCustomId(customId: pushIdentifier)
    return "\(origin)/rest/sys/missednotification/\(base64UrlId)"
  }
}

/**
 Gets suspension time from the request in seconds
 */
fileprivate func extractSuspensionTime(from httpResponse: HTTPURLResponse) -> UInt32 {
  let retryAfterHeader =
  (httpResponse.allHeaderFields["Retry-After"] ?? httpResponse.allHeaderFields["Suspension-Time"])
  as! String?
  return retryAfterHeader.flatMap { UInt32($0) } ?? 0
}

fileprivate func stringToCustomId(customId: String) -> String {
  return customId.data(using: .utf8)!
    .base64EncodedString()
    .replacingOccurrences(of: "+", with: "-")
    .replacingOccurrences(of: "/", with: "_")
    .replacingOccurrences(of: "=", with: "")
}

enum HttpStatusCode: Int {
  case ok = 200
  case notAuthenticated = 401
  case notFound = 404
  case tooManyRequests = 429
  case serviceUnavailable = 503
}
