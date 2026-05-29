final class IosNativePushFacade: NativePushFacade {
	func getPushIdentifier() async throws -> String? { fatalError("Not implemented") }
	func storePushIdentifierLocally(
		_ identifier: String,
		_ userId: String,
		_ sseOrigin: String,
		_ pushIdentifierId: String,
		_ pushIdentifierSessionKey: TutanotaSharedFramework.DataWrapper
	) async throws { fatalError("Not implemented") }
	func removeUser(_ userId: String) async throws { fatalError("Not implemented") }
	func initPushNotifications() async throws { fatalError("Not implemented") }
	func closePushNotifications(_ addressesArray: [String]) async throws { fatalError("Not implemented") }
	func scheduleAlarms(_ alarmNotificationsWireFormat: String, _ newDeviceSessionKey: String) async throws { fatalError("Not implemented") }
	func invalidateAlarmsForUser(_ userId: String) async throws { fatalError("Not implemented") }
	func setExtendedNotificationConfig(_ userId: String, _ mode: TutanotaSharedFramework.ExtendedNotificationMode) async throws {
		fatalError("Not implemented")
	}
	func getExtendedNotificationConfig(_ userId: String) async throws -> TutanotaSharedFramework.ExtendedNotificationMode { fatalError("Not implemented") }
	func setReceiveCalendarNotificationConfig(_ pushIdentifier: String, _ value: Bool) async throws { fatalError("Not implemented") }
	func getReceiveCalendarNotificationConfig(_ pushIdentifier: String) async throws -> Bool { fatalError("Not implemented") }
}
