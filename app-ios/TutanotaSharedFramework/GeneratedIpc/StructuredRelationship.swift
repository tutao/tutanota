/* generated file, don't edit. */


public struct StructuredRelationship : Codable, Sendable {
	public init(
		person: String,
		type: ContactRelationshipType,
		customTypeName: String
	) {
		self.person = person
		self.type = type
		self.customTypeName = customTypeName
	}
	public let person: String
	public let type: ContactRelationshipType
	public let customTypeName: String
}
