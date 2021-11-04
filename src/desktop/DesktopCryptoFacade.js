// @flow
import {base64ToKey} from "../api/worker/crypto/CryptoUtils"
import {
	base64ToBase64Url,
	base64ToUint8Array,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString
} from "@tutao/tutanota-utils"
import type {CryptoFunctions} from "./CryptoFns"
import {cryptoFns} from "./CryptoFns"
import {IV_BYTE_LENGTH} from "../api/worker/crypto/Aes"
import type {TypeModel} from "../api/common/EntityTypes"


export class DesktopCryptoFacade {
	+fs: $Exports<"fs">
	+cryptoFns: CryptoFunctions

	constructor(fs: $Exports<"fs">, cryptoFns: CryptoFunctions) {
		this.fs = fs
		this.cryptoFns = cryptoFns
	}

	aesEncryptObject(encryptionKey: Aes256Key, object: number | string | boolean | $ReadOnlyArray<*> | {}): string {
		const serializedObject = JSON.stringify(object)
		const encryptedBytes = this.cryptoFns.aes256Encrypt(
			encryptionKey,
			stringToUtf8Uint8Array(serializedObject),
			this.cryptoFns.randomBytes(IV_BYTE_LENGTH),
			true,
			true
		)
		return uint8ArrayToBase64(encryptedBytes)
	}

	aesDecryptObject(encryptionKey: Aes256Key, serializedObject: string): {} {
		const encryptedBytes = base64ToUint8Array(serializedObject)
		const decryptedBytes = this.cryptoFns.aes256Decrypt(encryptionKey, encryptedBytes, true, true)
		const stringObject = utf8Uint8ArrayToString(decryptedBytes)
		return JSON.parse(stringObject)
	}

	/**
	 * decrypts a file in-place
	 * @param encodedKey
	 * @param itemPath
	 * @returns {Promise<Uint8Array>}
	 */
	aesDecryptFile(encodedKey: string, itemPath: string): Promise<string> {
		return this.fs.promises.readFile(itemPath).then(encData => {
			const key = this.cryptoFns.base64ToKey(encodedKey)
			return this.cryptoFns.aes128Decrypt(key, encData, true)
		}).then(decData => {
			return this.fs.promises.writeFile(itemPath, decData, {encoding: 'binary'})
		}).then(() => itemPath)
	}

	aes256DecryptKeyToB64(encryptionKey: Aes256Key, keyToDecryptB64: string): string {
		return uint8ArrayToBase64(this.cryptoFns.aes256Decrypt(
			encryptionKey,
			base64ToUint8Array(keyToDecryptB64),
			false,
			false
		))
	}

	aes256EncryptKeyToB64(encryptionKey: Aes256Key, keyToEncryptB64: string): string {
		return uint8ArrayToBase64(this.cryptoFns.aes256Encrypt(
			encryptionKey,
			base64ToUint8Array(keyToEncryptB64),
			this.cryptoFns.randomBytes(16),
			false,
			false
		))
	}

	decryptAndMapToInstance<T>(model: TypeModel, instance: Object, piSessionKey: string, piSessionKeyEncSessionKey: string): Promise<T> {
		const sk = this._decrypt256KeyToArray(piSessionKey, piSessionKeyEncSessionKey)
		return this.cryptoFns.decryptAndMapToInstance(model, instance, sk)
	}

	generateId(byteLength: number): string {
		return base64ToBase64Url(uint8ArrayToBase64(this.cryptoFns.randomBytes(byteLength)))
	}

	publicKeyFromPem(pem: string): {verify: (string, string) => boolean} {
		return this.cryptoFns.publicKeyFromPem(pem)
	}

	_decrypt256KeyToArray(encryptionKey: string, keyB64: string): Aes256Key {
		const encryptionKeyArray = base64ToKey(encryptionKey)
		const keyArray = base64ToUint8Array(keyB64)
		return this.cryptoFns.decrypt256Key(encryptionKeyArray, keyArray)
	}

	generateDeviceKey(): Aes256Key {
		return this.cryptoFns.aes256RandomKey()
	}

	randomBytes(count: number): Uint8Array {
		return cryptoFns.randomBytes(count)
	}
}