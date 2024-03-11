import Foundation
import LocalAuthentication

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
}
