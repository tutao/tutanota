import {decode} from "cborg"
import {assert, downcast, firstThrow, partitionAsync} from "@tutao/tutanota-utils"
import type {U2fChallenge, U2fRegisteredDevice, WebauthnResponseData} from "../../../api/entities/sys/TypeRefs.js"
import {createU2fRegisteredDevice, createWebauthnResponseData, U2fKey} from "../../../api/entities/sys/TypeRefs.js"
import {WebAuthnFacade} from "../../../native/common/generatedipc/WebAuthnFacade.js"
import {U2F_APPID, U2f_APPID_SUFFIX, WEBAUTHN_RP_ID} from "./WebAuthn.js"
import {WebauthnKeyDescriptor} from "../../../native/common/generatedipc/WebauthnKeyDescriptor.js"

/** Web authentication entry point for the rest of the app. */
export class WebauthnClient {
	constructor(
		private readonly webauthn: WebAuthnFacade,
		private readonly clientWebRoot: string,
	) {
	}

	isSupported(): Promise<boolean> {
		return this.webauthn.isSupported()
	}

	/** Whether it's possible to attempt a challenge. It might not be possible if there are not keys for this domain. */
	async canAttemptChallenge(challenge: U2fChallenge): Promise<{canAttempt: Array<U2fKey>, cannotAttempt: Array<U2fKey>}> {
		// Whitelabel keys can ge registered other (whitelabel) domains.
		// If it's a new Webauthn key it will match rpId, otherwise it will match legacy appId.

		// Partition in keys that might work and which certainly cannot work.
		const [canAttempt, cannotAttempt] = await partitionAsync(
			challenge.keys,
			async k => await this.webauthn.canAttemptChallengeForRpId(k.appId) || await this.webauthn.canAttemptChallengeForU2FAppId(k.appId)
		)
		return {canAttempt, cannotAttempt}
	}

	async register(userId: Id, displayName: string, mailAddress: string): Promise<U2fRegisteredDevice> {
		const challenge = this.getChallenge()
		const name = `${userId} ${mailAddress} ${displayName}`
		const registrationResult = await this.webauthn.register({challenge, userId, name, displayName, domain: this.clientWebRoot})
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

	async authenticate(challenge: U2fChallenge, signal?: AbortSignal): Promise<WebauthnResponseData> {
		const allowedKeys: WebauthnKeyDescriptor[] = challenge.keys.map(key => {
			return {
				id: key.keyHandle,
			}
		})

		const signResult = await this.webauthn.sign({
			challenge: challenge.challenge,
			keys: allowedKeys,
			domain: this.selectAuthenticationUrl(challenge)
		})

		return createWebauthnResponseData({
			keyHandle: new Uint8Array(signResult.rawId),
			clientData: new Uint8Array(signResult.clientDataJSON),
			signature: new Uint8Array(signResult.signature),
			authenticatorData: new Uint8Array(signResult.authenticatorData),
		})
	}

	abortCurrentOperation(): Promise<void> {
		return this.webauthn.abortCurrentOperation()
	}

	private selectAuthenticationUrl(challenge: U2fChallenge): string {
		// We need to figure our for which page we need to open authentication based on the keys that user has added because users can register keys for our
		// domains as well as for whitelabel domains.

		let selectedClientUrl
		if (challenge.keys.some(k => k.appId === WEBAUTHN_RP_ID)) {
			// First, if we find our own key then open web client on our URL.
			// Even if it's a different subdomain of ours it can still match because it is scoped for all tutanota.com subdomains
			selectedClientUrl = this.clientWebRoot
		} else {
			// If it isn't there, look for any Webauthn key. Legacy U2F key ids ends with json subpath.
			const webauthnKey = challenge.keys.find(k => !this.isLegacyU2fKey(k))
			if (webauthnKey) {
				selectedClientUrl = `https://${webauthnKey.appId}`
			} else if (challenge.keys.some(k => k.appId === U2F_APPID)) {
				// There are only legacy U2F keys but there is one for our domain, take it
				selectedClientUrl = this.clientWebRoot
			} else {
				// Nothing else worked, select legacy U2F key for whitelabel domain
				selectedClientUrl = this.legacyU2fKeyToBaseUrl(firstThrow(challenge.keys))
			}
		}
		return selectedClientUrl
	}

	private isLegacyU2fKey(key: U2fKey): boolean {
		return key.appId.endsWith(U2f_APPID_SUFFIX)
	}

	private legacyU2fKeyToBaseUrl(key: U2fKey): string {
		assert(this.isLegacyU2fKey(key), "Is not a legacy u2f key")

		return key.appId.slice(0, -(U2f_APPID_SUFFIX.length))
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
		idLenBytes.forEach((value, index) => dataView.setUint8(index, value))
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