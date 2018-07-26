// @flow
import {uint8ArrayToBase64, base64ToUint8Array} from "../api/common/utils/Encoding"
import {CryptoError} from "../api/common/error/CryptoError"
import {nativeApp} from "./NativeWrapper"
import {Request} from "../api/common/WorkerProtocol"


export const rsaApp = {
	generateRsaKey,
	rsaEncrypt,
	rsaDecrypt,
}

function generateRsaKey(seed: Uint8Array) {
	return nativeApp.invokeNative(new Request("generateRsaKey", [uint8ArrayToBase64(seed)]))
	                .catch(e => {
		                throw new CryptoError(e)
	                })
}

/**
 * Encrypt bytes with the provided publicKey
 */
function rsaEncrypt(publicKey: PublicKey, bytes: Uint8Array, seed: Uint8Array): Promise<Uint8Array> {
	let encodedBytes = uint8ArrayToBase64(bytes);
	return nativeApp.invokeNative(new Request("rsaEncrypt", [publicKey, encodedBytes, uint8ArrayToBase64(seed)]))
	                .then(base64 => base64ToUint8Array(base64))
	                .catch(e => {
		                throw new CryptoError(e)
	                })
}

/**
 * Decrypt bytes with the provided privateKey
 */
function rsaDecrypt(privateKey: PrivateKey, bytes: Uint8Array): Promise<Uint8Array> {
	let encodedBytes = uint8ArrayToBase64(bytes);
	return nativeApp.invokeNative(new Request("rsaDecrypt", [privateKey, encodedBytes]))
	                .then(base64 => base64ToUint8Array(base64))
	                .catch(e => {
		                throw new CryptoError(e)
	                })
}