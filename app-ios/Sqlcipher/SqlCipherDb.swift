import Foundation

public final class SqlCipherDb: SqliteDb, @unchecked Sendable {

	public init(filePath: String, dbKey: Data) throws {
		super.init(dbPath: filePath)

		let rawKeyData: NSData = dbKey as NSData
		let rawKeyPtr: UnsafeRawPointer = rawKeyData.bytes

		let rc_key = sqlite3_key(self.db, rawKeyPtr, Int32(rawKeyData.count))
		if rc_key != SQLITE_OK {
			let errmsg = self.getLastErrorMessage()
			fatalError("Error setting key: \(errmsg)")
		}
		let errors = try! self.prepare(query: "PRAGMA cipher_integrity_check").all()
		if !errors.isEmpty { throw SqlcipherError.intergrityCheck }
		// have to initialize signal tokenizer late because we need to setup sqlite3_key before we can do any queries
		self.setupSignalTokenizer()
	}
	private func setupSignalTokenizer() {
		var api = UsefulSqlite3ApiRoutines(
			malloc64: sqlite3_malloc64,
			prepare: sqlite3_prepare,
			bind_pointer: sqlite3_bind_pointer,
			finalize: sqlite3_finalize,
			step: sqlite3_step,
			libversion_number: sqlite3_libversion_number
		)
		var errMsg: UnsafeMutablePointer<CChar>?
		let extensionLoadResult = signal_fts5_tokenizer_init_static(self.db, &errMsg, &api)
		if extensionLoadResult != SQLITE_OK {
			let error: String? = if let errMsg = sqlite3_errmsg(self.db) { String(cString: errMsg) } else { nil }
			let swiftErrorMsg: String? = if let errMsg { String(cString: errMsg) } else { nil }
			fatalError("Could not load fts5 extension \(swiftErrorMsg ?? "") \(error ?? "")")
		}
	}
}
