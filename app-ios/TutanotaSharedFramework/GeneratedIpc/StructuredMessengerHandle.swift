/* generated file, don't edit. */


public struct StructuredMessengerHandle : Codable {
	public init(
		handle: String,
		type: ContactMessengerHandleType,
		customTypeName: String
	) {
		self.handle = handle
		self.type = type
		self.customTypeName = customTypeName
	}
	public let handle: String
	public let type: ContactMessengerHandleType
	public let customTypeName: String
}
