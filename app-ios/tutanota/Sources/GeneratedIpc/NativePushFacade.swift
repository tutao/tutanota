/* generated file, don't edit. */


import Foundation

public protocol NativePushFacade {
	func getPushIdentifier(
		_ userId: String,
		_ mailAddress: String
	) async throws -> String?
	func storePushIdentifierLocally(
		_ identifier: String,
		_ userId: String,
		_ sseOrigin: String,
		_ pushIdentifierId: String,
		_ pushIdentifierSessionKey: DataWrapper
	) async throws -> Void
	func initPushNotifications(
	) async throws -> Void
	func closePushNotifications(
		_ addressesArray: [String]
	) async throws -> Void
	func scheduleAlarms(
		_ alarms: [EncryptedAlarmNotification]
	) async throws -> Void
}
