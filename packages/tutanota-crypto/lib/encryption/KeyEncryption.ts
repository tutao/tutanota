import type { Aes128Key, Aes256Key } from "./Aes.js"
import { aesDecrypt, aesEncrypt, getKeyLengthBytes, KEY_LENGTH_BYTES_AES_128, KEY_LENGTH_BYTES_AES_256 } from "./Aes.js"
import { bitArrayToUint8Array, fixedIv, uint8ArrayToBitArray } from "../misc/Utils.js"
import { assertNotNull, concat, hexToUint8Array, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { hexToRsaPrivateKey, hexToRsaPublicKey, rsaPrivateKeyToHex } from "./Rsa.js"
import type { RsaPrivateKey } from "./RsaKeyPair.js"
import { bytesToKyberPrivateKey, bytesToKyberPublicKey } from "./Liboqs/KyberKeyPair.js"
import { EccPrivateKey } from "./Ecc.js"
import { KeyPairType, AsymmetricKeyPair } from "./AsymmetricKeyPair.js"

export type EncryptedKeyPairs = {
	pubEccKey: null | Uint8Array
	pubKyberKey: null | Uint8Array
	pubRsaKey: null | Uint8Array
	symEncPrivEccKey: null | Uint8Array
	symEncPrivKyberKey: null | Uint8Array
	symEncPrivRsaKey: null | Uint8Array
}

export function encryptKey(encryptionKey: Aes128Key | Aes256Key, keyToBeEncrypted: Aes128Key | Aes256Key): Uint8Array {
	const keyLength = getKeyLengthBytes(encryptionKey)
	if (keyLength === KEY_LENGTH_BYTES_AES_128) {
		return aesEncrypt(encryptionKey, bitArrayToUint8Array(keyToBeEncrypted), fixedIv, false, false).slice(fixedIv.length)
	} else if (keyLength === KEY_LENGTH_BYTES_AES_256) {
		return aesEncrypt(encryptionKey, bitArrayToUint8Array(keyToBeEncrypted), undefined, false)
	} else {
		throw new Error(`invalid AES key length (must be 128-bit or 256-bit, got ${keyLength} bytes instead)`)
	}
}

export function decryptKey(encryptionKey: Aes128Key | Aes256Key, keyToBeDecrypted: Uint8Array): Aes128Key | Aes256Key {
	const keyLength = getKeyLengthBytes(encryptionKey)
	if (keyLength === KEY_LENGTH_BYTES_AES_128) {
		return uint8ArrayToBitArray(aesDecrypt(encryptionKey, concat(fixedIv, keyToBeDecrypted), false))
	} else if (keyLength === KEY_LENGTH_BYTES_AES_256) {
		return uint8ArrayToBitArray(aesDecrypt(encryptionKey, keyToBeDecrypted, false))
	} else {
		throw new Error(`invalid AES key length (must be 128-bit or 256-bit, got ${keyLength} bytes instead)`)
	}
}

export function aes256DecryptLegacyRecoveryKey(encryptionKey: Aes256Key, keyToBeDecrypted: Uint8Array): Aes256Key {
	// legacy case: recovery code without IV/mac
	if (keyToBeDecrypted.length === KEY_LENGTH_BYTES_AES_128) {
		return uint8ArrayToBitArray(aesDecrypt(encryptionKey, concat(fixedIv, keyToBeDecrypted), false))
	} else {
		return decryptKey(encryptionKey, keyToBeDecrypted)
	}
}

export function encryptRsaKey(encryptionKey: Aes128Key | Aes256Key, privateKey: RsaPrivateKey, iv?: Uint8Array): Uint8Array {
	// BitArrays are arrays of numbers. Each number encodes 4 bytes. See https://bitwiseshiftleft.github.io/sjcl/doc/sjcl.bitArray.html.
	if (encryptionKey.length === KEY_LENGTH_BYTES_AES_128 / 4) {
		// legacy case: private key without mac
		return aesEncrypt(encryptionKey, hexToUint8Array(rsaPrivateKeyToHex(privateKey)), iv, true, false)
	} else {
		return aesEncrypt(encryptionKey, hexToUint8Array(rsaPrivateKeyToHex(privateKey)), iv, true, true)
	}
}

export function encryptEccKey(encryptionKey: Aes128Key | Aes256Key, privateKey: EccPrivateKey): Uint8Array {
	return aesEncrypt(encryptionKey, privateKey, undefined, true, true) // passing IV as undefined here is fine, as it will generate a new one for each encryption
}

export function decryptKeyPair(encryptionKey: Aes128Key | Aes256Key, keyPair: EncryptedKeyPairs): AsymmetricKeyPair {
	if (keyPair.symEncPrivRsaKey) {
		const publicKey = hexToRsaPublicKey(uint8ArrayToHex(assertNotNull(keyPair.pubRsaKey)))
		const privateKey = hexToRsaPrivateKey(uint8ArrayToHex(aesDecrypt(encryptionKey, keyPair.symEncPrivRsaKey, true)))
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
	} else {
		const eccPublicKey = assertNotNull(keyPair.pubEccKey)
		const eccPrivateKey = aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivEccKey))
		const kyberPublicKey = bytesToKyberPublicKey(assertNotNull(keyPair.pubKyberKey))
		const kyberPrivateKey = bytesToKyberPrivateKey(aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivKyberKey)))

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
}

export function decryptRsaKey(encryptionKey: Aes128Key | Aes256Key, encryptedPrivateKey: Uint8Array): RsaPrivateKey {
	return hexToRsaPrivateKey(uint8ArrayToHex(aesDecrypt(encryptionKey, encryptedPrivateKey, true)))
}
