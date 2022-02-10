import {base64ToBase64Url, base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString} from "@tutao/tutanota-utils"
import type {CryptoFunctions} from "./CryptoFns"
import type {TypeModel} from "../api/common/EntityTypes"
import type * as FsModule from "fs"
import {Aes256Key} from "@tutao/tutanota-crypto/dist/encryption/Aes"
import {aes256Decrypt256Key, aes256Encrypt256Key, base64ToKey, IV_BYTE_LENGTH} from "@tutao/tutanota-crypto"

type FsExports = typeof FsModule

export class DesktopCryptoFacade {
	readonly fs: typeof FsModule
	readonly cryptoFns: CryptoFunctions

	constructor(fs: FsExports, cryptoFns: CryptoFunctions) {
		this.fs = fs
		this.cryptoFns = cryptoFns
	}

	aes256Encrypt256Key(encryptionKey: Aes256Key, keyToEncrypt: Aes256Key): Uint8Array {
		return aes256Encrypt256Key(encryptionKey, keyToEncrypt)
	}

	aes256Decrypt256Key(encryptionKey: Aes256Key, keyToDecrypt: Uint8Array): Aes256Key {
		return aes256Decrypt256Key(encryptionKey, keyToDecrypt)
	}


	aesEncryptObject(encryptionKey: Aes256Key, object: number | string | boolean | ReadonlyArray<any> | {}): string {
		const serializedObject = JSON.stringify(object)
		const encryptedBytes = this.cryptoFns.aes256Encrypt(
			encryptionKey,
			stringToUtf8Uint8Array(serializedObject),
			this.cryptoFns.randomBytes(IV_BYTE_LENGTH),
			true,
			true,
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
		return this.fs.promises
				   .readFile(itemPath)
				   .then(encData => {
					   const key = this.cryptoFns.base64ToKey(encodedKey)
					   return this.cryptoFns.aes128Decrypt(key, encData, true)
				   })
				   .then(decData => {
					   return this.fs.promises.writeFile(itemPath, decData, {
						   encoding: "binary",
					   })
				   })
				   .then(() => itemPath)
	}

	aes256DecryptKeyToB64(encryptionKey: Aes256Key, keyToDecryptB64: string): string {
		return uint8ArrayToBase64(this.cryptoFns.aes256Decrypt(encryptionKey, base64ToUint8Array(keyToDecryptB64), false, false))
	}

	aes256EncryptKeyToB64(encryptionKey: Aes256Key, keyToEncryptB64: string): string {
		return uint8ArrayToBase64(
			this.cryptoFns.aes256Encrypt(encryptionKey, base64ToUint8Array(keyToEncryptB64), this.cryptoFns.randomBytes(16), false, false),
		)
	}

	decryptAndMapToInstance<T>(model: TypeModel, instance: Record<string, any>, piSessionKey: string, piSessionKeyEncSessionKey: string): Promise<T> {
		const sk = this._decrypt256KeyToArray(piSessionKey, piSessionKeyEncSessionKey)

		return this.cryptoFns.decryptAndMapToInstance(model, instance, sk)
	}

	generateId(byteLength: number): string {
		return base64ToBase64Url(uint8ArrayToBase64(this.cryptoFns.randomBytes(byteLength)))
	}

	publicKeyFromPem(
		pem: string,
	): {
		verify: (arg0: string, arg1: string) => boolean
	} {
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
		return this.cryptoFns.randomBytes(count)
	}
}