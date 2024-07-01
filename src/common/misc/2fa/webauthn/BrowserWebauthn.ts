import { COSEAlgorithmIdentifier } from "./WebauthnTypes.js"
import { ProgrammingError } from "../../../api/common/error/ProgrammingError.js"
import { isApp } from "../../../api/common/Env.js"
import { WebAuthnFacade } from "../../../native/common/generatedipc/WebAuthnFacade.js"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { CancelledError } from "../../../api/common/error/CancelledError.js"
import { WebauthnError } from "../../../api/common/error/WebauthnError.js"
import { WebAuthnRegistrationChallenge } from "../../../native/common/generatedipc/WebAuthnRegistrationChallenge.js"
import { WebAuthnRegistrationResult } from "../../../native/common/generatedipc/WebAuthnRegistrationResult.js"
import { WebAuthnSignChallenge } from "../../../native/common/generatedipc/WebAuthnSignChallenge.js"
import { WebAuthnSignResult } from "../../../native/common/generatedipc/WebAuthnSignResult.js"

const WEBAUTHN_TIMEOUT_MS = 60000

/** An actual webauthn implementation in browser. */
export class BrowserWebauthn implements WebAuthnFacade {
	/**
	 * Relying Party Identifier
	 * see https://www.w3.org/TR/webauthn-2/#public-key-credential-source-rpid
	 */
	private readonly rpId: string
	/** Backward-compatible identifier for the legacy U2F API */
	private readonly appId: string
	private currentOperationSignal: AbortController | null = null

	constructor(private readonly api: CredentialsContainer, domainConfig: DomainConfig) {
		this.rpId = domainConfig.webauthnRpId
		this.appId = domainConfig.u2fAppId
	}

	async canAttemptChallengeForRpId(rpId: string): Promise<boolean> {
		return rpId === this.rpId
	}

	async canAttemptChallengeForU2FAppId(appId: string): Promise<boolean> {
		return this.appId === appId
	}

	/**
	 * test whether hardware key second factors are supported for this client
	 */
	async isSupported(): Promise<boolean> {
		return (
			!isApp() &&
			this.api != null &&
			// @ts-ignore see polyfill.js
			// We just stub BigInt in order to import cborg without issues but we can't actually use it
			!BigInt.polyfilled
		)
	}

	async register({ challenge, userId, name, displayName }: WebAuthnRegistrationChallenge): Promise<WebAuthnRegistrationResult> {
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
				userVerification: "discouraged",
			},
			timeout: WEBAUTHN_TIMEOUT_MS,
			attestation: "none",
		}
		this.currentOperationSignal = new AbortController()
		const credential = (await this.api.create({
			publicKey: publicKeyCredentialCreationOptions,
			signal: this.currentOperationSignal.signal,
		})) as PublicKeyCredential

		return {
			rpId: this.rpId,
			rawId: new Uint8Array(credential.rawId),
			attestationObject: new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject),
		}
	}

	async sign({ challenge, keys }: WebAuthnSignChallenge): Promise<WebAuthnSignResult> {
		const allowCredentials: PublicKeyCredentialDescriptor[] = keys.map((key) => {
			return {
				id: key.id,
				type: "public-key",
			}
		})
		const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
			challenge: challenge,
			rpId: this.rpId,
			allowCredentials,
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
				signal: this.currentOperationSignal.signal,
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
			rawId: new Uint8Array(publicKeyCredential.rawId),
			authenticatorData: new Uint8Array(assertionResponse.authenticatorData),
			signature: new Uint8Array(assertionResponse.signature),
			clientDataJSON: new Uint8Array(assertionResponse.clientDataJSON),
		}
	}

	async abortCurrentOperation(): Promise<void> {
		this.currentOperationSignal?.abort()
		this.currentOperationSignal = null
	}
}
