import Foundation
import DictionaryCoding
import CryptoTokenKit

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
  private let credentialsEncryption: CredentialsEncryption
  private let blobUtils: BlobUtil

  private var requestId = 0
  private var requests = [String : ((String) -> Void)]()
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
    fileFacade: FileFacade,
    credentialsEncryption: CredentialsEncryption,
    blobUtils: BlobUtil
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
    self.credentialsEncryption = credentialsEncryption
    self.blobUtils = blobUtils

    super.init()
    self.webView.configuration.userContentController.add(self, name: "nativeApp")
    let js =
      """
      window.nativeApp = {
        invoke: (message) => window.webkit.messageHandlers.nativeApp.postMessage(message)
      }
      """
    let script = WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
    self.webView.configuration.userContentController.addUserScript(script)
  }

  func sendRequest(
    method: String,
    args: [Encodable],
    completion: ((String) -> Void)?
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
    var parts = ["request", requestId, method]
    for arg in args {
      parts.append(json(arg))
    }
    self.postMessage(encodedMessage: parts.joined(separator: "\n"))
  }

  func invokeRemote(method: String, args: [Encodable]) async throws -> String {
    return try await withCheckedThrowingContinuation { continuation in
      self.sendRequest(method: method, args: args, completion: continuation.resume(returning:))
    }
  }

  private func sendResponse(requestId: String, value: Encodable) {
    let parts: [String] = ["response", requestId, json(value)]

    self.postMessage(encodedMessage: parts.joined(separator: "\n"))
  }

  private func sendErrorResponse(requestId: String, err: Error) {
    TUTSLog("Error: \(err)")

    let responseError: ResponseError
    var parts : [String] = ["requestError", requestId]
    if let err = err as? TutanotaError {
      responseError = ResponseError(name: err.name, message: err.message, stack: err.underlyingError.debugDescription)
    } else {
      let nsError = err as NSError
      let userInfo = nsError.userInfo
      let message = userInfo["message"] as? String ?? err.localizedDescription
      let underlyingError = nsError.userInfo[NSUnderlyingErrorKey] as! NSError?

      responseError = ResponseError(
        name: nsError.domain,
        message: message,
        stack:  underlyingError?.debugDescription ?? ""
      )
    }
    parts.append(json(responseError))

    let bridgeMessage = parts.joined(separator: "\n")
    self.postMessage(encodedMessage: bridgeMessage)
  }

  private func postMessage(encodedMessage: String) {
    DispatchQueue.main.async {
      let base64 = encodedMessage.data(using: .utf8)!.base64EncodedString()
      let js = "tutao.nativeApp.receiveMessageFromApp('\(base64)')"
      self.webView.evaluateJavaScript(js, completionHandler: nil)
    }
  }

  private func handleResponse(id: String, value: String) {
    if let request = self.requests[id] {
      self.requests.removeValue(forKey: id)
      request(value)
    }
  }

  private func handleRequest(type: String, requestId: String, args: String) {
    Task {
      do {
        let value: Encodable = try await self.handleRequest(type: type, args: args) ?? NullReturn()
        self.sendResponse(requestId: requestId, value: value)
      } catch {
        self.sendErrorResponse(requestId: requestId, err: error)
      }
    }
  }

  private func handleRequest(type: String, args encodedArgs: String) async throws -> Encodable? {

    let args = encodedArgs.split(separator: "\n").map { strArg in
      return try! JSONSerialization.jsonObject(with: strArg.data(using: .utf8)!, options: [.fragmentsAllowed])
    }

      switch type {
      case "init":
        self.webviewInitialized = true
        // Start another task async that will execute everything else after web app (hopefully) thinks that we are initialized
        Task {
          // 200 ms
          try? await Task.sleep(nanoseconds: 200_000_000)

          for callback in requestsBeforeInit {
            callback()
          }
          requestsBeforeInit.removeAll()
          if let sseInfo = userPreferences.sseInfo, sseInfo.userIds.isEmpty {
            TUTSLog("Sending alarm invalidation")
            self.sendRequest(method: "invalidateAlarms", args: [] as Array<String>, completion: nil)
          }
        }
        return "ios"
      case "rsaEncrypt":
        let publicKey = try! DictionaryDecoder().decode(PublicKey.self, from: args[0] as! NSDictionary)
        return try await self.crypto.rsaEncrypt(
          publicKey: publicKey,
          base64Data: args[1] as! Base64,
          base64Seed: args[2] as! Base64
          )
      case "rsaDecrypt":
        let privateKey = try! DictionaryDecoder().decode(PrivateKey.self, from: args[0] as! NSDictionary)
        return try await self.crypto.rsaDecrypt(
          privateKey: privateKey,
          base64Data: args[1] as! Base64
        )
      case "reload":
        self.webviewInitialized = false
        await self.viewController.loadMainPage(params: args[0] as! [String : String])
        return nil
      case "generateRsaKey":
        return try await self.crypto.generateRsaKey(seed: args[0] as! Base64)
      case "openFileChooser":
        let rectDict = args[0] as! [String : Int]
        let rect = CGRect(
          x: rectDict["x"]!,
          y: rectDict["y"]!,
          width: rectDict["width"]!,
          height: rectDict["height"]!
        )
        return try await self.fileFacade.openFileChooser(anchor: rect)
      case "getName":
        return try await self.fileFacade.getName(path: args[0] as! String)
      case "changeLanguage":
        return nil
      case "getSize":
        return try await self.fileFacade.getSize(path: args[0] as! String)
      case "getMimeType":
        return try await self.fileFacade.getMimeType(path: args[0] as! String)
      case "aesEncryptFile":
        return try await self.crypto.encryptFile(key: args[0] as! String, atPath: args[1] as! String)
      case "aesDecryptFile":
        return try await self.crypto.decryptFile(key: args[0] as! String, atPath: args[1] as! String)
      case "upload":
        return try await self.fileFacade.uploadFile(
          atPath: args[0] as! String,
          toUrl: args[1] as! String,
          method: args[2] as! String,
          withHeaders: args[3] as! [String : String]
        )
      case "deleteFile":
        try await self.fileFacade.deleteFile(path: args[0] as! String)
        return nil
      case "clearFileData":
        try await self.fileFacade.clearFileData()
        return nil
      case "download":
        return try await self.fileFacade.downloadFile(
          fromUrl: args[0] as! String,
          forName: args[1] as! String,
          withHeaders: args[2] as! [String : String]
        )
      case "open":
        await self.fileFacade.openFile(path: args[0] as! String)
        return nil
      case "getPushIdentifier":
        return try await self.viewController.appDelegate.registerForPushNotifications()
      case "storePushIdentifierLocally":
        self.userPreferences.store(
          pushIdentifier: args[0] as! String,
          userId: args[1] as! String,
          sseOrigin: args[2] as! String
        )
        let keyData = Data(base64Encoded: args[4] as! Base64)!
        try self.keychainManager.storeKey(keyData, withId: args[3] as! String)
        return nil
      case "findSuggestions":
        return try await self.contactsSource.search(query: args[0] as! String)
      case "closePushNotifications":
        await MainActor.run {
          UIApplication.shared.applicationIconBadgeNumber = 0
        }
        return nil
      case "openLink":
        return await self.openLink(args[0] as! String)
      case "saveDataFile":
        let fileDataB64 = args[1] as! Base64
        let fileData = Data(base64Encoded: fileDataB64)!
        return try await self.fileFacade.saveDataFile(name: args[0] as! String, data: fileData)
      case "getDeviceLog":
        return try self.getLogfile()
      case "scheduleAlarms":
        let alarms = try! EncryptedAlarmNotification.arrayFrom(nsArray: args[0] as! NSArray)
        try await self.alarmManager.processNewAlarms(alarms)
        return nil
      case "getSelectedTheme":
        return self.themeManager.selectedThemeId
      case "setSelectedTheme":
        let themeId = args[0] as! String
        self.themeManager.selectedThemeId = themeId
        await self.viewController.applyTheme(self.themeManager.currentThemeWithFallback)
        return nil
      case "getThemes":
        return self.themeManager.themes
      case "setThemes":
        let themes = args[0] as! [Theme]
        self.themeManager.themes = themes
        await self.viewController.applyTheme(self.themeManager.currentThemeWithFallback)
        return nil
      case "encryptUsingKeychain":
        let encryptionMode = CredentialEncryptionMode(rawValue: args[0] as! String)!
        return try await self.credentialsEncryption.encryptUsingKeychain(data: args[1] as! Base64, encryptionMode: encryptionMode)
      case "decryptUsingKeychain":
        let encryptionMode = CredentialEncryptionMode(rawValue: args[0] as! String)!
        return try await self.credentialsEncryption.decryptUsingKeychain(encryptedData: args[1] as! Base64, encryptionMode: encryptionMode)
      case "getSupportedEncryptionModes":
        return await self.credentialsEncryption.getSupportedEncryptionModes()
      case "joinFiles":
        let outFileName = args[0] as! String
        let filesToJoin = args[1] as! [String]
        return try await self.blobUtils.joinFiles(fileName: outFileName, filePathsToJoin: filesToJoin)
      case "splitFile":
        let inFileName = args[0] as! String
        let maxBlobSize = args[1] as! Int
        return try await self.blobUtils.splitFile(fileUri: inFileName, maxBlobSize: maxBlobSize)
      case "hashFile":
        let inFileUri = args[0] as! String
        return try await self.blobUtils.hashFile(fileUri: inFileUri)
      default:
        let message = "Unknown command: \(type)"
        TUTSLog(message)
        let error = NSError(domain: "tutanota", code: 5, userInfo: ["message": message])
        throw error
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


  @MainActor
  private func openLink(_ link: String) async -> Bool {
    return await withCheckedContinuation({ continuation in
      UIApplication.shared.open(
        URL(string: link)!,
        options: [:]) { success in
          continuation.resume(returning: success)
      }
    })
  }
}

extension WebViewBridge : WKScriptMessageHandler {
  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    let body = message.body as! String
    let parts = body.split(separator: "\n", maxSplits: 2, omittingEmptySubsequences: false)
    // type
    // requestId
    // ...rest
    let type = parts[0]
    let requestId = String(parts[1])

    switch type {
    case "response":
      let value = parts[2]
      self.handleResponse(id: requestId, value: String(value))
    case "errorResponse":
      TUTSLog("Request failed: \(type) \(requestId)")
      // We don't "reject" requests right now
      self.requests.removeValue(forKey: requestId)
    case "requestError":
      fatalError(body)
    case "request":
      // requestType
      // arguments
      let requestParams = parts[2].split(separator: "\n", maxSplits: 1, omittingEmptySubsequences: false)
      let requestType = String(requestParams[0])
      let arguments = String(requestParams[1])
      self.handleRequest(type: requestType, requestId: requestId, args: arguments)
    default:
      fatalError("unknown message type \(type)")
    }
  }
}

/// Little zero-sized struct that encodes to null so that it's easier to pass around when we return stuff
struct NullReturn {
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


fileprivate func json(_ value: Encodable) -> String {
  let wrapper = ExistentialEncodable(value: value)
  let valueData = try! JSONEncoder().encode(wrapper)
  return String(data: valueData, encoding: .utf8)!
}
