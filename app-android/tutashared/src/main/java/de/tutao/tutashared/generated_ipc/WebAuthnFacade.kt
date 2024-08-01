/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * implementation of the WebAuthn protocol
 */
interface WebAuthnFacade {
	/**
	 * register for webauthn
	 */
	suspend fun register(
		challenge: WebAuthnRegistrationChallenge,
	): WebAuthnRegistrationResult
	/**
	 * sign a webauthn challenge
	 */
	suspend fun sign(
		challenge: WebAuthnSignChallenge,
	): WebAuthnSignResult
	/**
	 * cancels the current sign/registration operation
	 */
	suspend fun abortCurrentOperation(
	): Unit
	/**
	 * return whether this platform supports webAuthn
	 */
	suspend fun isSupported(
	): Boolean
	/**
	 * return whether we can attempt a challenge for a given RpId
	 */
	suspend fun canAttemptChallengeForRpId(
		rpId: String,
	): Boolean
	/**
	 * return whether we can attempt a challenge for a given U2FAppId
	 */
	suspend fun canAttemptChallengeForU2FAppId(
		appId: String,
	): Boolean
}
