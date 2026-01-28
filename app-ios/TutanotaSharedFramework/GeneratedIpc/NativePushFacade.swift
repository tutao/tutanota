/* generated file, don't edit. */


import Foundation

/**
 * Push notifications and alarms operations
 */
public protocol NativePushFacade {
	func getPushIdentifier(
	) async throws -> String?
	func storePushIdentifierLocally(
		_ identifier: String,
		_ userId: String,
		_ sseOrigin: String,
		_ pushIdentifierId: String,
		_ pushIdentifierSessionKey: DataWrapper
	) async throws
	func removeUser(
		_ userId: String
	) async throws
	/**
	 * Called at some point after login to initialize push notifications.
	 */
	func initPushNotifications(
	) async throws
	func closePushNotifications(
		_ addressesArray: [String]
	) async throws
	func scheduleAlarms(
		_ alarmNotificationsWireFormat: String,
		_ newDeviceSessionKey: String
	) async throws
	/**
	 * Unschedule and remove alarms belonging to a specific user from the persistent storage
	 */
	func invalidateAlarmsForUser(
		_ userId: String
	) async throws
	func setExtendedNotificationConfig(
		_ userId: String,
		_ mode: ExtendedNotificationMode
	) async throws
	func getExtendedNotificationConfig(
		_ userId: String
	) async throws -> ExtendedNotificationMode
	/**
	 * Set user preference for receiving calendar notifications in the mail app using pushIdentifier since it represents the device of a user.
	 */
	func setReceiveCalendarNotificationConfig(
		_ pushIdentifier: String,
		_ value: Bool
	) async throws
	func getReceiveCalendarNotificationConfig(
		_ pushIdentifier: String
	) async throws -> Bool
}
