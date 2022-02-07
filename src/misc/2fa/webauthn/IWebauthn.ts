export interface WebAuthnRegistrationChallenge {
	challenge: Uint8Array
	userId: string
	name: string
	displayName: string
	domain: string
}

/**
 * Result of Webauthn registration with hardware key.
 *
 * Custom type as opposed to PublicKeyCredential and AuthenticatorAttestationResponse because:
 * 1. Built-in type is not a plain type, we can't send it over IPC or easily clone
 * 2. We need rpId which was actually used
 * 3. More precise: we know that attestationObject is there
 */
export interface WebauthnRegistrationResult {
	rpId: string
	rawId: ArrayBuffer
	attestationObject: ArrayBuffer
}

export interface WebAuthnSignChallenge {
	challenge: Uint8Array
	keys: Array<PublicKeyCredentialDescriptor>
	domain: string
}

/**
 * Result of Webauthn authentication with hardware key.
 *
 * See {@link WebauthnRegistrationResult} for motivation.
 */
export interface WebauthnSignResult {
	rawId: ArrayBuffer
	clientDataJSON: ArrayBuffer
	signature: ArrayBuffer
	authenticatorData: ArrayBuffer
}

export interface ExposedWebauthnInterface {
	webauthn: IWebauthn
}

/** Actual web authentication implementation. Should not be used directly. */
export interface IWebauthn {
	isSupported(): Promise<boolean>;

	canAttemptChallengeForRpId(rpId: string): Promise<boolean>;

	canAttemptChallengeForU2FAppId(appId: string): Promise<boolean>;

	register(challenge: WebAuthnRegistrationChallenge): Promise<WebauthnRegistrationResult>;

	sign(challenge: WebAuthnSignChallenge): Promise<WebauthnSignResult>;

	abortCurrentOperation(): Promise<void>;
}

export const WEBAUTHN_RP_ID = "tutanota.com"
export const U2f_APPID_SUFFIX = "/u2f-appid.json"
export const U2F_APPID = "https://tutanota.com/u2f-appid.json"