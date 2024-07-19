import Mockingbird
import TutanotaSharedFramework
import XCTest

final class CredentialsFacadeTest: XCTestCase {
	private let keychainEncryption = mock(KeychainEncryption.self)
		.initialize(keychainManager: mock(KeychainManager.self).initialize(keyGenerator: mock(KeyGenerator.self).initialize()))
	private let credentialsDb = mock(CredentialsStorage.self)
	private let cryptoFns = mock(CryptoFunctions.self).initialize()
	private var facade: IosNativeCredentialsFacade!

	override func setUpWithError() throws {
		facade = IosNativeCredentialsFacade(keychainEncryption: keychainEncryption, credentialsDb: credentialsDb, cryptoFns: cryptoFns)
		given(keychainEncryption.requiresKeyAccessMigration()).willReturn(false)
	}

	private let encryptedCredentials1 = PersistedCredentials(
		credentialInfo: CredentialsInfo(login: "login1@test.com", userId: "user1", type: CredentialType._internal),
		accessToken: Data([0x01, 0x0a, 0x0e]).wrap(),
		databaseKey: Data([0x01, 0x0d, 0x0e]).wrap(),
		encryptedPassword: "pw1",
		encryptedPassphraseKey: nil
	)

	private let decryptedCredentials1 = UnencryptedCredentials(
		credentialInfo: CredentialsInfo(login: "login1@test.com", userId: "user1", type: CredentialType._internal),
		accessToken: "decAccessToken1",
		databaseKey: Data([0x01, 0x0d, 0x0d]).wrap(),
		encryptedPassword: "pw1",
		encryptedPassphraseKey: nil
	)

	private let encryptedCredentials2 = PersistedCredentials(
		credentialInfo: CredentialsInfo(login: "login2@test.com", userId: "user2", type: CredentialType._internal),
		accessToken: Data([0x02, 0x0a, 0x0e]).wrap(),
		databaseKey: Data([0x02, 0x0d, 0x0e]).wrap(),
		encryptedPassword: "pw2",
		encryptedPassphraseKey: Data([0x02, 0x0b, 0x0e]).wrap()
	)

	private let decryptedCredentials2 = UnencryptedCredentials(
		credentialInfo: CredentialsInfo(login: "login2@test.com", userId: "user2", type: CredentialType._internal),
		accessToken: "decAccessToken2",
		databaseKey: Data([0x02, 0x0d, 0x0d]).wrap(),
		encryptedPassword: "pw2",
		encryptedPassphraseKey: Data([0x02, 0x0b, 0x0e]).wrap()
	)

	private let encCredentialsKey = Data([0x0e])
	private let decCredentialsKey = Data([0x0d])
	private let reEncryptedCredentialsKey = Data([0x03])

	func test_deleteByUserId_deletes_it_from_the_db() async throws {
		let userId = "user1"
		try await facade.deleteByUserId(userId)
		verify(credentialsDb.delete(userId: userId)).wasCalled()
	}

	func test_GetCredentialEncryptionode_returns_null_from_the_db() async throws {
		given(credentialsDb.getCredentialEncryptionMode()).willReturn(nil)
		let mode = try await facade.getCredentialEncryptionMode()
		XCTAssertNil(mode)
	}

	func test_GetCredentialEncryptionode_returns_value_from_the_db() async throws {
		given(credentialsDb.getCredentialEncryptionMode()).willReturn(.systemPassword)
		let mode = try await facade.getCredentialEncryptionMode()
		XCTAssertEqual(CredentialEncryptionMode.systemPassword, mode)
	}

	func test_loadAll_returns_credentials_from_the_db() async throws {
		given(credentialsDb.getAll()).willReturn([encryptedCredentials1, encryptedCredentials2])
		let loadedCredentials = try await facade.loadAll()
		XCTAssertEqual([encryptedCredentials1, encryptedCredentials2], loadedCredentials)
	}

	func test_loadByUserId_$_when_there_is_a_key_it_is_used_to_decrypt_credentials_wo_passphraseKey() async throws {
		given(credentialsDb.getCredentialEncryptionKey()).willReturn(encCredentialsKey)
		given(credentialsDb.getCredentialEncryptionMode()).willReturn(CredentialEncryptionMode.deviceLock)
		given(credentialsDb.getAll()).willReturn([encryptedCredentials1, encryptedCredentials2])
		given(await keychainEncryption.decryptUsingKeychain(encCredentialsKey, .deviceLock)).willReturn(decCredentialsKey)
		given(cryptoFns.aesDecryptData(encryptedCredentials1.databaseKey!.data, withKey: decCredentialsKey)).willReturn(decryptedCredentials1.databaseKey!.data)
		given(cryptoFns.aesDecryptData(encryptedCredentials1.accessToken.data, withKey: decCredentialsKey))
			.willReturn(decryptedCredentials1.accessToken.data(using: .utf8)!)
		let loadedCredential = try await facade.loadByUserId("user1")
		XCTAssertEqual(decryptedCredentials1, loadedCredential)
	}

	func test_loadByUserId_$_when_there_is_a_key_it_is_used_to_decrypt_credentials_w_passphraseKey() async throws {
		given(credentialsDb.getCredentialEncryptionKey()).willReturn(encCredentialsKey)
		given(credentialsDb.getCredentialEncryptionMode()).willReturn(CredentialEncryptionMode.deviceLock)
		given(credentialsDb.getAll()).willReturn([encryptedCredentials1, encryptedCredentials2])
		given(await keychainEncryption.decryptUsingKeychain(encCredentialsKey, .deviceLock)).willReturn(decCredentialsKey)
		given(cryptoFns.aesDecryptData(encryptedCredentials2.databaseKey!.data, withKey: decCredentialsKey)).willReturn(decryptedCredentials2.databaseKey!.data)
		given(cryptoFns.aesDecryptData(encryptedCredentials2.accessToken.data, withKey: decCredentialsKey))
			.willReturn(decryptedCredentials2.accessToken.data(using: .utf8)!)
		let loadedCredential = try await facade.loadByUserId("user2")
		XCTAssertEqual(decryptedCredentials2, loadedCredential)
	}

	func test_loadByUserId_$_when_another_mode_is_selected_the_migration_is_done() async throws {
		given(credentialsDb.getCredentialEncryptionKey()).willReturn(encCredentialsKey)
		given(credentialsDb.getCredentialEncryptionMode()).willReturn(CredentialEncryptionMode.systemPassword)
		given(credentialsDb.getAll()).willReturn([encryptedCredentials1])
		given(await keychainEncryption.decryptUsingKeychain(encCredentialsKey, .systemPassword)).willReturn(decCredentialsKey)
		given(cryptoFns.aesDecryptData(encryptedCredentials1.databaseKey!.data, withKey: decCredentialsKey)).willReturn(decryptedCredentials1.databaseKey!.data)
		given(cryptoFns.aesDecryptData(encryptedCredentials1.accessToken.data, withKey: decCredentialsKey))
			.willReturn(decryptedCredentials1.accessToken.data(using: .utf8)!)
		given(await keychainEncryption.encryptUsingKeychain(decCredentialsKey, .deviceLock)).willReturn(reEncryptedCredentialsKey)
		let loadedCredential = try await facade.loadByUserId("user1")
		XCTAssertEqual(decryptedCredentials1, loadedCredential)
		verify(credentialsDb.setCredentialEncryptionKey(encryptionKey: reEncryptedCredentialsKey)).wasCalled()
	}

	func test_loadByUserId_$_when_key_access_migration_is_required_the_migration_is_done() async throws {
		given(credentialsDb.getCredentialEncryptionKey()).willReturn(encCredentialsKey)
		given(credentialsDb.getCredentialEncryptionMode()).willReturn(CredentialEncryptionMode.deviceLock)
		given(keychainEncryption.requiresKeyAccessMigration()).willReturn(true)
		given(credentialsDb.getAll()).willReturn([encryptedCredentials1])
		given(await keychainEncryption.decryptUsingKeychain(encCredentialsKey, .deviceLock)).willReturn(decCredentialsKey)
		given(cryptoFns.aesDecryptData(encryptedCredentials1.databaseKey!.data, withKey: decCredentialsKey)).willReturn(decryptedCredentials1.databaseKey!.data)
		given(cryptoFns.aesDecryptData(encryptedCredentials1.accessToken.data, withKey: decCredentialsKey))
			.willReturn(decryptedCredentials1.accessToken.data(using: .utf8)!)
		given(await keychainEncryption.encryptUsingKeychain(decCredentialsKey, .deviceLock)).willReturn(reEncryptedCredentialsKey)
		let loadedCredential = try await facade.loadByUserId("user1")
		XCTAssertEqual(decryptedCredentials1, loadedCredential)
		verify(credentialsDb.setCredentialEncryptionKey(encryptionKey: reEncryptedCredentialsKey)).wasCalled()
	}

	func test_store_$_when_there_is_no_key_it_generates_and_stores_one() async throws {
		given(credentialsDb.getCredentialEncryptionKey()).willReturn(nil)
		given(cryptoFns.aesGenerateKey()).willReturn(decCredentialsKey)
		given(credentialsDb.getCredentialEncryptionMode()).willReturn(CredentialEncryptionMode.deviceLock)
		given(credentialsDb.getAll()).willReturn([])
		given(await keychainEncryption.encryptUsingKeychain(decCredentialsKey, .deviceLock)).willReturn(encCredentialsKey)
		given(cryptoFns.aesEncryptData(decryptedCredentials1.databaseKey!.data, withKey: decCredentialsKey, withIV: any()))
			.willReturn(encryptedCredentials1.databaseKey!.data)
		given(cryptoFns.aesEncryptData(decryptedCredentials1.accessToken.data(using: .utf8)!, withKey: decCredentialsKey, withIV: any()))
			.willReturn(encryptedCredentials1.accessToken.data)
		try await facade.store(decryptedCredentials1)
		verify(credentialsDb.store(credentials: encryptedCredentials1)).wasCalled()
	}

	func test_migrate_stores_everything() async throws {
		try await facade.migrateToNativeCredentials([encryptedCredentials1, encryptedCredentials2], .biometrics, encCredentialsKey.wrap())
		verify(credentialsDb.setCredentialEncryptionKey(encryptionKey: encCredentialsKey)).wasCalled()
		verify(credentialsDb.setCredentialEncryptionMode(encryptionMode: .biometrics)).wasCalled()
		verify(credentialsDb.store(credentials: encryptedCredentials1)).wasCalled()
		verify(credentialsDb.store(credentials: encryptedCredentials2)).wasCalled()
	}
}

extension CredentialsInfo: Equatable {
	public static func == (lhs: CredentialsInfo, rhs: CredentialsInfo) -> Bool { lhs.login == rhs.login && lhs.userId == rhs.userId && lhs.type == rhs.type }
}

extension DataWrapper: Equatable { public static func == (lhs: DataWrapper, rhs: DataWrapper) -> Bool { lhs.data == rhs.data } }

extension PersistedCredentials: Equatable {
	public static func == (lhs: PersistedCredentials, rhs: PersistedCredentials) -> Bool {
		lhs.credentialInfo == rhs.credentialInfo && lhs.accessToken == rhs.accessToken && lhs.databaseKey == rhs.databaseKey
			&& lhs.encryptedPassword == rhs.encryptedPassword
	}
}

extension UnencryptedCredentials: Equatable {
	public static func == (lhs: UnencryptedCredentials, rhs: UnencryptedCredentials) -> Bool {
		lhs.credentialInfo == rhs.credentialInfo && lhs.accessToken == rhs.accessToken && lhs.databaseKey == rhs.databaseKey
			&& lhs.encryptedPassword == rhs.encryptedPassword
	}
}
