/* generated file, don't edit. */


/**
 * Result of Webauthn authentication with hardware key.
 */
public struct WebAuthnSignResult : Codable {
	public init(
		rawId: DataWrapper,
		clientDataJSON: DataWrapper,
		signature: DataWrapper,
		authenticatorData: DataWrapper
	) {
		self.rawId = rawId
		self.clientDataJSON = clientDataJSON
		self.signature = signature
		self.authenticatorData = authenticatorData
	}
	public let rawId: DataWrapper
	public let clientDataJSON: DataWrapper
	public let signature: DataWrapper
	public let authenticatorData: DataWrapper
}
