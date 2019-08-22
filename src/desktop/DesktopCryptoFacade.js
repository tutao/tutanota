// @flow
import fs from "fs-extra"
import {uint8ArrayToBitArray} from "../api/worker/crypto/CryptoUtils"
import {base64ToBase64Url, base64ToUint8Array, uint8ArrayToBase64} from "../api/common/utils/Encoding"
import {aes128Decrypt, aes256Decrypt, aes256Encrypt} from "../api/worker/crypto/Aes"
import crypto from "crypto"
import {decrypt256Key} from "../api/worker/crypto/KeyCryptoUtils"
import {decryptAndMapToInstance} from "../api/worker/crypto/InstanceMapper"

export class DesktopCryptoFacade {
	/**
	 * decrypts a file in-place
	 * @param encodedKey
	 * @param itemPath
	 * @returns {Promise<Uint8Array>}
	 */
	aesDecryptFile(encodedKey: string, itemPath: string): Promise<string> {
		return fs.readFile(itemPath).then(encData => {
			const key = uint8ArrayToBitArray(base64ToUint8Array(encodedKey))
			return aes128Decrypt(key, encData)
		}).then(decData => {
			return fs.writeFile(itemPath, decData, {encoding: 'binary'})
		}).then(() => itemPath)
	}

	aes256DecryptKeyToB64(encryptionKey: Aes256Key, keyToDecryptB64: string): string {
		return uint8ArrayToBase64(aes256Decrypt(
			encryptionKey,
			Buffer.from(keyToDecryptB64, 'base64'),
			false,
			false
		))
	}

	aes256EncryptKeyToB64(encryptionKey: Aes256Key, keyToEncryptB64: string): string {
		return uint8ArrayToBase64(aes256Encrypt(
			encryptionKey,
			Buffer.from(keyToEncryptB64, 'base64'),
			crypto.randomBytes(16),
			false,
			false
		))
	}

	decryptAndMapToInstance<T>(model: TypeModel, instance: Object, piSk: string, piSkEncSk: string): Promise<T> {
		const sk = this._decrypt256KeyToArray(piSk, piSkEncSk)
		return decryptAndMapToInstance(model, instance, sk)
	}

	generateId(byteLength: number): string {
		return base64ToBase64Url(crypto.randomBytes(byteLength).toString('base64'))
	}

	_decrypt256KeyToArray(encryptionKey: string, keyB64: string): Aes256Key {
		const encryptionKeyBuffer = Buffer.from(encryptionKey, 'base64')
		const keyBuffer = Buffer.from(keyB64, 'base64')
		const encryptionKeyArray = uint8ArrayToBitArray(Uint8Array.from(encryptionKeyBuffer))
		const keyArray = Uint8Array.from(keyBuffer)
		return decrypt256Key(encryptionKeyArray, keyArray)
	}

	static generateDeviceKey(): string {
		return crypto.randomBytes(32).toString('base64')
	}

	static randomHexString(byteLength: number): string {
		return crypto.randomBytes(byteLength).toString('hex')
	}
}