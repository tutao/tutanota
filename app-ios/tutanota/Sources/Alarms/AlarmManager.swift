import Foundation

// iOS (13.3 at least) has a limit on saved alarms which was empirically inferred.
// It means that only *last* X alarms are stored in the internal plist by SpringBoard.
// If we schedule too many some alarms will not be fired. We should be careful to not
// schedule too far into the future.
let EVENTS_SCHEDULED_AHEAD = 14
let SYSTEM_ALARM_LIMIT = 64

class AlarmManager {
  private let alarmPersistor: any AlarmPersistor
  private let alarmCryptor: any AlarmCryptor
  private let alarmScheduler: any AlarmScheduler
  private let alarmCalculator: any AlarmCalculator
  
  init(
    alarmPersistor: any AlarmPersistor,
    alarmCryptor: any AlarmCryptor,
    alarmScheduler: any AlarmScheduler,
    alarmCalculator: any AlarmCalculator
  ) {
    self.alarmPersistor = alarmPersistor
    self.alarmCryptor = alarmCryptor
    self.alarmScheduler = alarmScheduler
    self.alarmCalculator = alarmCalculator
  }

  func processNewAlarms(_ alarms: Array<EncryptedAlarmNotification>) throws {
    var savedNotifications = self.alarmPersistor.alarms
    var resultError: Error?
    for alarmNotification in alarms {
      do {
        try self.handleAlarmNotification(alarmNotification, existingAlarms: &savedNotifications)
      } catch {
        TUTSLog("Error while handling alarm \(error)")
        resultError = error
      }
    }
    
    TUTSLog("Finished processing \(alarms.count) alarms")
    self.alarmPersistor.store(alarms: savedNotifications)
    
    self.rescheduleAlarms()
    TUTSLog("Finished re-scheduling")
    if let error = resultError {
      throw error
    }
  }

  func resetStoredState() {
    TUTSLog("Resetting stored state")
    self.unscheduleAllAlarms(userId: nil)
    self.alarmPersistor.clear()
  }
  
  func rescheduleAlarms() {
    TUTSLog("Re-scheduling alarms")
    let decryptedAlarms = self.savedAlarms()
      .compactMap { encryptedAlarm in
        do {
          return try alarmCryptor.decrypt(alarm: encryptedAlarm)
        } catch {
          TUTSLog("Error when decrypting alarm \(encryptedAlarm) \(error)")
          return nil
        }
      }
    let occurences = alarmCalculator.futureOccurrences(acrossAlarms: decryptedAlarms, upToForEach: EVENTS_SCHEDULED_AHEAD, upToOverall: SYSTEM_ALARM_LIMIT)
    
    for occurrence in occurences.reversed() {
      self.scheduleAlarmOccurrence(
        occurrenceInfo: occurrence,
        trigger: occurrence.alarm.alarmInfo.trigger,
        summary: occurrence.alarm.summary,
        alarmIdentifier: occurrence.alarm.alarmInfo.alarmIdentifer
      )
    }
  }
  
  private func savedAlarms() -> Set<EncryptedAlarmNotification> {
    let savedNotifications = self.alarmPersistor.alarms
    let set = Set(savedNotifications)
    if set.count != savedNotifications.count {
      TUTSLog("Duplicated alarms detected, re-saving...")
      self.alarmPersistor.store(alarms: Array(set))
    }
    return set
  }
  
  private func handleAlarmNotification(
    _ alarm: EncryptedAlarmNotification,
    existingAlarms: inout Array<EncryptedAlarmNotification>
  ) throws {
    switch alarm.operation {
    case .Create:
      if !existingAlarms.contains(alarm) {
        existingAlarms.append(alarm)
      }
    case .Delete:
      let alarmToUnschedule = existingAlarms.first { $0 == alarm } ?? alarm
      do {
        try self.unscheduleAlarm(alarmToUnschedule)
      } catch {
        TUTSLog("Failed to cancel alarm \(alarm) \(error)")
        throw error
      }
      if let index = existingAlarms.firstIndex(of: alarmToUnschedule) {
        existingAlarms.remove(at: index)
      }
    default:
      fatalError("Unexpected operation for alarm: \(alarm.operation)")
    }
  }
  
  func unscheduleAllAlarms(userId: String?) {
    let alarms = self.alarmPersistor.alarms
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
  
  private func unscheduleAlarm(_ encAlarmNotification: EncryptedAlarmNotification) throws {
    let alarmIdentifier = encAlarmNotification.alarmInfo.alarmIdentifier
    let alarmNotification = try alarmCryptor.decrypt(alarm: encAlarmNotification)
    
    let occurrenceIds = alarmCalculator.futureOccurrences(ofAlarm: alarmNotification)
      .map {
        ocurrenceIdentifier(alarmIdentifier: $0.alarm.identifier, occurrence: $0.occurrenceNumber)
      }
    TUTSLog("Cancelling alarm \(alarmIdentifier)")
    self.alarmScheduler.unscheduleAll(occurrenceIds: occurrenceIds)
  }
  
  private func scheduleAlarmOccurrence(
    occurrenceInfo: AlarmOccurence,
    trigger: String,
    summary: String,
    alarmIdentifier: String
  ) {
    let alarmTime = AlarmModel.alarmTime(trigger: trigger, eventTime: occurrenceInfo.eventOccurrenceTime)
    
    let identifier = ocurrenceIdentifier(
      alarmIdentifier: alarmIdentifier,
      occurrence: occurrenceInfo.occurrenceNumber
    )
    
    let info = ScheduledAlarmInfo(alarmTime: alarmTime, occurrence: occurrenceInfo.occurrenceNumber, identifier: identifier, summary: summary, eventDate: occurrenceInfo.eventOccurrenceTime)
    
    self.alarmScheduler.schedule(info: info)
  }
}

// visible for testing
func ocurrenceIdentifier(alarmIdentifier: String, occurrence: Int) -> String {
  return "\(alarmIdentifier)#\(occurrence)"
}
