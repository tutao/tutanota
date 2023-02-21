import Foundation

class IosNativePushFacade : NativePushFacade {

  private let appDelegate: AppDelegate
  private let alarmManager: AlarmManager
  private let userPreferences: UserPreferenceFacade
  private let keychainManager: KeychainManager
  private let commonNativeFacade: CommonNativeFacade

  init(
    appDelegate: AppDelegate,
    alarmManager: AlarmManager,
    userPreferences: UserPreferenceFacade,
    keychainManager: KeychainManager,
    commonNativeFacade: CommonNativeFacade
  ) {
    self.appDelegate = appDelegate
    self.alarmManager = alarmManager
    self.userPreferences = userPreferences
    self.keychainManager = keychainManager
    self.commonNativeFacade = commonNativeFacade
  }

  func getPushIdentifier() async throws -> String? {
    if let sseInfo = userPreferences.sseInfo, sseInfo.userIds.isEmpty {
      TUTSLog("Sending alarm invalidation")
      self.userPreferences.clear()
      try await self.commonNativeFacade.invalidateAlarms()
    }
    
    return try await self.appDelegate.registerForPushNotifications()
  }

  func storePushIdentifierLocally(_ identifier: String, _ userId: String, _ sseOrigin: String, _ pushIdentifierId: String, _ pushIdentifierSessionKey: DataWrapper) async throws {
    self.userPreferences.store(
      pushIdentifier: identifier,
      userId: userId,
      sseOrigin: sseOrigin
    )
    try self.keychainManager.storeKey(pushIdentifierSessionKey.data, withId: pushIdentifierId)
  }

  func initPushNotifications() async throws {
    // nothing to do on this platform
  }

  func closePushNotifications(_ addressesArray: [String]) async throws {
    await MainActor.run {
      UIApplication.shared.applicationIconBadgeNumber = 0
    }
  }

  func scheduleAlarms(_ alarms: [EncryptedAlarmNotification]) async throws {
    try self.alarmManager.processNewAlarms(alarms)
  }


}
