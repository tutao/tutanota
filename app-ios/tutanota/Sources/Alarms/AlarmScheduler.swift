import Foundation

struct ScheduledAlarmInfo : Equatable {
  let alarmTime: Date
  let occurrence: Int
  let identifier: String
  let summary: String
  let eventDate: Date
}

protocol AlarmScheduler {
  func schedule(info: ScheduledAlarmInfo)
  func unscheduleAll(occurrenceIds: [String])
}

class SystemAlarmScheduler : AlarmScheduler {
  func schedule(info: ScheduledAlarmInfo) {
    let formattedTime = DateFormatter.localizedString(
      from: info.eventDate,
      dateStyle: .short,
      timeStyle: .short
    )
    let notificationText = "\(formattedTime): \(info.summary)"
    
    let cal = Calendar.current
    let dateComponents = cal.dateComponents(
      [.year, .month, .day, .hour, .minute],
      from: info.alarmTime
    )
    
    let notificationTrigger = UNCalendarNotificationTrigger(
      dateMatching: dateComponents,
      repeats: false
    )
    let content = UNMutableNotificationContent()
    content.title = translate("TutaoCalendarAlarmTitle", default: "Reminder")
    content.body = notificationText
    content.sound = UNNotificationSound.default
    
    let request = UNNotificationRequest(
      identifier: info.identifier,
      content: content,
      trigger: notificationTrigger
    )
    
    TUTSLog("Scheduling a notification \(info.identifier) at \(cal.date(from: dateComponents)!)")
    
    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        // We should make the whole funciton async and wait for it
        TUTSLog("Failed to schedule a notification \(error)")
      }
    }
  }
  
  func unscheduleAll(occurrenceIds: [String]) {
    UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: occurrenceIds)
  }
}
