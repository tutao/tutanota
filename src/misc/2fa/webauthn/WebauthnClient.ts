import {decode} from "cborg"
import {downcast, stringToUtf8Uint8Array} from "@tutao/tutanota-utils"
import {getHttpOrigin, isApp, isDesktop} from "../../../api/common/Env"
import type {U2fRegisteredDevice} from "../../../api/entities/sys/U2fRegisteredDevice"
import {createU2fRegisteredDevice} from "../../../api/entities/sys/U2fRegisteredDevice"
import type {U2fChallenge} from "../../../api/entities/sys/U2fChallenge"
import type {WebauthnResponseData} from "../../../api/entities/sys/WebauthnResponseData"
import {createWebauthnResponseData} from "../../../api/entities/sys/WebauthnResponseData"
import {TutanotaError} from "../../../api/common/error/TutanotaError"
import type {
	AuthenticatorAssertionResponse,
	AuthenticatorAttestationResponse,
	CredentialsApi,
	PublicKeyCredential,
	PublicKeyCredentialCreationOptions,
	PublicKeyCredentialRequestOptions,
} from "./WebauthnTypes"
import {COSEAlgorithmIdentifierNames} from "./WebauthnTypes"
import {ProgrammingError} from "../../../api/common/error/ProgrammingError"

const WEBAUTHN_TIMEOUT_MS = 60000

export class WebauthnClient {
	/**
	 * Relying Party Identifier
	 * see https://www.w3.org/TR/webauthn-2/#public-key-credential-source-rpid
	 * */
	readonly rpId: string

	/** Backward-compatible identifier for the legacy U2F API */
	readonly appId: string
	readonly api: CredentialsApi

	constructor() {
		this.api = downcast(navigator.credentials)

		if (window.location.hostname.endsWith("tutanota.com")) {
			this.rpId = "tutanota.com"
		} else {
			this.rpId = window.location.hostname
		}

		if (window.location.hostname.endsWith("tutanota.com")) {
			this.appId = "https://tutanota.com/u2f-appid.json"
		} else {
			this.appId = getHttpOrigin() + "/u2f-appid.json"
		}
	}

	isSupported(): boolean {
		// We explicitly disable apps and desktop because even if webauthn somehow works there it won't match our domain.
		// For those platforms another implementation with separate webview should be used instead.
		return !isDesktop() && !isApp() && this.api != null
	}

	async register(userId: Id, name: string, mailAddress: string, signal: AbortSignal): Promise<U2fRegisteredDevice> {
		const challenge = this._getChallenge()

		const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
			challenge,
			rp: {
				name: "Tutanota",
				id: this.rpId,
			},
			user: {
				id: stringToUtf8Uint8Array(userId),
				name: `${userId} ${mailAddress} ${name}`,
				displayName: name,
			},
			pubKeyCredParams: [
				{
					alg: COSEAlgorithmIdentifierNames.ES256,
					type: "public-key",
				},
			],
			authenticatorSelection: {
				authenticatorAttachment: "cross-platform",
			},
			timeout: WEBAUTHN_TIMEOUT_MS,
			attestation: "none",
		}
		const credential = await this.api.create({
			publicKey: publicKeyCredentialCreationOptions,
			signal,
		})
		const publicKeyCredential: PublicKeyCredential = downcast(credential)
		const response: AuthenticatorAttestationResponse = downcast(publicKeyCredential.response)

		const attestationObject = this._parseAttestationObject(response.attestationObject)

		const publicKey = this._parsePublicKey(downcast(attestationObject).authData)

		return createU2fRegisteredDevice({
			keyHandle: new Uint8Array(publicKeyCredential.rawId),
			// For Webauthn keys we save rpId into appId. They do not conflict: one of them is json URL, another is domain.
			appId: this.rpId,
			publicKey: this._serializePublicKey(publicKey),
			compromised: false,
			counter: "-1",
		})
	}

	async sign(sessionId: IdTuple, challenge: U2fChallenge, signal?: AbortSignal): Promise<WebauthnResponseData> {
		const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
			challenge: challenge.challenge,
			rpId: this.rpId,
			allowCredentials: challenge.keys.map(key => {
				return {
					id: key.keyHandle,
					type: "public-key",
				}
			}),
			extensions: {
				appid: this.appId,
			},
			userVerification: "discouraged",
			timeout: WEBAUTHN_TIMEOUT_MS,
		}
		let assertion

		try {
			assertion = await this.api.get({
				publicKey: publicKeyCredentialRequestOptions,
				signal,
			})
		} catch (e) {
			if (e.name === "AbortError") {
				throw new WebauthnCancelledError(e)
			} else {
				throw new WebauthnError(e)
			}
		}

		const publicKeyCredential: PublicKeyCredential | null = downcast(assertion)

		if (publicKeyCredential == null) {
			throw new ProgrammingError("Webauthn credential could not be unambiguously resolved")
		}

		const response: AuthenticatorAssertionResponse = downcast(publicKeyCredential.response)
		return createWebauthnResponseData({
			keyHandle: new Uint8Array(publicKeyCredential.rawId),
			clientData: new Uint8Array(response.clientDataJSON),
			signature: new Uint8Array(response.signature),
			authenticatorData: new Uint8Array(response.authenticatorData),
		})
	}

	_getChallenge(): Uint8Array {
		// Should be replaced with our own entropy generator in the future.
		const random = new Uint8Array(32)
		crypto.getRandomValues(random)
		return random
	}

	_parseAttestationObject(raw: ArrayBuffer): unknown {
		return decode(new Uint8Array(raw))
	}

	_parsePublicKey(authData: Uint8Array): Map<number, number | Uint8Array> {
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

	_serializePublicKey(publicKey: Map<number, number | Uint8Array>): Uint8Array {
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

export class WebauthnError extends TutanotaError {
	constructor(error: Error) {
		super("WebauthnUnrecoverableError", `${error.name} ${String(error)}`)
	}
}

export class WebauthnCancelledError extends TutanotaError {
	constructor(error: Error) {
		super("WebauthnCancelledError", `${error.name} ${String(error)}`)
	}
}