import Foundation

protocol AlarmPersistor {
  var alarms: [EncryptedAlarmNotification] { get }
  
  func clear()
  
  func store(alarms: [EncryptedAlarmNotification])
}

class AlarmPreferencePersistor : AlarmPersistor {
  var alarms: [EncryptedAlarmNotification] {
    get {
      return userPreferenceFacade.alarms
    }
  }
  
  let userPreferenceFacade: UserPreferenceFacade
  let keychainManager: KeychainManager
  
  init (userPreferenceFacade: UserPreferenceFacade, keychainManager: KeychainManager) {
    self.userPreferenceFacade = userPreferenceFacade
    self.keychainManager = keychainManager
  }
  
  func clear() {
    self.userPreferenceFacade.clear()
    do {
      try keychainManager.removePushIdentifierKeys()
    } catch {
      TUTSLog("Faied to remove pushIdentifier keys \(error)")
    }
  }
  
  func store(alarms: [EncryptedAlarmNotification]) {
    self.userPreferenceFacade.store(alarms: alarms)
  }
}
