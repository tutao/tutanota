public class CredentialsDatabase {
	private let db: SqliteDb

	public init(db: SqliteDb) throws {
		self.db = db
		let dbPath = makeDbPath(fileName: "credentials.sqlite")
		try db.open(dbPath: dbPath.absoluteString)
		try self.createCredentialTable()
	}

	public func createCredentialTable() throws {
		try db.prepare(
			query: """
				CREATE TABLE IF NOT EXISTS credentials
				(login TEXT NOT NULL,
				userId TEXT NOT NULL,
				type TEXT NOT NULL,
				accessToken TEXT NOT NULL,
				databaseKey TEXT,
				encryptedPassword TEXT NOT NULL,
				PRIMARY KEY (userId),
				UNIQUE(login))
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
				login: try sqlRow["login"]!.asString(),
				userId: try sqlRow["userId"]!.asString(),
				type: CredentialType(rawValue: try sqlRow["type"]!.asString())!
			)

			let databaseKey: String? = if case let .string(value) = sqlRow["databaseKey"] { value } else { nil }
			return PersistedCredentials(
				credentialsInfo: credentialsInfo,
				accessToken: try sqlRow["accessToken"]!.asString(),
				databaseKey: databaseKey,
				encryptedPassword: try sqlRow["encryptedPassword"]!.asString()
			)
		}
	}

	public func store(credentials: PersistedCredentials) throws {
		let databaseKey: TaggedSqlValue = if let databaseKey = credentials.databaseKey { .string(value: databaseKey) } else { .null }
		try db.prepare(
			query: """
				INSERT INTO credentials (login, userId, type, accessToken, databaseKey, encryptedPassword) 
				VALUES (?, ?, ?, ?, ?, ?)
				"""
		)
		.bindParams([
			.string(value: credentials.credentialsInfo.login), .string(value: credentials.credentialsInfo.userId),
			.string(value: credentials.credentialsInfo.type.rawValue), .string(value: credentials.accessToken), databaseKey,
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
}

private extension TaggedSqlValue {
	struct InvalidSqlType: Error { init() {} }

	func asString() throws -> String { if case let .string(value) = self { return value } else { throw InvalidSqlType() } }
}
