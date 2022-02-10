import type {Aes128Key, Aes256Key} from "./Aes.js"
import {aes128Decrypt, aes128Encrypt, aes256Decrypt, aes256Encrypt, IV_BYTE_LENGTH} from "./Aes.js"
import {bitArrayToUint8Array, fixedIv, uint8ArrayToBitArray} from "../misc/Utils.js"
import {concat, hexToUint8Array, uint8ArrayToHex} from "@tutao/tutanota-utils"
import {hexToPrivateKey, privateKeyToHex} from "./Rsa.js"
import {random} from "../random/Randomizer.js"
import type {PrivateKey} from "./RsaKeyPair.js"

export function encryptKey(encryptionKey: Aes128Key, key: Aes128Key): Uint8Array {
	return aes128Encrypt(encryptionKey, bitArrayToUint8Array(key), fixedIv, false, false).slice(fixedIv.length)
}

export function decryptKey(encryptionKey: Aes128Key, key: Uint8Array): Aes128Key | Aes256Key {
	return uint8ArrayToBitArray(aes128Decrypt(encryptionKey, concat(fixedIv, key), false))
}

export function encrypt256Key(encryptionKey: Aes128Key, key: Aes256Key): Uint8Array {
	return aes128Encrypt(encryptionKey, bitArrayToUint8Array(key), fixedIv, false, false).slice(fixedIv.length)
}

export function decrypt256Key(encryptionKey: Aes128Key, key: Uint8Array): Aes256Key {
	return uint8ArrayToBitArray(aes128Decrypt(encryptionKey, concat(fixedIv, key), false))
}

export function aes256EncryptKey(encryptionKey: Aes256Key, key: Aes128Key): Uint8Array {
	return aes256Encrypt(encryptionKey, bitArrayToUint8Array(key), fixedIv, false, false).slice(fixedIv.length)
}

export function aes256DecryptKey(encryptionKey: Aes256Key, key: Uint8Array): Aes128Key {
	return uint8ArrayToBitArray(aes256Decrypt(encryptionKey, concat(fixedIv, key), false, false))
}

export function aes256Encrypt256Key(encryptionKey: Aes256Key, keyToEncrypt: Aes256Key): Uint8Array {
	return aes256Encrypt(encryptionKey, bitArrayToUint8Array(keyToEncrypt), fixedIv, false, false).slice(fixedIv.length)
}

export function aes256Decrypt256Key(encryptionKey: Aes256Key, keyToDecrypt: Uint8Array): Aes256Key {
	return uint8ArrayToBitArray(aes256Decrypt(encryptionKey, concat(fixedIv, keyToDecrypt), false, false))
}

export function encryptRsaKey(
		encryptionKey: Aes128Key,
		privateKey: PrivateKey,
		iv?: Uint8Array,
): Uint8Array {
	return aes128Encrypt(
			encryptionKey,
			hexToUint8Array(privateKeyToHex(privateKey)),
			iv ? iv : random.generateRandomData(IV_BYTE_LENGTH),
			true,
			false,
	)
}

export function decryptRsaKey(encryptionKey: Aes128Key, encryptedPrivateKey: Uint8Array): PrivateKey {
	return hexToPrivateKey(uint8ArrayToHex(aes128Decrypt(encryptionKey, encryptedPrivateKey, true)))
}