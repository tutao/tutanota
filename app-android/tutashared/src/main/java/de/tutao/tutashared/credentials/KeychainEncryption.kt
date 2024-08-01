package de.tutao.tutashared.credentials

interface KeychainEncryption {
	suspend fun decryptUsingKeychain(
		encryptedData: ByteArray,
		encryptionMode: CredentialEncryptionMode
	): ByteArray

	suspend fun encryptUsingKeychain(
		data: ByteArray,
		encryptionMode: CredentialEncryptionMode
	): ByteArray
}