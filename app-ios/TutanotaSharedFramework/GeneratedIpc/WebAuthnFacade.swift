/* generated file, don't edit. */


import Foundation

/**
 * implementation of the WebAuthn protocol
 */
public protocol WebAuthnFacade {
	/**
	 * register for webauthn
	 */
	func register(
		_ challenge: WebAuthnRegistrationChallenge
	) async throws -> WebAuthnRegistrationResult
	/**
	 * sign a webauthn challenge
	 */
	func sign(
		_ challenge: WebAuthnSignChallenge
	) async throws -> WebAuthnSignResult
	/**
	 * cancels the current sign/registration operation
	 */
	func abortCurrentOperation(
	) async throws -> Void
	/**
	 * return whether this platform supports webAuthn
	 */
	func isSupported(
	) async throws -> Bool
	/**
	 * return whether we can attempt a challenge for a given RpId
	 */
	func canAttemptChallengeForRpId(
		_ rpId: String
	) async throws -> Bool
	/**
	 * return whether we can attempt a challenge for a given U2FAppId
	 */
	func canAttemptChallengeForU2FAppId(
		_ appId: String
	) async throws -> Bool
}
