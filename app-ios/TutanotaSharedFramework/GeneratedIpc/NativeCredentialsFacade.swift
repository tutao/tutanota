/* generated file, don't edit. */


import Foundation

/**
 * Operations for credential encryption operations using OS keychain.
 */
public protocol NativeCredentialsFacade {
	func encryptUsingKeychain(
		_ data: DataWrapper,
		_ encryptionMode: CredentialEncryptionMode
	) async throws -> DataWrapper
	func decryptUsingKeychain(
		_ encryptedData: DataWrapper,
		_ encryptionMode: CredentialEncryptionMode
	) async throws -> DataWrapper
	func getSupportedEncryptionModes(
	) async throws -> [CredentialEncryptionMode]
	func loadAll(
	) async throws -> [PersistedCredentials]
	func store(
		_ credentials: PersistedCredentials
	) async throws -> Void
	func loadByUserId(
		_ id: String
	) async throws -> PersistedCredentials?
	func deleteByUserId(
		_ id: String
	) async throws -> Void
	func getCredentialEncryptionMode(
	) async throws -> CredentialEncryptionMode?
	func setCredentialEncryptionMode(
		_ encryptionMode: CredentialEncryptionMode?
	) async throws -> Void
	func getCredentialsEncryptionKey(
	) async throws -> DataWrapper?
	func setCredentialsEncryptionKey(
		_ credentialsEncryptionKey: DataWrapper?
	) async throws -> Void
}
