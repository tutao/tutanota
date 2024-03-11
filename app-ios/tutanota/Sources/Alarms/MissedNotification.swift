import Foundation
import TutanotaSharedFramework

/// Response for the downloading of notifications request
struct MissedNotification: Codable {
	let alarmNotifications: [EncryptedAlarmNotification]
	/// Is needed to only request new information from the server
	let lastProcessedNotificationId: String
}
