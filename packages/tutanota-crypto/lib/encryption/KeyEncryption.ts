import type { Aes128Key, Aes256Key } from "./Aes.js"
import { aesDecrypt, aesEncrypt, getKeyLengthBytes, KEY_LENGTH_BYTES_AES_128, KEY_LENGTH_BYTES_AES_256 } from "./Aes.js"
import { bitArrayToUint8Array, fixedIv, uint8ArrayToBitArray } from "../misc/Utils.js"
import { concat, hexToUint8Array, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { hexToPrivateKey, privateKeyToHex } from "./Rsa.js"
import type { RsaPrivateKey } from "./RsaKeyPair.js"

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
	return aesEncrypt(encryptionKey, hexToUint8Array(privateKeyToHex(privateKey)), iv, true, false)
}

export function decryptRsaKey(encryptionKey: Aes128Key | Aes256Key, encryptedPrivateKey: Uint8Array): RsaPrivateKey {
	return hexToPrivateKey(uint8ArrayToHex(aesDecrypt(encryptionKey, encryptedPrivateKey, true)))
}
