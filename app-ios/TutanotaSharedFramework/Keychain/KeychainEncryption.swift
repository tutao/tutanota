import Foundation
import LocalAuthentication

/// Wrapper around cryptographic operations using keychain-bound keys.
public class KeychainEncryption {
	private let keychainManager: KeychainManager

	public init(keychainManager: KeychainManager) { self.keychainManager = keychainManager }

	func encryptUsingKeychain(_ data: Data, _ encryptionMode: CredentialEncryptionMode) async throws -> Data {
		try self.keychainManager.encryptData(encryptionMode: encryptionMode, data: data)
	}

	func decryptUsingKeychain(_ encryptedData: Data, _ encryptionMode: CredentialEncryptionMode) async throws -> Data {
		let data = try self.keychainManager.decryptData(encryptionMode: encryptionMode, encryptedData: encryptedData)
		return data
	}

	/// Whether we should re-encrypt the data that was encrypt using keychain-bound keys.
	public func requiresKeyAccessMigration() throws -> Bool { try self.keychainManager.requiresKeyAccessMigration() }
}
