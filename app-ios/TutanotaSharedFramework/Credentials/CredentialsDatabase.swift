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
				CREATE TABLE IF NOT EXISTS credentials
				(login TEXT NOT NULL,
				userId TEXT NOT NULL,
				type TEXT NOT NULL,
				accessToken BLOB NOT NULL,
				databaseKey BLOB,
				encryptedPassword TEXT NOT NULL,
				PRIMARY KEY (userId),
				UNIQUE(login))
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
	}

	public func getAll() throws -> [PersistedCredentials] {
		try db.prepare(
			query: """
				SELECT * FROM credentials
				"""
		)
		.all()
		.map { sqlRow in
			let credentialsInfo = CredentialsInfo(
				login: try sqlRow["login"]!.unwrapString(),
				userId: try sqlRow["userId"]!.unwrapString(),
				type: CredentialType(rawValue: try sqlRow["type"]!.unwrapString())!
			)

			let databaseKey: DataWrapper? = if case let .bytes(value) = sqlRow["databaseKey"] { value } else { nil }
			return PersistedCredentials(
				credentialInfo: credentialsInfo,
				accessToken: try sqlRow["accessToken"]!.unwrapBytes().wrap(),
				databaseKey: databaseKey,
				encryptedPassword: try sqlRow["encryptedPassword"]!.unwrapString()
			)
		}
	}

	public func store(credentials: PersistedCredentials) throws {
		let databaseKey: TaggedSqlValue = if let databaseKey = credentials.databaseKey { .bytes(value: databaseKey) } else { .null }
		try db.prepare(
			query: """
				INSERT INTO credentials (login, userId, type, accessToken, databaseKey, encryptedPassword) 
				VALUES (?, ?, ?, ?, ?, ?)
				"""
		)
		.bindParams([
			.string(value: credentials.credentialInfo.login), .string(value: credentials.credentialInfo.userId),
			.string(value: credentials.credentialInfo.type.rawValue), .bytes(value: credentials.accessToken), databaseKey,
			.string(value: credentials.encryptedPassword),
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
	struct InvalidSqlType: Error { init() {} }

	func unwrapString() throws -> String { if case let .string(value) = self { return value } else { throw InvalidSqlType() } }
	func unwrapBytes() throws -> Data { if case let .bytes(value) = self { return value.data } else { throw InvalidSqlType() } }
}
