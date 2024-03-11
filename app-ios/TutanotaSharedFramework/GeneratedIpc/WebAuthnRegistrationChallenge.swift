/* generated file, don't edit. */


public struct WebAuthnRegistrationChallenge : Codable {
	public init(
		challenge: DataWrapper,
		userId: String,
		name: String,
		displayName: String,
		domain: String
	) {
		self.challenge = challenge
		self.userId = userId
		self.name = name
		self.displayName = displayName
		self.domain = domain
	}
	public let challenge: DataWrapper
	public let userId: String
	public let name: String
	public let displayName: String
	public let domain: String
}
