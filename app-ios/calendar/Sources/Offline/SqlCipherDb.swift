import Foundation

class SqlCipherDb: SqliteDb {
	let userId: String

	init(userId: String, dbKey: Data) throws {
		TUTSLog("opening DB for \(userId)")
		self.userId = userId
		let filePath = makeDbPath(self.userId).absoluteString

		super.init(dbPath: filePath)

		let rawKeyData: NSData = dbKey as NSData
		let rawKeyPtr: UnsafeRawPointer = rawKeyData.bytes

		let rc_key = sqlite3_key(self.db, rawKeyPtr, Int32(rawKeyData.count))
		if rc_key != SQLITE_OK {
			let errmsg = self.getLastErrorMessage()
			fatalError("Error setting key: \(errmsg)")
		}
		let errors = try! self.prepare(query: "PRAGMA cipher_integrity_check").all()
		if !errors.isEmpty {
			throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "sqlcipher: \(errors.count) pages failed integrity check")
		}

		// We are using the auto_vacuum=incremental mode to allow for a faster vacuum execution
		// After changing the auto_vacuum mode we need to run "vacuum" once
		// auto_vacuum mode: 0 (NONE) | 1 (FULL) | 2 (INCREMENTAL)
		let autoVacuumMode = try? self.prepare(query: "PRAGMA auto_vacuum").get()?.first?.value
		if case let .number(autoVacuumModeValue) = autoVacuumMode, autoVacuumModeValue != 2 {
			try! self.prepare(query: "PRAGMA auto_vacuum = incremental").run()
			try! self.prepare(query: "PRAGMA vacuum").run()
		}
	}
}

func makeDbPath(_ userId: String) -> URL {
	let fileName = "offline_\(userId).sqlite"
	return makeDbPath(fileName: fileName)
}
