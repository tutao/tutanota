import Combine
import Sqlcipher

enum ListIdLockState {
	case waitingForListIdUnlock
	case listIdUnlocked
}

let OFFLINE_DB_CLOSED_DOMAIN = "de.tutao.tutashared.offline.OfflineDbClosedError"

public actor IosSqlCipherFacade: SqlCipherFacade {
	private var db: SqlCipherDb?

	// according to the docs the return value of sink should be held
	// because otherwise the stream will be canceled
	private var cancellables: [AnyCancellable] = []

	public init() {}

	private func getDb() throws -> SqlCipherDb {
		guard let db = self.db else { throw TUTErrorFactory.createError(withDomain: OFFLINE_DB_CLOSED_DOMAIN, message: "No db opened") }
		return db
	}

	public func run(_ query: String, _ params: [TaggedSqlValue]) async throws {
		let activity = ProcessInfo.processInfo.beginActivity(reason: "SqlCipherFacadeRun")
		let prepped = try self.getDb().prepare(query: query)
		try! prepped.bindParams(params).run()
		ProcessInfo.processInfo.endActivity(activity)
		return
	}

	public func get(_ query: String, _ params: [TaggedSqlValue]) async throws -> [String: TaggedSqlValue]? {
		let backgroundTaskID = ProcessInfo.processInfo.beginActivity(reason: "SqlCipherFacadeGet")
		let prepped = try self.getDb().prepare(query: query)
		let resp = try! prepped.bindParams(params).get()?.tag()
		ProcessInfo.processInfo.endActivity(backgroundTaskID)
		return resp
	}

	public func all(_ query: String, _ params: [TaggedSqlValue]) async throws -> [[String: TaggedSqlValue]] {
		let backgroundTaskID = ProcessInfo.processInfo.beginActivity(reason: "SqlCipherFacadeAll")
		let prepped = try self.getDb().prepare(query: query)
		let resp = try! prepped.bindParams(params).all().map { $0.tag() }
		ProcessInfo.processInfo.endActivity(backgroundTaskID)
		return resp
	}

	public func openDb(_ userId: String, _ dbKey: DataWrapper) async throws { self.db = try TutanotaSharedFramework.openDb(userId: userId, dbkey: dbKey.data) }

	public func closeDb() async throws { self.db = nil }

	public func deleteDb(_ userId: String) async throws {
		self.db = nil

		do { try FileUtils.deleteFile(path: makeDbPath(userId)) } catch {
			let err = error as NSError
			if err.domain == NSPOSIXErrorDomain && err.code == ENOENT {
				// we don't care
			} else if let underlyingError = err.userInfo[NSUnderlyingErrorKey] as? NSError,
				underlyingError.domain == NSPOSIXErrorDomain && underlyingError.code == ENOENT
			{
				// we don't care either
			} else {
				throw error
			}
		}
	}

	public func vaccumDb() async throws { self.db?.vacuum() }

	public func tokenize(_ query: String) async throws -> [String] { signalTokenize(query) }
}

extension SqliteStatement { public func bindParams(_ params: [TaggedSqlValue]) throws -> Self { try self.bindParams(params.map { $0.untag() }) } }

private extension Dictionary where Value == SqlValue { func tag() -> [Self.Key: TaggedSqlValue] { self.mapValues { $0.tag() } } }
