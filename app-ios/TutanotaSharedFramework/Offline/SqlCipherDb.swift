import Foundation
import Sqlcipher

func openDb(userId: String, dbkey: Data) throws -> SqlCipherDb {
	TUTSLog("opening DB for \(userId)")
	let filePath = makeDbPath(userId).absoluteString
	var db: SqlCipherDb
	do { db = try SqlCipherDb(filePath: filePath, dbKey: dbkey) } catch {
		if let error = error as? SqlcipherError {
			switch error {
			case .intergrityCheck: throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "sqlcipher: failed integrity check")
			case let .prepare(message, sql): throw TUTErrorFactory.createError("SQL error: could not prepare. Message: \(message), sql: \(sql)")
			case let .exec(message, sql): throw TUTErrorFactory.createError("SQL error: could not exec. Message: \(message), sql: \(sql)")
			@unknown default: throw TUTErrorFactory.createError("SQL error: unknown")
			}
		} else {
			throw error
		}
	}
	// We are using the auto_vacuum=incremental mode to allow for a faster vacuum execution
	// After changing the auto_vacuum mode we need to run "vacuum" once
	// auto_vacuum mode: 0 (NONE) | 1 (FULL) | 2 (INCREMENTAL)
	let autoVacuumMode = try? db.prepare(query: "PRAGMA auto_vacuum").get()?.first?.value
	if case let .number(autoVacuumModeValue) = autoVacuumMode, autoVacuumModeValue != 2 {
		try! db.prepare(query: "PRAGMA auto_vacuum = incremental").run()
		try! db.prepare(query: "PRAGMA vacuum").run()
	}
	return db
}

func makeDbPath(_ userId: String) -> URL {
	let fileName = "offline_\(userId).sqlite"
	return makeDbPath(fileName: fileName)
}
