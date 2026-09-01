import Combine
import os

public final class IosArchiveDownloaderFacade: ArchiveDownloaderFacade {
	private let sqlCipherFacade: IosSqlCipherFacade
	private let schemeHandler: ApiSchemeHandler
	private let urlSession: URLSession
	private let activeJobsLock = OSAllocatedUnfairLock(initialState: [String: URLSessionTask]())

	public init(sqlCipherFacade: IosSqlCipherFacade, schemeHandler: ApiSchemeHandler, urlSession: URLSession) {
		self.sqlCipherFacade = sqlCipherFacade
		self.schemeHandler = schemeHandler
		self.urlSession = urlSession
	}

	public func downloadAndStoreArchive(_ sourceUrl: String, _ archiveId: String, _ typeref: String, _ modelVersion: Int) async throws {
		let urlStruct = URL(string: sourceUrl)!
		var request = URLRequest(url: urlStruct)
		request.httpMethod = "GET"
		request.allHTTPHeaderFields = ["Accept": "text/csv;charset=utf-8", "Content-Type": "application/json", "Cache-Control": "no-cache"]
		defer { _ = self.activeJobsLock.withLock { $0.removeValue(forKey: archiveId) } }

		// Concurrency is not an issue, we only mutate observation once to keep a reference to it
		final class DownloadDelegate: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
			private let taskCreated: (_ task: URLSessionTask) -> Void
			init(taskCreated: @escaping (_ task: URLSessionTask) -> Void) { self.taskCreated = taskCreated }
			func urlSession(_ session: URLSession, didCreateTask task: URLSessionTask) { taskCreated(task) }
		}
		let downloadDelegate = DownloadDelegate(taskCreated: { task in self.activeJobsLock.withLock { $0[archiveId] = task } })
		var response: URLResponse
		var bytes: URLSession.AsyncBytes
		TUTSLog("Downloading archive with id \(archiveId)")
		do { (bytes, response) = try await self.urlSession.bytes(for: self.schemeHandler.rewriteRequest(request), delegate: downloadDelegate) } catch let error
			as URLError where error.code == URLError.cancelled
		{ throw CancelledError(message: "Download task was canceled", underlyingError: error) }

		let httpResponse = response as! HTTPURLResponse
		if httpResponse.statusCode == 200 {
			do { try await storeArchive(bytes, archiveId, typeref, modelVersion) } catch {
				TUTSLog("Storing archive with id \(archiveId) failed, cancelling request")
				self.cancelRequest(archiveId)
			}
		}
	}

	public func abortDownloadAndStoreArchive(_ archiveId: String) async throws {
		self.activeJobsLock.withLock { $0[archiveId]?.cancel() }
		TUTSLog("Aborted storing archive with id \(archiveId)")
	}

	public func clearStoredArchives() async throws {
		try await sqlCipherFacade.run("DELETE FROM encrypted_mail_details_blobs", [])
		try await sqlCipherFacade.run("DELETE FROM fully_persisted_mail_details_archives", [])
	}

	private func cancelRequest(_ archiveId: String) { self.activeJobsLock.withLock { $0[archiveId]?.cancel() } }

	private func storeArchive(_ bytes: URLSession.AsyncBytes, _ archiveId: String, _ typeref: String, _ modelVersion: Int) async throws {
		TUTSLog("Started storing archive with id \(archiveId)")
		var iterator = bytes.lines.makeAsyncIterator()

		let storage = ArchiveStorageHelper(archiveId, typeref, modelVersion, self.sqlCipherFacade)

		// skip first line
		try await iterator.next()
		var line = try await iterator.next()

		while line != nil {
			let split = line!.split(separator: ";", maxSplits: 1)
			try await storage.storeBlob(blobId: String(split[0]), bytesToStore: Data([UInt8](split[1].utf8)))
			line = try await iterator.next()
		}

		try await storage.success()
		TUTSLog("Finished storing archive with id \(archiveId)")
	}
}

private final class ArchiveStorageHelper {
	private let archiveId: TaggedSqlValue
	private let rawArchiveId: String
	private let typeref: TaggedSqlValue
	private let modelVersion: TaggedSqlValue
	private let sqlCipherFacade: IosSqlCipherFacade
	static private let CACHE_BUFFER_SIZE = 4 * 1024 * 1024

	init(_ archiveId: String, _ typeref: String, _ modelVersion: Int, _ sqlCipherFacade: IosSqlCipherFacade) {
		self.archiveId = TaggedSqlValue.string(value: archiveId)
		self.rawArchiveId = archiveId
		self.typeref = TaggedSqlValue.string(value: typeref)
		self.modelVersion = TaggedSqlValue.number(value: modelVersion)
		self.sqlCipherFacade = sqlCipherFacade
	}

	// store when 4 mb of data reached (see companion object)
	private var unstoredBytes = 0
	private var blobs: [StoreBlob] = []
	private var closed = false

	func storeBlob(blobId: String, bytesToStore: Data) async throws {
		if self.closed { return }

		self.blobs.append(StoreBlob(blobId: blobId, bytesToStore: bytesToStore))
		self.unstoredBytes += bytesToStore.count

		if self.unstoredBytes > ArchiveStorageHelper.CACHE_BUFFER_SIZE { try await self.store() }
	}

	func flushAndClose() async throws {
		if !self.blobs.isEmpty { try await self.store() }
		self.closed = true
	}

	func success() async throws {
		try await self.flushAndClose()
		try await self.sqlCipherFacade.run("INSERT OR REPLACE INTO fully_persisted_mail_details_archives VALUES (?)", [self.archiveId])
	}

	private func store() async throws {
		if !self.closed {
			let params = [TaggedSqlValue](repeating: TaggedSqlValue.null, count: self.blobs.count).enumerated()
			try await sqlCipherFacade.run(
				"INSERT OR REPLACE INTO encrypted_mail_details_blobs (blobId, archiveId, data, typeref, modelVersion) VALUES (?, ?, ?, ?, ?)"
					+ String(repeating: ", (?, ?, ?, ?, ?)", count: self.blobs.count - 1),
				params.flatMap { offset, _ in
					[
						TaggedSqlValue.string(value: self.blobs[offset].blobId), self.archiveId,
						TaggedSqlValue.bytes(value: DataWrapper(data: self.blobs[offset].bytesToStore)), self.typeref, self.modelVersion,
					]
				}
			)
		}

		self.unstoredBytes = 0
		self.blobs = []
	}
}

private struct StoreBlob {
	let blobId: String
	let bytesToStore: Data
}
