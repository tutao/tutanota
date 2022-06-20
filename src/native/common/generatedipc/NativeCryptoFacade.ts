/* generated file, don't edit. */

import {PublicKey} from "./PublicKey.js"
import {PrivateKey} from "./PrivateKey.js"
import {EncryptedFileInfo} from "./EncryptedFileInfo.js"
import {RsaKeyPair} from "./RsaKeyPair.js"
export interface NativeCryptoFacade {

	rsaEncrypt(
		publicKey: PublicKey,
		data: Uint8Array,
		seed: Uint8Array,
	): Promise<Uint8Array>
	
	rsaDecrypt(
		privateKey: PrivateKey,
		data: Uint8Array,
	): Promise<Uint8Array>
	
	/**
	 * Encrypt file specified by the `fileUri`. Returns URI of the encrypted file.
	 */
	aesEncryptFile(
		key: Uint8Array,
		fileUri: string,
		iv: Uint8Array,
	): Promise<EncryptedFileInfo>
	
	/**
	 * Decrypt file specified by the `fileUri`. Returns URI of the decrypted file.
	 */
	aesDecryptFile(
		key: Uint8Array,
		fileUri: string,
	): Promise<string>
	
	generateRsaKey(
		seed: Uint8Array,
	): Promise<RsaKeyPair>
	
}
