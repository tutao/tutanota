import Foundation

public func translate(_ key: String, default defaultValue: String) -> String {
	Bundle.main.localizedString(forKey: key, value: defaultValue, table: "InfoPlist")
}

// // keep in sync with src/native/main/NativePushServiceApp.ts
public let SYS_MODEL_VERSION = 118

// api/entities/tutanota/ModelInfo.ts
// FIXME there are at least 5 places needs manual sync for these version numbers.
// Definitely need a script to automate.
public let TUTANOTA_MODEL_VERSION: UInt32 = 80

public extension URLRequest {
	mutating func addSysModelHeader() { self.setValue(String(SYS_MODEL_VERSION), forHTTPHeaderField: "v") }
	mutating func addTutanotaModelHeader() { self.setValue(String(TUTANOTA_MODEL_VERSION), forHTTPHeaderField: "v") }
}

public func addSystemModelHeaders(to headers: inout [String: String]) { headers["v"] = String(SYS_MODEL_VERSION) }
public func addTutanotaModelHeaders(to headers: inout [String: String]) { headers["v"] = String(TUTANOTA_MODEL_VERSION) }

public func makeDbPath(fileName: String) -> URL {
	let sharedDirectory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: getAppGroupName())

	return (sharedDirectory?.appendingPathComponent(fileName))!
}

public enum HttpStatusCode: Int {
	case ok = 200
	case notAuthenticated = 401
	case notFound = 404
	case tooManyRequests = 429
	case serviceUnavailable = 503
}

// would use Duration instead but its iOS 16+
public struct SuspensionTime {
	public let seconds: UInt32

	public var nanos: UInt64 { get { UInt64(seconds) * 1_000_000_000 } }
}

/**
 Gets suspension time from the request in seconds
 */
public func extractSuspensionTime(from httpResponse: HTTPURLResponse) -> SuspensionTime {
	let retryAfterHeader = (httpResponse.allHeaderFields["Retry-After"] ?? httpResponse.allHeaderFields["Suspension-Time"]) as! String?
	let seconds = retryAfterHeader.flatMap { UInt32($0) } ?? 0
	return SuspensionTime(seconds: seconds)
}

public func stringToCustomId(customId: String) -> String {
	customId.data(using: .utf8)!.base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_")
		.replacingOccurrences(of: "=", with: "")
}

public func makeUrlSession() -> URLSession {
	var urlSession = URLSession(configuration: .ephemeral)
	urlSession.configuration.timeoutIntervalForRequest = 20
	return urlSession
}

public func printLog(_ message: String, _ file: StaticString = #fileID) {
	let filename = file
	TUTSLog("\(filename): \(message)")
}
