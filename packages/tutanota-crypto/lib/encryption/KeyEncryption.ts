import type { Aes256Key, AesKey } from "./Aes.js"
import { aesDecrypt, aesEncrypt, getKeyLengthBytes, KEY_LENGTH_BYTES_AES_128, KEY_LENGTH_BYTES_AES_256, unauthenticatedAesDecrypt } from "./Aes.js"
import { bitArrayToUint8Array, fixedIv, uint8ArrayToBitArray } from "../misc/Utils.js"
import { assertNotNull, concat, hexToUint8Array, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { hexToRsaPrivateKey, hexToRsaPublicKey, rsaPrivateKeyToHex } from "./Rsa.js"
import type { RsaEccKeyPair, RsaKeyPair, RsaPrivateKey } from "./RsaKeyPair.js"
import { bytesToKyberPrivateKey, bytesToKyberPublicKey, KyberPrivateKey, kyberPrivateKeyToBytes } from "./Liboqs/KyberKeyPair.js"
import { EccPrivateKey } from "./Ecc.js"
import { AsymmetricKeyPair, KeyPairType } from "./AsymmetricKeyPair.js"
import type { PQKeyPairs } from "./PQKeyPairs.js"

export type EncryptedKeyPairs = EncryptedPqKeyPairs | EncryptedRsaKeyPairs | EncryptedRsaEccKeyPairs

export type EncryptedPqKeyPairs = {
	pubEccKey: Uint8Array
	pubKyberKey: Uint8Array
	pubRsaKey: null
	symEncPrivEccKey: Uint8Array
	symEncPrivKyberKey: Uint8Array
	symEncPrivRsaKey: null
}

export type EncryptedRsaKeyPairs = {
	pubEccKey: null
	pubKyberKey: null
	pubRsaKey: Uint8Array
	symEncPrivEccKey: null
	symEncPrivKyberKey: null
	symEncPrivRsaKey: Uint8Array
}

export type EncryptedRsaEccKeyPairs = {
	pubEccKey: Uint8Array
	pubKyberKey: null
	pubRsaKey: Uint8Array
	symEncPrivEccKey: Uint8Array
	symEncPrivKyberKey: null
	symEncPrivRsaKey: Uint8Array
}

export function encryptKey(encryptionKey: AesKey, keyToBeEncrypted: AesKey): Uint8Array {
	const keyLength = getKeyLengthBytes(encryptionKey)
	if (keyLength === KEY_LENGTH_BYTES_AES_128) {
		return aesEncrypt(encryptionKey, bitArrayToUint8Array(keyToBeEncrypted), fixedIv, false, false).slice(fixedIv.length)
	} else if (keyLength === KEY_LENGTH_BYTES_AES_256) {
		return aesEncrypt(encryptionKey, bitArrayToUint8Array(keyToBeEncrypted), undefined, false, true)
	} else {
		throw new Error(`invalid AES key length (must be 128-bit or 256-bit, got ${keyLength} bytes instead)`)
	}
}

export function decryptKey(encryptionKey: AesKey, keyToBeDecrypted: Uint8Array): AesKey {
	const keyLength = getKeyLengthBytes(encryptionKey)
	if (keyLength === KEY_LENGTH_BYTES_AES_128) {
		return uint8ArrayToBitArray(aesDecrypt(encryptionKey, concat(fixedIv, keyToBeDecrypted), false))
	} else if (keyLength === KEY_LENGTH_BYTES_AES_256) {
		return uint8ArrayToBitArray(aesDecrypt(encryptionKey, keyToBeDecrypted, false))
	} else {
		throw new Error(`invalid AES key length (must be 128-bit or 256-bit, got ${keyLength} bytes instead)`)
	}
}

export function aes256DecryptWithRecoveryKey(encryptionKey: Aes256Key, keyToBeDecrypted: Uint8Array): Aes256Key {
	// legacy case: recovery code without IV/mac
	if (keyToBeDecrypted.length === KEY_LENGTH_BYTES_AES_128) {
		return uint8ArrayToBitArray(unauthenticatedAesDecrypt(encryptionKey, concat(fixedIv, keyToBeDecrypted), false))
	} else {
		return decryptKey(encryptionKey, keyToBeDecrypted)
	}
}

export function encryptRsaKey(encryptionKey: AesKey, privateKey: RsaPrivateKey, iv?: Uint8Array): Uint8Array {
	return aesEncrypt(encryptionKey, hexToUint8Array(rsaPrivateKeyToHex(privateKey)), iv, true, true)
}

export function encryptEccKey(encryptionKey: AesKey, privateKey: EccPrivateKey): Uint8Array {
	return aesEncrypt(encryptionKey, privateKey, undefined, true, true) // passing IV as undefined here is fine, as it will generate a new one for each encryption
}

export function encryptKyberKey(encryptionKey: AesKey, privateKey: KyberPrivateKey): Uint8Array {
	return aesEncrypt(encryptionKey, kyberPrivateKeyToBytes(privateKey)) // passing IV as undefined here is fine, as it will generate a new one for each encryption
}

export function decryptRsaKey(encryptionKey: AesKey, encryptedPrivateKey: Uint8Array): RsaPrivateKey {
	return hexToRsaPrivateKey(uint8ArrayToHex(aesDecrypt(encryptionKey, encryptedPrivateKey, true)))
}

export function decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedPqKeyPairs): PQKeyPairs
export function decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedRsaKeyPairs): RsaKeyPair
export function decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedRsaEccKeyPairs): RsaEccKeyPair
export function decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedKeyPairs): AsymmetricKeyPair
export function decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedKeyPairs): AsymmetricKeyPair {
	if (keyPair.symEncPrivRsaKey) {
		return decryptRsaOrRsaEccKeyPair(encryptionKey, keyPair)
	} else {
		return decryptPQKeyPair(encryptionKey, keyPair)
	}
}

function decryptRsaOrRsaEccKeyPair(encryptionKey: AesKey, keyPair: EncryptedKeyPairs): RsaKeyPair | RsaEccKeyPair {
	const publicKey = hexToRsaPublicKey(uint8ArrayToHex(assertNotNull(keyPair.pubRsaKey)))
	const privateKey = hexToRsaPrivateKey(uint8ArrayToHex(aesDecrypt(encryptionKey, keyPair.symEncPrivRsaKey!, true)))
	if (keyPair.symEncPrivEccKey) {
		const publicEccKey = assertNotNull(keyPair.pubEccKey)
		const privateEccKey = aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivEccKey))
		return {
			keyPairType: KeyPairType.RSA_AND_ECC,
			publicKey,
			privateKey,
			publicEccKey,
			privateEccKey,
		}
	} else {
		return { keyPairType: KeyPairType.RSA, publicKey, privateKey }
	}
}

function decryptPQKeyPair(encryptionKey: Aes256Key, keyPair: EncryptedKeyPairs): PQKeyPairs {
	const eccPublicKey = assertNotNull(keyPair.pubEccKey, "expected pub ecc key for PQ keypair")
	const eccPrivateKey = aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivEccKey, "expected priv ecc key for PQ keypair"))
	const kyberPublicKey = bytesToKyberPublicKey(assertNotNull(keyPair.pubKyberKey, "expected pub kyber key for PQ keypair"))
	const kyberPrivateKey = bytesToKyberPrivateKey(
		aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivKyberKey, "expected enc priv kyber key for PQ keypair")),
	)

	return {
		keyPairType: KeyPairType.TUTA_CRYPT,
		eccKeyPair: {
			publicKey: eccPublicKey,
			privateKey: eccPrivateKey,
		},
		kyberKeyPair: {
			publicKey: kyberPublicKey,
			privateKey: kyberPrivateKey,
		},
	}
}
