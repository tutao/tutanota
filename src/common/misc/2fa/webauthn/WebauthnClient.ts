import { decode } from "cborg"
import { assert, downcast, getFirstOrThrow, partitionAsync, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import type { U2fChallenge, U2fRegisteredDevice, WebauthnResponseData } from "../../../api/entities/sys/TypeRefs.js"
import { createU2fRegisteredDevice, createWebauthnResponseData, U2fKey } from "../../../api/entities/sys/TypeRefs.js"
import { WebAuthnFacade } from "../../../native/common/generatedipc/WebAuthnFacade.js"
import { WebauthnKeyDescriptor } from "../../../native/common/generatedipc/WebauthnKeyDescriptor.js"
import { getApiBaseUrl } from "../../../api/common/Env.js"
import { Const } from "../../../api/common/TutanotaConstants.js"
import { DomainConfigProvider } from "../../../api/common/DomainConfigProvider.js"

/** Web authentication entry point for the rest of the app. */
export class WebauthnClient {
	constructor(private readonly webauthn: WebAuthnFacade, private readonly domainConfigProvider: DomainConfigProvider, private readonly isApp: boolean) {}

	isSupported(): Promise<boolean> {
		return this.webauthn.isSupported()
	}

	/** Whether it's possible to attempt a challenge. It might not be possible if there are not keys for this domain. */
	async canAttemptChallenge(challenge: U2fChallenge): Promise<{ canAttempt: Array<U2fKey>; cannotAttempt: Array<U2fKey> }> {
		// Whitelabel keys can ge registered other (whitelabel) domains.
		// If it's a new Webauthn key it will match rpId, otherwise it will match legacy appId.

		// Partition in keys that might work and which certainly cannot work.
		const [canAttempt, cannotAttempt] = await partitionAsync(
			challenge.keys,
			async (k) => (await this.webauthn.canAttemptChallengeForRpId(k.appId)) || (await this.webauthn.canAttemptChallengeForU2FAppId(k.appId)),
		)
		return { canAttempt, cannotAttempt }
	}

	async register(userId: Id, displayName: string): Promise<U2fRegisteredDevice> {
		const challenge = this.getChallenge()
		// this must be at most 64 bytes because the authenticators are allowed to truncate it
		// https://www.w3.org/TR/webauthn-2/#user-handle
		const name = `userId="${userId}"`
		const registrationResult = await this.webauthn.register({ challenge, userId, name, displayName, domain: this.selectRegistrationUrl() })
		const attestationObject = this.parseAttestationObject(registrationResult.attestationObject)
		const publicKey = this.parsePublicKey(downcast(attestationObject).authData)

		return createU2fRegisteredDevice({
			keyHandle: new Uint8Array(registrationResult.rawId),
			// For Webauthn keys we save rpId into appId. They do not conflict: one of them is json URL, another is domain.
			appId: registrationResult.rpId,
			publicKey: this.serializePublicKey(publicKey),
			compromised: false,
			counter: "-1",
		})
	}

	private selectRegistrationUrl() {
		const domainConfig = this.domainConfigProvider.getCurrentDomainConfig()
		return this.getWebauthnUrl(domainConfig, "new")
	}

	/**
	 * Attempt to complete Webauthn challenge (the local part, signing of the data).
	 * U2fChallenge might have multiple keys for different domains and this method takes care of picking the one we can attempt to solve.
	 * @return responseData to send to the server and base api url which should be contacted in order to finish the challenge
	 * @throws CancelledError
	 * @throws WebauthnError
	 */
	async authenticate(challenge: U2fChallenge): Promise<{ responseData: WebauthnResponseData; apiBaseUrl: string }> {
		const allowedKeys: WebauthnKeyDescriptor[] = challenge.keys.map((key) => {
			return {
				id: key.keyHandle,
			}
		})

		const authenticationUrl = this.selectAuthenticationUrl(challenge)
		const signResult = await this.webauthn.sign({
			challenge: challenge.challenge,
			keys: allowedKeys,
			domain: authenticationUrl,
		})

		const responseData = createWebauthnResponseData({
			keyHandle: new Uint8Array(signResult.rawId),
			clientData: new Uint8Array(signResult.clientDataJSON),
			signature: new Uint8Array(signResult.signature),
			authenticatorData: new Uint8Array(signResult.authenticatorData),
		})
		// take https://app.tuta.com/webauthn and convert it to apis://app.tuta.com
		const authUrlObject = new URL(authenticationUrl)
		const domainConfig = this.domainConfigProvider.getDomainConfigForHostname(authUrlObject.hostname, authUrlObject.protocol, authUrlObject.port)
		const apiUrl = getApiBaseUrl(domainConfig)

		return { responseData, apiBaseUrl: apiUrl }
	}

	abortCurrentOperation(): Promise<void> {
		return this.webauthn.abortCurrentOperation()
	}

	private selectAuthenticationUrl(challenge: U2fChallenge): string {
		// We need to figure our for which page we need to open authentication based on the keys that user has added because users can register keys for our
		// domains as well as for whitelabel domains.

		const domainConfig = this.domainConfigProvider.getCurrentDomainConfig()
		if (challenge.keys.some((k) => k.appId === Const.WEBAUTHN_RP_ID)) {
			// This function is not needed for the webapp! We can safely assume that our clientWebRoot is a new domain.
			return this.getWebauthnUrl(domainConfig, "new")
		} else if (challenge.keys.some((k) => k.appId === Const.LEGACY_WEBAUTHN_RP_ID)) {
			// If there's a Webauthn key for our old domain we need to open the webapp on the old domain.
			return this.getWebauthnUrl(domainConfig, "legacy")
		} else {
			// If it isn't there, look for any Webauthn key. Legacy U2F key ids ends with json subpath.
			const webauthnKey = challenge.keys.find((k) => !this.isLegacyU2fKey(k))
			if (webauthnKey) {
				const domainConfigForHostname = this.domainConfigProvider.getDomainConfigForHostname(webauthnKey.appId, "https:")
				return this.getWebauthnUrl(domainConfigForHostname, "new")
			} else if (challenge.keys.some((k) => k.appId === Const.U2F_LEGACY_APPID)) {
				// There are only legacy U2F keys but there is one for our domain, take it
				return this.getWebauthnUrl(domainConfig, "legacy")
			} else {
				// Nothing else worked, select legacy U2F key for whitelabel domain
				const keyToUse = getFirstOrThrow(challenge.keys)
				const keyUrl = new URL(keyToUse.appId)
				const domainConfigForHostname = this.domainConfigProvider.getDomainConfigForHostname(keyUrl.hostname, keyUrl.protocol, keyUrl.port)
				return this.getWebauthnUrl(domainConfigForHostname, "new")
			}
		}
	}

	private getWebauthnUrl(domainConfig: DomainConfig, type: "legacy" | "new") {
		if (type === "legacy") {
			return this.isApp ? domainConfig.legacyWebauthnMobileUrl : domainConfig.legacyWebauthnUrl
		} else {
			return this.isApp ? domainConfig.webauthnMobileUrl : domainConfig.webauthnUrl
		}
	}

	private isLegacyU2fKey(key: U2fKey): boolean {
		return key.appId.endsWith(Const.U2f_APPID_SUFFIX)
	}

	private getChallenge(): Uint8Array {
		// Should be replaced with our own entropy generator in the future.
		const random = new Uint8Array(32)
		crypto.getRandomValues(random)
		return random
	}

	private parseAttestationObject(raw: ArrayBuffer): unknown {
		return decode(new Uint8Array(raw))
	}

	private parsePublicKey(authData: Uint8Array): Map<number, number | Uint8Array> {
		// get the length of the credential ID
		const dataView = new DataView(new ArrayBuffer(2))
		const idLenBytes = authData.slice(53, 55)
		for (const [index, value] of idLenBytes.entries()) {
			dataView.setUint8(index, value)
		}
		const credentialIdLength = dataView.getUint16(0)
		// get the public key object
		const publicKeyBytes = authData.slice(55 + credentialIdLength)
		// the publicKeyBytes are encoded again as CBOR
		// We have to use maps here because keys are numeric and cborg only allows them in maps
		return decode(new Uint8Array(publicKeyBytes.buffer), {
			useMaps: true,
		})
	}

	private serializePublicKey(publicKey: Map<number, number | Uint8Array>): Uint8Array {
		const encoded = new Uint8Array(65)
		encoded[0] = 0x04
		const x = publicKey.get(-2)
		const y = publicKey.get(-3)

		if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array)) {
			throw new Error("Public key is in unknown format")
		}

		encoded.set(x, 1)
		encoded.set(y, 33)
		return encoded
	}
}

/** authenticators are allowed to truncate strings to this length */
const WEBAUTHN_STRING_MAX_BYTE_LENGTH = 64

/**
 * some authenticators truncate this and others refuse to be registered
 * at all if this validation does not pass.
 *
 * Note: technically, we'd also be supposed to encode text direction and a language
 * code into the display name.
 */
export function validateWebauthnDisplayName(displayName: string): boolean {
	return WEBAUTHN_STRING_MAX_BYTE_LENGTH - stringToUtf8Uint8Array(displayName).byteLength >= 0
}
