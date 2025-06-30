/* generated file, don't edit. */


package de.tutao.tutashared.ipc

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
	suspend fun argon2idGeneratePassphraseKey(
		passphrase: String,
		salt: DataWrapper,
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
	suspend fun generateEd25519Keypair(
	): IPCEd25519KeyPair
	suspend fun ed25519Sign(
		privateKey: IPCEd25519PrivateKey,
		data: DataWrapper,
	): IPCEd25519Signature
	suspend fun ed25519Verify(
		publicKey: IPCEd25519PublicKey,
		data: DataWrapper,
		signature: IPCEd25519Signature,
	): Boolean
}
