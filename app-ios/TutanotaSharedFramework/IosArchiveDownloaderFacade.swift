public final class IosArchiveDownloaderFacade: ArchiveDownloaderFacade {
	private var sqlCipherFacade: IosSqlCipherFacade

	public init() {
		self.sqlCipherFacade = IosSqlCipherFacade()
	}

	public func download(_ sourceUrl: String, _ typeref: String, _ modelVersion: Int64) async throws -> DownloadTaskResponse {
		let urlStruct = URL(string: sourceUrl)!
		var request = URLRequest(url: urlStruct)
		request.httpMethod = "GET"
		defer { _ = self.activeTransfersLock.withLock { $0.removeValue(forKey: fileId) } }

		// Concurrency is not an issue, we only mutate observation once to keep a reference to it
		final class DownloadDelegate: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
			private var progressCancellable: AnyCancellable?
			private let reporter: (_ bytesReceived: Int) -> Void
			private let taskCreated: (_ task: URLSessionTask) -> Void
			init(taskCreated: @escaping (_ task: URLSessionTask) -> Void, reporter: @escaping (_ bytesReceived: Int) -> Void) {
				self.reporter = reporter
				self.taskCreated = taskCreated
			}
			func urlSession(_ session: URLSession, didCreateTask task: URLSessionTask) {
				// We observe .fractionCompleted, as that changes frequently and accurately reacts to download progress.
				// Other properties, such as .completedUnitCount are more abstract and do not immediately reflect progress.
				// Progress handed into this method as task.progress internally consists of two progress trackers, the second
				// one of which is the *actual* download progress. It seems inaccessible however, which is why we ask task
				// directly for the bytes received.
				taskCreated(task)
				self.progressCancellable = task.progress.publisher(for: \.fractionCompleted)
					.throttle(for: .milliseconds(50), scheduler: RunLoop.main, latest: true)
					.sink { [weak self] _ in self?.reporter(Int(task.countOfBytesReceived)) }
			}
		}
		let downloadDelegate = DownloadDelegate(
			taskCreated: { task in self.activeTransfersLock.withLock { $0[fileId] = task } },
			reporter: { bytesReceived in self.downloadProgress(fileId, bytesReceived) }
		)
		var response: URLResponse
		var data: Data
		do { (data, response) = try await self.urlSession.data(for: self.schemeHandler.rewriteRequest(request), delegate: downloadDelegate) } catch let error
			as URLError where error.code == URLError.cancelled
		{ throw CancelledError(message: "Download task was canceled", underlyingError: error) }
		let httpResponse = response as! HTTPURLResponse
		let encryptedFileUri: String?
		if httpResponse.statusCode == 200 {
			encryptedFileUri = try self.writeEncryptedFile(fileName: filename, data: data).absoluteString
		} else {
			encryptedFileUri = nil
		}
		return DownloadTaskResponse(httpResponse: httpResponse, encryptedFileUri: encryptedFileUri)
	}


}
