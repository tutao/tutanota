import Foundation

public func translate(_ key: String, default defaultValue: String) -> String {
	Bundle.main.localizedString(forKey: key, value: defaultValue, table: "InfoPlist")
}

// // keep in sync with src/native/main/NativePushServiceApp.ts
let SYS_MODEL_VERSION = 99

// api/entities/tutanota/ModelInfo.ts
// FIXME there are at least 5 places needs manual sync for these version numbers.
// Definitely need a script to automate.
public let TUTANOTA_MODEL_VERSION: UInt32 = 71

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
