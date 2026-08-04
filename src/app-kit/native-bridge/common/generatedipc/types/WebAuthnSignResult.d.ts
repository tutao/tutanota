/* generated file, don't edit. */

/**
 * Result of Webauthn authentication with hardware key.
 */
export interface WebAuthnSignResult {
	readonly rawId: Uint8Array<ArrayBuffer>
	readonly clientDataJSON: Uint8Array<ArrayBuffer>
	readonly signature: Uint8Array<ArrayBuffer>
	readonly authenticatorData: Uint8Array<ArrayBuffer>
}
