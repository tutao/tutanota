import {base64ToBase64Url, base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString} from "@tutao/tutanota-utils"
import type {CryptoFunctions} from "./CryptoFns"
import type {TypeModel} from "../api/common/EntityTypes"
import type * as FsModule from "fs"
import {Aes256Key} from "@tutao/tutanota-crypto/dist/encryption/Aes"
import {aes256Decrypt256Key, aes256Encrypt256Key, IV_BYTE_LENGTH, uint8ArrayToKey} from "@tutao/tutanota-crypto"
import {FileUri} from "../native/common/FileApp"
import path from "path"
import {NativeCryptoFacade} from "../native/common/generatedipc/NativeCryptoFacade"
import {EncryptedFileInfo} from "../native/common/generatedipc/EncryptedFileInfo"
import {RsaPrivateKey} from "../native/common/generatedipc/RsaPrivateKey.js"
import {RsaPublicKey} from "../native/common/generatedipc/RsaPublicKey.js"
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
	 */
	async aesDecryptFile(key: Uint8Array, encryptedFileUri: FileUri): Promise<FileUri> {
		const targetDir = path.join(this.utils.getTutanotaTempPath(), "decrypted")
		await this.fs.promises.mkdir(targetDir, {recursive: true})

		const encData = await this.fs.promises.readFile(encryptedFileUri)
		const bitKey = this.cryptoFns.bytesToKey(key)
		const decData = await this.cryptoFns.aes128Decrypt(bitKey, encData, true)
		const decryptedFileUri = path.join(targetDir, path.basename(encryptedFileUri))
		await this.fs.promises.writeFile(decryptedFileUri, decData, {
			encoding: "binary",
		})
		return decryptedFileUri
	}

	aes256DecryptKey(encryptionKey: Aes256Key, keyToDecrypt: Uint8Array): Uint8Array {
		return this.cryptoFns.aes256Decrypt(encryptionKey, keyToDecrypt, false, false)
	}

	aes256EncryptKey(encryptionKey: Aes256Key, keyToEncrypt: Uint8Array): Uint8Array {
		return this.cryptoFns.aes256Encrypt(encryptionKey, keyToEncrypt, this.cryptoFns.randomBytes(16), false, false)
	}

	decryptAndMapToInstance<T>(model: TypeModel, instance: Record<string, any>, piSessionKey: Uint8Array, piSessionKeyEncSessionKey: Uint8Array): Promise<T> {
		const sk = this._decrypt256KeyToArray(piSessionKey, piSessionKeyEncSessionKey)

		return this.cryptoFns.decryptAndMapToInstance(model, instance, sk)
	}

	generateId(byteLength: number): string {
		return base64ToBase64Url(uint8ArrayToBase64(this.cryptoFns.randomBytes(byteLength)))
	}

	verifySignature(pem: string, data: Uint8Array, sig: Uint8Array): boolean {
		return this.cryptoFns.verifySignature(pem, data, sig)
	}

	_decrypt256KeyToArray(encryptionKey: Uint8Array, key: Uint8Array): Aes256Key {
		const encryptionKeyArray = uint8ArrayToKey(encryptionKey)
		return this.cryptoFns.decrypt256Key(encryptionKeyArray, key)
	}

	generateDeviceKey(): Aes256Key {
		return this.cryptoFns.aes256RandomKey()
	}

	randomBytes(count: number): Uint8Array {
		return this.cryptoFns.randomBytes(count)
	}

	async aesEncryptFile(key: Uint8Array, fileUri: string): Promise<EncryptedFileInfo> {
		const bytes = await this.fs.promises.readFile(fileUri)
		const encrypted = this.cryptoFns.aes128Encrypt(this.cryptoFns.bytesToKey(key), bytes, this.cryptoFns.randomBytes(16), true, true)

		const targetDir = path.join(this.utils.getTutanotaTempPath(), "encrypted")
		await this.fs.promises.mkdir(targetDir, {recursive: true})
		const filePath = path.join(targetDir, path.basename(fileUri))
		await this.fs.promises.writeFile(filePath, encrypted)
		return {
			uri: filePath,
			unencryptedSize: bytes.length,
		}
	}

	async generateRsaKey(seed: Uint8Array): Promise<RsaKeyPair> {
		throw new Error("not implemented for this platform")
	}

	async rsaDecrypt(privateKey: RsaPrivateKey, data: Uint8Array): Promise<Uint8Array> {
		throw new Error("not implemented for this platform")
	}

	async rsaEncrypt(publicKey: RsaPublicKey, data: Uint8Array, seed: Uint8Array): Promise<Uint8Array> {
		throw new Error("not implemented for this platform")
	}
}