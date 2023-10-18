import { concat, Hex, hexToUint8Array, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { KYBER_POLYVECBYTES, KYBER_SYMBYTES } from "./Kyber.js"
import { CryptoError } from "../../misc/CryptoError.js"

export type KyberKeyPair = {
	publicKey: KyberPublicKey
	privateKey: KyberPrivateKey
}
export type KyberPrivateKey = {
	raw: Uint8Array
}
export type KyberPublicKey = {
	raw: Uint8Array
}

export type KyberEncapsulation = {
	ciphertext: Uint8Array
	sharedSecret: Uint8Array
}

export function kyberPrivateKeyToHex(key: KyberPrivateKey): Hex {
	const keyBytes = key.raw
	//liboqs: s, t, rho, hpk, nonce
	//encoded: s, hpk, nonce, t, rho
	const s = keyBytes.slice(0, KYBER_POLYVECBYTES)
	const t = keyBytes.slice(KYBER_POLYVECBYTES, 2 * KYBER_POLYVECBYTES)
	const rho = keyBytes.slice(2 * KYBER_POLYVECBYTES, 2 * KYBER_POLYVECBYTES + KYBER_SYMBYTES)
	const hpk = keyBytes.slice(2 * KYBER_POLYVECBYTES + KYBER_SYMBYTES, 2 * KYBER_POLYVECBYTES + 2 * KYBER_SYMBYTES)
	const nonce = keyBytes.slice(2 * KYBER_POLYVECBYTES + 2 * KYBER_SYMBYTES, 2 * KYBER_POLYVECBYTES + 3 * KYBER_SYMBYTES)
	return formatHexString([s, hpk, nonce, t, rho])
}

export function kyberPublicKeyToHex(key: KyberPublicKey): Hex {
	const keyComponents: Uint8Array[] = []
	const keyBytes = key.raw
	keyComponents.push(keyBytes.slice(0, KYBER_POLYVECBYTES))
	keyComponents.push(keyBytes.slice(KYBER_POLYVECBYTES, KYBER_POLYVECBYTES + KYBER_SYMBYTES))
	return formatHexString(keyComponents)
}

function formatHexString(keyComponent: Uint8Array[]): Hex {
	let result = ""
	for (const comp of keyComponent) {
		const hex = uint8ArrayToHex(comp)
		result += getHexLen(hex) + hex
	}
	return result
}

function getHexLen(data: Hex): Hex {
	let hexLen = data.length.toString(16)
	while (hexLen.length < 4) {
		hexLen = "0" + hexLen
	}
	return hexLen
}

export function hexToKyberPublicKey(hex: Hex): KyberPublicKey {
	const keyComponents = _hexToKyberKeyArray(hex)
	if (keyComponents.length != 2) {
		throw new Error("invalid public key hex encoding")
	}
	// key is expected by oqs in the same order t, rho
	return { raw: concat(...keyComponents) }
}

export function hexToKyberPrivateKey(hex: Hex): KyberPrivateKey {
	const keyComponents = _hexToKyberKeyArray(hex)
	if (keyComponents.length != 5) {
		throw new Error("invalid private key hex encoding")
	}

	// key is expected by oqs in this order (vs how we encode it on the server): s, t, rho, hpk, nonce
	return { raw: concat(keyComponents[0], keyComponents[3], keyComponents[4], keyComponents[1], keyComponents[2]) }
}

function _hexToKyberKeyArray(hex: Hex): Uint8Array[] {
	try {
		var key: Uint8Array[] = []
		var pos = 0

		while (pos < hex.length) {
			var nextParamLen = parseInt(hex.substring(pos, pos + 4), 16)
			pos += 4
			key.push(hexToUint8Array(hex.substring(pos, pos + nextParamLen)))
			pos += nextParamLen
		}

		return key
	} catch (e) {
		throw new CryptoError("hex to kyber key failed", e as Error)
	}
}
