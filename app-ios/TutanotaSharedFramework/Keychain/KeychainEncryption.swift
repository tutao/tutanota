import Foundation
import LocalAuthentication
public import Mockable

@Mockable public protocol KeychainEncryption: Sendable {
	func encryptUsingKeychain(_ data: Data, _ encryptionMode: CredentialEncryptionMode) async throws -> Data

	func decryptUsingKeychain(_ encryptedData: Data, _ encryptionMode: CredentialEncryptionMode) async throws -> Data

	/// Whether we should re-encrypt the data that was encrypt using keychain-bound keys.
	func requiresKeyAccessMigration() throws -> Bool
}

/// Wrapper around cryptographic operations using keychain-bound keys.
public final class KeychainManagerKeychainEncryption: Sendable, KeychainEncryption {
	private let keychainManager: KeychainManager

	public init(keychainManager: KeychainManager) { self.keychainManager = keychainManager }

	public func encryptUsingKeychain(_ data: Data, _ encryptionMode: CredentialEncryptionMode) async throws -> Data {
		try await self.keychainManager.encryptData(encryptionMode: encryptionMode, data: data)
	}

	public func decryptUsingKeychain(_ encryptedData: Data, _ encryptionMode: CredentialEncryptionMode) async throws -> Data {
		let data = try await self.keychainManager.decryptData(encryptionMode: encryptionMode, encryptedData: encryptedData)
		return data
	}

	/// Whether we should re-encrypt the data that was encrypt using keychain-bound keys.
	public func requiresKeyAccessMigration() throws -> Bool { try self.keychainManager.requiresKeyAccessMigration() }
}
