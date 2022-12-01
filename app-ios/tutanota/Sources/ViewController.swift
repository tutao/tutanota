import UIKit
import WebKit
import UserNotifications
import DictionaryCoding
import AuthenticationServices

/// Main screen of the app.
class ViewController : UIViewController, WKNavigationDelegate, UIScrollViewDelegate {
  private let themeManager: ThemeManager
  private let alarmManager: AlarmManager
  private var bridge: RemoteBridge!
  private var webView: WKWebView!
  
  private var keyboardSize = 0
  private var isDarkTheme = false
  
  init(
    crypto: IosNativeCryptoFacade,
    themeManager: ThemeManager,
    keychainManager: KeychainManager,
    userPreferences: UserPreferenceFacade,
    alarmManager: AlarmManager,
    credentialsEncryption: IosNativeCredentialsFacade,
    blobUtils:BlobUtil
  ) {
    self.themeManager = themeManager
    self.alarmManager = alarmManager
    self.bridge = nil
    
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
    
    let commonSystemFacade = IosCommonSystemFacade(viewController: self)
    self.bridge = RemoteBridge(
      webView: self.webView,
      viewController: self,
      commonSystemFacade: commonSystemFacade,
      fileFacade: IosFileFacade(
        chooser: TUTFileChooser(viewController: self),
        viewer: FileViewer(viewController: self),
        schemeHandler: apiSchemeHandler
      ),
      nativeCredentialsFacade: credentialsEncryption,
      nativeCryptoFacade: crypto,
      themeFacade: IosThemeFacade(themeManager: themeManager, viewController: self),
      appDelegate: self.appDelegate,
      alarmManager: self.alarmManager,
      userPreferences: userPreferences,
      keychainManager: keychainManager
    )
  }
  
  required init?(coder: NSCoder) {
    fatalError("Not NSCodable")
  }
  
  override func loadView() {
    super.loadView()
    self.view.addSubview(webView)
    WebviewHacks.hideAccessoryBar()
    WebviewHacks.keyboardDisplayDoesNotRequireUserAction()
    
    NotificationCenter.default.addObserver(self, selector: #selector(onKeyboardDidShow), name: UIResponder.keyboardDidShowNotification, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(onKeyboardWillHide), name: UIResponder.keyboardWillHideNotification, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(onKeyboardSizeChange), name: UIResponder.keyboardDidChangeFrameNotification, object: nil)
  }
  
  override func viewDidAppear(_ animated: Bool) {
    self.testWebauthn()
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
      self.loadMainPage(params:[:])
    } else {
      decisionHandler(.cancel)
      UIApplication.shared.open(requestUrl, options:[:])
    }
    
  }
  
  var appDelegate: AppDelegate {
    get {
      UIApplication.shared.delegate as! AppDelegate
    }
  }
  
  func loadMainPage(params: [String : String]) {
    DispatchQueue.main.async {
      self._loadMainPage(params: params)
    }
  }
  
  @objc
  private func onKeyboardDidShow(note: Notification) {
    let rect = note.userInfo![UIResponder.keyboardFrameEndUserInfoKey] as! CGRect
    self.onAnyKeyboardSizeChange(newHeight: rect.size.height)
    
  }
  
  @objc
  private func onKeyboardWillHide() {
    self.onAnyKeyboardSizeChange(newHeight: 0)
  }
  
  @objc
  private func onKeyboardSizeChange(note: Notification) {
    let rect = note.userInfo![UIResponder.keyboardFrameEndUserInfoKey] as! CGRect
    let newHeight = rect.size.height
    if self.keyboardSize != 0 && self.keyboardSize != Int(newHeight) {
      self.onAnyKeyboardSizeChange(newHeight: newHeight)
    }
  }
  
  private func onAnyKeyboardSizeChange(newHeight: CGFloat) {
    self.keyboardSize = Int(newHeight)
    Task {
      try await MobileFacadeSendDispatcher(transport: self.bridge).keyboardSizeChanged(self.keyboardSize)
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
    self.alarmManager.initialize()
    
    
    Task { @MainActor in
      let location = UserDefaults.standard.string(forKey: "webConfigLocation")
      if location != "assetOrigin" {
        await self.migrateCredentialsFromOldOrigin()
      }
      
      self._loadMainPage(params: [:])
    }
  }
  
  private func testWebauthn() {
//    let baseUrl = "http://ivk:9000/client/build/webauthnmobile"
    let baseUrl = "https://test.tutanota.com"
    let queryItems = NSURLQueryItem.from(dict: ["cbUrl": "tutanota://{result}"])
    var components = URLComponents.init(url: URL(string: baseUrl)!, resolvingAgainstBaseURL: false)!
    components.queryItems = queryItems
    let authUrl = components.url!
    let scheme = "tutanota"
    let session = ASWebAuthenticationSession(url: authUrl, callbackURLScheme: scheme) { url, error in
      TUTSLog("url \(url) error \(error)")
    }
    session.prefersEphemeralWebBrowserSession = true
    session.presentationContextProvider = self
    session.start()
  }
  
  private func migrateCredentialsFromOldOrigin() async {
    defer {
      UserDefaults.standard.set("assetOrigin", forKey: "webConfigLocation")
    }
    TUTSLog("Migrating webView data")
    do {
      let oldConfig = try await self.executeJavascriptForResult(
        js: "localStorage.getItem('tutanotaConfig') ? btoa(localStorage.getItem('tutanotaConfig')) : 'null'",
        withUrl: "file:///dummy.html"
      )
      if oldConfig == "null" {
        TUTSLog("Nothing to migrate")
        return
      }
      
      TUTSLog("Deleting old webView data")
      let dataRecords = await WKWebsiteDataStore.default().dataRecords(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes())
      await WKWebsiteDataStore.default().removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), for: dataRecords)
      
      TUTSLog("Setting new webView config")
      
      let _ = try await self.executeJavascriptForResult(
        // Must return something otherwise webkit gets sad
        js: "localStorage.setItem('tutanotaConfig', atob('\(oldConfig)')); '42'",
        withUrl: "asset://app/polyfill.js"
      )
      TUTSLog("WebView config migrated")
    } catch {
      TUTSLog("Error during webView data migration \(error)")
    }
  }
  
  private func executeJavascriptForResult(js: String, withUrl url: String) async throws -> String {
    return try await withCheckedThrowingContinuation { cont in
      let webViewConfig = WKWebViewConfiguration()
      webViewConfig.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
      let folderPath: String = (self.appUrl() as NSURL).deletingLastPathComponent!.path
      webViewConfig.setURLSchemeHandler(AssetSchemeHandler(folderPath: folderPath), forURLScheme: "asset")
      
      let migrationWebView = WKWebView(frame: CGRect.zero, configuration: webViewConfig)
      
      let littleDelegate = LittleNavigationDelegate()
      littleDelegate.action = {
        Task {
          defer {
            littleDelegate.action = nil
          }
          
          let result: Any
          do {
            result = try await migrationWebView.evaluateJavaScript(js)
          } catch {
            cont.resume(throwing: error)
            return
          }
          if let result = result as? String {
            cont.resume(returning: result)
          } else {
            cont.resume(throwing: TUTErrorFactory.createError("Could not execute JS"))
          }
        }
      }
      migrationWebView.navigationDelegate = littleDelegate
      migrationWebView.loadHTMLString("", baseURL: URL(string: url))
    }
  }
  
  private func _loadMainPage(params: [String : String]) {
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
  
  private func dictToJson(dictionary: [String : String]) -> String {
    return try! String(data: JSONEncoder().encode(dictionary), encoding: .utf8)!
  }
  
  private func appUrl() -> URL {    
    // this var is stored in Info.plist and possibly manipulated by the build schemes:
    // Product > Scheme > Manage Schemes in xcode.
    // default path points to the dist build of the web app,
    // both schemes modify it to point at the respective build before building the app
    let pagePath: String = Bundle.main.infoDictionary!["TutanotaApplicationPath"] as! String
    let path = Bundle.main.path(forResource: pagePath + "index-app", ofType: "html")
    if path == nil {
      return Bundle.main.resourceURL!
    } else {
      return NSURL.fileURL(withPath: path!)
    }
  }
  
  private func getAssetUrl() -> URL {
    return URL(string: "asset://app/index-app.html")!
  }
  
  func applyTheme(_ theme: [String : String]) {
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
  
  override var preferredStatusBarStyle: UIStatusBarStyle {
    if self.isDarkTheme {
      return .lightContent
    } else {
      return .darkContent
    }
  }
}


// Remove when webView config migration is removed
fileprivate class LittleNavigationDelegate : NSObject, WKNavigationDelegate {
  var action: (() -> Void)? = nil
  
  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    if let action = self.action {
      action()
    }
  }
  
  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    TUTSLog("FAILED NAVIGATION >{")
  }
}

extension ViewController: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return view.window!
    }
}
