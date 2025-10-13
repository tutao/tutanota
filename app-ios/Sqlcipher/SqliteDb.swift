/// Swift wrapper around sqlite
open class SqliteDb {
	public private(set) var db: OpaquePointer?
	private var signalTokenizerLoaded: Bool = false

	public init(dbPath: String) {
		let rc_open = sqlite3_open_v2(
			dbPath,  // file name
			&(self.db),  // db connection
			SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE,  // flags
			nil  // vfs module name
		)
		if rc_open != SQLITE_OK {
			let errmsg = self.getLastErrorMessage()
			fatalError("Error opening database: \(errmsg)")
		}
	}
	deinit {
		close()
		self.db = nil
	}
	public func transaction(actions: () throws -> Void) throws {
		try self.exec(sql: "BEGIN")
		do { try actions() } catch {
			try self.exec(sql: "ROLLBACK TRANSACTION")
			throw error
		}
		try self.exec(sql: "COMMIT")
	}
	private func exec(sql: String) throws {
		self.setupSignalTokenizer()
		let rc = sqlite3_exec(self.db, sql, nil, nil, nil)
		if rc != SQLITE_OK {
			let errmsg = self.getLastErrorMessage()
			throw SqlcipherError.exec(message: errmsg, sql: sql)
		}
	}

	public func prepare(query: String) throws -> SqliteStatement {
		self.setupSignalTokenizer()
		var stmt: OpaquePointer?
		let sqlCStr = UnsafeMutablePointer<CChar>(mutating: (query as NSString).utf8String)
		// db pointer, query, max query length, OUT statement handle, OUT pointer to unused portion of query (?)
		let rc_prep = sqlite3_prepare_v2(self.db, sqlCStr, -1, &stmt, nil)
		if rc_prep != SQLITE_OK || stmt == nil {
			let errmsg = self.getLastErrorMessage()
			throw SqlcipherError.prepare(message: errmsg, sql: query)
		}
		return SqliteStatement(db: self, query: query, stmt: stmt.unsafelyUnwrapped)
	}

	public func vacuum() { try! self.prepare(query: "PRAGMA incremental_vacuum").run() }

	public func getLastErrorMessage() -> String { String(cString: sqlite3_errmsg(self.db)) }

	public func getLastErrorCode() -> Int32 { sqlite3_errcode(self.db) }

	private func close() {
		if sqlite3_close(self.db) != SQLITE_OK {
			let errmsg = self.getLastErrorMessage()
			print("Error closing database: \(errmsg): \(self.getLastErrorMessage())")  // ignore
		}
	}

	private func setupSignalTokenizer() {
		// have to initialize signal tokenizer late because we need to setup sqlite3_key before we can do any queries

		if signalTokenizerLoaded { return }
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
		signalTokenizerLoaded = true
	}
}
