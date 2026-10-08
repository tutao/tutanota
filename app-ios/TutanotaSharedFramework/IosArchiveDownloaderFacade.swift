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

	public func downloadAndStoreArchive(
		_ sourceUrl: String,
		_ archiveId: String,
		_ archiveType: String,
		_ modelVersion: Int,
		_ rangeHeaders: ArchiveDownloadRangeHeaders?
	) async throws {
		let urlStruct = URL(string: sourceUrl)!
		var request = URLRequest(url: urlStruct)
		request.httpMethod = "GET"
		var headers = ["Accept": "text/csv;charset=utf-8", "Content-Type": "application/json", "Cache-Control": "no-cache"]
		if rangeHeaders != nil {
			headers["Range"] = "rows=\(rangeHeaders!.rangeStart)-"
			headers["Repr-Digest"] = "sha-256=:\(rangeHeaders!.reprDigest):"
		}


		request.allHTTPHeaderFields = headers
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
		TUTSLog("Downloading archive \(archiveId) starting from row \(rangeHeader?.rangeStart ?? 0)")
		do { (bytes, response) = try await self.urlSession.bytes(for: self.schemeHandler.rewriteRequest(request), delegate: downloadDelegate) } catch let error
			as URLError where error.code == URLError.cancelled
		{ throw CancelledError(message: "Download task was canceled", underlyingError: error) }

		let httpResponse = response as! HTTPURLResponse
		TUTSLog("Received status code \(httpResponse.statusCode) when downloading archive \(archiveId)")
		if httpResponse.statusCode == 200 || httpResponse.statusCode == 206 {
			if httpResponse.statusCode == 200 {
				TUTSLog("Clearing cached blobs for archive \(archiveId)")
				try await sqlCipherFacade.run("DELETE FROM encrypted_blobs WHERE archiveId = ?", [TaggedSqlValue.string(value: archiveId)])
			}

			do { try await storeArchive(bytes, archiveId, archiveType, modelVersion, urlStruct.host()!) } catch {
				TUTSLog("Storing archive \(archiveId) failed, cancelling request")
				self.cancelRequest(archiveId)
			}
		}
	}

	public func abortDownloadAndStoreArchive(_ archiveId: String) async throws {
		self.activeJobsLock.withLock {
			if $0[archiveId] != nil && $0[archiveId]!.state != URLSessionTask.State.canceling && $0[archiveId]!.state != URLSessionTask.State.completed {
				do { $0[archiveId]!.cancel() }
			}
		}
		TUTSLog("Aborted storing archive \(archiveId)")
	}

	private func cancelRequest(_ archiveId: String) { self.activeJobsLock.withLock { do { $0[archiveId]?.cancel() } } }

	private func storeArchive(_ bytes: URLSession.AsyncBytes, _ archiveId: String, _ archiveType: String, _ modelVersion: Int, _ serverHostname: String)
		async throws
	{
		TUTSLog("Started storing archive \(archiveId)")
		var iterator = bytes.lines.makeAsyncIterator()

		let storage = ArchiveStorageHelper(archiveId, archiveType, modelVersion, serverHostname, self.sqlCipherFacade)
		try await storage.initialize()

		// skip first line
		_ = try await iterator.next()
		var line = try await iterator.next()

		while line != nil {
			let split = line!.split(separator: ";", maxSplits: 1)
			try await storage.storeBlob(blobId: String(split[0]), json: String(split[1]))
			line = try await iterator.next()
		}

		try await storage.flushAndClose()
		TUTSLog("Finished storing archive \(archiveId)")
	}
}

private final class ArchiveStorageHelper {
	private let archiveId: TaggedSqlValue
	private let rawArchiveId: String
	private let archiveType: TaggedSqlValue
	private let modelVersion: TaggedSqlValue
	private let serverHostname: TaggedSqlValue
	private let sqlCipherFacade: IosSqlCipherFacade
	static private let CACHE_BUFFER_SIZE = 4 * 1024 * 1024

	init(_ archiveId: String, _ archiveType: String, _ modelVersion: Int, _ serverHostname: String, _ sqlCipherFacade: IosSqlCipherFacade) {
		self.archiveId = TaggedSqlValue.string(value: archiveId)
		self.rawArchiveId = archiveId
		self.archiveType = TaggedSqlValue.string(value: archiveType)
		self.modelVersion = TaggedSqlValue.number(value: modelVersion)
		self.serverHostname = TaggedSqlValue.string(value: serverHostname)
		self.sqlCipherFacade = sqlCipherFacade
	}

	// store when 4 mb of data reached (see companion object)
	private var unstoredBytes = 0
	private var blobs: [StoreBlob] = []
	private var closed = false

	func initialize() async throws {
		try await sqlCipherFacade.run(
			"INSERT OR REPLACE INTO encrypted_blobs_metadata (archiveId, type, modelVersion, serverHostname) VALUES (?, ?, ?, ?)",
			[self.archiveId, self.archiveType, self.modelVersion, self.serverHostname]
		)
	}

	func storeBlob(blobId: String, json: String) async throws {
		if self.closed { return }

		self.blobs.append(StoreBlob(blobId: blobId, json: json))
		self.unstoredBytes += json.utf8.count

		if self.unstoredBytes > ArchiveStorageHelper.CACHE_BUFFER_SIZE { try await self.store() }
	}

	func flushAndClose() async throws {
		try await self.store()
		self.closed = true
	}

	private func store() async throws {
		if !self.closed && !self.blobs.isEmpty {
			try await sqlCipherFacade.run(
				"INSERT OR REPLACE INTO encrypted_blobs (type, archiveId, blobId, modelVersion, data) VALUES (?, ?, ?, ?, ?)"
					+ String(repeating: ", (?, ?, ?, ?, ?)", count: self.blobs.count - 1),
				self.blobs.indices.flatMap { i in
					[
						self.archiveType, self.archiveId, TaggedSqlValue.string(value: self.blobs[i].blobId), self.modelVersion,
						TaggedSqlValue.string(value: self.blobs[i].json),
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
	let json: String
}
