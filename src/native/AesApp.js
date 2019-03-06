// @flow
import {uint8ArrayToBase64} from "../api/common/utils/Encoding"
import {nativeApp} from "./NativeWrapper"
import {Request} from "../api/common/WorkerProtocol"
import {keyToBase64} from "../api/worker/crypto/CryptoUtils"

export type EncryptedFileInfo = {|
	uri: string,
	unencSize: number
|}

/**
 * Encrypts a file with the provided key
 * @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
 */
export function aesEncryptFile(key: Aes128Key, fileUrl: string, iv: Uint8Array): Promise<EncryptedFileInfo> {
	let encodedKey = keyToBase64(key)
	return nativeApp.invokeNative(new Request('aesEncryptFile', [encodedKey, fileUrl, uint8ArrayToBase64(iv)]))
}

/**
 * Decrypt bytes with the provided key
 * @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
 */
export function aesDecryptFile(key: Aes128Key, fileUrl: string): Promise<string> {
	let encodedKey = keyToBase64(key)
	return nativeApp.invokeNative(new Request("aesDecryptFile", [encodedKey, fileUrl]))
}
