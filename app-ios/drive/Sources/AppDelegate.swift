import StoreKit
import TutanotaSharedFramework
import UIKit

// FIXME
public let TUTA_CALENDAR_INTEROP_SCHEME = "tutacalendar"

@main class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
	var window: UIWindow?

	private var viewController: ViewController!
	private let urlSession: URLSession = makeUrlSession()

	fileprivate func start() {
		spawnTransactionFinisher()

		let userPreferencesProvider = UserPreferencesProviderImpl()
		let keychainManager = KeychainManager(keyGenerator: KeyGenerator())
		let keychainEncryption = KeychainManagerKeychainEncryption(keychainManager: keychainManager)
		let dateProvider = SystemDateProvider()

		let alarmModel = AlarmModel(dateProvider: dateProvider)
		let httpClient = URLSessionHttpClient(session: self.urlSession)
		self.window = UIWindow(frame: UIScreen.main.bounds)

		let credentialsDb = try! CredentialsDatabase(dbPath: credentialsDatabasePath().absoluteString)
		let credentialsEncryption = IosNativeCredentialsFacade(
			keychainEncryption: keychainEncryption,
			credentialsDb: credentialsDb,
			cryptoFns: CommonCryptoCryptoFunctions()
		)

		let tempFs = TempFs()
		self.viewController = ViewController(
			crypto: TutanotaSharedFramework.IosNativeCryptoFacade(tempFs: tempFs),
			themeManager: ThemeManager(userPreferencesProvider: userPreferencesProvider),
			keychainManager: keychainManager,
			credentialsEncryption: credentialsEncryption,
			blobUtils: BlobUtil(tempFs: tempFs),
			contactsSynchronization: IosMobileContactsFacade(),
			userPreferencesProvider: userPreferencesProvider,
			urlSession: self.urlSession,
			tempFs: tempFs,
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
				//				FIXME
				//				let transaction = IosMobilePaymentsFacade.checkVerified(result)
				//				await transaction.finish()
				//				TUTSLog("finished transaction \(transaction.id)")
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
