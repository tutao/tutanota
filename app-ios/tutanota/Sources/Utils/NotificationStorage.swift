import DictionaryCoding
import Foundation

private let SSE_INFO_KEY = "sseInfo"
private let ALARMS_KEY = "repeatingAlarmNotification"
private let LAST_PROCESSED_NOTIFICAION_ID_KEY = "lastProcessedNotificationId"
private let LAST_MISSED_NOTIFICATION_CHECK_TIME = "lastMissedNotificationCheckTime"

class NotificationStorage {
	private let userPreferencesProvider: UserPreferencesProvider

	init(userPreferencesProvider: UserPreferencesProvider) { self.userPreferencesProvider = userPreferencesProvider }

	var sseInfo: SSEInfo? {
		get {
			let dict = self.userPreferencesProvider.getObject(forKey: SSE_INFO_KEY)
			return dict.map { try! DictionaryDecoder().decode(SSEInfo.self, from: $0 as! NSDictionary) }
		}
	}

	func store(pushIdentifier: String, userId: String, sseOrigin: String) {
		if var sseInfo = self.sseInfo {
			sseInfo.pushIdentifier = pushIdentifier
			sseInfo.sseOrigin = sseOrigin
			var userIds = sseInfo.userIds
			if !userIds.contains(userId) { userIds.append(userId) }
			sseInfo.userIds = userIds
			self.put(sseInfo: sseInfo)
		} else {
			let sseInfo = SSEInfo(pushIdentifier: pushIdentifier, sseOrigin: sseOrigin, userIds: [userId])
			self.put(sseInfo: sseInfo)
		}
	}

	func store(alarms: [EncryptedAlarmNotification]) {
		let jsonData = try! JSONEncoder().encode(alarms)
		self.userPreferencesProvider.setValue(jsonData, forKey: ALARMS_KEY)
	}

	var alarms: [EncryptedAlarmNotification] {
		get {
			let notificationsJsonData = self.userPreferencesProvider.getObject(forKey: ALARMS_KEY)
			if let notificationsJsonData {
				return try! JSONDecoder().decode(Array<EncryptedAlarmNotification>.self, from: notificationsJsonData as! Data)
			} else {
				return []
			}
		}
	}

	func removeUser(_ userId: String) {
		guard var sseInfo = self.sseInfo else {
			TUTSLog("Removing userId but there's no SSEInfo stored")
			return
		}
		var userIds = sseInfo.userIds
		if let index = userIds.firstIndex(of: userId) { userIds.remove(at: index) }
		sseInfo.userIds = userIds
		self.put(sseInfo: sseInfo)
	}

	var lastProcessedNotificationId: String? {
		get { self.userPreferencesProvider.getObject(forKey: LAST_PROCESSED_NOTIFICAION_ID_KEY) as! String? }
		set { return self.userPreferencesProvider.setValue(newValue, forKey: LAST_PROCESSED_NOTIFICAION_ID_KEY) }
	}

	var lastMissedNotificationCheckTime: Date? {
		get { self.userPreferencesProvider.getObject(forKey: LAST_MISSED_NOTIFICATION_CHECK_TIME) as! Date? }
		set { return self.userPreferencesProvider.setValue(newValue, forKey: LAST_MISSED_NOTIFICATION_CHECK_TIME) }
	}

	func clear() {
		TUTSLog("UserPreference clear")
		let sseInfo = self.sseInfo
		if var sseInfo {
			sseInfo.userIds = []
			self.put(sseInfo: nil)
			self.lastMissedNotificationCheckTime = nil
			self.store(alarms: [])
		}
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
