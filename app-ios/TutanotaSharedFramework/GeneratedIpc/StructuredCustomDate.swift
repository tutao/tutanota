/* generated file, don't edit. */


public struct StructuredCustomDate : Codable {
	public init(
		dateIso: String,
		type: ContactCustomDateType,
		customTypeName: String
	) {
		self.dateIso = dateIso
		self.type = type
		self.customTypeName = customTypeName
	}
	public let dateIso: String
	public let type: ContactCustomDateType
	public let customTypeName: String
}
