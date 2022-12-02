import UIKit

@UIApplicationMain
class AppDelegate : UIResponder,
                    UIApplicationDelegate,
                    UNUserNotificationCenterDelegate {
  var window: UIWindow?

  private var pushTokenCallback: ResponseCallback<String>?
  private let userPreferences = UserPreferenceFacade()
  private var alarmManager: AlarmManager!
  private var viewController: ViewController!

  func registerForPushNotifications() async throws -> String {
#if targetEnvironment(simulator)
    return ""
#else
    return try await withCheckedThrowingContinuation { continuation in
      UNUserNotificationCenter.current()
        .requestAuthorization(
          options: [.alert, .badge, .sound]) { granted, error in
            if error == nil {
              DispatchQueue.main.async {
                self.pushTokenCallback = continuation.resume(with:)
                UIApplication.shared.registerForRemoteNotifications()
              }
            } else {
              continuation.resume(with: .failure(error!))
            }
          }
    }
#endif
  }

  func main() {

    let keychainManager = KeychainManager(keyGenerator: KeyGenerator())

    self.alarmManager = AlarmManager(keychainManager: keychainManager, userPreference: userPreferences)
    self.window = UIWindow(frame: UIScreen.main.bounds)
    let credentialsEncryption = IosNativeCredentialsFacade(keychainManager: keychainManager)
    self.viewController = ViewController(
      crypto: IosNativeCryptoFacade(),
      themeManager: ThemeManager(),
      keychainManager: keychainManager,
      userPreferences: userPreferences,
      alarmManager: self.alarmManager,
      credentialsEncryption: credentialsEncryption,
      blobUtils: BlobUtil()
    )
    self.window!.rootViewController = viewController

    UNUserNotificationCenter.current().delegate = self

    window!.makeKeyAndVisible()
  }

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]?
  ) -> Bool {
    TUTSLog("Start Tutanota wit launch options: \(String(describing: launchOptions))")
    self.main()
    return true
  }

  func applicationWillEnterForeground(_ application: UIApplication) {
    UIApplication.shared.applicationIconBadgeNumber = 0
  }

  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    if let callback = self.pushTokenCallback {
      let stringToken = deviceTokenAsString(deviceToken: deviceToken)
      callback(.success(stringToken!))
      self.pushTokenCallback = nil
    }
  }

  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    self.pushTokenCallback?(.failure(error))
    self.pushTokenCallback = nil
  }

  /// handles tutanota deep links:
  /// tutanota:// -> ?
  /// tutashare:// -> share requests from the sharing extension
  func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:] ) -> Bool {
    switch url.scheme {
    case TUTANOTA_SHARE_SCHEME:
      Task { try! await self.viewController.handleShare(url) }
    case nil:
      TUTSLog("missing scheme!")
    default:
      TUTSLog("unknown scheme? \(url.scheme!)")
    }
    return true
  }

  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable : Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
      let apsDict = userInfo["aps"] as! Dictionary<String, Any>
      TUTSLog("Received notification \(userInfo)")

      let contentAvailable = apsDict["content-available"]
      if contentAvailable as? Int == 1 {
        self.alarmManager.fetchMissedNotifications { result in
          TUTSLog("Fetched missed notification after notification \(String(describing: result))")
          switch result {
          case .success():
            completionHandler(.newData)
          case .failure(_):
            completionHandler(.failed)
          }
        }
      }
    }

  func applicationWillTerminate(_ application: UIApplication) {
    do {
      try FileUtils.deleteSharedStorage()
    } catch {
      TUTSLog("failed to delete shared storage on shutdown: \(error)")
    }
  }

}

fileprivate func deviceTokenAsString(deviceToken: Data) -> String? {
  if deviceToken.isEmpty {
    return nil
  }
  var result = ""
  for byte in deviceToken {
    result = result.appendingFormat("%02x", byte)
  }
  return result
}
