import { base64ToBase64Url, base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import type { CryptoFunctions } from "./CryptoFns.js"
import type { TypeModel } from "../api/common/EntityTypes.js"
import type * as FsModule from "node:fs"
import { Aes256Key, Argon2IDExports, bitArrayToUint8Array, generateKeyFromPassphraseArgon2id, uint8ArrayToKey } from "@tutao/tutanota-crypto"
import { FileUri } from "../native/common/FileApp.js"
import path from "node:path"
import { NativeCryptoFacade } from "../native/common/generatedipc/NativeCryptoFacade.js"
import { EncryptedFileInfo } from "../native/common/generatedipc/EncryptedFileInfo.js"
import { RsaPrivateKey } from "../native/common/generatedipc/RsaPrivateKey.js"
import { RsaPublicKey } from "../native/common/generatedipc/RsaPublicKey.js"
import { nonClobberingFilename } from "./PathUtils.js"
import { TempFs } from "./files/TempFs.js"
import { KyberKeyPair } from "../native/common/generatedipc/KyberKeyPair.js"
import { KyberPublicKey } from "../native/common/generatedipc/KyberPublicKey.js"
import { KyberEncapsulation } from "../native/common/generatedipc/KyberEncapsulation.js"
import { KyberPrivateKey } from "../native/common/generatedipc/KyberPrivateKey.js"

type FsExports = typeof FsModule

export class DesktopNativeCryptoFacade implements NativeCryptoFacade {
	constructor(
		private readonly fs: FsExports,
		private readonly cryptoFns: CryptoFunctions,
		private readonly tfs: TempFs,
		private readonly argon2: Promise<Argon2IDExports>,
	) {}

	aesEncryptObject(encryptionKey: Aes256Key, object: number | string | boolean | ReadonlyArray<unknown> | {}): string {
		const serializedObject = JSON.stringify(object)
		const encryptedBytes = this.cryptoFns.aesEncrypt(encryptionKey, stringToUtf8Uint8Array(serializedObject))
		return uint8ArrayToBase64(encryptedBytes)
	}

	aesDecryptObject(encryptionKey: Aes256Key, serializedObject: string): number | string | boolean | ReadonlyArray<unknown> | {} {
		const encryptedBytes = base64ToUint8Array(serializedObject)
		const decryptedBytes = this.cryptoFns.aesDecrypt(encryptionKey, encryptedBytes, true)
		const stringObject = utf8Uint8ArrayToString(decryptedBytes)
		return JSON.parse(stringObject)
	}

	async aesEncryptFile(key: Uint8Array, fileUri: string): Promise<EncryptedFileInfo> {
		// at the moment, this is randomized if the file to be encrypted
		// was created with FileFacade.writeDataFile.
		// to make it safe in all conditions, we should re-generate a random file name.
		// we're also not checking if the file to be encrypted is actually located in
		// the temp scratch space
		const bytes = await this.fs.promises.readFile(fileUri)
		const keyBits = this.cryptoFns.bytesToKey(key)
		const encrypted = this.cryptoFns.aesEncrypt(keyBits, bytes)
		const targetDir = await this.tfs.ensureEncryptedDir()
		const writtenFileName = path.basename(fileUri)
		const filePath = path.join(targetDir, writtenFileName)
		await this.fs.promises.writeFile(filePath, encrypted)
		return {
			uri: filePath,
			unencryptedSize: bytes.length,
		}
	}

	/**
	 * decrypts a file and returns the decrypted files path
	 */
	async aesDecryptFile(key: Uint8Array, encryptedFileUri: FileUri): Promise<FileUri> {
		const targetDir = await this.tfs.ensureUnencrytpedDir()
		const encData = await this.fs.promises.readFile(encryptedFileUri)
		const bitKey = this.cryptoFns.bytesToKey(key)
		const decData = this.cryptoFns.aesDecrypt(bitKey, encData, true)

		const filesInDirectory = await this.fs.promises.readdir(targetDir)
		// since we're working purely in scratch space until putFileIntoDownloadsFolder
		// is called, we could re-generate a random name here.
		const writtenFileName = path.basename(encryptedFileUri)
		const newFilename = nonClobberingFilename(filesInDirectory, writtenFileName)
		const decryptedFileUri = path.join(targetDir, newFilename)
		await this.fs.promises.writeFile(decryptedFileUri, decData, {
			encoding: "binary",
		})
		return decryptedFileUri
	}

	unauthenticatedAes256DecryptKey(encryptionKey: Aes256Key, keyToDecrypt: Uint8Array): Uint8Array {
		return this.cryptoFns.unauthenticatedAesDecrypt(encryptionKey, keyToDecrypt, false)
	}

	aes256EncryptKey(encryptionKey: Aes256Key, keyToEncrypt: Uint8Array): Uint8Array {
		return this.cryptoFns.aesEncrypt(encryptionKey, keyToEncrypt, undefined, false)
	}

	aesDecryptBytes(encryptionKey: Aes256Key, data: Uint8Array): Uint8Array {
		return this.cryptoFns.aesDecrypt(encryptionKey, data, true)
	}

	aesEncryptBytes(encryptionKey: Aes256Key, data: Uint8Array): Uint8Array {
		return this.cryptoFns.aesEncrypt(encryptionKey, data, undefined, true, true)
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

	async rsaDecrypt(privateKey: RsaPrivateKey, data: Uint8Array): Promise<Uint8Array> {
		throw new Error("not implemented for this platform")
	}

	async rsaEncrypt(publicKey: RsaPublicKey, data: Uint8Array, seed: Uint8Array): Promise<Uint8Array> {
		throw new Error("not implemented for this platform")
	}

	async argon2idGeneratePassphraseKey(passphrase: string, salt: Uint8Array): Promise<Uint8Array> {
		const hash = await generateKeyFromPassphraseArgon2id(await this.argon2, passphrase, salt)
		return bitArrayToUint8Array(hash)
	}

	generateKyberKeypair(seed: Uint8Array): Promise<KyberKeyPair> {
		throw new Error("not implemented for this platform")
	}

	kyberEncapsulate(publicKey: KyberPublicKey, seed: Uint8Array): Promise<KyberEncapsulation> {
		throw new Error("not implemented for this platform")
	}

	kyberDecapsulate(privateKey: KyberPrivateKey, ciphertext: Uint8Array): Promise<Uint8Array> {
		throw new Error("not implemented for this platform")
	}
}
