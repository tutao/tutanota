import Foundation

class SqlCipherDb {
	private var db: OpaquePointer?
	let userId: String

	init(_ userId: String) { self.userId = userId }

	func open(_ dbKey: Data) throws {
		TUTSLog("opening DB for \(userId)")
		let rawKeyData: NSData = dbKey as NSData
		let rawKeyPtr: UnsafeRawPointer = rawKeyData.bytes
		let file_name = makeDbPath(self.userId).absoluteString
		let rc_open = sqlite3_open_v2(
			file_name,  // file name
			&(self.db),  // db connection
			SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE,  // flags
			nil  // vfs module name
		)
		if rc_open != SQLITE_OK {
			let errmsg = self.getLastErrorMessage()
			self.close()
			fatalError("Error opening database: \(errmsg)")
		}
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

	func prepare(query: String) throws -> SqlCipherStatement {
		var stmt: OpaquePointer?
		let sqlCStr = UnsafeMutablePointer<CChar>(mutating: (query as NSString).utf8String)
		// db pointer, query, max query length, OUT statement handle, OUT pointer to unused portion of query (?)
		let rc_prep = sqlite3_prepare_v2(self.db, sqlCStr, -1, &stmt, nil)
		if rc_prep != SQLITE_OK || stmt == nil {
			let errmsg = self.getLastErrorMessage()

			throw TUTErrorFactory.createError("Could not prepare statement: \(errmsg). Query: \(query)")
		}
		return SqlCipherStatement(db: self, query: query, stmt: stmt.unsafelyUnwrapped)
	}

	func close() {
		if sqlite3_close(self.db) != SQLITE_OK {
			let errmsg = self.getLastErrorMessage()
			TUTSLog("Error closing database: \(errmsg): \(self.getLastErrorMessage())")  // ignore
		}
		self.db = nil
	}

	func vacuum() { try! self.prepare(query: "PRAGMA incremental_vacuum").run() }

	func getLastErrorMessage() -> String { String(cString: sqlite3_errmsg(self.db)) }

	func getLastErrorCode() -> Int32 { sqlite3_errcode(self.db) }
}

func makeDbPath(_ userId: String) -> URL {
	let fileName = "offline_\(userId).sqlite"
	let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
	return docs.appendingPathComponent(fileName)
}
