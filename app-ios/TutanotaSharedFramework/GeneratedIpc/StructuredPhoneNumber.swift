/* generated file, don't edit. */


public struct StructuredPhoneNumber : Codable {
	public init(
		number: String,
		type: ContactPhoneNumberType,
		customTypeName: String
	) {
		self.number = number
		self.type = type
		self.customTypeName = customTypeName
	}
	public let number: String
	public let type: ContactPhoneNumberType
	public let customTypeName: String
}
