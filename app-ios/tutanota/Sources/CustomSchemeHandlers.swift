import Foundation

/**
 * intercepts and proxies all requests to api:// and apis:// URLs rom the webview
 */
class ApiSchemeHandler: NSObject, WKURLSchemeHandler {

	private let regex: NSRegularExpression
	private let urlSession: URLSession
	// We need to synchronize access to the dictionary because tasks start/get cancelled/complete on diffent threads.
	// It *should* be fine to just lock it without resorting to a serial queue.
	private let dictLock = UnfairLock()
	private var taskDict = [URLRequest: URLSessionDataTask]()

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
		let range = NSRange(location: 0, length: urlString.count)
		let newUrlString = self.regex.stringByReplacingMatches(in: urlString, range: range, withTemplate: "http")
		let newUrl = URL(string: newUrlString)!
		var newRequest = oldRequest
		newRequest.url = newUrl
		return newRequest
	}

	func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
		let newRequest = self.rewriteRequest(urlSchemeTask.request)
		let task = self.urlSession.dataTask(with: newRequest) { data, response, err in
			defer { self.dictLock.locked { self.taskDict.removeValue(forKey: urlSchemeTask.request) } }

			// It is an error to call anything on WKURLSchemeTask after
			// webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask)
			// was called. It is unclear how cancel() works so to avoid crashes
			// we manually check for it.
			let taskFromDict = self.dictLock.locked { self.taskDict[urlSchemeTask.request] }
			if taskFromDict == nil { return }

			if let err {
				if (err as NSError).domain == NSURLErrorDomain && (err as NSError).code == NSURLErrorCancelled { return }
				urlSchemeTask.didFailWithError(err)
				return
			}
			urlSchemeTask.didReceive(response!)
			urlSchemeTask.didReceive(data!)
			urlSchemeTask.didFinish()
		}
		self.dictLock.locked { self.taskDict[urlSchemeTask.request] = task }
		task.resume()
	}

	func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
		self.dictLock.locked {
			guard let task = self.taskDict[urlSchemeTask.request] else { return }
			if task.state == .running || task.state == .suspended { task.cancel() }
			self.taskDict.removeValue(forKey: urlSchemeTask.request)
		}
	}

}

/**
 * intercepts asset:// requests and serves them from the asset directory
 */
class AssetSchemeHandler: NSObject, WKURLSchemeHandler {

	private let folderPath: String

	init(folderPath: String) {
		self.folderPath = (folderPath as NSString).standardizingPath
		TUTSLog("folderPath: \(self.folderPath)")
		super.init()
	}

	func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
		let newFilePath = urlSchemeTask.request.url!.path
		let appendedPath: NSString = (self.folderPath as NSString).appendingPathComponent(newFilePath) as NSString
		let requestedFilePath = appendedPath.standardizingPath
		if !requestedFilePath.starts(with: self.folderPath) {
			let err = NSError(domain: NSURLErrorDomain, code: NSURLErrorFileDoesNotExist)
			urlSchemeTask.didFailWithError(err)
		} else {
			let fileContent: Data
			do { fileContent = try Data(contentsOf: URL(fileURLWithPath: requestedFilePath)) } catch {
				TUTSLog("failed to load asset URL \(requestedFilePath), got error \(error)")
				let err = NSError(domain: NSURLErrorDomain, code: NSURLErrorFileDoesNotExist)
				urlSchemeTask.didFailWithError(err)
				return
			}
			let mimeType = self.getAssetMimeType(path: requestedFilePath)
			let response = HTTPURLResponse(url: urlSchemeTask.request.url!, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": mimeType])!
			urlSchemeTask.didReceive(response)
			urlSchemeTask.didReceive(fileContent)
			urlSchemeTask.didFinish()
		}
	}

	func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
		// we're doing the asset load synchronously, so we won't get a chance to cancel.
	}

	private func getAssetMimeType(path: String) -> String {
		if path.hasSuffix(".wasm") {
			return "application/wasm"
		} else if path.hasSuffix(".icc") {
			return "application/application/vnd.iccprofile"
		} else if let mimeType = getFileMIMEType(path: path) {
			return mimeType
		} else if path.hasSuffix(".cmap") {
			return "text/plain"  // used for invoices; no good mime type for cmap, so just use plain text
		} else {
			fatalError("Unknown asset type! \(path)")
		}
	}

}
