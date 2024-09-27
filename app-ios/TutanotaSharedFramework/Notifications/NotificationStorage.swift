import DictionaryCoding
import Foundation

private let SSE_INFO_KEY = "sseInfo"
private let ALARMS_KEY = "repeatingAlarmNotification"
private let LAST_PROCESSED_NOTIFICAION_ID_KEY = "lastProcessedNotificationId"
private let LAST_MISSED_NOTIFICATION_CHECK_TIME = "lastMissedNotificationCheckTime"
private let EXTENDED_NOTIFICATION_MODE = "extendedNotificationMode"
private let RECEIVE_CALENDAR_NOTIFICATION_CONFIG = "receiveCalendarNotificationConfig"

public class NotificationStorage {
	private let userPreferencesProvider: UserPreferencesProvider

	public init(userPreferencesProvider: UserPreferencesProvider) { self.userPreferencesProvider = userPreferencesProvider }

	public var sseInfo: SSEInfo? {
		get {
			let dict = self.userPreferencesProvider.getObject(forKey: SSE_INFO_KEY)
			return dict.map { try! DictionaryDecoder().decode(SSEInfo.self, from: $0 as! NSDictionary) }
		}
	}

	public func store(pushIdentifier: String, userId: String, sseOrigin: String) throws {
		// Provide right defaults for extended notification mode.
		//  - Start with "nothing" as a conservative default
		//  - If notifications were not used before, enable extended notifications
		if var sseInfo = self.sseInfo {
			sseInfo.pushIdentifier = pushIdentifier
			sseInfo.sseOrigin = sseOrigin
			var userIds = sseInfo.userIds
			if !userIds.contains(userId) {
				userIds.append(userId)
				try self.setExtendedNotificationConfig(userId, .sender_and_subject)
			}
			sseInfo.userIds = userIds
			self.put(sseInfo: sseInfo)
		} else {
			let sseInfo = SSEInfo(pushIdentifier: pushIdentifier, sseOrigin: sseOrigin, userIds: [userId])
			try self.setExtendedNotificationConfig(userId, .sender_and_subject)
			self.put(sseInfo: sseInfo)
		}
	}

	public func store(alarms: [EncryptedAlarmNotification]) {
		let jsonData = try! JSONEncoder().encode(alarms)
		self.userPreferencesProvider.setValue(jsonData, forKey: ALARMS_KEY)
	}

	public var alarms: [EncryptedAlarmNotification] {
		get {
			let notificationsJsonData = self.userPreferencesProvider.getObject(forKey: ALARMS_KEY)
			if let notificationsJsonData {
				return try! JSONDecoder().decode(Array<EncryptedAlarmNotification>.self, from: notificationsJsonData as! Data)
			} else {
				return []
			}
		}
	}

	public func removeUser(_ userId: String) {
		guard var sseInfo = self.sseInfo else {
			TUTSLog("Removing userId but there's no SSEInfo stored")
			return
		}
		var userIds = sseInfo.userIds
		if let index = userIds.firstIndex(of: userId) { userIds.remove(at: index) }
		sseInfo.userIds = userIds
		self.put(sseInfo: sseInfo)
	}

	public var lastProcessedNotificationId: String? {
		get { self.userPreferencesProvider.getObject(forKey: LAST_PROCESSED_NOTIFICAION_ID_KEY) as! String? }
		set { return self.userPreferencesProvider.setValue(newValue, forKey: LAST_PROCESSED_NOTIFICAION_ID_KEY) }
	}

	public var lastMissedNotificationCheckTime: Date? {
		get { self.userPreferencesProvider.getObject(forKey: LAST_MISSED_NOTIFICATION_CHECK_TIME) as! Date? }
		set { return self.userPreferencesProvider.setValue(newValue, forKey: LAST_MISSED_NOTIFICATION_CHECK_TIME) }
	}

	public func clear() {
		TUTSLog("UserPreference clear")
		let sseInfo = self.sseInfo
		if var sseInfo {
			sseInfo.userIds = []
			self.put(sseInfo: nil)
			self.lastMissedNotificationCheckTime = nil
			self.store(alarms: [])
		}
	}

	public func setExtendedNotificationConfig(_ userId: String, _ mode: TutanotaSharedFramework.ExtendedNotificationMode) throws {
		self.userPreferencesProvider.setValue(mode.rawValue, forKey: "\(EXTENDED_NOTIFICATION_MODE):\(userId)")
	}

	public func getExtendedNotificationConfig(_ userId: String) throws -> TutanotaSharedFramework.ExtendedNotificationMode {
		// This default gets overwritten later when we store the pushIdentifier
		self.userPreferencesProvider.getObject(forKey: "\(EXTENDED_NOTIFICATION_MODE):\(userId)")
			.map { mode in ExtendedNotificationMode(rawValue: mode as! String)! } ?? .sender_and_subject
	}

	public func setReceiveCalendarNotificationConfig(_ pushIdentifier: String, _ value: Bool) {
		self.userPreferencesProvider.setValue(value, forKey: "\(RECEIVE_CALENDAR_NOTIFICATION_CONFIG):\(pushIdentifier)")
	}

	public func getReceiveCalendarNotificationConfig(_ pushIdentifier: String) -> Bool {
		self.userPreferencesProvider.getObject(forKey: "\(RECEIVE_CALENDAR_NOTIFICATION_CONFIG):\(pushIdentifier)").map { enabled in enabled as! Bool == true }
			?? true
	}

	private func put(sseInfo: SSEInfo?) {
		if let sseInfo {
			let dict: NSDictionary = try! DictionaryEncoder().encode(sseInfo)
			self.userPreferencesProvider.setValue(dict, forKey: SSE_INFO_KEY)
		} else {
			self.userPreferencesProvider.setValue(nil, forKey: SSE_INFO_KEY)
		}
	}
}
