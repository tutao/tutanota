import Foundation

/// Response for the downloading of notifications request
public struct MissedNotification: Codable {
	public let alarmNotifications: [EncryptedAlarmNotification]
	/// Is needed to only request new information from the server
	public let lastProcessedNotificationId: String

	public init(alarmNotifications: [EncryptedAlarmNotification], lastProcessedNotificationId: String) {
		self.alarmNotifications = alarmNotifications
		self.lastProcessedNotificationId = lastProcessedNotificationId
	}
}
