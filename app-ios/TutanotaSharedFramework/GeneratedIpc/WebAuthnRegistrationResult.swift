/* generated file, don't edit. */


/**
 * Result of Webauthn registration with hardware key.
 */
public struct WebAuthnRegistrationResult : Codable {
	public init(
		rpId: String,
		rawId: DataWrapper,
		attestationObject: DataWrapper
	) {
		self.rpId = rpId
		self.rawId = rawId
		self.attestationObject = attestationObject
	}
	public let rpId: String
	public let rawId: DataWrapper
	public let attestationObject: DataWrapper
}
