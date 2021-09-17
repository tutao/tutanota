import Foundation

struct MissedNotification : Codable {
  let alarmNotifications: [EncryptedAlarmNotification]
  let lastProcessedNotificationId: String
}
