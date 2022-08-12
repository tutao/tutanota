import Foundation

/**
 * intercepts and proxies all requests to api:// and apis:// URLs rom the webview
 */
class ApiSchemeHandler : NSObject, WKURLSchemeHandler {
  
  private let regex: NSRegularExpression
  private let urlSession: URLSession
  private var taskMap = [URLRequest : URLSessionDataTask]()
  
  override init() {
    // docs say that schemes are case insensitive
    self.regex = try! NSRegularExpression(pattern: "^api", options: .caseInsensitive)
    let configuration = URLSessionConfiguration.ephemeral
    configuration.timeoutIntervalForRequest = 20
    self.urlSession = URLSession(configuration: configuration)
    super.init()
  }
  
  func rewriteRequest(_ oldRequest: URLRequest) -> URLRequest {
    let urlString = oldRequest.url!.absoluteString
    let range = NSMakeRange(0, urlString.count)
    let newUrlString = self.regex.stringByReplacingMatches(in: urlString, range: range, withTemplate: "http")
    let newUrl = URL(string: newUrlString)!
    var newRequest = oldRequest
    newRequest.url = newUrl
    return newRequest
  }
  
  func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
    let newRequest = self.rewriteRequest(urlSchemeTask.request)
    let task = self.urlSession.dataTask(with: newRequest) { data, response, err in
      defer {self.taskMap.removeValue(forKey: urlSchemeTask.request)}
      if let err = err {
        if (err as NSError).domain == NSURLErrorDomain && (err as NSError).code == NSURLErrorCancelled {
          return
        }
        urlSchemeTask.didFailWithError(err)
        return
      }
      urlSchemeTask.didReceive(response!)
      urlSchemeTask.didReceive(data!)
      urlSchemeTask.didFinish()
    }
    self.taskMap[urlSchemeTask.request] = task
    task.resume()
  }
  
  func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
    guard let task = self.taskMap[urlSchemeTask.request] else {
      return
    }
    if task.state == .running || task.state == .suspended {
      task.cancel()
      self.taskMap.removeValue(forKey: urlSchemeTask.request)
    }
  }
  
}

/**
 * intercepts asset:// requests and serves them from the asset directory
 */
class AssetSchemeHandler : NSObject, WKURLSchemeHandler {
  
  private let folderPath : String
  
  init(
    folderPath: String
  ) {
    self.folderPath = (folderPath as NSString).standardizingPath
    TUTSLog("folderPath: \(self.folderPath)")
    super.init()
  }
  
  func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
    let newFilePath = urlSchemeTask.request.url!.path
    let appendedPath : NSString = (self.folderPath as NSString).appendingPathComponent(newFilePath) as NSString
    let requestedFilePath = appendedPath.standardizingPath
    if(!requestedFilePath.starts(with: self.folderPath)){
      let err = NSError(domain: NSURLErrorDomain, code: NSURLErrorFileDoesNotExist)
      urlSchemeTask.didFailWithError(err)
    } else {
      let fileContent: Data
      do {
        fileContent = try Data(contentsOf: URL(fileURLWithPath: requestedFilePath))
      } catch {
        TUTSLog("failed to load asset URL \(requestedFilePath), got error \(error)")
        let err = NSError(domain: NSURLErrorDomain, code: NSURLErrorFileDoesNotExist)
        urlSchemeTask.didFailWithError(err)
        return
      }
      let mimeType = getFileMIMETypeWithDefault(path: requestedFilePath)
      urlSchemeTask.didReceive(URLResponse(
        url: urlSchemeTask.request.url!,
        mimeType: mimeType,
        expectedContentLength: fileContent.count,
        textEncodingName: "UTF-8")
      )
      urlSchemeTask.didReceive(fileContent)
      urlSchemeTask.didFinish()
    }
  }
  
  func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
    // we're doing the asset load synchronously, so we won't get a chance to cancel.
  }
  
}
