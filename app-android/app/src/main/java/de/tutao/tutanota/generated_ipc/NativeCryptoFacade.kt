/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface NativeCryptoFacade {
	 suspend fun rsaEncrypt(
		publicKey: PublicKey,
		data: DataWrapper,
		seed: DataWrapper,
	): DataWrapper
	 suspend fun rsaDecrypt(
		privateKey: PrivateKey,
		data: DataWrapper,
	): DataWrapper
	/**
	 * Encrypt file specified by the `fileUri`. Returns URI of the encrypted file.
	 */
	 suspend fun aesEncryptFile(
		key: DataWrapper,
		fileUri: String,
		iv: DataWrapper,
	): EncryptedFileInfo
	/**
	 * Decrypt file specified by the `fileUri`. Returns URI of the decrypted file.
	 */
	 suspend fun aesDecryptFile(
		key: DataWrapper,
		fileUri: String,
	): String
	 suspend fun generateRsaKey(
		seed: DataWrapper,
	): RsaKeyPair
}
