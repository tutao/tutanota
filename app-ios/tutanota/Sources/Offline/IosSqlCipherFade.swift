import Foundation

class IosSqlCipherFacade: SqlCipherFacade {
  private var db: SqlCipherDb? = nil
  
  func run(_ query: String, _ params: [TaggedSqlValue]) async throws {
    assertDb()
    let prepped = try! self.db!.prepare(query: query)
    try! prepped.bindParams(params).run()
    return
  }
  
  func get(_ query: String, _ params: [TaggedSqlValue]) async throws -> [String : TaggedSqlValue]? {
    assertDb()
    let prepped = try! self.db!.prepare(query: query)
    return try! prepped.bindParams(params).get()
  }
  
  func all(_ query: String, _ params: [TaggedSqlValue]) async throws -> [[String : TaggedSqlValue]] {
    assertDb()
    let prepped = try! self.db!.prepare(query: query)
    return try! prepped.bindParams(params).all()
  }
  
  func openDb(_ userId: String, _ dbKey: DataWrapper) async throws {
    let db = SqlCipherDb(userId)
    db.open(dbKey.data)
    self.db = db
  }
  
  func closeDb() async throws {
    if self.db == nil {
      return
    }
    self.db!.close()
  }
  
  func deleteDb(_ userId: String) async throws {
    if self.db != nil && self.db!.userId == userId {
      self.db!.close()
    }
    try FileUtils.deleteFile(path: makeDbPath(userId))
  }
  
  private func assertDb() {
    if self.db == nil {
      fatalError("assertDb failed!")
    }
  }
}
