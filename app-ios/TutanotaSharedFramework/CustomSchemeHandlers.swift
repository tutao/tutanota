import Foundation
import os

/// Intercepts and proxies all requests to api:// and apis:// URLs rom the webview
public final class ApiSchemeHandler: NSObject, WKURLSchemeHandler, Sendable {
	private let regex: NSRegularExpression
	private let urlSession: URLSession
	/// Map from original request id to Swift task which executes a "real" request
	/// We need to synchronize access to the dictionary because tasks start/get cancelled/complete on diffent threads.
	private let dictLock = OSAllocatedUnfairLock<[ObjectIdentifier: Task<(), Never>]>(initialState: [:])

	public init(urlSession: URLSession) {
		// docs say that schemes are case insensitive
		self.regex = try! NSRegularExpression(pattern: "^api", options: .caseInsensitive)
		self.urlSession = urlSession
		super.init()
	}

	public func rewriteRequest(_ oldRequest: URLRequest) -> URLRequest {
		let urlString = oldRequest.url!.absoluteString
		let range = NSRange(location: 0, length: urlString.count)
		let newUrlString = self.regex.stringByReplacingMatches(in: urlString, range: range, withTemplate: "http")
		let newUrl = URL(string: newUrlString)!
		var newRequest = oldRequest
		newRequest.url = newUrl
		return newRequest
	}

	public func webView(_ webView: WKWebView, start urlSchemeTask: any WKURLSchemeTask) {
		// Change URL on the request to a real one
		let newRequest = self.rewriteRequest(urlSchemeTask.request)
		let taskIdentifier = ObjectIdentifier(urlSchemeTask)
		// Non-detached task will execute with the same isolation as this function which
		// lets us sidestep isolation problems of WKURLSchemeTask.
		let task = Task {
			defer { _ = self.dictLock.withLock { dict in dict.removeValue(forKey: taskIdentifier) } }
			do {
				let (data, response) = try await self.urlSession.data(for: newRequest)
				urlSchemeTask.didReceive(response)
				urlSchemeTask.didReceive(data)
				urlSchemeTask.didFinish()
			} catch is CancellationError {
				// Not allowed to interact with a task if it's canceled
			} catch { urlSchemeTask.didFailWithError(error) }
		}
		self.dictLock.withLock { dict in dict[taskIdentifier] = task }
	}

	public func webView(_ webView: WKWebView, stop urlSchemeTask: any WKURLSchemeTask) {
		let taskIdentifier = ObjectIdentifier(urlSchemeTask)
		self.dictLock.withLock { taskDict in
			let task = taskDict.removeValue(forKey: taskIdentifier)
			task?.cancel()
		}
	}

}

/**
 * intercepts asset:// requests and serves them from the asset directory
 */
public class AssetSchemeHandler: NSObject, WKURLSchemeHandler {

	private let folderPath: String

	public init(folderPath: String) {
		self.folderPath = (folderPath as NSString).standardizingPath
		TUTSLog("folderPath: \(self.folderPath)")
		super.init()
	}

	public func webView(_ webView: WKWebView, start urlSchemeTask: any WKURLSchemeTask) {
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

	public func webView(_ webView: WKWebView, stop urlSchemeTask: any WKURLSchemeTask) {
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
		} else if path.hasSuffix(".woff2") {
			return "font/woff2"
		} else if path.hasSuffix(".woff") {
			return "font/woff"
		} else if path.hasSuffix(".ttf") {
			return "font/ttf"
		} else if path.hasSuffix(".otf") {
			return "font/otf"
		} else {
			fatalError("Unknown asset type! \(path)")
		}
	}

}
