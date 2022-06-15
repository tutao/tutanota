/* generated file, don't edit. */


import Foundation

public protocol NativeCredentialsFacade {
	func encryptUsingKeychain(
		_ base64EncodedData: String,
		_ encryptionMode: CredentialEncryptionMode
	) async throws -> String
	func decryptUsingKeychain(
		_ base64EncodedEncryptedData: String,
		_ encryptionMode: CredentialEncryptionMode
	) async throws -> String
	func getSupportedEncryptionModes(
	) async throws -> [CredentialEncryptionMode]
}
