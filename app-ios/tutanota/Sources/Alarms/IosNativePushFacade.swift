import Foundation

class IosNativePushFacade : NativePushFacade {

  private let appDelegate: AppDelegate
  private let alarmManager: AlarmManager
  private let userPreferences: UserPreferenceFacade
  private let keychainManager: KeychainManager

  init(
    appDelegate: AppDelegate,
    alarmManager: AlarmManager,
    userPreferences: UserPreferenceFacade,
    keychainManager: KeychainManager
  ) {
    self.appDelegate = appDelegate
    self.alarmManager = alarmManager
    self.userPreferences = userPreferences
    self.keychainManager = keychainManager
  }

  func getPushIdentifier(_ userId: String, _ mailAddress: String) async throws -> String? {
    return try await self.appDelegate.registerForPushNotifications()
  }

  func storePushIdentifierLocally(_ identifier: String, _ userId: String, _ sseOrigin: String, _ pushIdentifierId: String, _ pushIdentifierSessionKeyB64: String) async throws {
    self.userPreferences.store(
      pushIdentifier: identifier,
      userId: userId,
      sseOrigin: sseOrigin
    )
    let keyData = Data(base64Encoded: pushIdentifierSessionKeyB64)!
    try self.keychainManager.storeKey(keyData, withId: pushIdentifierId)
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
    try await self.alarmManager.processNewAlarms(alarms)
  }


}
