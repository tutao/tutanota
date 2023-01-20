import Foundation
import Combine

enum ListIdLockState {
  case waitingForListIdUnlock
  case listIdUnlocked
}

let OFFLINE_DB_CLOSED_DOMAIN = "de.tutao.tutanota.offline.OfflineDbClosedError"

actor IosSqlCipherFacade: SqlCipherFacade {
  private var db: SqlCipherDb? = nil

  private var concurrentListIdLocks = ConcurrentListIdLocks()
  // according to the docs the return value of sink should be held
  // because otherwise the stream will be canceled
  private var cancellables: [AnyCancellable] = []

  private func getDb() throws -> SqlCipherDb {
    guard let db = self.db else {
      throw TUTErrorFactory.createError(withDomain: OFFLINE_DB_CLOSED_DOMAIN, message: "No db opened")
    }
    return db
  }

  func run(_ query: String, _ params: [TaggedSqlValue]) async throws {
    let prepped = try self.getDb().prepare(query: query)
    try! prepped.bindParams(params).run()
    return
  }

  func get(_ query: String, _ params: [TaggedSqlValue]) async throws -> [String : TaggedSqlValue]? {
    let prepped = try self.getDb().prepare(query: query)
    return try! prepped.bindParams(params).get()
  }

  func all(_ query: String, _ params: [TaggedSqlValue]) async throws -> [[String : TaggedSqlValue]] {
    let prepped = try self.getDb().prepare(query: query)
    return try! prepped.bindParams(params).all()
  }

  func openDb(_ userId: String, _ dbKey: DataWrapper) async throws {
    let db = SqlCipherDb(userId)
    try db.open(dbKey.data)
    self.db = db
  }

  func closeDb() async throws {
    if self.db == nil {
      return
    }
    self.db!.close()
    self.db = nil
  }

  func deleteDb(_ userId: String) async throws {
    if let db = self.db, db.userId == userId {
      db.close()
    }

    do {
      try FileUtils.deleteFile(path: makeDbPath(userId))
    } catch {
      let err = error as NSError
      if err.domain == NSPOSIXErrorDomain && err.code == ENOENT {
        // we don't care
      } else if let underlyingError = err.userInfo[NSUnderlyingErrorKey] as? NSError,
                underlyingError.domain == NSPOSIXErrorDomain && underlyingError.code == ENOENT {
        // we don't care either
      } else {
        throw error
      }
    }
  }

  func vaccumDb() async throws {
    self.db?.vacuum()
  }

  /**
   * We want to lock the access to the "ranges" db when updating / reading the
   * offline available mail list ranges for each mail list (referenced using the listId).
   * @param listId the mail list that we want to lock
   */
  func lockRangesDbAccess(_ listId: String) async throws {
    let listIdLock = await concurrentListIdLocks.get(listId)
    if let listIdLock = listIdLock {
      await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
        let cancellable = listIdLock
          .first(where: { $0 == .listIdUnlocked })
          .sink { v in
            continuation.resume()
          }
        self.cancellables.append(cancellable)
      }
      await self.concurrentListIdLocks.set(listId,CurrentValueSubject<ListIdLockState, Never>(.waitingForListIdUnlock))
    } else {
      await self.concurrentListIdLocks.set(listId, CurrentValueSubject<ListIdLockState, Never>(.waitingForListIdUnlock))
    }
  }

  /**
   * This is the counterpart to the function "lockRangesDbAccess(listId)".
   * @param listId the mail list that we want to unlock
   */
  func unlockRangesDbAccess(_ listId: String) async throws {
    let listIdLock = await self.concurrentListIdLocks.removeValue(forKey: listId)
    listIdLock?.send(.listIdUnlocked)
  }
}

// We need this actor in order to make sure that access to the listIdLocks dictionary is thread safe
actor ConcurrentListIdLocks {
  private var listIdLocks: [String: CurrentValueSubject<ListIdLockState, Never>] = [:]

  func get(_ listId: String) ->  CurrentValueSubject<ListIdLockState, Never>? {
    listIdLocks[listId]
  }

  func set(_ listId: String,_ value: CurrentValueSubject<ListIdLockState, Never>) {
    return listIdLocks[listId] = value
  }

  func removeValue(forKey listId: String) -> CurrentValueSubject<ListIdLockState, Never>? {
    return listIdLocks.removeValue(forKey: listId)
  }
}
