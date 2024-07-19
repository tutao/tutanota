/// Swift wrapper around sqlite
open class SqliteDb {
	public private(set) var db: OpaquePointer?

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
		let rc = sqlite3_exec(self.db, sql, nil, nil, nil)
		if rc != SQLITE_OK {
			let errmsg = self.getLastErrorMessage()

			throw TUTErrorFactory.createError("Could not exec: \(errmsg). sql: \(sql)")
		}
	}

	public func prepare(query: String) throws -> SqliteStatement {
		var stmt: OpaquePointer?
		let sqlCStr = UnsafeMutablePointer<CChar>(mutating: (query as NSString).utf8String)
		// db pointer, query, max query length, OUT statement handle, OUT pointer to unused portion of query (?)
		let rc_prep = sqlite3_prepare_v2(self.db, sqlCStr, -1, &stmt, nil)
		if rc_prep != SQLITE_OK || stmt == nil {
			let errmsg = self.getLastErrorMessage()

			throw TUTErrorFactory.createError("Could not prepare statement: \(errmsg). Query: \(query)")
		}
		return SqliteStatement(db: self, query: query, stmt: stmt.unsafelyUnwrapped)
	}

	public func vacuum() { try! self.prepare(query: "PRAGMA incremental_vacuum").run() }

	public func getLastErrorMessage() -> String { String(cString: sqlite3_errmsg(self.db)) }

	public func getLastErrorCode() -> Int32 { sqlite3_errcode(self.db) }

	private func close() {
		if sqlite3_close(self.db) != SQLITE_OK {
			let errmsg = self.getLastErrorMessage()
			TUTSLog("Error closing database: \(errmsg): \(self.getLastErrorMessage())")  // ignore
		}
	}
}
