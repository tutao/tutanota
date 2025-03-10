import Foundation
import TutanotaSharedFramework

class IosNativePushFacade: NativePushFacade {

	func setReceiveCalendarNotificationConfig(_ pushIdentifier: String, _ value: Bool) {
		self.notificationStorage.setReceiveCalendarNotificationConfig(pushIdentifier, value)
	}
	func getReceiveCalendarNotificationConfig(_ pushIdentifier: String) async throws -> Bool {
		self.notificationStorage.getReceiveCalendarNotificationConfig(pushIdentifier)
	}
	private let appDelegate: AppDelegate
	private let alarmManager: AlarmManager
	private let notificationStorage: NotificationStorage
	private let keychainManager: KeychainManager
	private let commonNativeFacade: CommonNativeFacade

	init(
		appDelegate: AppDelegate,
		alarmManager: AlarmManager,
		notificationStorage: NotificationStorage,
		keychainManager: KeychainManager,
		commonNativeFacade: CommonNativeFacade
	) {
		self.appDelegate = appDelegate
		self.alarmManager = alarmManager
		self.notificationStorage = notificationStorage
		self.keychainManager = keychainManager
		self.commonNativeFacade = commonNativeFacade
	}

	func getPushIdentifier() async throws -> String? {
		if let sseInfo = notificationStorage.sseInfo, sseInfo.userIds.isEmpty {
			TUTSLog("Sending alarm invalidation")
			self.notificationStorage.clear()
			try await self.commonNativeFacade.invalidateAlarms()
		}

		return try await self.appDelegate.registerForPushNotifications()
	}

	func storePushIdentifierLocally(
		_ identifier: String,
		_ userId: String,
		_ sseOrigin: String,
		_ pushIdentifierId: String,
		_ pushIdentifierSessionKey: DataWrapper
	) async throws {
		try self.notificationStorage.store(pushIdentifier: identifier, userId: userId, sseOrigin: sseOrigin)
		try self.keychainManager.storeKey(pushIdentifierSessionKey.data, withId: pushIdentifierId)
	}

	func initPushNotifications() async throws {
		// nothing to do on this platform
	}

	func closePushNotifications(_ addressesArray: [String]) async throws { await MainActor.run { UIApplication.shared.applicationIconBadgeNumber = 0 } }
	func scheduleAlarms(_ alarmNotificationsWireFormat: String, _ newDeviceSessionKey: String) async throws {
		guard let alarmsData = alarmNotificationsWireFormat.data(using: .utf8) else {
			throw TUTErrorFactory.createError("Failed to convert string to data for new alarms")
		}
		let encryptedAlarmNotifications: [EncryptedAlarmNotification]
		do { encryptedAlarmNotifications = try JSONDecoder().decode([EncryptedAlarmNotification].self, from: alarmsData) } catch {
			throw TUTErrorFactory.createError("Failed to parse new alarms, \(error)")
		}
		try self.alarmManager.processNewAlarms(encryptedAlarmNotifications, newDeviceSessionKey)
	}
	func invalidateAlarmsForUser(_ userId: String) async throws { alarmManager.unscheduleAllAlarms(userId: userId) }

	func removeUser(_ userId: String) async throws { self.notificationStorage.removeUser(userId) }
	func setExtendedNotificationConfig(_ userId: String, _ mode: TutanotaSharedFramework.ExtendedNotificationMode) async throws {
		try self.notificationStorage.setExtendedNotificationConfig(userId, mode)
	}

	func getExtendedNotificationConfig(_ userId: String) async throws -> TutanotaSharedFramework.ExtendedNotificationMode {
		try self.notificationStorage.getExtendedNotificationConfig(userId)
	}

}
