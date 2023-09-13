import { base64ToBase64Url, base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import type { CryptoFunctions } from "./CryptoFns"
import type { TypeModel } from "../api/common/EntityTypes"
import type * as FsModule from "node:fs"
import { Aes256Key, uint8ArrayToKey } from "@tutao/tutanota-crypto"
import { FileUri } from "../native/common/FileApp"
import path from "node:path"
import { NativeCryptoFacade } from "../native/common/generatedipc/NativeCryptoFacade"
import { EncryptedFileInfo } from "../native/common/generatedipc/EncryptedFileInfo"
import { RsaPrivateKey } from "../native/common/generatedipc/RsaPrivateKey.js"
import { RsaPublicKey } from "../native/common/generatedipc/RsaPublicKey.js"
import { RsaKeyPair } from "../native/common/generatedipc/RsaKeyPair"
import { DesktopUtils } from "./DesktopUtils"
import { nonClobberingFilename } from "./PathUtils.js"

type FsExports = typeof FsModule

export class DesktopNativeCryptoFacade implements NativeCryptoFacade {
	constructor(private readonly fs: FsExports, private readonly cryptoFns: CryptoFunctions, private readonly utils: DesktopUtils) {}

	aesEncryptObject(encryptionKey: Aes256Key, object: number | string | boolean | ReadonlyArray<any> | {}): string {
		const serializedObject = JSON.stringify(object)
		const encryptedBytes = this.cryptoFns.aesEncrypt(encryptionKey, stringToUtf8Uint8Array(serializedObject))
		return uint8ArrayToBase64(encryptedBytes)
	}

	aesDecryptObject(encryptionKey: Aes256Key, serializedObject: string): {} {
		const encryptedBytes = base64ToUint8Array(serializedObject)
		const decryptedBytes = this.cryptoFns.aesDecrypt(encryptionKey, encryptedBytes, true)
		const stringObject = utf8Uint8ArrayToString(decryptedBytes)
		return JSON.parse(stringObject)
	}

	/**
	 * decrypts a file and returns the decrypted files path
	 */
	async aesDecryptFile(key: Uint8Array, encryptedFileUri: FileUri): Promise<FileUri> {
		const targetDir = path.join(this.utils.getTutanotaTempPath(), "decrypted")
		await this.fs.promises.mkdir(targetDir, { recursive: true })

		const encData = await this.fs.promises.readFile(encryptedFileUri)
		const bitKey = this.cryptoFns.bytesToKey(key)
		const decData = this.cryptoFns.aesDecrypt(bitKey, encData, true)

		const filesInDirectory = await this.fs.promises.readdir(targetDir)
		const newFilename = nonClobberingFilename(filesInDirectory, path.basename(encryptedFileUri))
		const decryptedFileUri = path.join(targetDir, newFilename)
		await this.fs.promises.writeFile(decryptedFileUri, decData, {
			encoding: "binary",
		})
		return decryptedFileUri
	}

	aes256DecryptKey(encryptionKey: Aes256Key, keyToDecrypt: Uint8Array): Uint8Array {
		return this.cryptoFns.aesDecrypt(encryptionKey, keyToDecrypt, false)
	}

	aes256EncryptKey(encryptionKey: Aes256Key, keyToEncrypt: Uint8Array): Uint8Array {
		return this.cryptoFns.aesEncrypt(encryptionKey, keyToEncrypt, undefined, false)
	}

	decryptAndMapToInstance<T>(model: TypeModel, instance: Record<string, any>, piSessionKey: Uint8Array, piSessionKeyEncSessionKey: Uint8Array): Promise<T> {
		const sk = this.cryptoFns.decryptKey(uint8ArrayToKey(piSessionKey), piSessionKeyEncSessionKey)
		return this.cryptoFns.decryptAndMapToInstance(model, instance, sk)
	}

	generateId(byteLength: number): string {
		return base64ToBase64Url(uint8ArrayToBase64(this.cryptoFns.randomBytes(byteLength)))
	}

	verifySignature(pem: string, data: Uint8Array, sig: Uint8Array): boolean {
		return this.cryptoFns.verifySignature(pem, data, sig)
	}

	generateDeviceKey(): Aes256Key {
		return this.cryptoFns.aes256RandomKey()
	}

	randomBytes(count: number): Uint8Array {
		return this.cryptoFns.randomBytes(count)
	}

	async aesEncryptFile(key: Uint8Array, fileUri: string): Promise<EncryptedFileInfo> {
		const bytes = await this.fs.promises.readFile(fileUri)
		const keyBits = this.cryptoFns.bytesToKey(key)
		const encrypted = this.cryptoFns.aesEncrypt(keyBits, bytes)
		const targetDir = path.join(this.utils.getTutanotaTempPath(), "encrypted")
		await this.fs.promises.mkdir(targetDir, { recursive: true })
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

	async argon2idHashRaw(
		password: Uint8Array,
		salt: Uint8Array,
		timeCost: number,
		memoryCost: number,
		parallelism: number,
		hashLength: number,
	): Promise<Uint8Array> {
		throw new Error("not implemented for this platform")
	}
}
