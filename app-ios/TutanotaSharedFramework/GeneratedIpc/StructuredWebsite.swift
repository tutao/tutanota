/* generated file, don't edit. */


public struct StructuredWebsite : Codable {
	public init(
		url: String,
		type: ContactWebsiteType,
		customTypeName: String
	) {
		self.url = url
		self.type = type
		self.customTypeName = customTypeName
	}
	public let url: String
	public let type: ContactWebsiteType
	public let customTypeName: String
}
