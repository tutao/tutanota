/* generated file, don't edit. */


import Foundation

/**
 * Operations for credential encryption operations using OS keychain.
 */
public protocol NativeCredentialsFacade {
	func getSupportedEncryptionModes(
	) async throws -> [CredentialEncryptionMode]
	func loadAll(
	) async throws -> [PersistedCredentials]
	/**
	 * Encrypt and store credentials
	 */
	func store(
		_ credentials: UnencryptedCredentials
	) async throws -> Void
	/**
	 * Store already encrypted credentials
	 */
	func storeEncrypted(
		_ credentials: PersistedCredentials
	) async throws -> Void
	func loadByUserId(
		_ id: String
	) async throws -> UnencryptedCredentials?
	func deleteByUserId(
		_ id: String
	) async throws -> Void
	func getCredentialEncryptionMode(
	) async throws -> CredentialEncryptionMode?
	func setCredentialEncryptionMode(
		_ encryptionMode: CredentialEncryptionMode
	) async throws -> Void
	func clear(
	) async throws -> Void
	/**
	 * Migrate existing credentials to native db
	 */
	func migrateToNativeCredentials(
		_ credentials: [PersistedCredentials],
		_ encryptionMode: CredentialEncryptionMode,
		_ credentialsKey: DataWrapper
	) async throws -> Void
}
