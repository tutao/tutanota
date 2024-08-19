import StoreKit
import TutanotaSharedFramework
import UIKit

@UIApplicationMain class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
	var window: UIWindow?

	private var pushTokenCallback: ResponseCallback<String>?
	private var alarmManager: AlarmManager!
	private var notificationsHandler: NotificationsHandler!
	private var viewController: ViewController!

	func registerForPushNotifications() async throws -> String {
		#if targetEnvironment(simulator)
			return ""
		#else
			return try await withCheckedThrowingContinuation { continuation in
				UNUserNotificationCenter.current()
					.requestAuthorization(options: [.alert, .badge, .sound]) { _, error in
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

	fileprivate func start() {
		spawnTransactionFinisher()

		let userPreferencesProvider = UserPreferencesProviderImpl()
		let notificationStorage = NotificationStorage(userPreferencesProvider: userPreferencesProvider)
		let keychainManager = KeychainManager(keyGenerator: KeyGenerator())
		let keychainEncryption = KeychainEncryption(keychainManager: keychainManager)

		let alarmModel = AlarmModel(dateProvider: SystemDateProvider())
		self.alarmManager = AlarmManager(
			alarmPersistor: AlarmPreferencePersistor(notificationsStorage: notificationStorage, keychainManager: keychainManager),
			alarmCryptor: KeychainAlarmCryptor(keychainManager: keychainManager),
			alarmScheduler: SystemAlarmScheduler(),
			alarmCalculator: alarmModel
		)
		self.notificationsHandler = NotificationsHandler(alarmManager: self.alarmManager, notificationStorage: notificationStorage)
		self.window = UIWindow(frame: UIScreen.main.bounds)

		let credentialsDb = try! CredentialsDatabase(dbPath: credentialsDatabasePath().absoluteString)
		let credentialsEncryption = IosNativeCredentialsFacade(
			keychainEncryption: keychainEncryption,
			credentialsDb: credentialsDb,
			cryptoFns: CryptoFunctions()
		)

		self.viewController = ViewController(
			crypto: TutanotaSharedFramework.IosNativeCryptoFacade(),
			themeManager: ThemeManager(userProferencesProvider: userPreferencesProvider),
			keychainManager: keychainManager,
			notificationStorage: notificationStorage,
			alarmManager: alarmManager,
			notificaionsHandler: notificationsHandler,
			credentialsEncryption: credentialsEncryption,
			blobUtils: BlobUtil(),
			contactsSynchronization: IosMobileContactsFacade(userDefault: UserDefaults.standard),
			userPreferencesProvider: userPreferencesProvider
		)
		self.window!.rootViewController = viewController

		UNUserNotificationCenter.current().delegate = self

		window!.makeKeyAndVisible()
	}

	func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
		TUTSLog("Start Tuta Calendar with launch options: \(String(describing: launchOptions))")
		self.start()
		return true
	}

	func applicationWillEnterForeground(_ application: UIApplication) { UIApplication.shared.applicationIconBadgeNumber = 0 }

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
	/// tutacalshare:// -> share requests from the sharing extension
	func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
		switch url.scheme {
		case CALENDAR_SHARE_SCHEME: Task { try! await self.viewController.handleShare(url) }
		case nil: TUTSLog("missing scheme!")
		default: TUTSLog("unknown scheme? \(url.scheme!)")
		}
		return true
	}

	func application(
		_ application: UIApplication,
		didReceiveRemoteNotification userInfo: [AnyHashable: Any],
		fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
	) {
		let apsDict = userInfo["aps"] as! [String: Any]
		TUTSLog("Received notification \(userInfo)")

		let contentAvailable = apsDict["content-available"]
		if contentAvailable as? Int == 1 {
			self.notificationsHandler.fetchMissedNotifications { result in
				TUTSLog("Fetched missed notification after notification \(String(describing: result))")
				switch result {
				case .success: completionHandler(.newData)
				case .failure: completionHandler(.failed)
				}
			}
		}
	}

	func applicationDidEnterBackground(_ application: UIApplication) {
		self.viewController.onApplicationDidEnterBackground()

	}

	func applicationWillTerminate(_ application: UIApplication) {
		self.viewController.onApplicationWillTerminate()
		do { try FileUtils.deleteSharedStorage() } catch { TUTSLog("failed to delete shared storage on shutdown: \(error)") }
	}

	// everything is handled on the server. nothing to do here (should run infinitely in the background)o
	private func spawnTransactionFinisher() -> Task<Void, Error> {
		Task.detached {
			for await result in Transaction.updates {
				let transaction = IosMobilePaymentsFacade.checkVerified(result)
				await transaction.finish()
				TUTSLog("finished transaction \(transaction.id)")
			}
			TUTSLog("unclogged all transactions 🪠")
		}
	}
}

private func deviceTokenAsString(deviceToken: Data) -> String? {
	if deviceToken.isEmpty { return nil }
	var result = ""
	for byte in deviceToken { result = result.appendingFormat("%02x", byte) }
	return result
}
