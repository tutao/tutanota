import Foundation

class SqlCipherDb {
  private var db: OpaquePointer? = nil
  let userId: String
  
  init(_ userId: String) {
    self.userId = userId
  }
  
  func open(_ dbKey: Data) {
    TUTSLog("opening DB for \(userId)")
    let rawKeyData: NSData = dbKey as NSData
    let rawKeyPtr: UnsafeRawPointer = rawKeyData.bytes
    let file_name = makeDbPath(self.userId).absoluteString
    let rc_open = sqlite3_open_v2(
      file_name,// file name
      &(self.db), // db connection
      SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE, // flags
      nil // vfs module name
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
  }
  
  func prepare(query: String) throws -> SqlCipherStatement {
    var stmt: OpaquePointer? = nil
    let sqlCStr = UnsafeMutablePointer<CChar>(mutating: (query as NSString).utf8String)
    //db pointer, query, max query length, OUT statement handle, OUT pointer to unused portion of query (?)
    let rc_prep = sqlite3_prepare_v2(self.db, sqlCStr, -1, &stmt, nil)
    if rc_prep != SQLITE_OK || stmt == nil {
      let errmsg = self.getLastErrorMessage()
      fatalError("failed to prepare stmt: \(errmsg)")
    }
    return SqlCipherStatement(db: self, query: query, stmt: stmt.unsafelyUnwrapped)
  }
  
  func close() {
    if sqlite3_close(self.db) != SQLITE_OK {
      let errmsg = self.getLastErrorMessage()
      TUTSLog("Error closing database: \(errmsg): \(self.getLastErrorMessage())")
      // ignore
    }
    self.db = nil
  }
  
  func getLastErrorMessage() -> String {
    return String(cString: sqlite3_errmsg(self.db))
  }
  
  func getLastErrorCode() -> Int32 {
    return sqlite3_errcode(self.db)
  }
}

func makeDbPath(_ userId: String) -> URL {
  let fileName = "offline_\(userId).sqlite"
  let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
  return docs.appendingPathComponent(fileName)
}
