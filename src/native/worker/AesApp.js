// @flow
import {uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {Request} from "../../api/common/MessageDispatcher"
import {keyToBase64} from "@tutao/tutanota-crypto"
import type {NativeInterface} from "../common/NativeInterface"

export type EncryptedFileInfo = {|
	uri: string,
	unencSize: number
|}

export class AesApp {
	_native: NativeInterface

	constructor(native: NativeInterface) {
		this._native = native
	}

	/**
	 * Encrypts a file with the provided key
	 * @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
	 */
	aesEncryptFile(key: Aes128Key, fileUrl: string, iv: Uint8Array): Promise<EncryptedFileInfo> {
		let encodedKey = keyToBase64(key)
		return this._native.invokeNative(new Request('aesEncryptFile', [encodedKey, fileUrl, uint8ArrayToBase64(iv)]))
	}

	/**
	 * Decrypt bytes with the provided key
	 * @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
	 */
	aesDecryptFile(key: Aes128Key, fileUrl: string): Promise<string> {
		let encodedKey = keyToBase64(key)
		return this._native.invokeNative(new Request("aesDecryptFile", [encodedKey, fileUrl]))
	}
}
