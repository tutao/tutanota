/* generated file, don't edit. */


public struct WebAuthnSignChallenge : Codable {
	public init(
		challenge: DataWrapper,
		domain: String,
		keys: [WebauthnKeyDescriptor]
	) {
		self.challenge = challenge
		self.domain = domain
		self.keys = keys
	}
	public let challenge: DataWrapper
	public let domain: String
	public let keys: [WebauthnKeyDescriptor]
}
