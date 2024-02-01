/* generated file, don't edit. */


/**
 * Result of Webauthn authentication with hardware key.
 */
public struct WebAuthnSignResult : Codable {
	let rawId: DataWrapper
	let clientDataJSON: DataWrapper
	let signature: DataWrapper
	let authenticatorData: DataWrapper
}
