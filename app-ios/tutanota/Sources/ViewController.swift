import UIKit
import WebKit
import UserNotifications
import DictionaryCoding

struct AssetError : Error {
  let url: URL?
}

class AssetSchemeHandler : NSObject, WKURLSchemeHandler {
  func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
    guard let url = urlSchemeTask.request.url else {
      TUTSLog("Assets: No URL for task \(urlSchemeTask)")
      urlSchemeTask.didFailWithError(AssetError(url: nil))
      return
    }
    guard let fileUrl = fileUrlFromUrl(url) else {
      TUTSLog("Assets: Could not find file for URL \(url)")
      urlSchemeTask.didFailWithError(AssetError(url: url))
      return
    }
//    TUTSLog("Assets: \(url) -> \(fileUrl)")
    let mimeType = getFileMIMEType(forExtension: fileUrl.pathExtension) ?? "applicaion/octet-stream"
    
    guard let data = try? Data(contentsOf: fileUrl) else {
      TUTSLog("Assets: Could not read file for URL \(url)")
      urlSchemeTask.didFailWithError(AssetError(url: url))
      return
    }
    let response = HTTPURLResponse(url: url, mimeType: mimeType, expectedContentLength: data.count, textEncodingName: nil)
    urlSchemeTask.didReceive(response)
    urlSchemeTask.didReceive(data)
    urlSchemeTask.didFinish()
  }
  
  func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
    
  }
  
  private func fileUrlFromUrl(_ url: URL) -> URL? {
    return Bundle.main.url(forResource: url.path, withExtension: "", subdirectory: "build")
  }
}

class ApiSchemeHandler : NSObject, WKURLSchemeHandler {
  func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
    if urlSchemeTask.request.httpMethod == "OPTIONS" {
      urlSchemeTask.didFinish()
      return
    }
    guard let originalUrl = urlSchemeTask.request.url else {
      return
    }
    guard var urlComponents = URLComponents(url: originalUrl, resolvingAgainstBaseURL: false) else {
      return
    }
    // FIXME: unhardcode
    urlComponents.scheme = "https"
    urlComponents.host = "test.tutanota.com"
    let newUrl = urlComponents.url!

    var newRequest = urlSchemeTask.request
    newRequest.url = newUrl
    
    let session = URLSession.shared
    session.dataTask(with: newRequest) { data, response, error in
      if let error = error {
        urlSchemeTask.didFailWithError(error)
      } else {
        urlSchemeTask.didReceive(response!)
        urlSchemeTask.didReceive(data!)
        urlSchemeTask.didFinish()
      }
    }.resume()
  }
  
  func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
    
  }
}

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
      // FIXME: needed?
//      webViewConfig.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
      webViewConfig.setURLSchemeHandler(AssetSchemeHandler(), forURLScheme: "assets")
      webViewConfig.setURLSchemeHandler(ApiSchemeHandler(), forURLScheme: "api")

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
        fileFacade: IosFileFacade(chooser: TUTFileChooser(viewController: self), viewer: FileViewer(viewController: self)),
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

  /// Implementation of WKNavigationDelegate
  /// Handles links being clicked inside the webview
  func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    guard let requestUrl = navigationAction.request.url else {
      decisionHandler(.cancel)
      return
    }
    
    if requestUrl.scheme == "assets" {
      decisionHandler(.allow)
    } else {
      decisionHandler(.cancel)
      UIApplication.shared.open(requestUrl, options:[:])
    }

//    if requestUrl.scheme == "file" && requestUrl.path == self.appUrl().path {
//      decisionHandler(.allow)
//    } else if requestUrl.scheme == "file" && requestUrl.absoluteString.hasPrefix(self.appUrl().absoluteString) {
//	  // If the app is removed from memory, the URL won't point to the file but will have additional path.
//	  // We ignore additional path for now.
//      decisionHandler(.cancel)
//      self.loadMainPage(params:[:])
//    } else {
//      decisionHandler(.cancel)
//      UIApplication.shared.open(requestUrl, options:[:])
//    }

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
    self.view.addSubview(webView)
    webView.translatesAutoresizingMaskIntoConstraints = false
    webView.leftAnchor.constraint(equalTo: self.view.leftAnchor).isActive = true
    webView.topAnchor.constraint(equalTo: self.view.topAnchor).isActive = true
    webView.rightAnchor.constraint(equalTo: self.view.rightAnchor).isActive = true
    webView.bottomAnchor.constraint(equalTo: self.view.bottomAnchor).isActive = true

    let theme = self.themeManager.currentThemeWithFallback
    self.applyTheme(theme)
    self.alarmManager.initialize()

    self._loadMainPage(params: [:])
  }

  private func _loadMainPage(params: [String : String]) {
    let fileUrl = self.appUrl()
    let baseUrl = URL(string: "assets://")!

    var mutableParams = params
    if let theme = self.themeManager.currentTheme {
      let encodedTheme = self.dictToJson(dictionary: theme)
      mutableParams["theme"] = encodedTheme
    }
    mutableParams["platformId"] = "ios"
    let queryParams = URLQueryItem.from(dict: mutableParams)
    var components = URLComponents.init(url: baseUrl, resolvingAgainstBaseURL: false)!
    
    components.queryItems = queryParams

    let url = components.url!
    let fileContent = try! String(contentsOf: fileUrl)
    webView.loadHTMLString(fileContent, baseURL: url)
  }

  private func dictToJson(dictionary: [String : String]) -> String {
    return try! String(data: JSONEncoder().encode(dictionary), encoding: .utf8)!
  }

  private func appUrl() -> URL {
    let env = ProcessInfo.processInfo.environment

    let pagePath: String
    if let envPath = env["TUT_PAGE_PATH"] {
      pagePath = envPath
    } else {
      pagePath = Bundle.main.infoDictionary!["TutanotaApplicationPath"] as! String
    }
    let path = Bundle.main.path(forResource: pagePath + "index-app", ofType: "html")
    if path == nil {
      return Bundle.main.resourceURL!
    } else {
      return NSURL.fileURL(withPath: path!)
    }
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
      if #available(iOS 13, *) {
        return .darkContent
      } else {
        return .default
      }
    }
  }
}
