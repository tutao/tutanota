import {COSEAlgorithmIdentifier} from "./WebauthnTypes.js"
import {ProgrammingError} from "../../../api/common/error/ProgrammingError.js"
import {getHttpOrigin} from "../../../api/common/Env.js"
import {
	WebAuthn,
	U2F_APPID, U2f_APPID_SUFFIX,
	WEBAUTHN_RP_ID,
	WebAuthnRegistrationChallenge,
	WebauthnRegistrationResult,
	WebAuthnSignChallenge,
	WebauthnSignResult
} from "./WebAuthn.js"
import {stringToUtf8Uint8Array} from "@tutao/tutanota-utils"
import {CancelledError} from "../../../api/common/error/CancelledError.js"
import {WebauthnError} from "../../../api/common/error/WebauthnError.js"

const WEBAUTHN_TIMEOUT_MS = 60000

/** An actual webauthn implementation in browser. */
export class BrowserWebauthn implements WebAuthn {
	/**
	 * Relying Party Identifier
	 * see https://www.w3.org/TR/webauthn-2/#public-key-credential-source-rpid
	 */
	private readonly rpId: string
	/** Backward-compatible identifier for the legacy U2F API */
	private readonly appId: string
	private currentOperationSignal: AbortController | null = null

	constructor(
		private readonly api: CredentialsContainer,
		hostname: string
	) {
		this.rpId = this.rpIdFromHostname(hostname)
		this.appId = this.appidFromHostname(hostname)
	}

	async canAttemptChallengeForRpId(rpId: string): Promise<boolean> {
		return rpId === this.rpId
	}

	async canAttemptChallengeForU2FAppId(appId: string): Promise<boolean> {
		return this.appId === appId
	}

	async isSupported(): Promise<boolean> {
		return this.api != null &&
			// @ts-ignore see polyfill.js
			// We just stub BigInt in order to import cborg without issues but we can't actually use it
			!BigInt.polyfilled
	}

	async register({challenge, userId, name, displayName}: WebAuthnRegistrationChallenge): Promise<WebauthnRegistrationResult> {
		const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
			challenge,
			rp: {
				name: "Tutanota",
				id: this.rpId,
			},
			user: {
				id: stringToUtf8Uint8Array(userId),
				name,
				displayName,
			},
			pubKeyCredParams: [
				{
					alg: COSEAlgorithmIdentifier.ES256,
					type: "public-key",
				},
			],
			authenticatorSelection: {
				authenticatorAttachment: "cross-platform",
				userVerification: "discouraged"
			},
			timeout: WEBAUTHN_TIMEOUT_MS,
			attestation: "none",
		}
		this.currentOperationSignal = new AbortController()
		const credential = await this.api.create({
			publicKey: publicKeyCredentialCreationOptions,
			signal: this.currentOperationSignal.signal
		}) as PublicKeyCredential

		return {
			rpId: this.rpId,
			rawId: credential.rawId,
			attestationObject: (credential.response as AuthenticatorAttestationResponse).attestationObject,
		}
	}

	async sign({challenge, keys}: WebAuthnSignChallenge): Promise<WebauthnSignResult> {
		const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
			challenge: challenge,
			rpId: this.rpId,
			allowCredentials: keys,
			extensions: {
				appid: this.appId,
			},
			userVerification: "discouraged",
			timeout: WEBAUTHN_TIMEOUT_MS,
		}
		let assertion

		this.currentOperationSignal = new AbortController()
		try {
			assertion = await this.api.get({
				publicKey: publicKeyCredentialRequestOptions,
				signal: this.currentOperationSignal.signal
			})
		} catch (e) {
			if (e.name === "AbortError") {
				throw new CancelledError(e)
			} else {
				throw new WebauthnError(e)
			}
		}

		const publicKeyCredential = assertion as PublicKeyCredential | null

		if (publicKeyCredential == null) {
			throw new ProgrammingError("Webauthn credential could not be unambiguously resolved")
		}
		const assertionResponse = publicKeyCredential.response as AuthenticatorAssertionResponse
		return {
			rawId: publicKeyCredential.rawId,
			authenticatorData: assertionResponse.authenticatorData,
			signature: assertionResponse.signature,
			clientDataJSON: assertionResponse.clientDataJSON,
		}
	}

	async abortCurrentOperation(): Promise<void> {
		this.currentOperationSignal?.abort()
		this.currentOperationSignal = null
	}

	private rpIdFromHostname(hostname: string): string {
		if (hostname.endsWith(WEBAUTHN_RP_ID)) {
			return WEBAUTHN_RP_ID
		} else {
			return hostname
		}
	}

	private appidFromHostname(hostname: string): string {
		if (hostname.endsWith(WEBAUTHN_RP_ID)) {
			return U2F_APPID
		} else {
			return getHttpOrigin() + U2f_APPID_SUFFIX
		}
	}
}