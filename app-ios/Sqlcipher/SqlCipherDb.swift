import Foundation

open class SqlCipherDb: SqliteDb {

	public init(filePath: String, dbKey: Data) throws {
		super.init(dbPath: filePath)

		// FIXME: without nsdata maybe
		let rawKeyData: NSData = dbKey as NSData
		let rawKeyPtr: UnsafeRawPointer = rawKeyData.bytes

		let rc_key = sqlite3_key(self.db, rawKeyPtr, Int32(rawKeyData.count))
		if rc_key != SQLITE_OK {
			let errmsg = self.getLastErrorMessage()
			fatalError("Error setting key: \(errmsg)")
		}
		let errors = try! self.prepare(query: "PRAGMA cipher_integrity_check").all()
		if !errors.isEmpty { throw SqlcipherError.intergrityCheck }
	}
}
