/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Operations for credential encryption operations using OS keychain.
 */
interface NativeCredentialsFacade {
	suspend fun getSupportedEncryptionModes(
	): List<CredentialEncryptionMode>
	suspend fun loadAll(
	): List<PersistedCredentials>
	/**
	 * Encrypt and store credentials
	 */
	suspend fun store(
		credentials: UnencryptedCredentials,
	): Unit
	/**
	 * Store already encrypted credentials
	 */
	suspend fun storeEncrypted(
		credentials: PersistedCredentials,
	): Unit
	suspend fun loadByUserId(
		id: String,
	): UnencryptedCredentials?
	suspend fun deleteByUserId(
		id: String,
	): Unit
	suspend fun getCredentialEncryptionMode(
	): CredentialEncryptionMode?
	suspend fun setCredentialEncryptionMode(
		encryptionMode: CredentialEncryptionMode,
	): Unit
	suspend fun clear(
	): Unit
	/**
	 * Migrate existing credentials to native db
	 */
	suspend fun migrateToNativeCredentials(
		credentials: List<PersistedCredentials>,
		encryptionMode: CredentialEncryptionMode,
		credentialsKey: DataWrapper,
	): Unit
}
