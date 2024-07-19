import TutanotaSharedFramework
import XCTest

final class CredentialsDatabaseTest: XCTestCase {
	private var storage: CredentialsDatabase!

	private let encryptedCredentials1 = PersistedCredentials(
		credentialInfo: CredentialsInfo(login: "login1@test.com", userId: "user1", type: CredentialType._internal),
		accessToken: Data([0x01, 0x0a, 0x0e]).wrap(),
		databaseKey: Data([0x01, 0x0d, 0x0e]).wrap(),
		encryptedPassword: "pw1",
		encryptedPassphraseKey: nil
	)

	private let encryptedCredentials2 = PersistedCredentials(
		credentialInfo: CredentialsInfo(login: "login2@test.com", userId: "user2", type: CredentialType._internal),
		accessToken: Data([0x02, 0x0a, 0x0e]).wrap(),
		databaseKey: Data([0x02, 0x0d, 0x0e]).wrap(),
		encryptedPassword: "pw1",
		encryptedPassphraseKey: Data([0x02, 0x0b, 0x0e]).wrap()
	)
	private let key1 = Data([0x04, 0x0e, 0x04, 0x01])
	private let key2 = Data([0x04, 0x0e, 0x04, 0x02])

	override func setUpWithError() throws {
		storage = try CredentialsDatabase(dbPath: ":memory:")
		try storage.store(credentials: encryptedCredentials1)
		try storage.store(credentials: encryptedCredentials2)
	}

	func test_credentialEncryptionKey_when_there_is_none_it_returns_null() throws { try XCTAssertNil(storage.getCredentialEncryptionKey()) }

	func test_credentialEncryptionKey_it_returns_one_after_writing() throws {
		try storage.setCredentialEncryptionKey(encryptionKey: key1)
		try XCTAssertEqual(key1, storage.getCredentialEncryptionKey())
	}

	func test_credentialEncryptionKey_it_returns_one_after_overwriting() throws {
		try storage.setCredentialEncryptionKey(encryptionKey: key1)
		try storage.setCredentialEncryptionKey(encryptionKey: key2)
		try XCTAssertEqual(key2, storage.getCredentialEncryptionKey())
	}

	func test_credentialEncryptionKey_it_returns_null_after_writing_null() throws {
		try storage.setCredentialEncryptionKey(encryptionKey: key1)
		try storage.setCredentialEncryptionKey(encryptionKey: nil)
		try XCTAssertNil(storage.getCredentialEncryptionKey())
	}

	func test_credentialEncryptionMode_when_there_is_none_it_returns_null() throws { try XCTAssertNil(storage.getCredentialEncryptionMode()) }

	func test_credentialEncryptionMode_it_returns_one_after_writing() throws {
		try storage.setCredentialEncryptionMode(encryptionMode: .systemPassword)
		try XCTAssertEqual(CredentialEncryptionMode.systemPassword, storage.getCredentialEncryptionMode())
	}

	func test_credentialEncryptionMode_it_returns_one_after_overwriting() throws {
		try storage.setCredentialEncryptionMode(encryptionMode: .systemPassword)
		try storage.setCredentialEncryptionMode(encryptionMode: .deviceLock)
		try XCTAssertEqual(CredentialEncryptionMode.deviceLock, storage.getCredentialEncryptionMode())
	}

	func test_credentialEncryptionMode_it_returns_null_after_writing_null() throws {
		try storage.setCredentialEncryptionMode(encryptionMode: .systemPassword)
		try storage.setCredentialEncryptionMode(encryptionMode: nil)
		try XCTAssertNil(storage.getCredentialEncryptionMode())
	}

	func test_credentials_getAllCredentials_returns_all_after_storing() throws {
		try XCTAssertEqual([encryptedCredentials1, encryptedCredentials2], storage.getAll())
	}

	func test_credentials_doesnt_return_after_deleteByUserId() throws {
		try storage.delete(userId: encryptedCredentials1.credentialInfo.userId)
		try XCTAssertEqual([encryptedCredentials2], storage.getAll())
	}

	func test_credentials_doesnt_return_after_deleteAll() throws {
		try storage.deleteAllCredentials()
		try XCTAssertEqual([], storage.getAll())
	}
}
