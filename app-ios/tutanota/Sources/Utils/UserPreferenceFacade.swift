import Foundation

fileprivate let SSE_INFO_KEY = "sseInfo"
fileprivate let ALARMS_KEY = "repeatingAlarmNotification"
fileprivate let LAST_PROCESSED_NOTIFICAION_ID_KEY = "lastProcessedNotificationId"
fileprivate let LAST_MISSED_NOTIFICATION_CHECK_TIME = "lastMissedNotificationCheckTime"

class UserPreferenceFacade {
  var sseInfo: SSEInfo? {
    get {
      let dict = UserDefaults.standard.object(forKey: SSE_INFO_KEY)
      return dict.map { nsobjectToEncodable(value: $0 as! NSObject) }
    }
  }
  
  func store(pushIdentifier: String, userId: String, sseOrigin: String) {
    if var sseInfo = self.sseInfo {
        sseInfo.pushIdentifier = pushIdentifier
        sseInfo.sseOrigin = sseOrigin
        var userIds = sseInfo.userIds
        if !userId.contains(userId) {
          userIds.append(userId)
        }
        sseInfo.userIds = userIds
      self.put(sseInfo: sseInfo)
    } else {
      let sseInfo = SSEInfo(
        pushIdentifier: pushIdentifier,
        sseOrigin: sseOrigin,
        userIds: [userId]
      )
      self.put(sseInfo: sseInfo)
    }
  }
  
  func store(alarms: [EncryptedAlarmNotification]) {
    let jsonData = try! JSONEncoder().encode(alarms)
    UserDefaults.standard.setValue(jsonData, forKey: ALARMS_KEY)
  }
  
  var alarms: [EncryptedAlarmNotification] {
    get {
      let defaults = UserDefaults.standard
      let notificationsJsonData = defaults.object(forKey: ALARMS_KEY)
      if let notificationsJsonData = notificationsJsonData {
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
    if let index = userIds.firstIndex(of: userId) {
      userIds.remove(at: index)
    }
    sseInfo.userIds = userIds
    self.put(sseInfo: sseInfo)
  }
  
  var lastProcessedNotificationId: String? {
    get {
      return UserDefaults.standard.object(forKey: LAST_PROCESSED_NOTIFICAION_ID_KEY) as! String?
    }
    set {
      return UserDefaults.standard.setValue(newValue, forKey: LAST_PROCESSED_NOTIFICAION_ID_KEY)
    }
  }
  
  var lastMissedNotificationCheckTime: Date? {
    get {
      return UserDefaults.standard.object(forKey: LAST_MISSED_NOTIFICATION_CHECK_TIME) as! Date?
    }
    set {
      return UserDefaults.standard.setValue(newValue, forKey: LAST_MISSED_NOTIFICATION_CHECK_TIME)
    }
  }
  
  func clear() {
    TUTSLog("UserPreference clear")
    let sseInfo = self.sseInfo
    if var sseInfo = sseInfo {
      sseInfo.userIds = []
      self.put(sseInfo: sseInfo)
      self.lastMissedNotificationCheckTime = nil
      self.store(alarms: [])
    }
  }
  
  private func put(sseInfo: SSEInfo) {
    let dict = encodableToNSOjbect(value: sseInfo)
    UserDefaults.standard.setValue(dict, forKey: SSE_INFO_KEY)
  }
}
