import Foundation
import LocalAuthentication

struct NotImplemented: Error {

}

public class IosNativeCredentialsFacade: NativeCredentialsFacade {
	private static let ENCRYPTION_MODE_KEY = "credentialEncryptionMode"
	private static let CREDENTIALS_ENCRYPTION_KEY_KEY = "credentialsEncryptionKey"

	private let keychainEncryption: KeychainEncryption
	private let credentialsDb: CredentialsStorage
	private let cryptoFns: CryptoFunctions

	public init(keychainEncryption: KeychainEncryption, credentialsDb: CredentialsStorage, cryptoFns: CryptoFunctions) {
		self.keychainEncryption = keychainEncryption
		self.credentialsDb = credentialsDb
		self.cryptoFns = cryptoFns
	}

	public func loadAll() async throws -> [PersistedCredentials] { try self.credentialsDb.getAll() }
	public func store(_ unencryptedCredentials: UnencryptedCredentials) async throws {
		let credentialsEncryptionKey = try await self.getOrCreateCredentialEncryptionKey()
		let encryptedCredentials: PersistedCredentials = try self.encryptCredentials(unencryptedCredentials, credentialsEncryptionKey)
		return try await self.storeEncrypted(encryptedCredentials)
	}
	public func storeEncrypted(_ credentials: PersistedCredentials) async throws { try self.credentialsDb.store(credentials: credentials) }
	public func clear() async throws {
		try self.credentialsDb.deleteAllCredentials()
		try self.credentialsDb.setCredentialEncryptionMode(encryptionMode: nil)
		try self.credentialsDb.setCredentialEncryptionKey(encryptionKey: nil)
	}
	public func migrateToNativeCredentials(_ credentials: [PersistedCredentials], _ encryptionMode: CredentialEncryptionMode, _ credentialsKey: DataWrapper)
		async throws
	{
		try self.credentialsDb.setCredentialEncryptionMode(encryptionMode: encryptionMode)
		try self.credentialsDb.setCredentialEncryptionKey(encryptionKey: credentialsKey.data)
		for persistedCredentials in credentials { try await self.storeEncrypted(persistedCredentials) }
	}
	public func loadByUserId(_ id: String) async throws -> UnencryptedCredentials? {
		guard let credentialsKey = try await self.getCredentialsEncryptionKey() else {
			throw KeyPermanentlyInvalidatedError(message: "Credentials key is missing, cannot decrypt credentials")
		}
		// We do two migrations here: one, from any other `CredentialEncryptionMode` to `.deviceLock`, another:
		// from `.deviceLock` key that is only accessible in foreground to the one that's accessible after
		// the first device unlock.
		// There was a private version of the app where we migrated to device lock but didn't migrate to the
		// background-accessible key. That's why we need another check for it.
		// `encryptUsingKeychain` with `.deviceLock` will always try to use a new key so it will re-encrypt.
		//
		// There might be a rare case where we might store credentials with an old key, even now: if we add new
		// credentials before we log in. It is not a problem as we will migrate on the first login.
		let requiresKeyAccessMigration = try self.keychainEncryption.requiresKeyAccessMigration()
		if let encryptionMode = try await self.getCredentialEncryptionMode(), encryptionMode != .deviceLock || requiresKeyAccessMigration {
			TUTSLog("Migrating encryption mode to DEVICE_LOCK")
			let encryptedKey = try await self.keychainEncryption.encryptUsingKeychain(credentialsKey, .deviceLock)
			try self.credentialsDb.setCredentialEncryptionKey(encryptionKey: encryptedKey)
			try self.credentialsDb.setCredentialEncryptionMode(encryptionMode: .deviceLock)
			TUTSLog("Encryption mode migration complete")
		}
		let credentials = try self.credentialsDb.getAll()
		guard let persistedCredentials = credentials.first(where: { $0.credentialInfo.userId == id }) else { return nil }
		return try self.decryptCredentials(persistedCredentials: persistedCredentials, credentialsKey: credentialsKey)
	}
	public func deleteByUserId(_ id: String) async throws { try self.credentialsDb.delete(userId: id) }
	public func getCredentialEncryptionMode() async throws -> CredentialEncryptionMode? { try self.credentialsDb.getCredentialEncryptionMode() }
	public func setCredentialEncryptionMode(_ encryptionMode: CredentialEncryptionMode) throws {
		assert(encryptionMode == .deviceLock, "Invalid encryption mode: \(encryptionMode)")
		try self.credentialsDb.setCredentialEncryptionMode(encryptionMode: encryptionMode)
	}
	private func getCredentialsEncryptionKey() async throws -> Data? {
		let encryptionMode = (try await self.getCredentialEncryptionMode()) ?? CredentialEncryptionMode.deviceLock
		let existingKey = try self.credentialsDb.getCredentialEncryptionKey()
		if let existingKey { return try await self.keychainEncryption.decryptUsingKeychain(existingKey, encryptionMode) } else { return nil }
	}

	public func getSupportedEncryptionModes() async -> [CredentialEncryptionMode] { [CredentialEncryptionMode.deviceLock] }

	private func encryptCredentials(_ unencryptedCredentials: UnencryptedCredentials, _ credentialsEncryptionKey: Data) throws -> PersistedCredentials {
		let accessToken = try self.cryptoFns.aesEncryptData(unencryptedCredentials.accessToken.data(using: .utf8)!, withKey: credentialsEncryptionKey)
		return try PersistedCredentials(
			credentialInfo: unencryptedCredentials.credentialInfo,
			accessToken: accessToken.wrap(),
			databaseKey: unencryptedCredentials.databaseKey.map { dbKey in
				try self.cryptoFns.aesEncryptData(dbKey.data, withKey: credentialsEncryptionKey).wrap()
			},
			encryptedPassword: unencryptedCredentials.encryptedPassword,
			encryptedPassphraseKey: unencryptedCredentials.encryptedPassphraseKey
		)
	}

	private func decryptCredentials(persistedCredentials: PersistedCredentials, credentialsKey: Data) throws -> UnencryptedCredentials {
		do {
			return try UnencryptedCredentials(
				credentialInfo: persistedCredentials.credentialInfo,
				accessToken: String(bytes: self.cryptoFns.aesDecryptData(persistedCredentials.accessToken.data, withKey: credentialsKey), encoding: .utf8)!,
				databaseKey: persistedCredentials.databaseKey.map({ dbKey in try self.cryptoFns.aesDecryptData(dbKey.data, withKey: credentialsKey).wrap() }),
				encryptedPassword: persistedCredentials.encryptedPassword,
				encryptedPassphraseKey: persistedCredentials.encryptedPassphraseKey
			)
		} catch { throw KeyPermanentlyInvalidatedError(underlyingError: error) }
	}

	private func createCredentialEncryptionKey() async throws -> Data {
		let encryptionMode = (try await self.getCredentialEncryptionMode()) ?? CredentialEncryptionMode.deviceLock
		let newKey = self.cryptoFns.aesGenerateKey()
		let encryptedKey = try await self.keychainEncryption.encryptUsingKeychain(newKey, encryptionMode)
		try self.credentialsDb.setCredentialEncryptionKey(encryptionKey: encryptedKey)
		return newKey
	}

	private func getOrCreateCredentialEncryptionKey() async throws -> Data {
		let existingKey = try await self.getCredentialsEncryptionKey()
		if let existingKey { return existingKey } else { return try await createCredentialEncryptionKey() }
	}

}
