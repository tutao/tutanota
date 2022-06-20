/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Operations for credential encryption operations using OS keychain.
 */
interface NativeCredentialsFacade {
	 suspend fun encryptUsingKeychain(
		data: DataWrapper,
		encryptionMode: CredentialEncryptionMode,
	): DataWrapper
	 suspend fun decryptUsingKeychain(
		encryptedData: DataWrapper,
		encryptionMode: CredentialEncryptionMode,
	): DataWrapper
	 suspend fun getSupportedEncryptionModes(
	): List<CredentialEncryptionMode>
}
