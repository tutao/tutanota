/* generated file, don't edit. */


public struct ContactSuggestion : Codable, Sendable {
	public init(
		name: String,
		mailAddress: String
	) {
		self.name = name
		self.mailAddress = mailAddress
	}
	public let name: String
	public let mailAddress: String
}
