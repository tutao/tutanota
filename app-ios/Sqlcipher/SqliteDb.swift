/// SQLite database
///
/// Will open or create database on construction and close it on deinit.
///
/// This version does not set the key for SQLCipher nor loads `signal_tokenizer`.
/// See `SqlCipherDb` for that functionality.
///
/// Example usage:
///
///		let db = SqliteDb(dbPath: "mydb.sqlite")
///		let statement = try db.prepare(query: "SELECT id FROM mytable WHERE name = ?")
///		let rows = try statement.bindParams([.string(value: "myname")]).all()
public class SqliteDb:
	// Sqlite itself is compiled with thread-safe. The only field is db pointer
	// and the pointers are not sendable\
	// see https://github.com/swiftlang/swift/issues/70396#issuecomment-1851497237
	@unchecked Sendable
{
	public let db: OpaquePointer?

	public init(dbPath: String) {
		var dbPointer: OpaquePointer?
		let rc_open = sqlite3_open_v2(
			dbPath,  // file name
			&(dbPointer),  // address of a db pointer
			SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE,  // flags, will create db if it doesn't exist
			nil  // vfs module name
		)
		// A database connection handle is usually returned in *ppDb, even if an error occurs.
		// The only exception is that if SQLite is unable to allocate memory to hold the sqlite3 object,
		// a NULL will be written into *ppDb instead of a pointer to the sqlite3 object.
		self.db = dbPointer
		if rc_open != SQLITE_OK {
			let errmsg = self.getLastErrorMessage()
			fatalError("Error opening database: \(errmsg)")
		}
	}
	deinit { close() }
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
			throw SqlcipherError.exec(message: errmsg, sql: sql)
		}
	}

	/// Prepare `SqliteStatement` to be executed
	/// - Throws: `SqlCipherError.prepare`
	public func prepare(query: String) throws -> SqliteStatement {
		var stmt: OpaquePointer?
		let sqlCStr = UnsafeMutablePointer<CChar>(mutating: (query as NSString).utf8String)
		let rc_prep = sqlite3_prepare_v2(
			// db pointer
			self.db,
			// query
			sqlCStr,
			// max query length
			-1,
			// OUT statement handle
			&stmt,
			// OUT pointer to unused portion of query
			nil
		)
		if rc_prep != SQLITE_OK || stmt == nil {
			let errmsg = self.getLastErrorMessage()
			throw SqlcipherError.prepare(message: errmsg, sql: query)
		}
		return SqliteStatement(db: self, query: query, stmt: stmt.unsafelyUnwrapped)
	}

	/// Execute database compaction
	public func vacuum() { try! self.prepare(query: "PRAGMA incremental_vacuum").run() }

	public func getLastErrorMessage() -> String { String(cString: sqlite3_errmsg(self.db)) }

	public func getLastErrorCode() -> Int32 { sqlite3_errcode(self.db) }

	private func close() {
		if sqlite3_close(self.db) != SQLITE_OK {
			let errmsg = self.getLastErrorMessage()
			print("Error closing database: \(errmsg): \(self.getLastErrorMessage())")  // ignore
		}
	}
}
