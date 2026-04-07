import StoreKit
import TutanotaSharedFramework
import UIKit

public let TUTA_CALENDAR_INTEROP_SCHEME = "tutacalendar"

@main class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
	var window: UIWindow?

	private var remoteNotificationsContinuation: CheckedContinuation<String, any Error>?
	private var alarmManager: AlarmManager!
	private var notificationsHandler: NotificationsHandler!
	private var viewController: ViewController!
	private let urlSession: URLSession = makeUrlSession()

	private var notificationStorage: UserPrefsNotificationStorage!

	@MainActor func registerForPushNotifications() async throws -> String {
		#if targetEnvironment(simulator)
			return ""
		#else
			try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
			return try await withCheckedThrowingContinuation { continuation in
				self.remoteNotificationsContinuation = continuation
				UIApplication.shared.registerForRemoteNotifications()
			}
		#endif
	}

	fileprivate func start() {
		spawnTransactionFinisher()

		let userPreferencesProvider = UserPreferencesProviderImpl()
		self.notificationStorage = UserPrefsNotificationStorage(userPreferencesProvider: userPreferencesProvider)
		let keychainManager = KeychainManager(keyGenerator: KeyGenerator())
		let keychainEncryption = KeychainManagerKeychainEncryption(keychainManager: keychainManager)
		let dateProvider = SystemDateProvider()

		let alarmModel = AlarmModel(dateProvider: dateProvider)
		self.alarmManager = AlarmManager(
			alarmPersistor: AlarmPreferencePersistor(notificationsStorage: notificationStorage, keychainManager: keychainManager),
			alarmCryptor: KeychainAlarmCryptor(keychainManager: keychainManager),
			alarmScheduler: SystemAlarmScheduler(),
			alarmCalculator: alarmModel
		)
		let httpClient = URLSessionHttpClient(session: self.urlSession)
		self.notificationsHandler = NotificationsHandler(
			alarmManager: self.alarmManager,
			notificationStorage: notificationStorage,
			httpClient: httpClient,
			dateProvider: dateProvider
		)
		self.window = UIWindow(frame: UIScreen.main.bounds)

		let credentialsDb = try! CredentialsDatabase(dbPath: credentialsDatabasePath().absoluteString)
		let credentialsEncryption = IosNativeCredentialsFacade(
			keychainEncryption: keychainEncryption,
			credentialsDb: credentialsDb,
			cryptoFns: CommonCryptoCryptoFunctions()
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
			contactsSynchronization: IosMobileContactsFacade(),
			userPreferencesProvider: userPreferencesProvider,
			urlSession: self.urlSession
		)
		self.window!.rootViewController = viewController

		UNUserNotificationCenter.current().delegate = self

		window!.makeKeyAndVisible()
	}

	func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
		// if running unit tests, skip all setup and return
		#if DEBUG
			if ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil { return true }
		#endif
		TUTSLog("Start Tuta Calendar with launch options: \(String(describing: launchOptions))")
		self.start()
		return true
	}

	func applicationDidBecomeActive(_ application: UIApplication) { UIApplication.shared.applicationIconBadgeNumber = 0 }

	func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
		let stringToken = deviceTokenAsString(deviceToken: deviceToken)
		self.remoteNotificationsContinuation?.resume(with: .success(stringToken!))
		self.remoteNotificationsContinuation = nil
	}

	func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: any Error) {
		self.remoteNotificationsContinuation?.resume(with: .failure(error))
		self.remoteNotificationsContinuation = nil
	}

	/// handles tutanota deep links:
	/// tutanota:// -> ?
	/// tutacalshare:// -> share requests from the sharing extension
	func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
		switch url.scheme {
		case CALENDAR_SHARE_SCHEME: Task { try! await self.viewController.handleShare(url) }
		case TUTA_CALENDAR_INTEROP_SCHEME:
			Task {
				let sourceApp = options[UIApplication.OpenURLOptionsKey.sourceApplication]

				if sourceApp == nil { return }

				if String(describing: sourceApp!).starts(with: "de.tutao") { return try! await self.viewController.handleInterop(url) }

				TUTSLog("Tried to open Mail App from an unknown source!")
			}
		case nil: TUTSLog("missing scheme!")
		default: TUTSLog("unknown scheme? \(url.scheme!)")
		}
		return true
	}

	func application(
		_ application: UIApplication,
		didReceiveRemoteNotification userInfo: [AnyHashable: Any],
		fetchCompletionHandler completionHandler: @escaping @Sendable (UIBackgroundFetchResult) -> Void
	) {
		let apsDict = userInfo["aps"] as! [String: Any]
		TUTSLog("Received notification \(userInfo)")

		let contentAvailable = apsDict["content-available"]
		if contentAvailable as? Int == 1 {
			Task {
				await self.notificationsHandler.fetchMissedNotifications { result in
					TUTSLog("Fetched missed notification after notification \(String(describing: result))")
					switch result {
					case .success: completionHandler(.newData)
					case .failure: completionHandler(.failed)
					}
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
	private func spawnTransactionFinisher() {
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
