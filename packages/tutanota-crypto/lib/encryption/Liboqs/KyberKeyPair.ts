import { concat } from "@tutao/tutanota-utils"
import { KYBER_POLYVECBYTES, KYBER_SYMBYTES } from "./Kyber.js"
import { byteArraysToBytes, bytesToByteArrays } from "@tutao/tutanota-utils/dist/Encoding.js"

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

export function kyberPrivateKeyToBytes(key: KyberPrivateKey): Uint8Array {
	const keyBytes = key.raw
	//liboqs: s, t, rho, hpk, nonce
	//tuta encoded: s, hpk, nonce, t, rho
	const s = keyBytes.slice(0, KYBER_POLYVECBYTES)
	const t = keyBytes.slice(KYBER_POLYVECBYTES, 2 * KYBER_POLYVECBYTES)
	const rho = keyBytes.slice(2 * KYBER_POLYVECBYTES, 2 * KYBER_POLYVECBYTES + KYBER_SYMBYTES)
	const hpk = keyBytes.slice(2 * KYBER_POLYVECBYTES + KYBER_SYMBYTES, 2 * KYBER_POLYVECBYTES + 2 * KYBER_SYMBYTES)
	const nonce = keyBytes.slice(2 * KYBER_POLYVECBYTES + 2 * KYBER_SYMBYTES, 2 * KYBER_POLYVECBYTES + 3 * KYBER_SYMBYTES)
	return byteArraysToBytes([s, hpk, nonce, t, rho])
}

export function kyberPublicKeyToBytes(key: KyberPublicKey): Uint8Array {
	const keyBytes = key.raw
	const t = keyBytes.slice(0, KYBER_POLYVECBYTES)
	const rho = keyBytes.slice(KYBER_POLYVECBYTES, KYBER_POLYVECBYTES + KYBER_SYMBYTES)
	return byteArraysToBytes([t, rho])
}

export function bytesToKyberPublicKey(encodedPublicKey: Uint8Array): KyberPublicKey {
	const keyComponents = bytesToByteArrays(encodedPublicKey, 2)
	// key is expected by oqs in the same order t, rho
	return { raw: concat(...keyComponents) }
}

export function bytesToKyberPrivateKey(encodedPrivateKey: Uint8Array): KyberPrivateKey {
	const keyComponents = bytesToByteArrays(encodedPrivateKey, 5)
	const s = keyComponents[0]
	const hpk = keyComponents[1]
	const nonce = keyComponents[2]
	const t = keyComponents[3]
	const rho = keyComponents[4]
	// key is expected by oqs in this order (vs how we encode it on the server): s, t, rho, hpk, nonce
	return { raw: concat(s, t, rho, hpk, nonce) }
}
