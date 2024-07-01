/* generated file, don't edit. */


package de.tutao.calendar.ipc


import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface NativeCryptoFacade {
	suspend fun rsaEncrypt(
		publicKey: RsaPublicKey,
		data: DataWrapper,
		seed: DataWrapper,
	): DataWrapper
	suspend fun rsaDecrypt(
			privateKey: RsaPrivateKey,
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
	suspend fun argon2idHashRaw(
		password: DataWrapper,
		salt: DataWrapper,
		timeCost: Int,
		memoryCost: Int,
		parallelism: Int,
		hashLength: Int,
	): DataWrapper
	suspend fun generateKyberKeypair(
		seed: DataWrapper,
	): KyberKeyPair
	suspend fun kyberEncapsulate(
		publicKey: KyberPublicKey,
		seed: DataWrapper,
	): KyberEncapsulation
	suspend fun kyberDecapsulate(
		privateKey: KyberPrivateKey,
		ciphertext: DataWrapper,
	): DataWrapper
}
