/* generated file, don't edit. */


public struct StructuredAddress : Codable, Sendable {
	public init(
		address: String,
		type: ContactAddressType,
		customTypeName: String
	) {
		self.address = address
		self.type = type
		self.customTypeName = customTypeName
	}
	public let address: String
	public let type: ContactAddressType
	public let customTypeName: String
}
