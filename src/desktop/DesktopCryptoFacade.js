// @flow
import {base64ToKey} from "../api/worker/crypto/CryptoUtils"
import {base64ToBase64Url, base64ToUint8Array, uint8ArrayToBase64, uint8ArrayToHex} from "../api/common/utils/Encoding"
import type {CryptoFunctions} from "./CryptoFns"


export class DesktopCryptoFacade {
	+fs: $Exports<"fs">
	+cryptoFns: CryptoFunctions

	constructor(fs: $Exports<"fs">, cryptoFns: CryptoFunctions) {
		this.fs = fs
		this.cryptoFns = cryptoFns
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

	generateDeviceKey(): string {
		return uint8ArrayToBase64(this.cryptoFns.randomBytes(32))
	}
}