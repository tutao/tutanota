/* generated file, don't edit. */

import { WebAuthnRegistrationChallenge, WebAuthnRegistrationResult, WebAuthnSignChallenge, WebAuthnSignResult } from "./index"

/**
 * implementation of the WebAuthn protocol
 */
export interface WebAuthnFacade {
	/**
	 * register for webauthn
	 */
	register(challenge: WebAuthnRegistrationChallenge): Promise<WebAuthnRegistrationResult>

	/**
	 * sign a webauthn challenge
	 */
	sign(challenge: WebAuthnSignChallenge): Promise<WebAuthnSignResult>

	/**
	 * cancels the current sign/registration operation
	 */
	abortCurrentOperation(): Promise<void>

	/**
	 * return whether this platform supports webAuthn
	 */
	isSupported(): Promise<boolean>

	/**
	 * return whether we can attempt a challenge for a given RpId
	 */
	canAttemptChallengeForRpId(rpId: string): Promise<boolean>

	/**
	 * return whether we can attempt a challenge for a given U2FAppId
	 */
	canAttemptChallengeForU2FAppId(appId: string): Promise<boolean>
}
