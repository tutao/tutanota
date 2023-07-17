import type { Aes128Key, Aes256Key } from "./Aes.js"
import {
	aes128Decrypt,
	aes128Encrypt,
	aes256Decrypt,
	aes256Encrypt,
	getKeyLengthBytes,
	IV_BYTE_LENGTH,
	KEY_LENGTH_BYTES_AES_128,
	KEY_LENGTH_BYTES_AES_256,
} from "./Aes.js"
import { bitArrayToUint8Array, fixedIv, uint8ArrayToBitArray } from "../misc/Utils.js"
import { concat, hexToUint8Array, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { hexToPrivateKey, privateKeyToHex } from "./Rsa.js"
import { random } from "../random/Randomizer.js"
import type { PrivateKey } from "./RsaKeyPair.js"

export function encryptKey(encryptionKey: Aes128Key | Aes256Key, keyToBeEncrypted: Aes128Key | Aes256Key): Uint8Array {
	const keyLength = getKeyLengthBytes(encryptionKey)
	if (keyLength === KEY_LENGTH_BYTES_AES_128) {
		return aes128Encrypt(encryptionKey, bitArrayToUint8Array(keyToBeEncrypted), fixedIv, false, false).slice(fixedIv.length)
	} else if (keyLength === KEY_LENGTH_BYTES_AES_256) {
		return aes256Encrypt(encryptionKey, bitArrayToUint8Array(keyToBeEncrypted), fixedIv, false, false).slice(fixedIv.length)
	} else {
		throw new Error(`invalid AES key length (must be 128-bit or 256-bit, got ${keyLength} bytes instead)`)
	}
}

export function decryptKey(encryptionKey: Aes128Key | Aes256Key, keyToBeDecrypted: Uint8Array): Aes128Key | Aes256Key {
	const keyLength = getKeyLengthBytes(encryptionKey)
	if (keyLength === KEY_LENGTH_BYTES_AES_128) {
		return uint8ArrayToBitArray(aes128Decrypt(encryptionKey, concat(fixedIv, keyToBeDecrypted), false))
	} else if (keyLength === KEY_LENGTH_BYTES_AES_256) {
		return uint8ArrayToBitArray(aes256Decrypt(encryptionKey, concat(fixedIv, keyToBeDecrypted), false))
	} else {
		throw new Error(`invalid AES key length (must be 128-bit or 256-bit, got ${keyLength} bytes instead)`)
	}
}

export function encrypt256Key(encryptionKey: Aes128Key, keyToBeEncrypted: Aes256Key): Uint8Array {
	return aes128Encrypt(encryptionKey, bitArrayToUint8Array(keyToBeEncrypted), fixedIv, false, false).slice(fixedIv.length)
}

export function decrypt256Key(encryptionKey: Aes128Key, keyToBeDecrypted: Uint8Array): Aes256Key {
	return uint8ArrayToBitArray(aes128Decrypt(encryptionKey, concat(fixedIv, keyToBeDecrypted), false))
}

export function aes256EncryptKey(encryptionKey: Aes256Key, keyToBeEncrypted: Aes128Key): Uint8Array {
	return aes256Encrypt(encryptionKey, bitArrayToUint8Array(keyToBeEncrypted), fixedIv, false, false).slice(fixedIv.length)
}

export function aes256DecryptKey(encryptionKey: Aes256Key, keyToBeDecrypted: Uint8Array): Aes128Key {
	return uint8ArrayToBitArray(aes256Decrypt(encryptionKey, concat(fixedIv, keyToBeDecrypted), false))
}

export function aes256Encrypt256Key(encryptionKey: Aes256Key, keyToBeEncrypted: Aes256Key): Uint8Array {
	return aes256Encrypt(encryptionKey, bitArrayToUint8Array(keyToBeEncrypted), fixedIv, false, false).slice(fixedIv.length)
}

export function aes256Decrypt256Key(encryptionKey: Aes256Key, keyToBeDecrypted: Uint8Array): Aes256Key {
	return uint8ArrayToBitArray(aes256Decrypt(encryptionKey, concat(fixedIv, keyToBeDecrypted), false))
}

export function encryptRsaKey(encryptionKey: Aes128Key, privateKey: PrivateKey, iv?: Uint8Array): Uint8Array {
	return aes128Encrypt(encryptionKey, hexToUint8Array(privateKeyToHex(privateKey)), iv ? iv : random.generateRandomData(IV_BYTE_LENGTH), true, false)
}

export function decryptRsaKey(encryptionKey: Aes128Key, encryptedPrivateKey: Uint8Array): PrivateKey {
	return hexToPrivateKey(uint8ArrayToHex(aes128Decrypt(encryptionKey, encryptedPrivateKey, true)))
}
