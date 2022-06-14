/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface NativeCryptoFacade {
	 suspend fun rsaEncrypt(
		publicKey: PublicKey,
		base64Data: String,
		base64Seed: String,
	): String
	 suspend fun rsaDecrypt(
		privateKey: PrivateKey,
		base64Data: String,
	): String
	 suspend fun aesEncryptFile(
		key: String,
		fileUri: String,
		iv: String,
	): EncryptedFileInfo
	 suspend fun aesDecryptFile(
		key: String,
		fileUri: String,
	): String
	 suspend fun generateRsaKey(
		seed: String,
	): RsaKeyPair
}
