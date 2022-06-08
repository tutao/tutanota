import {uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {keyToBase64} from "@tutao/tutanota-crypto"
import type {NativeInterface} from "../common/NativeInterface"
import {FileUri} from "../common/FileApp"

export type EncryptedFileInfo = {
	uri: string
	unencSize: number
}

export class AesApp {
	_native: NativeInterface

	constructor(native: NativeInterface) {
		this._native = native
	}

	/**
	 * Encrypts a file with the provided key
	 * @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
	 */
	aesEncryptFile(key: Aes128Key, fileUrl: FileUri, iv: Uint8Array): Promise<EncryptedFileInfo> {
		let encodedKey = keyToBase64(key)
		return this._native.invokeNative("aesEncryptFile", [encodedKey, fileUrl, uint8ArrayToBase64(iv)])
	}

	/**
	 * Decrypt bytes with the provided key
	 * @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
	 */
	aesDecryptFile(key: Aes128Key, fileUrl: FileUri): Promise<FileUri> {
		let encodedKey = keyToBase64(key)
		return this._native.invokeNative("aesDecryptFile", [encodedKey, fileUrl])
	}
}