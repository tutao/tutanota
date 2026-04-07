import Atomics
import CryptoTokenKit
import DictionaryCoding
import Foundation
import os

/// Gateway for communicating with Javascript code in WebView. Can send messages and handle requests.
public final class RemoteBridge:  // NSObject is needed because of WKScriptMessageHandler conformance
	NSObject, NativeInterface
{
	private let webView: WKWebView
	private let commonSystemFacade: IosCommonSystemFacade
	private let globalDispatcher: IosGlobalDispatcher

	private let requestId = ManagedAtomic<Int64>(0)
	private let requestsLock = OSAllocatedUnfairLock(initialState: [String: CheckedContinuation<String, any Error>]())

	@MainActor public init(webView: WKWebView, commonSystemFacade: IosCommonSystemFacade, globalDispatcher: IosGlobalDispatcher) {
		self.webView = webView
		self.commonSystemFacade = commonSystemFacade
		self.globalDispatcher = globalDispatcher
		super.init()

		self.webView.configuration.userContentController.add(self, name: "nativeApp")
	}

	/** Part of the NativeInterface. Sends request to the web part. Should not be used directly but through the send dispatchers. */
	@concurrent public func sendRequest(requestType: String, args: [String]) async throws -> String {
		let newRequestId = self.requestId.wrappingIncrementThenLoad(ordering: .sequentiallyConsistent)
		let requestId = "app\(newRequestId)"
		await self.commonSystemFacade.awaitForInit()
		return try await withCheckedThrowingContinuation { continuation in
			self.requestsLock.withLock { requests in requests[requestId] = continuation }
			let parts: [String] = ["request", requestId, requestType] + args
			self.postMessage(encodedMessage: parts.joined(separator: "\n"))
		}
	}

	private func sendResponse(requestId: String, value: String) {
		let parts: [String] = ["response", requestId, value]

		self.postMessage(encodedMessage: parts.joined(separator: "\n"))
	}

	private func sendErrorResponse(requestId: String, err: any Error) {
		var parts: [String] = ["requestError", requestId]
		let responseError = err.toResponseError()
		TUTSLog("Error: \(err) \(err.localizedDescription) \(responseError.name) \(responseError.message) \(responseError.stack)")
		parts.append(toJson(responseError))

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
		if let request: CheckedContinuation = getAndRemoveRequest(id: id) {
			request.resume(returning: value)
		} else {
			TUTSLog("got a response for nonexistent request.")
		}
	}

	private func handleRequest(type: String, requestId: String, args: String) {
		Task { @concurrent in
			do {
				let value: String = try await self.handleRequest(method: type, args: args)
				self.sendResponse(requestId: requestId, value: value)
			} catch { self.sendErrorResponse(requestId: requestId, err: error) }
		}
	}

	private func handleRequest(method: String, args encodedArgs: String) async throws -> String {
		assert(method == "ipc", "invalid remote request method \(method)")
		let ipcArgs = encodedArgs.split(separator: "\n").map { String($0) }
		let facade = try! JSONDecoder().decode(String.self, from: ipcArgs[0].data(using: .utf8)!)
		let method = try! JSONDecoder().decode(String.self, from: ipcArgs[1].data(using: .utf8)!)
		return try await self.globalDispatcher.dispatch(facadeName: facade, methodName: method, args: Array(ipcArgs[2..<ipcArgs.endIndex]))
	}

	private func handleRequestError(id: String, error: String) {
		TUTSLog("got error for req \(id): \(error)")

		if let request: CheckedContinuation = getAndRemoveRequest(id: id) { request.resume(throwing: TUTErrorFactory.createError(error)) }
	}

	private func handleErrorResponse(id: String, type: String, value: String) {
		TUTSLog("Request failed: \(type) \(id)")
		if let request: CheckedContinuation = getAndRemoveRequest(id: id) {
			request.resume(throwing: TUTErrorFactory.createError(value))
		} else {
			TUTSLog("got an error response for nonexistent request.")
		}
	}

	private func getAndRemoveRequest(id: String) -> CheckedContinuation<String, any Error>? {
		self.requestsLock.withLock { requests in requests.removeValue(forKey: id) }
	}
}

extension RemoteBridge: WKScriptMessageHandler {
	public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
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
		case "errorResponse": self.handleErrorResponse(id: requestId, type: String(type), value: String(parts[2]))
		case "requestError":
			let errorJSON = String(parts[2])
			self.handleRequestError(id: requestId, error: errorJSON)
		case "request":
			// requestType
			// arguments
			let requestParams = parts[2].split(separator: "\n", maxSplits: 1, omittingEmptySubsequences: false)
			let requestType = String(requestParams[0])
			let arguments = String(requestParams[1])
			self.handleRequest(type: requestType, requestId: requestId, args: arguments)
		default: fatalError("unknown message type \(type)")
		}
	}
}

extension Error {
	func toResponseError() -> ResponseError {
		if let err = self as? TutanotaError {
			// "name" is a static property so we need to get the dynamic type of err.
			// We could also write an extension that returns Self.name.
			return ResponseError(name: type(of: err).name, message: err.message, stack: err.underlyingError.debugDescription)
		} else {
			let nsError = self as NSError
			let userInfo = nsError.userInfo
			let message = userInfo["message"] as? String ?? self.localizedDescription
			let underlyingError = nsError.userInfo[NSUnderlyingErrorKey] as! NSError?

			return ResponseError(name: nsError.domain, message: message, stack: underlyingError?.debugDescription ?? "")
		}
	}
}
