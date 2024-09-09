import AuthenticationServices
import DictionaryCoding
import TutanotaSharedFramework
import UIKit
import UserNotifications
import WebKit

/// Main screen of the app.
class ViewController: UIViewController, WKNavigationDelegate, UIScrollViewDelegate {
	private let themeManager: ThemeManager
	private let alarmManager: AlarmManager
	private let notificationsHandler: NotificationsHandler
	private var bridge: RemoteBridge!
	private var webView: WKWebView!
	private var sqlCipherFacade: IosSqlCipherFacade

	private var keyboardSize = 0
	private var isDarkTheme = false

	init(
		crypto: TutanotaSharedFramework.IosNativeCryptoFacade,
		themeManager: ThemeManager,
		keychainManager: KeychainManager,
		notificationStorage: NotificationStorage,
		alarmManager: AlarmManager,
		notificaionsHandler: NotificationsHandler,
		credentialsEncryption: IosNativeCredentialsFacade,
		blobUtils: BlobUtil,
		contactsSynchronization: IosMobileContactsFacade,
		userPreferencesProvider: UserPreferencesProvider
	) {

		self.themeManager = themeManager
		self.alarmManager = alarmManager
		self.notificationsHandler = notificaionsHandler
		self.bridge = nil
		self.sqlCipherFacade = IosSqlCipherFacade()

		super.init(nibName: nil, bundle: nil)
		let webViewConfig = WKWebViewConfiguration()
		let folderPath: String = (self.appUrl() as NSURL).deletingLastPathComponent!.path
		webViewConfig.preferences.setValue(false, forKey: "allowFileAccessFromFileURLs")
		let apiSchemeHandler = ApiSchemeHandler()
		webViewConfig.setURLSchemeHandler(apiSchemeHandler, forURLScheme: "api")
		webViewConfig.setURLSchemeHandler(apiSchemeHandler, forURLScheme: "apis")
		webViewConfig.setURLSchemeHandler(AssetSchemeHandler(folderPath: folderPath), forURLScheme: "asset")

		self.webView = WKWebView(frame: CGRect.zero, configuration: webViewConfig)
		webView.navigationDelegate = self
		webView.scrollView.bounces = false
		webView.scrollView.isScrollEnabled = false
		webView.scrollView.delegate = self
		webView.isOpaque = false
		webView.scrollView.contentInsetAdjustmentBehavior = .never

		#if DEBUG
			if #available(iOS 16.4, *) { webView.isInspectable = true }
		#endif

		let commonSystemFacade = IosCommonSystemFacade(viewController: self)
		self.bridge = RemoteBridge(
			webView: self.webView,
			viewController: self,
			commonSystemFacade: commonSystemFacade,
			fileFacade: IosFileFacade(chooser: TUTFileChooser(viewController: self), viewer: FileViewer(viewController: self), schemeHandler: apiSchemeHandler),
			nativeCredentialsFacade: credentialsEncryption,
			nativeCryptoFacade: crypto,
			themeFacade: IosThemeFacade(themeManager: themeManager, viewController: self),
			appDelegate: self.appDelegate,
			alarmManager: self.alarmManager,
			notificationStorage: notificationStorage,
			keychainManager: keychainManager,
			webAuthnFacade: IosWebauthnFacade(viewController: self),
			sqlCipherFacade: self.sqlCipherFacade,
			contactsSynchronization: contactsSynchronization,
			userPreferencesProvider: userPreferencesProvider,
			externalCalendarFacade: ExternalCalendarFacadeImpl()
		)

	}

	required init?(coder: NSCoder) { fatalError("Not NSCodable") }

	override func loadView() {
		super.loadView()
		self.view.addSubview(webView)
		WebviewHacks.hideAccessoryBar()
		WebviewHacks.keyboardDisplayDoesNotRequireUserAction()

		NotificationCenter.default.addObserver(self, selector: #selector(onKeyboardDidShow), name: UIResponder.keyboardDidShowNotification, object: nil)
		NotificationCenter.default.addObserver(self, selector: #selector(onKeyboardWillHide), name: UIResponder.keyboardWillHideNotification, object: nil)
		NotificationCenter.default.addObserver(
			self,
			selector: #selector(onKeyboardSizeChange),
			name: UIResponder.keyboardDidChangeFrameNotification,
			object: nil
		)
	}

	/// Implementation of WKNavigationDelegate
	/// Handles links being clicked inside the webview
	func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
		guard let requestUrl = navigationAction.request.url else {
			decisionHandler(.cancel)
			return
		}

		if requestUrl.scheme == "asset" && requestUrl.path == self.getAssetUrl().path {
			decisionHandler(.allow)
		} else if requestUrl.scheme == "asset" && requestUrl.absoluteString.hasPrefix(self.getAssetUrl().absoluteString) {
			// If the app is removed from memory, the URL won't point to the file but will have additional path.
			// We ignore additional path for now.
			decisionHandler(.cancel)
			self.loadMainPage(params: [:])
		} else {
			decisionHandler(.cancel)
			UIApplication.shared.open(requestUrl, options: [:])
		}

	}

	var appDelegate: AppDelegate { get { UIApplication.shared.delegate as! AppDelegate } }

	func loadMainPage(params: [String: String]) { DispatchQueue.main.async { self._loadMainPage(params: params) } }

	@objc private func onKeyboardDidShow(note: Notification) {
		let rect = note.userInfo![UIResponder.keyboardFrameEndUserInfoKey] as! CGRect
		self.onAnyKeyboardSizeChange(newHeight: rect.size.height)
	}

	@objc private func onKeyboardWillHide() { self.onAnyKeyboardSizeChange(newHeight: 0) }

	@objc private func onKeyboardSizeChange(note: Notification) {
		let rect = note.userInfo![UIResponder.keyboardFrameEndUserInfoKey] as! CGRect
		let newHeight = rect.size.height
		if self.keyboardSize != 0 && self.keyboardSize != Int(newHeight) { self.onAnyKeyboardSizeChange(newHeight: newHeight) }
	}

	private func onAnyKeyboardSizeChange(newHeight: CGFloat) {
		self.keyboardSize = Int(newHeight)
		Task { try await MobileFacadeSendDispatcher(transport: self.bridge).keyboardSizeChanged(self.keyboardSize) }
	}

	func onApplicationDidEnterBackground() {
		// When the user leaves the app we want to perform "incremental_vacuum" on the offline database.
		// We perform vacuum once the app is put into background instead of when the app is terminated as on iOS
		// we do not have enough time before the app is terminated by the system.
		Task { try await self.sqlCipherFacade.vaccumDb() }
	}

	func onApplicationWillTerminate() { Task { try await self.sqlCipherFacade.closeDb() } }

	override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
		super.traitCollectionDidChange(previousTraitCollection)
		Task.detached { @MainActor in
			self.applyTheme(self.themeManager.currentThemeWithFallback)
			try? await self.bridge.commonNativeFacade.updateTheme()
		}
	}

	override func viewDidLoad() {
		super.viewDidLoad()
		webView.translatesAutoresizingMaskIntoConstraints = false
		webView.leftAnchor.constraint(equalTo: self.view.leftAnchor).isActive = true
		webView.topAnchor.constraint(equalTo: self.view.topAnchor).isActive = true
		webView.rightAnchor.constraint(equalTo: self.view.rightAnchor).isActive = true
		webView.bottomAnchor.constraint(equalTo: self.view.bottomAnchor).isActive = true

		let theme = self.themeManager.currentThemeWithFallback
		self.applyTheme(theme)
		self.notificationsHandler.initialize()

		Task { @MainActor in self._loadMainPage(params: [:]) }
	}

	private func _loadMainPage(params: [String: String]) {
		let fileUrl = self.getAssetUrl()

		var mutableParams = params
		if let theme = self.themeManager.currentTheme {
			let encodedTheme = self.dictToJson(dictionary: theme)
			mutableParams["theme"] = encodedTheme
		}
		mutableParams["platformId"] = "ios"
		let queryParams = NSURLQueryItem.from(dict: mutableParams)
		var components = URLComponents.init(url: fileUrl, resolvingAgainstBaseURL: false)!
		components.queryItems = queryParams

		let url = components.url!
		webView.load(URLRequest(url: url))
	}

	private func dictToJson(dictionary: [String: String]) -> String { try! String(data: JSONEncoder().encode(dictionary), encoding: .utf8) ?? "" }

	private func appUrl() -> URL {
		// this var is stored in Info.plist and possibly manipulated by the build schemes:
		// Product > Scheme > Manage Schemes in xcode.
		// default path points to the dist build of the web app,
		// both schemes modify it to point at the respective build before building the app
		let pagePath: String = Bundle.main.infoDictionary!["TutanotaApplicationPath"] as! String
		let path = Bundle.main.path(forResource: pagePath + "index-app", ofType: "html")
		if path == nil { return Bundle.main.resourceURL! } else { return NSURL.fileURL(withPath: path!) }
	}

	private func getAssetUrl() -> URL { URL(string: "asset://app/index-app.html")! }

	func applyTheme(_ theme: [String: String]) {
		let contentBgString = theme["content_bg"]!
		let contentBg = UIColor(hex: contentBgString)!
		self.isDarkTheme = !contentBg.isLight()
		self.view.backgroundColor = contentBg
		self.setNeedsStatusBarAppearanceUpdate()
	}

	func scrollViewDidScroll(_ scrollView: UIScrollView) {
		// disable scrolling of the web view to avoid that the keyboard moves the body out of the screen
		scrollView.contentOffset = CGPoint.zero
	}

	/// use the URL we were called with to retrieve the information about shared items
	/// from the app group storage
	private func getSharingInfo(url: URL) async -> SharingInfo? {
		guard let infoLocation = url.host else { return nil }
		return readSharingInfo(infoLocation: infoLocation)
	}

	func handleShare(_ url: URL) async throws {
		guard let info = await getSharingInfo(url: url) else {
			TUTSLog("unable to get sharingInfo from url: \(url)")
			return
		}

		do { try await self.bridge.commonNativeFacade.createMailEditor(info.fileUrls.map { $0.path }, info.text, [], "", "") } catch {
			TUTSLog("failed to open mail editor to share: \(error)")
			try FileUtils.deleteSharedStorage(subDir: info.identifier)
		}
	}

	override var preferredStatusBarStyle: UIStatusBarStyle { if self.isDarkTheme { return .lightContent } else { return .darkContent } }
}

// Remove when webView config migration is removed
private class LittleNavigationDelegate: NSObject, WKNavigationDelegate {
	var action: (() -> Void)?

	func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { if let action = self.action { action() } }

	func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { TUTSLog("FAILED NAVIGATION >{") }
}

extension ViewController: ASWebAuthenticationPresentationContextProviding {
	func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor { view.window! }
}
