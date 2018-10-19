//@flow
import {TutanotaError} from "../api/common/error/TutanotaError"
import {base64ToBase64Url, base64ToUint8Array, base64UrlToBase64, uint8ArrayToBase64} from "../api/common/utils/Encoding"
import {assertMainOrNode, getHttpOrigin, isApp} from "../api/Env"
import {BadRequestError} from "../api/common/error/RestError"
import {createU2fRegisteredDevice} from "../api/entities/sys/U2fRegisteredDevice"
import {createU2fResponseData} from "../api/entities/sys/U2fResponseData"
import {client} from "./ClientDetector"
import u2f from "./u2f-api"
import {BrowserType} from "./ClientConstants"

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
 * We should probably use the Yubico Impl for our server part:
 * https://github.com/Yubico/java-u2flib-server/blob/master/u2flib-server-core/src/main/java/com/yubico/u2f/U2fPrimitives.java
 *
 * compile 'com.yubico:u2flib-server-core:0.16.0'
 */
export class U2fClient {
	appId: string;

	constructor() {
		if (window.location.hostname.endsWith("tutanota.com")) {
			this.appId = "https://tutanota.com/u2f-appid.json"
		} else {
			this.appId = getHttpOrigin() + "/u2f-appid.json"
		}
	}

	/**
	 * Returns true if U2F is supported in this client. Attention: this call may take up to 1.5 seconds.
	 * Triggers a dummy U2F registration request to check if the U2F interface is available.
	 */
	isSupported(): Promise<boolean> {
		if (client.browser === BrowserType.IE || client.browser === BrowserType.EDGE || isApp()) {
			// we do not use the actual check below in IE and Edge because they would ask how to open the chrome extension
			return Promise.resolve(false)
		} else {
			let random = new Uint8Array(32)
			let c = typeof crypto !== 'undefined' ? crypto : msCrypto
			c.getRandomValues(random)
			let challenge = base64ToBase64Url(uint8ArrayToBase64(random))
			let u2fResponsePromise = Promise.fromCallback(cb => {
				u2f.register(this.appId, [
					{
						version: "U2F_V2",
						challenge: challenge,
					}
				], [], (r) => this._handleError(r, cb), 1);
			}).then(rawRegisterResponse => {
				return true
			}).catch(U2fTimeoutError, e => {
				return true
			}).catch(e => {
				return false
			})

			let timeoutPromise = Promise.delay(1500).then(() => {
				return false
			})
			return Promise.any([u2fResponsePromise, timeoutPromise])
		}
	}

	register(): Promise<U2fRegisteredDevice> {
		let random = new Uint8Array(32)
		let c = typeof crypto !== 'undefined' ? crypto : msCrypto
		c.getRandomValues(random)
		let challenge = base64ToBase64Url(uint8ArrayToBase64(random))
		return Promise.fromCallback(cb => {
			u2f.register(this.appId, [
				{
					version: "U2F_V2",
					challenge: challenge,
				}
			], [], (r) => this._handleError(r, cb), TIMEOUT);
		}).then(rawRegisterResponse => this._decodeRegisterResponse(rawRegisterResponse))
		              .then(registerResponse => {
			              let u2fDevice = createU2fRegisteredDevice()
			              u2fDevice.keyHandle = registerResponse.keyHandle
			              u2fDevice.appId = this.appId
			              u2fDevice.publicKey = registerResponse.userPublicKey
			              u2fDevice.compromised = false
			              u2fDevice.counter = "-1"
			              return u2fDevice
		              })
	}

	_handleError(rawResponse: Object, cb: Callback<Object>) {
		if (!rawResponse.errorCode) {
			cb(null, rawResponse)
		} else if (rawResponse.errorCode === 4) {
			cb(new U2fWrongDeviceError())
		} else if (rawResponse.errorCode === 5) {
			cb(new U2fTimeoutError())
		} else {
			cb(new U2fError("U2f error code: " + rawResponse.errorCode))
		}
	}

	sign(sessionId: IdTuple, challenge: U2fChallenge): Promise<U2fResponseData> {
		let registeredKeys = challenge.keys.map(key => {
			return {
				version: "U2F_V2",
				keyHandle: base64ToBase64Url(uint8ArrayToBase64(key.keyHandle)),
				appId: this.appId
			}
		})
		let challengeData = base64ToBase64Url(uint8ArrayToBase64(challenge.challenge))
		return Promise.fromCallback(cb => {
			u2f.sign(this.appId, challengeData, registeredKeys, (r) => this._handleError(r, cb), TIMEOUT)
		}).then(rawAuthenticationResponse => {
			let u2fSignatureResponse = createU2fResponseData()
			u2fSignatureResponse.keyHandle = rawAuthenticationResponse.keyHandle
			u2fSignatureResponse.clientData = rawAuthenticationResponse.clientData
			u2fSignatureResponse.signatureData = rawAuthenticationResponse.signatureData
			return u2fSignatureResponse
		})
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