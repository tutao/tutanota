/* generated file, don't edit. */


/**
 * Result of Webauthn registration with hardware key.
 */
public struct WebAuthnRegistrationResult : Codable {
	let rpId: String
	let rawId: DataWrapper
	let attestationObject: DataWrapper
}
