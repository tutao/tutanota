/// Access and modify credentials and related data.
/// Separate protocol to facilitate mocking.
public protocol CredentialsStorage {
	func getAll() throws -> [PersistedCredentials]
	func store(credentials: PersistedCredentials) throws
	func delete(userId: String) throws
	func getCredentialEncryptionMode() throws -> CredentialEncryptionMode?
	func getCredentialEncryptionKey() throws -> Data?
	func setCredentialEncryptionMode(encryptionMode: CredentialEncryptionMode?) throws
	func setCredentialEncryptionKey(encryptionKey: Data?) throws
	func deleteAllCredentials() throws
}

public func credentialsDatabasePath() -> URL { makeDbPath(fileName: "credentials.sqlite") }

public class CredentialsDatabase: CredentialsStorage {
	private let db: SqliteDb

	public init(dbPath: String) throws {
		self.db = SqliteDb(dbPath: dbPath)
		try self.createTables()
	}

	private func createTables() throws {
		try db.prepare(
			query: """
				CREATE TABLE IF NOT EXISTS meta (key TEXT NOT NULL, value TEXT)
				"""
		)
		.run()
		try db.prepare(
			query: """
				CREATE TABLE IF NOT EXISTS credentials
				(login TEXT NOT NULL UNIQUE,
				userId TEXT NOT NULL PRIMARY KEY,
				type TEXT NOT NULL,
				accessToken BLOB NOT NULL,
				databaseKey BLOB,
				encryptedPassword TEXT NOT NULL)
				"""
		)
		.run()
		// A table that restricts encryptionMode types
		try db.prepare(
			query: """
				CREATE TABLE IF NOT EXISTS credentialEncryptionModeEnum (mode TEXT UNIQUE)
				"""
		)
		.run()
		for mode in CredentialEncryptionMode.allCases {
			try db.prepare(query: "INSERT OR REPLACE INTO credentialEncryptionModeEnum (mode) VALUES (?)").bindParams([.string(value: mode.rawValue)]).run()
		}
		// A table with a single row
		try db.prepare(
			query: """
				CREATE TABLE IF NOT EXISTS credentialEncryptionMode (id INTEGER NOT NULL,
				credentialEncryptionMode TEXT NOT NULL, FOREIGN KEY(credentialEncryptionMode) REFERENCES credentialEncryptionModeEnum(mode), PRIMARY KEY (id), CHECK (id=0))
				"""
		)
		.run()
		// A table with a single row
		try db.prepare(
			query: """
				CREATE TABLE IF NOT EXISTS credentialEncryptionKey (id INTEGER NOT NULL,
				credentialEncryptionKey BLOB NOT NULL, PRIMARY KEY (id), CHECK (id=0))
				"""
		)
		.run()
		let version = try db.prepare(query: "SELECT value FROM meta WHERE key = 'version'").get()?["value"]
		switch version {
		case .some(.null), .none:
			// v1 adds encryptedPassphraseKey and version field
			try db.transaction {
				try self.db.prepare(query: "ALTER TABLE credentials ADD COLUMN encryptedPassphraseKey BLOB").run()
				try self.db.prepare(query: "INSERT INTO meta VALUES ('version', '1')").run()
			}
		default: break
		}
	}

	public func getAll() throws -> [PersistedCredentials] {
		try db.prepare(
			query: """
				SELECT * FROM credentials
				"""
		)
		.all().map { sqlRow in try readCredentials(sqlRow: sqlRow) }
	}
	private func readCredentials(sqlRow: [String: TaggedSqlValue]) throws -> PersistedCredentials {
		let credentialsInfo = CredentialsInfo(
			login: try sqlRow["login"]!.unwrapString(),
			userId: try sqlRow["userId"]!.unwrapString(),
			type: CredentialType(rawValue: try sqlRow["type"]!.unwrapString())!
		)

		return PersistedCredentials(
			credentialInfo: credentialsInfo,
			accessToken: try sqlRow["accessToken"]!.unwrapBytes().wrap(),
			databaseKey: try sqlRow["databaseKey"]!.unwrapOptionalBytes().map { $0.wrap() },
			encryptedPassword: try sqlRow["encryptedPassword"]!.unwrapString(),
			encryptedPassphraseKey: try sqlRow["encryptedPassphraseKey"]!.unwrapOptionalBytes().map { $0.wrap() }
		)
	}

	public func store(credentials: PersistedCredentials) throws {
		let databaseKey: TaggedSqlValue = if let databaseKey = credentials.databaseKey { .bytes(value: databaseKey) } else { .null }
		let encryptedPassword: TaggedSqlValue = .string(value: credentials.encryptedPassword)
		let encryptedPassphraseKey: TaggedSqlValue = if let key = credentials.encryptedPassphraseKey { .bytes(value: key) } else { .null }
		try db.prepare(
			query: """
				INSERT OR REPLACE INTO credentials (login, userId, type, accessToken, databaseKey, encryptedPassword, encryptedPassphraseKey)
				VALUES (?, ?, ?, ?, ?, ?, ?)
				"""
		)
		.bindParams([
			.string(value: credentials.credentialInfo.login), .string(value: credentials.credentialInfo.userId),
			.string(value: credentials.credentialInfo.type.rawValue), .bytes(value: credentials.accessToken), databaseKey, encryptedPassword,
			encryptedPassphraseKey,
		])
		.run()
	}

	public func delete(userId: String) throws {
		try db.prepare(
			query: """
				DELETE FROM credentials WHERE userId == ?
				"""
		)
		.bindParams([.string(value: userId)]).run()
	}

	public func getCredentialEncryptionMode() throws -> CredentialEncryptionMode? {
		try db
			.prepare(
				query: """
					SELECT credentialEncryptionMode FROM credentialEncryptionMode LIMIT 1
					"""
			)
			.get()?["credentialEncryptionMode"]
			.flatMap { mode in CredentialEncryptionMode(rawValue: try mode.unwrapString()) }
	}

	public func getCredentialEncryptionKey() throws -> Data? {
		try db
			.prepare(
				query: """
					SELECT credentialEncryptionKey FROM credentialEncryptionKey LIMIT 1
					"""
			)
			.get()?["credentialEncryptionKey"]?
			.unwrapBytes()
	}

	public func setCredentialEncryptionMode(encryptionMode: CredentialEncryptionMode?) throws {
		if let encryptionMode {
			try db.prepare(
				query: """
					INSERT OR REPLACE INTO credentialEncryptionMode (id, credentialEncryptionMode) VALUES (0, ?)
					"""
			)
			.bindParams([.string(value: encryptionMode.rawValue)]).run()
		} else {
			try db.prepare(
				query: """
					DELETE FROM credentialEncryptionMode
					"""
			)
			.run()
		}
	}

	public func setCredentialEncryptionKey(encryptionKey: Data?) throws {
		if let encryptionKey {
			try db.prepare(
				query: """
					INSERT OR REPLACE INTO credentialEncryptionKey (id, credentialEncryptionKey) VALUES (0, ?)
					"""
			)
			.bindParams([.bytes(value: encryptionKey.wrap())]).run()
		} else {
			try db.prepare(
				query: """
					DELETE FROM credentialEncryptionKey
					"""
			)
			.run()
		}
	}

	public func deleteAllCredentials() throws {
		try db.prepare(
			query: """
				DELETE FROM credentials
				"""
		)
		.run()
	}
}

private extension TaggedSqlValue {
	struct InvalidSqlType: Error {}

	func unwrapString() throws -> String { if case let .string(value) = self { return value } else { throw InvalidSqlType() } }
	func unwrapBytes() throws -> Data { if case let .bytes(value) = self { return value.data } else { throw InvalidSqlType() } }
	func unwrapOptionalString() throws -> String? {
		switch self {
		case .null: nil
		case let .string(s): s
		default: throw TaggedSqlValue.InvalidSqlType()
		}
	}
	func unwrapOptionalBytes() throws -> Data? {
		switch self {
		case .null: nil
		case let .bytes(b): b.data
		default: throw TaggedSqlValue.InvalidSqlType()
		}
	}
}
