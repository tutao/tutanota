/* generated file, don't edit. */


protocol NativeInterface {
	func sendRequest(method: String, args: [String]) async throws -> String
}

func toJson<T>(_ thing: T) -> String where T : Encodable {
	return String(data: try! JSONEncoder().encode(thing), encoding: .utf8)!
}

