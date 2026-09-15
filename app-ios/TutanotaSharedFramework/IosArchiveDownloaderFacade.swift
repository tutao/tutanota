import Combine

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
		// FIXME add csv header
		defer { _ = self.activeJobsLock.withLock { $0.removeValue(forKey: archiveId) } }

		// Concurrency is not an issue, we only mutate observation once to keep a reference to it
		final class DownloadDelegate: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
			private let taskCreated: (_ task: URLSessionTask) -> Void
			init(taskCreated: @escaping (_ task: URLSessionTask) -> Void) {
				self.taskCreated = taskCreated
			}
			func urlSession(_ session: URLSession, didCreateTask task: URLSessionTask) {
				taskCreated(task)
			}
		}
		let downloadDelegate = DownloadDelegate(
			taskCreated: { task in self.activeJobsLock.withLock { $0[archiveId] = task } }
		)
		var response: URLResponse
		var bytes: URLSession.AsyncBytes
		TUTSLog("Downloading archive with id \(archiveId)")
		do { (bytes, response) = try await self.urlSession.bytes(for: self.schemeHandler.rewriteRequest(request)) } catch let error as URLError
			where error.code == URLError.cancelled
		{ throw CancelledError(message: "Download task was canceled", underlyingError: error) }
		TUTSLog("Finished downloading archive with id \(archiveId)")

		let httpResponse = response as! HTTPURLResponse
		if httpResponse.statusCode == 200 { try await storeArchive(bytes, archiveId, typeref, modelVersion) catch let error
		{ TUTSLog("Storing archive \(archiveId) failed") }
	}

	public func abortDownloadAndStoreArchive(_ archive: String) async throws {
		self.activeJobsLock.withLock { $0[archiveId]?.cancel() }
	}

	public func clearStoredArchives() async throws {
	    // FIXME cleanup map as well
		try await sqlCipherFacade.run("DELETE FROM encrypted_mail_details_blobs", [])
		try await sqlCipherFacade.run("DELETE FROM fully_persisted_mail_details_archives", [])
	}

	private func storeArchive(_ bytes: URLSession.AsyncBytes, _ archiveId: String, _ typeref: String, _ modelVersion: Int) async throws {
		TUTSLog("Storing archive with id \(archiveId)")
		var iterator = bytes.lines.makeAsyncIterator()

		// everything we need for chunking the saves
		// FIXME need to test which value here is optimal
		let minBytes = 4 * 1024 * 1024  // at least 4mb
		var currentBytes = 0
		var waitingBlobIds: [String] = []
		var waitingBlobs: [Data] = []

		// skip first line
		try await iterator.next()
		var line = try await iterator.next()

		while line != nil {
			let split = line!.split(separator: ";", maxSplits: 1)

			waitingBlobIds.append(String(split[0]))
			let data = Data([UInt8](split[1].utf8))
			waitingBlobs.append(data)
			currentBytes += line!.count
			if currentBytes >= minBytes {
				try await storeBlobs(waitingBlobIds, waitingBlobs, archiveId, typeref, modelVersion)
				currentBytes = 0
				waitingBlobs = []
				waitingBlobIds = []
			}

			line = try await iterator.next()
		}
		try await sqlCipherFacade.run("INSERT OR IGNORE INTO fully_persisted_mail_details_archives VALUES (?)", [TaggedSqlValue.string(value: archiveId)])
		TUTSLog("Finished storing archive with id \(archiveId)")
	}

	private func storeBlobs(_ blobIds: [String], _ data: [Data], _ archiveId: String, _ typeref: String, _ modelVersion: Int) async throws {
		do {
			let wrappedArchiveId = TaggedSqlValue.string(value: archiveId)
			let wrappedTypeRef = TaggedSqlValue.string(value: typeref)
			let wrappedModelVersion = TaggedSqlValue.number(value: modelVersion)

			var params = [TaggedSqlValue](repeating: TaggedSqlValue.null, count: 5 * blobIds.count)
			for i in 0..<blobIds.count {
				switch i % 5 {
				case 0: params[i] = TaggedSqlValue.string(value: blobIds[i])
				case 1: params[i] = wrappedArchiveId
				case 2: params[i] = TaggedSqlValue.bytes(value: DataWrapper(data: data[i]))
				case 3: params[i] = wrappedTypeRef
				default: params[i] = wrappedModelVersion
				}
			}
			try await sqlCipherFacade.run(
				"INSERT OR REPLACE INTO encrypted_mail_details_blobs (blobId, archiveId, data, typeref, modelVersion) VALUES "
					+ String(repeating: "(?, ?, ?, ?, ?), ", count: blobIds.count - 1) + "(?, ?, ?, ?, ?)",
				params
			)
		} catch { throw error }
	}

}
