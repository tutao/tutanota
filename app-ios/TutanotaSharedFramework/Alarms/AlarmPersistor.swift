import Foundation

public protocol AlarmPersistor {
	var alarms: [EncryptedAlarmNotification] { get }

	func clear()

	func store(alarms: [EncryptedAlarmNotification])
}

public class AlarmPreferencePersistor: AlarmPersistor {
	public var alarms: [EncryptedAlarmNotification] { get { notificationStorage.alarms } }

	let notificationStorage: NotificationStorage
	let keychainManager: KeychainManager

	public init(notificationsStorage: NotificationStorage, keychainManager: KeychainManager) {
		self.notificationStorage = notificationsStorage
		self.keychainManager = keychainManager
	}

	public func clear() {
		self.notificationStorage.clear()
		do { try keychainManager.removePushIdentifierKeys() } catch { TUTSLog("Failed to remove pushIdentifier keys \(error)") }
	}

	public func store(alarms: [EncryptedAlarmNotification]) { self.notificationStorage.store(alarms: alarms) }
}
