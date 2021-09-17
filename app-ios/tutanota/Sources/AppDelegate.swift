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
  
  func registerForPushNotifications(
    callback: @escaping ResponseCallback<String>
  ) {
    UNUserNotificationCenter.current()
      .requestAuthorization(
        options: [.alert, .badge, .sound]) { granted, error in
        if error == nil {
          DispatchQueue.main.async {
            self.pushTokenCallback = callback
            UIApplication.shared.registerForRemoteNotifications()
          }
        } else {
          callback(.failure(error!))
        }
      }
  }
  
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]?
  ) -> Bool {
    TUTSLog("Start Tutanota \(String(describing: launchOptions))")
    let keychainManager = KeychainManager()
    self.alarmManager = AlarmManager(keychainManager: keychainManager, userPreference: userPreferences)
    self.window = UIWindow(frame: UIScreen.main.bounds)
    self.viewController = ViewController(
      crypto: CryptoFacade(),
      contactsSource: ContactsSource(),
      themeManager: ThemeManager(),
      keychainManager: keychainManager,
      userPreferences: userPreferences,
      alarmManager: self.alarmManager
    )
    self.window!.rootViewController = viewController
    
    UNUserNotificationCenter.current().delegate = self
    
    window!.makeKeyAndVisible()
    
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
  
  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable : Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    let apsDict = userInfo["aps"] as! Dictionary<String, Any>
    TUTSLog("Received notification \(userInfo)")
    
    let contentAvailable = apsDict["content-available"]
    if contentAvailable as? Int == 1 {
      self.alarmManager.fetchMissedNotifications { err in
        TUTSLog("Fetched missed notificaiton after notification \(String(describing: err))")
        completionHandler(err != nil ? .failed : .newData)
      }
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
