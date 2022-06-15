/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface NativeCredentialsFacade {
	 suspend fun encryptUsingKeychain(
		base64EncodedData: String,
		encryptionMode: CredentialEncryptionMode,
	): String
	 suspend fun decryptUsingKeychain(
		base64EncodedEncryptedData: String,
		encryptionMode: CredentialEncryptionMode,
	): String
	 suspend fun getSupportedEncryptionModes(
	): List<CredentialEncryptionMode>
}
