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
	 suspend fun loadAll(
	): List<PersistedCredentials>
	 suspend fun store(
		credentials: PersistedCredentials,
	): Unit
	 suspend fun loadByUserId(
		id: String,
	): PersistedCredentials?
	 suspend fun deleteByUserId(
		id: String,
	): Unit
	 suspend fun getCredentialEncryptionMode(
	): CredentialEncryptionMode?
	 suspend fun setCredentialEncryptionMode(
		encryptionMode: CredentialEncryptionMode?,
	): Unit
	 suspend fun getCredentialsEncryptionKey(
	): DataWrapper?
	 suspend fun setCredentialsEncryptionKey(
		credentialsEncryptionKey: DataWrapper?,
	): Unit
}
