import Foundation

/* that type is just too long */typealias SqliteDestructor = (@convention(c) (UnsafeMutableRawPointer?) -> Void)?

public class SqliteStatement {
	private let originalQuery: String
	private let stmt: OpaquePointer
	private let db: SqliteDb
	// this evilness is required because SQLITE_TRANSIENT and SQLITE_STATIC are defined in slqite3.h but it's not accepted by swift.
	private static let LIFETIME_TRANSIENT: SqliteDestructor = unsafeBitCast(-1, to: sqlite3_destructor_type.self)
	private static let LIFETIME_STATIC: SqliteDestructor = unsafeBitCast(0, to: sqlite3_destructor_type.self)

	public init(db: SqliteDb, query: String, stmt: OpaquePointer) {
		self.stmt = stmt
		self.db = db
		self.originalQuery = query
	}

	public func bindParams(_ params: [TaggedSqlValue]) throws -> Self {

		for (i, param) in params.enumerated() {
			// apparently, param indices start at 1
			try! self.bindSingleParam(param, Int32(i + 1))
		}

		return self
	}

	private func bindSingleParam(_ param: TaggedSqlValue, _ i: Int32) throws {
		var rc_bind = SQLITE_ERROR

		switch param {
		case .null: rc_bind = sqlite3_bind_null(self.stmt, i)
		case .number(let value): rc_bind = sqlite3_bind_int64(self.stmt, i, Int64(value))
		case .string(let value):
			let nsText = value as NSString
			let textCStr = UnsafeMutablePointer<CChar>(mutating: nsText.utf8String)
			rc_bind = sqlite3_bind_text64(
				self.stmt,  // statement to bind value to
				i,  // index of the "?" to bind to
				textCStr,  // pointer of the c-string to bind
				UInt64(value.utf8.count),  // byte length of the string
				SqliteStatement.LIFETIME_TRANSIENT,  // lifetime of the third param (we remain responsible, sqlite copies the buffer).
				UInt8(SQLITE_UTF8)  // encoding id
			)
		case .bytes(let value):
			rc_bind = sqlite3_bind_blob(
				self.stmt,  // statement to bind value to
				i,  // index of the "?" to bind to
				(value.data as NSData).bytes,  // pointer to the buffer
				Int32(value.data.count),  // byte size of the buffer
				SqliteStatement.LIFETIME_TRANSIENT
			)
		}

		if rc_bind != SQLITE_OK { fatalError("couldn't bind param \(i) \(self.db.getLastErrorMessage()) in \(self.originalQuery)") }
	}

	/// execute a query, don't return anything
	public func run() {
		let rc_step = sqlite3_step(self.stmt)
		if rc_step == SQLITE_ERROR {
			let errmsg = self.db.getLastErrorMessage()
			fatalError("error in run \(errmsg)")
		}
	}

	/// return the first row from a query
	public func get() -> [String: TaggedSqlValue]? {
		let res = self.all()
		if res.count > 1 {
			// if this is ever triggered, we either need to rewrite the query to contain
			// a LIMIT clause or make all() lazy for performance reasons.
			fatalError("got more than one result for get()")
		}
		return res.first
	}

	/// return all rows from a query
	public func all() -> [[String: TaggedSqlValue]] {
		var rc = sqlite3_step(self.stmt)
		var res: [[String: TaggedSqlValue]] = []
		while rc != SQLITE_DONE {
			if rc != SQLITE_ROW { fatalError("expected row, got \(rc)") }
			let n_cols = sqlite3_column_count(self.stmt)
			var row_content: [String: TaggedSqlValue] = [:]
			for index in 0...(n_cols - 1) { row_content[self.getColumnName(index)] = self.getColumnContent(index) }
			res.append(row_content)
			rc = sqlite3_step(self.stmt)
		}
		return res
	}

	/// get the name of the current rows column i as a string
	private func getColumnName(_ i: Int32) -> String {
		let col_name = sqlite3_column_name(self.stmt, i)
		if col_name == nil { fatalError("tried to get invalid column name!") }
		return String(cString: col_name!)
	}

	/// gets the contents of the current rows column with index i
	/// will check the type and then delegate to the appropriate access method
	private func getColumnContent(_ i: Int32) -> TaggedSqlValue {
		let type_id = sqlite3_column_type(self.stmt, i)
		// we currently only store text and blobs in the db
		// we support integer to retrieve the auto_vacuum mode: 0 (NONE) | 1 (FULL) | 2 (INCREMENTAL)
		switch type_id {
		case SQLITE_TEXT: return self.getColumnText(i)
		case SQLITE_BLOB: return self.getColumnBlob(i)
		case SQLITE_INTEGER: return self.getColumnInteger(i)
		case SQLITE_NULL: return .null
		default: fatalError("unexpected type id in column \(i): \(type_id)")
		}
	}

	/// return a string from the current rows column i
	/// use after checking that the column contains a string.
	private func getColumnText(_ i: Int32) -> TaggedSqlValue {
		let text = sqlite3_column_text(self.stmt, i)
		if text == nil { fatalError("null return in text column \(i)") }
		return .string(value: String(cString: text!))
	}

	/// return a blob from the current rows column i
	/// use after checking that the column contains a blob.
	private func getColumnBlob(_ i: Int32) -> TaggedSqlValue {
		let blob = sqlite3_column_blob(self.stmt, i)
		let count = Int(sqlite3_column_bytes(self.stmt, i))
		if count == 0 {
			return .bytes(value: Data([]).wrap())
		} else if blob == nil {
			// blob == null and count != 0 is an error condition
			fatalError("got blob nullptr but nonzero len, err \(self.db.getLastErrorCode()): \(self.db.getLastErrorMessage())")
		} else {
			let data = Data(bytes: blob!, count: count)
			return .bytes(value: data.wrap())
		}
	}

	/// return an integer from the current rows column i
	/// use after checking that the column contains an integer.
	private func getColumnInteger(_ i: Int32) -> TaggedSqlValue {
		let integer = sqlite3_column_int(self.stmt, i)
		return .number(value: Int(integer))
	}

	deinit { sqlite3_finalize(self.stmt) }
}
