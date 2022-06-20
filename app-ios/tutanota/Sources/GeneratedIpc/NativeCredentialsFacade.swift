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
}
