/* generated file, don't edit. */


public protocol NativeInterface {
	func sendRequest(requestType: String, args: [String]) async throws -> String
}

public func toJson<T>(_ thing: T) -> String where T : Encodable {
	return String(data: try! JSONEncoder().encode(thing), encoding: .utf8)!
}

