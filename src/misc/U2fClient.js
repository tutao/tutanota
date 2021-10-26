//@flow
import {TutanotaError} from "../api/common/error/TutanotaError"
import {base64ToBase64Url, base64ToUint8Array, base64UrlToBase64, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {assertMainOrNode, getHttpOrigin, isAdminClient, isApp, isDesktop} from "../api/common/Env"
import {BadRequestError} from "../api/common/error/RestError"
import type {U2fRegisteredDevice} from "../api/entities/sys/U2fRegisteredDevice"
import {createU2fRegisteredDevice} from "../api/entities/sys/U2fRegisteredDevice"
import type {U2fResponseData} from "../api/entities/sys/U2fResponseData"
import {createU2fResponseData} from "../api/entities/sys/U2fResponseData"
// $FlowIgnore[untyped-import]
import u2fApi from "./u2f-api"
import {SECOND_MS} from "../api/common/TutanotaConstants"
import {BrowserType} from "./ClientConstants"
import {client} from "./ClientDetector"
import type {U2fChallenge} from "../api/entities/sys/U2fChallenge"
import {delay} from "@tutao/tutanota-utils"
import {downcast} from "@tutao/tutanota-utils"
import type {Base64, Base64Url} from "@tutao/tutanota-utils/"

assertMainOrNode()

const TIMEOUT = 180


/**
 * Abstraction of the U2F high level API.
 *
 * The linked documentation provides an overview about
 * 1. the high level api and
 * 2. the raw messages sent
 *
 * @see https://fidoalliance.org/specs/fido-u2f-v1.2-ps-20170411/fido-u2f-javascript-api-v1.2-ps-20170411.html#high-level-javascript-api
 * @see https://fidoalliance.org/specs/fido-u2f-v1.1-id-20160915/fido-u2f-raw-message-formats-v1.1-id-20160915.html#registration-request-message---u2f_register
 *
 * Firefox supports u2f through the window.u2f property which we try to use when it's available.
 *
 * NOTE The type definitions for SignResponse and RegisterResponse as found in u2f-api.js are incorrect, disregard them (even when using the u2f-api.js implementation)
 * The actual values in the response objects are as defined by the fido spec
 */

type U2fRegisterRequest = {
	version: string,
	challenge: Base64
}

type RegisteredKey = {
	version: string,
	keyHandle: Base64,
	appId: string
}

// https://fidoalliance.org/specs/fido-u2f-v1.0-nfc-bt-amendment-20150514/fido-u2f-javascript-api.html#dictionary-signresponse-members
type U2fSignResponse = {|
	keyHandle: string,
	clientData: string,
	signatureData: string,

	// 0 in FF, undefined in chrome
	errorCode: void | 0
|}

// https://fidoalliance.org/specs/fido-u2f-v1.0-nfc-bt-amendment-20150514/fido-u2f-javascript-api.html#registration
type U2fRegisterResponse = {|
	clientData: Base64Url,
	registrationData: Base64Url,

	// 0 in FF, undefined in chrome
	errorCode: void | 0
|}

type U2fErrorResponse = {|
	errorCode: number
|}

type U2fApi = {
	register(appId: string, registerRequests: Array<U2fRegisterRequest>, registeredKeys: Array<RegisteredKey>, callback: (U2fRegisterResponse | U2fErrorResponse) => *, timeoutSeconds: ?number): void,
	sign(appId: string, challenge: string, registeredKeys: Array<RegisteredKey>, callback: (U2fSignResponse | U2fErrorResponse) => *, timeoutSeconds: number): void
}


export class U2fClient {
	appId: string;
	api: U2fApi

	constructor() {
		if (window.location.hostname.endsWith("tutanota.com")) {
			this.appId = "https://tutanota.com/u2f-appid.json"
		} else {
			this.appId = getHttpOrigin() + "/u2f-appid.json"
		}

		this.api = window.u2f || u2fApi
	}

	/**
	 * Returns true if U2F is supported in this client. Attention: this call may take up to 1 second.
	 */
	isSupported(): Promise<boolean> {
		if (isAdminClient() || isDesktop() || isApp() || client.browser === BrowserType.EDGE) return Promise.resolve(false)
		if (window.u2f && window.u2f.register) return Promise.resolve(true)
		return this.checkVersionWithTimeout().catch(() => false)
	}

	checkVersionWithTimeout(): Promise<boolean> {
		return Promise.race([
			new Promise((resolve) => {
				console.log("u2fApi.getApiVersion")
				u2fApi.getApiVersion((responseOrError) => {
					console.log("u2fApi.getApiVersion response", responseOrError)
					resolve(responseOrError['js_api_version'] != null)
				}, 2)
			}),
			delay(SECOND_MS).then(() => false),
		])
	}

	async register(): Promise<U2fRegisteredDevice> {
		const random = new Uint8Array(32)
		const c = typeof crypto !== 'undefined' ? crypto : msCrypto
		c.getRandomValues(random)
		const challenge = base64ToBase64Url(uint8ArrayToBase64(random))
		const wrappedResponse = await new Promise((resolve) => {
			this.api.register(this.appId, [
				{
					version: "U2F_V2",
					challenge: challenge,
				}
			], [], (response) => resolve(response), TIMEOUT)
		})
		const response = this._unwrapResponse(wrappedResponse)
		const registerResponse = this._decodeRegisterResponse(response)
		return createU2fRegisteredDevice({
			keyHandle: registerResponse.keyHandle,
			appId: this.appId,
			publicKey: registerResponse.userPublicKey,
			compromised: false,
			counter: "-1"
		})
	}

	async sign(sessionId: IdTuple, challenge: U2fChallenge): Promise<U2fResponseData> {
		let registeredKeys = challenge.keys.map(key => {
			return {
				version: "U2F_V2",
				keyHandle: base64ToBase64Url(uint8ArrayToBase64(key.keyHandle)),
				appId: this.appId
			}
		})
		const challengeData = base64ToBase64Url(uint8ArrayToBase64(challenge.challenge))
		const wrappedResponse = await new Promise((resolve) => {
			this.api.sign(this.appId, challengeData, registeredKeys, (response) => resolve(response), TIMEOUT)
		})
		const response = this._unwrapResponse(wrappedResponse)
		return createU2fResponseData({
			keyHandle: response.keyHandle,
			clientData: response.clientData,
			signatureData: response.signatureData,
		})
	}

	_unwrapResponse<T: U2fRegisterResponse | U2fSignResponse>(response: T | U2fErrorResponse): T {
		if (!response.errorCode) {
			// Can't get flow to agree that we do in fact have a non-error here
			return downcast(response)
		} else {
			const errorCode = response.errorCode
			console.log("U2f error", errorCode, JSON.stringify(response))
			if (errorCode === 4) {
				throw new U2fWrongDeviceError()
			} else if (errorCode === 5) {
				throw new U2fTimeoutError()
			} else {
				throw new U2fError("U2f error code: " + errorCode)
			}
		}
	}

	/**
	 * We extract the keyHandle and the public key from the u2f device and discard the attestation certificates and signature
	 * Yubikeys can be verified here: https://demo.yubico.com/u2f
	 * @param rawRegisterResponse the encoded registration response
	 * @see https://fidoalliance.org/specs/fido-u2f-v1.2-ps-20170411/fido-u2f-raw-message-formats-v1.2-ps-20170411.html#registration-response-message-success
	 */
	_decodeRegisterResponse(rawRegisterResponse: {clientData: Base64Url, registrationData: Base64Url}): {keyHandle: Uint8Array, userPublicKey: Uint8Array} {
		const msg = base64ToUint8Array(base64UrlToBase64(rawRegisterResponse.registrationData))
		const keyHandleEnd = 67 + msg[66]
		const reservedByte = msg[0]
		if (reservedByte !== REGISTRATION_RESERVED_BYTE_VALUE) {
			throw new BadRequestError("Incorrect value of reserved byte. Expected: " + REGISTRATION_RESERVED_BYTE_VALUE
				+ ". Was: " + reservedByte)
		}
		return {
			userPublicKey: msg.slice(1, 66),
			keyHandle: msg.slice(67, keyHandleEnd),
		}
	}

}

const REGISTRATION_RESERVED_BYTE_VALUE = 0x05

export class U2fTimeoutError extends TutanotaError {
	constructor() {
		super("U2fTimeoutError", "")
	}
}

export class U2fWrongDeviceError extends TutanotaError {
	constructor() {
		super("U2fWrongDeviceError", "")
	}
}

export class U2fError extends TutanotaError {
	constructor(msg: string) {
		super("U2fError", msg)
	}
}
