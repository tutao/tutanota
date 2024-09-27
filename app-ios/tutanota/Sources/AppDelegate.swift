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
		#if DEBUG
			if ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil { return true }
		#endif
		TUTSLog("Start Tutanota with launch options: \(String(describing: launchOptions))")
		try! migrateToSharedstorage()
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
	/// tutashare:// -> share requests from the sharing extension
	func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
		switch url.scheme {
		case TUTANOTA_SHARE_SCHEME: Task { try! await self.viewController.handleShare(url) }
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

	func userNotificationCenter(
		_ center: UNUserNotificationCenter,
		didReceive response: UNNotificationResponse,
		withCompletionHandler completionHandler: @escaping () -> Void
	) {
		if response.actionIdentifier == UNNotificationDefaultActionIdentifier {
			let notification = response.notification
			let userInfo = notification.request.content.userInfo
			guard let userId = userInfo["userId"] as? String else { return }
			guard let mailIdArray = userInfo["mailId"] as? [String], mailIdArray.count == 2 else { return }
			let mailId = (mailIdArray[0], mailIdArray[1])
			let address = userInfo["firstRecipient"] as? String ?? ""
			self.viewController.handleOpenNotification(userId: userId, address: address, mailId: mailId)
		}
		completionHandler()
	}

	func applicationDidEnterBackground(_ application: UIApplication) {
		self.viewController.onApplicationDidEnterBackground()

	}

	func applicationWillTerminate(_ application: UIApplication) {
		self.viewController.onApplicationWillTerminate()
		do { try FileUtils.deleteSharedStorage() } catch { TUTSLog("failed to delete shared storage on shutdown: \(error)") }
	}

	// everything is handled on the server. nothing to do here (should run infinitely in the background)
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

private func migrateToSharedstorage() throws {
	try migrateUserDefaultsToSharedStorage()
	try migrateOfflineDbToSharedStorage()
}

private func migrateUserDefaultsToSharedStorage() throws {
	// User Defaults - Old
	let userDefaults = UserDefaults.standard

	// App Groups Default - New
	let groupDefaults = UserDefaults(suiteName: getAppGroupName())!

	// Key to track if we migrated
	let didMigrateToAppGroups = "didMigrateToAppGroups"

	if !groupDefaults.bool(forKey: didMigrateToAppGroups) {
		for (key, value) in userDefaults.dictionaryRepresentation() { groupDefaults.set(value, forKey: key) }
		groupDefaults.set(true, forKey: didMigrateToAppGroups)
		TUTSLog("Successfully migrated defaults")
	} else {
		TUTSLog("No need to migrate defaults")
	}
}

private func migrateOfflineDbToSharedStorage() throws {
	let oldDbDirectoryUrl = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
	let userDirectoryFiles = try FileManager.default.contentsOfDirectory(at: oldDbDirectoryUrl, includingPropertiesForKeys: nil)

	for item in userDirectoryFiles {
		if item.isFileURL && item.relativePath.contains("offline") && item.relativePath.hasSuffix(".sqlite") {
			let fileName = item.pathComponents.last!
			let newFileUrl = makeDbPath(fileName: fileName)
			do {
				try FileManager.default.moveItem(at: item, to: newFileUrl)
				TUTSLog("Did move offline db \(fileName) to \(newFileUrl.relativePath)")
			} catch {
				TUTSLog("Could not move offline db \(fileName): \(error)")
				do { try FileManager.default.removeItem(at: item) } catch { TUTSLog("Could not clean up offline db: \(error)") }
			}
		}
	}
}
