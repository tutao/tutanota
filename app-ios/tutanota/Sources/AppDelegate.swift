import StoreKit
import TutanotaSharedFramework
import UIKit
import tutasdk

public let TUTA_MAIL_INTEROP_SCHEME = "tutamail"
public let TUTA_MAIL_MAILTO_SCHEME = "tutamailto"
public let MAILTO_SCHEME = "mailto"

@UIApplicationMain class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
	var window: UIWindow?

	private var remoteNotificationsContinuation: CheckedContinuation<String, Error>?
	private var alarmManager: AlarmManager!
	private var notificationsHandler: NotificationsHandler!
	private var viewController: ViewController!
	private let urlSession: URLSession = makeUrlSession()

	private var notificationStorage: NotificationStorage!

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
		self.notificationStorage = NotificationStorage(userPreferencesProvider: userPreferencesProvider)
		let keychainManager = KeychainManager(keyGenerator: KeyGenerator())
		let keychainEncryption = KeychainEncryption(keychainManager: keychainManager)
		let dateProvider: SystemDateProvider = SystemDateProvider()

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

		TUTSLog("Start Tutanota with launch options: \(String(describing: launchOptions))")
		try! migrateToSharedstorage()
		self.registerNotificationCategories()

		self.start()
		return true
	}

	func applicationDidBecomeActive(_ application: UIApplication) {
		// if running unit tests do not try to use components that might not be there
		#if DEBUG
			if ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil { return }
		#endif
		UIApplication.shared.applicationIconBadgeNumber = 0
		self.notificationStorage.resetNotificaitonCount()
	}

	func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
		let stringToken = deviceTokenAsString(deviceToken: deviceToken)
		self.remoteNotificationsContinuation?.resume(with: .success(stringToken!))
		self.remoteNotificationsContinuation = nil
	}

	func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
		self.remoteNotificationsContinuation?.resume(with: .failure(error))
		self.remoteNotificationsContinuation = nil
	}

	/// handles tutanota deep links:
	/// tutanota:// -> ?
	/// tutashare:// -> share requests from the sharing extension
	func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
		switch url.scheme {
		case TUTANOTA_SHARE_SCHEME: Task { try! await self.viewController.handleShare(url) }
		case TUTA_MAIL_INTEROP_SCHEME:
			Task {
				guard let sourceApp = options[UIApplication.OpenURLOptionsKey.sourceApplication] else { return }
				if String(describing: sourceApp).starts(with: "de.tutao") { return try! await self.viewController.handleInterop(url) }

				TUTSLog("Tried to open Mail App from an unknown source!")
			}
		case TUTA_MAIL_MAILTO_SCHEME, MAILTO_SCHEME: Task { try? await self.viewController.handleMailto(url) }
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
		TUTSLog("Received background notification, content-available: \(String(describing: contentAvailable))")
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
		let userInfo = response.notification.request.content.userInfo
		guard let mailId = userInfo["mailId"] as? [String], mailId.count == 2, let userId = userInfo["userId"] as? String else { return }
		switch response.actionIdentifier {
		case MAIL_READ_ACTION: Task { try await handleWithSdk(mailId: mailId, userId: userId, actionIdentifier: MAIL_READ_ACTION) }
		case MAIL_TRASH_ACTION: Task { try await handleWithSdk(mailId: mailId, userId: userId, actionIdentifier: MAIL_TRASH_ACTION) }
		case UNNotificationDefaultActionIdentifier:
			let mailIdTuple = (mailId[0], mailId[1])
			let address = userInfo["firstRecipient"] as? String ?? ""
			self.viewController.handleOpenNotification(userId: userId, address: address, mailId: mailIdTuple)
		default: TUTSLog("Invalid Notification Action")
		}
		completionHandler()
	}

	func handleWithSdk(mailId: [String], userId: String, actionIdentifier: String) async throws {
		let credentialsDb = try! CredentialsDatabase(dbPath: credentialsDatabasePath().absoluteString)
		let keychainManager = KeychainManager(keyGenerator: KeyGenerator())
		let keychainEncryption = KeychainEncryption(keychainManager: keychainManager)
		let credentialsFacade = IosNativeCredentialsFacade(keychainEncryption: keychainEncryption, credentialsDb: credentialsDb, cryptoFns: CryptoFunctions())
		let notificationStorage = NotificationStorage(userPreferencesProvider: UserPreferencesProviderImpl())
		guard let origin = notificationStorage.sseInfo?.sseOrigin else { return }
		guard let unencryptedCredentials = try await credentialsFacade.loadByUserId(userId) else { return }
		guard let encryptedPassphraseKey = unencryptedCredentials.encryptedPassphraseKey else { return }
		let credentials = tutasdk.Credentials(
			login: unencryptedCredentials.credentialInfo.login,
			userId: userId,
			accessToken: unencryptedCredentials.accessToken,
			encryptedPassphraseKey: encryptedPassphraseKey.data,
			credentialType: tutasdk.CredentialType.internal
		)
		let sdk = try await Sdk(baseUrl: origin, rawRestClient: SdkRestClient(urlSession: self.urlSession), fileClient: SdkFileClient())
			.login(credentials: credentials)
		let mail = IdTupleGenerated(listId: mailId[0], elementId: mailId[1])
		switch actionIdentifier {
		case MAIL_TRASH_ACTION: try await sdk.mailFacade().trashMails(mails: [mail])
		case MAIL_READ_ACTION: try await sdk.mailFacade().setUnreadStatusForMails(mails: [mail], unread: false)
		default: TUTSLog("Invalid Notification Action")
		}
	}
	func applicationDidEnterBackground(_ application: UIApplication) {
		self.viewController.onApplicationDidEnterBackground()

	}

	func applicationWillTerminate(_ application: UIApplication) {
		self.viewController.onApplicationWillTerminate()
		do { try FileUtils.deleteSharedStorage() } catch { TUTSLog("failed to delete shared storage on shutdown: \(error)") }
	}

	private func registerNotificationCategories() {
		let readAction = UNNotificationAction(identifier: MAIL_READ_ACTION, title: translate("TutaoMarkReadAction", default: "Mark Read"), options: [])
		let trashAction = UNNotificationAction(identifier: MAIL_TRASH_ACTION, title: translate("TutaoDeleteAction", default: "Delete"), options: [.destructive])
		let mailActionsCategory = UNNotificationCategory(
			identifier: MAIL_ACTIONS_CATEGORY,
			actions: [readAction, trashAction],
			intentIdentifiers: [],
			options: .customDismissAction
		)

		UNUserNotificationCenter.current().setNotificationCategories([mailActionsCategory])
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
