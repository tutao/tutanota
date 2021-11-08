import Foundation
import DictionaryCoding

/// Gateway for communicating with Javascript code in WebView. Can send messages and handle requests.
class WebViewBridge : NSObject {
  private let webView: WKWebView
  private let viewController: ViewController
  private let crypto: CryptoFacade
  private let fileFacade: FileFacade
  private let contactsSource: ContactsSource
  private let themeManager: ThemeManager
  private let keychainManager: KeychainManager
  private let userPreferences: UserPreferenceFacade
  private let alarmManager: AlarmManager
  
  private var requestId = 0
  private var requests = [String : ((Any?) -> Void)]()
  private var requestsBeforeInit = [() -> Void]()
  private var webviewInitialized = false
  
  init(
    webView: WKWebView,
    viewController: ViewController,
    crypto: CryptoFacade,
    contactsSource: ContactsSource,
    themeManager: ThemeManager,
    keychainManager: KeychainManager,
    userPreferences: UserPreferenceFacade,
    alarmManager: AlarmManager,
    fileFacade: FileFacade
  ) {
    self.webView = webView
    self.viewController = viewController
    self.crypto = crypto
    self.contactsSource = contactsSource
    self.themeManager = themeManager
    self.keychainManager = keychainManager
    self.userPreferences = userPreferences
    self.alarmManager = alarmManager
    self.fileFacade = fileFacade
    
    super.init()
    self.webView.configuration.userContentController.add(self, name: "nativeApp")
  }
  
  func injectBridge() {
    // We need to implement this bridging from here because we don't know if we are an iOS app
    // before the init is sent from here.
    // From JS we expect window.nativeApp.invoke to be there.
    let js =
      """
      window.nativeApp = {
        invoke: (message) => window.webkit.messageHandlers.nativeApp.postMessage(message)
      }
      """
    self.webView.evaluateJavaScript(js, completionHandler: nil)
  }
  
  func sendRequest(
    method: String,
    args: [Encodable],
    completion: ((Any?) -> Void)?
  ) {
    if !self.webviewInitialized {
      let callback = { self.sendRequest(method: method, args: args, completion: completion) }
      self.requestsBeforeInit.append(callback)
      return
    }
    
    self.requestId = self.requestId + 1
    let requestId = "app\(self.requestId)"
    if let completion = completion {
      self.requests[requestId] = completion
    }
    let bridgeMessage = RemoteMessage.request(
      id: requestId,
      type: method,
      args: args
    )
    self.postMessage(bridgeMessage: bridgeMessage)
  }
  
  private func sendResponse(requestId: String, value: Encodable) {
    let response = RemoteMessage.response(id: requestId, value: value)
    self.postMessage(bridgeMessage: response)
  }

  private func sendErrorResponse(requestId: String, err: Error) {
    let nsError = err as NSError
    let userInfo = nsError.userInfo
    var newDict = [String : String]()
    for (key, value) in userInfo {
      newDict[key] = String(describing: value)
    }
    let message = String(data: try! JSONEncoder().encode(newDict), encoding: .utf8)!
    
    let error = ResponseError(
      name: nsError.domain,
      message: "code \(nsError.code) message: \(message)"
    )
    let bridgeMessage = RemoteMessage.requestError(id: requestId, error: error)
    self.postMessage(bridgeMessage: bridgeMessage)
  }

  private func postMessage(bridgeMessage: RemoteMessage) {
    let data = try! JSONEncoder().encode(bridgeMessage)
    DispatchQueue.main.async {
      let base64 = data.base64EncodedString()
      let js = "tutao.nativeApp.handleMessageFromNative('\(base64)')"
      self.webView.evaluateJavaScript(js, completionHandler: nil)
    }
  }
  
  private func handleResponse(id: String, value: Any?) {
    if let request = self.requests[id] {
      self.requests.removeValue(forKey: id)
      request(value)
    }
  }
  
  private func handleRequest(type: String, requestId: String, args: [Any]) {
    self.handleRequest(type: type, args: args) { response in
      switch response {
      case let .success(value):
        self.sendResponse(requestId: requestId, value: value)
      case let .failure(error):
        self.sendErrorResponse(requestId: requestId, err: error)
      }
    }
  }
  
  private func handleRequest(type: String, args: [Any], completion: @escaping (Result<Encodable, Error>) -> Void) {
    func respond<T: Encodable>(_ result: Result<T, Error>) {
      // For some reason Result is not covariant in its value so we manually erase it
      let erasedResult: Result<Encodable, Error> = result.map { thing in thing }
      completion(erasedResult)
    }
    
      switch type {
      case "init":
        self.webviewInitialized = true
        respond(.success("ios"))
        for callback in requestsBeforeInit {
          callback()
        }
        requestsBeforeInit.removeAll()
        if let sseInfo = userPreferences.sseInfo, sseInfo.userIds.isEmpty {
          TUTSLog("Sending alarm invalidation")
          self.sendRequest(method: "invalidateAlarms", args: [] as Array<String>, completion: nil)
        }
      case "rsaEncrypt":
        let publicKey = try! DictionaryDecoder().decode(PublicKey.self, from: args[0] as! NSDictionary)
        self.crypto.rsaEncrypt(
          publicKey: publicKey,
          base64Data: args[1] as! Base64,
          base64Seed: args[2] as! Base64,
          completion: respond
          )
      case "rsaDecrypt":
        let privateKey = try! DictionaryDecoder().decode(PrivateKey.self, from: args[0] as! NSDictionary)
        self.crypto.rsaDecrypt(
          privateKey: privateKey,
          base64Data: args[1] as! Base64,
          completion: respond
        )
      case "reload":
        self.webviewInitialized = false
        self.viewController.loadMainPage(params: args[0] as! [String : String])
      case "generateRsakey":
        self.crypto.generateRsaKey(seed: args[0] as! Base64, completion: respond)
      case "openFileChooser":
        let rectDict = args[0] as! [String : Int]
        let rect = CGRect(
          x: rectDict["x"]!,
          y: rectDict["y"]!,
          width: rectDict["width"]!,
          height: rectDict["height"]!
        )
        self.fileFacade.openFileChooser(anchor: rect, completion: respond)
      case "getName":
        self.fileFacade.getName(path: args[0] as! String, completion: respond)
      case "changeLanguage":
        respond(nullResult())
      case "getSize":
        self.fileFacade.getSize(path: args[0] as! String, completion: respond)
      case "getMimeType":
        self.fileFacade.getMimeType(path: args[0] as! String, completion: respond)
      case "aesEncryptFile":
        self.crypto.encryptFile(key: args[0] as! String, atPath: args[1] as! String, completion: respond)
      case "aesDecryptFile":
        self.crypto.decryptFile(key: args[0] as! String, atPath: args[1] as! String, completion: respond)
      case "upload":
        self.fileFacade.uploadFile(
          atPath: args[0] as! String,
          toUrl: args[1] as! String,
          withHeaders: args[2] as! [String : String],
          completion: respond
        )
      case "deleteFile":
        self.fileFacade.deleteFile(path: args[0] as! String) { result in
          respond(result.asNull())
        }
      case "clearFileData":
        self.fileFacade.clearFileData { result in
          respond(result.asNull())
        }
      case "download":
        self.fileFacade.downloadFile(
          fromUrl: args[0] as! String,
          forName: args[1] as! String,
          withHeaders: args[2] as! [String : String],
          completion: respond
        )
      case "open":
        self.fileFacade.openFile(path: args[0] as! String) {
          respond(nullResult())
        }
      case "getPushIdentifier":
        self.viewController.appDelegate.registerForPushNotifications(callback: respond)
      case "storePushIdentifierLocally":
        self.userPreferences.store(
          pushIdentifier: args[0] as! String,
          userId: args[1] as! String,
          sseOrigin: args[2] as! String
        )
        let keyData = Data(base64Encoded: args[4] as! Base64)!
        let result: Result<String?, Error> = Result {
          try self.keychainManager.storeKey(keyData, withId: args[3] as! String)
          return nil
        }
        respond(result)
      case "findSuggestions":
        self.contactsSource.search(
          query: args[0] as! String,
          completion: respond
        )
      case "closePushNotifications":
        UIApplication.shared.applicationIconBadgeNumber = 0
        respond(nullResult())
      case "openLink":
        UIApplication.shared.open(
          URL(string: args[0] as! String)!,
          options: [:]) { success in
            respond(.success(success))
        }
      case "saveBlob":
        let fileDataB64 = args[1] as! Base64
        let fileData = Data(base64Encoded: fileDataB64)!
        self.fileFacade.openFile(name: args[0] as! String, data: fileData) { result in
          respond(result.asNull())
        }
      case "getDeviceLog":
        let result = Result { try self.getLogfile() }
        respond(result)
      case "scheduleAlarms":
        let alarms = try! EncryptedAlarmNotification.arrayFrom(nsArray: args[0] as! NSArray)
        self.alarmManager.processNewAlarms(alarms) { result in
          respond(result.asNull())
        }
      case "getSelectedTheme":
        respond(.success(self.themeManager.selectedThemeId))
      case "setSelectedTheme":
        let themeId = args[0] as! String
        self.themeManager.selectedThemeId = themeId
        self.viewController.applyTheme(self.themeManager.currentThemeWithFallback)
        respond(nullResult())
      case "getThemes":
        respond(.success(self.themeManager.themes))
      case "setThemes":
        let themes = args[0] as! [Theme]
        self.themeManager.themes = themes
        self.viewController.applyTheme(self.themeManager.currentThemeWithFallback)
        respond(nullResult())
      default:
        let message = "Unknown comand: \(type)"
        TUTSLog(message)
        let error = NSError(domain: "tutanota", code: 5, userInfo: ["message": message])
        
        respond(Result<NullReturn, Error>.failure(error))
    }
  }
  
  /// - Returns path to the generated logfile
  private func getLogfile() throws -> String {
    let entries = TUTLogger.sharedInstance().entries()
    let directory = try FileUtils.getDecryptedFolder()
    let directoryUrl = URL(fileURLWithPath: directory)
    let fileName = "\(Date().timeIntervalSince1970)_device_tutanota_log"
    let fileUrl = directoryUrl.appendingPathComponent(fileName, isDirectory: false)
    let stringContent = entries.joined(separator: "\n")
    let bytes = stringContent.data(using: .utf8)!
    try bytes.write(to: fileUrl, options: .atomic)
    return fileUrl.path
  }
}

extension WebViewBridge : WKScriptMessageHandler {
  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    let jsonString = message.body as! String
    let json = try! JSONSerialization.jsonObject(with: jsonString.data(using: .utf8)!, options: []) as! [String : Any]
    let type = json["type"] as! String
    let requestId = json["id"] as! String
    
    switch type {
    case "response":
      let value = json["value"]
      self.handleResponse(id: requestId, value: value)
    case "errorResponse":
      TUTSLog("Request failed: \(type) \(requestId)")
      // We don't "reject" requests right now
      self.requests.removeValue(forKey: requestId)
    default:
      let arguments = json["args"] as! [Any]
      self.handleRequest(type: type, requestId: requestId, args: arguments)
    }
  }
}

/// Little zero-sized struct that encodes to null so that it's easier to pass around when we return stuff
fileprivate struct NullReturn {
}

extension NullReturn : Encodable {
  func encode(to encoder: Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encodeNil()
  }
}

fileprivate func nullResult() -> Result<NullReturn, Error> {
  return .success(NullReturn())
}

extension Result where Success == Void {
  fileprivate func asNull() -> Result<NullReturn, Failure> {
    return self.map { _ in NullReturn() }
  }
}
