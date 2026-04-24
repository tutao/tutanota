/* generated file, don't edit. */

/**
 * Result of Webauthn authentication with hardware key.
 */
export interface WebAuthnSignResult {
	readonly rawId: Uint8Array
	readonly clientDataJSON: Uint8Array
	readonly signature: Uint8Array
	readonly authenticatorData: Uint8Array
}
