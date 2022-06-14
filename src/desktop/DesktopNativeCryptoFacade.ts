import {base64ToBase64Url, base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString} from "@tutao/tutanota-utils"
import type {CryptoFunctions} from "./CryptoFns"
import type {TypeModel} from "../api/common/EntityTypes"
import type * as FsModule from "fs"
import {Aes256Key} from "@tutao/tutanota-crypto/dist/encryption/Aes"
import {aes256Decrypt256Key, aes256Encrypt256Key, base64ToKey, IV_BYTE_LENGTH} from "@tutao/tutanota-crypto"
import {FileUri} from "../native/common/FileApp"
import path from "path"
import {NativeCryptoFacade} from "../native/common/generatedipc/NativeCryptoFacade"
import {EncryptedFileInfo} from "../native/common/generatedipc/EncryptedFileInfo"
import {PrivateKey} from "../native/common/generatedipc/PrivateKey"
import {PublicKey} from "../native/common/generatedipc/PublicKey"
import {RsaKeyPair} from "../native/common/generatedipc/RsaKeyPair"
import {DesktopUtils} from "./DesktopUtils"

type FsExports = typeof FsModule

export class DesktopNativeCryptoFacade implements NativeCryptoFacade {

	constructor(
		private readonly fs: FsExports,
		private readonly cryptoFns: CryptoFunctions,
		private readonly utils: DesktopUtils,
	) {
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
	 * decrypts a file and returns the decrypted files path
	 * @param encodedKey
	 * @param encryptedFileUri
	 * @returns {Promise<FileUri>}
	 */
	async aesDecryptFile(encodedKey: string, encryptedFileUri: FileUri): Promise<FileUri> {
		const targetDir = this.utils.getTutanotaTempPath("decrypted")
		const encData = await this.fs.promises.readFile(encryptedFileUri)
		const key = this.cryptoFns.base64ToKey(encodedKey)
		const decData = await this.cryptoFns.aes128Decrypt(key, encData, true)
		await this.fs.promises.mkdir(targetDir, {recursive: true})
		const decryptedFileUri = path.join(targetDir, path.basename(encryptedFileUri))
		await this.fs.promises.writeFile(decryptedFileUri, decData, {
			encoding: "binary",
		})
		return decryptedFileUri
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

	async aesEncryptFile(key: string, fileUri: string): Promise<EncryptedFileInfo> {
		throw new Error("not implemented for this platform")
	}

	async generateRsaKey(seed: string): Promise<RsaKeyPair> {
		throw new Error("not implemented for this platform")
	}

	async rsaDecrypt(privateKey: PrivateKey, base64Data: string): Promise<string> {
		throw new Error("not implemented for this platform")
	}

	async rsaEncrypt(publicKey: PublicKey, base64Data: string, base64Seed: string): Promise<string> {
		throw new Error("not implemented for this platform")
	}
}