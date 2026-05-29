import Combine
import Foundation
import MobileCoreServices
import TutanotaSharedFramework
import UniformTypeIdentifiers
import os

public typealias ProgressUpdater = @Sendable (String, Int) -> Void

public struct FileInfo: Sendable {
	let name: String
	let size: Int64
}

public func getFileSize(_ file: String) throws -> Int {
	let attrs = try FileManager.default.attributesOfItem(atPath: file)
	let size = attrs[.size] as! UInt64
	// Technically we shouldn't do this but we are always running on 64bit devices and
	// max Int64 number (even signed) is pretty huge so this is safe.
	// If we somehow overflow we will actually crash.
	return Int(size)
}

public func getFileInfo(fileUri: URL) throws -> FileInfo {
	let scheme = fileUri.scheme
	if scheme == nil || scheme == "file" {
		let filePath = fileUri.path(percentEncoded: false)
		let fileSize = try getFileSize(filePath)
		return FileInfo(name: fileUri.lastPathComponent, size: Int64(fileSize))
	} else {
		throw FileError(message: "could not resolve file name / size for URL \(fileUri)")
	}
}

public final class IosFileFacade: FileFacade {
	private let chooser: TUTFileChooser
	private let viewer: FileViewer
	private let schemeHandler: ApiSchemeHandler
	private let urlSession: URLSession
	private let tempFs: TempFs
	private let downloadProgress: ProgressUpdater
	private let uploadProgress: ProgressUpdater
	/// Map from fileId to the corresponding task
	private let activeTransfersLock = OSAllocatedUnfairLock(initialState: [String: URLSessionTask]())

	public init(
		chooser: TUTFileChooser,
		viewer: FileViewer,
		schemeHandler: ApiSchemeHandler,
		urlSession: URLSession,
		tempFs: TempFs,
		downloadProgress: @escaping ProgressUpdater,
		uploadProgress: @escaping ProgressUpdater
	) {
		self.chooser = chooser
		self.viewer = viewer
		self.schemeHandler = schemeHandler
		self.urlSession = urlSession
		self.tempFs = tempFs
		self.downloadProgress = downloadProgress
		self.uploadProgress = uploadProgress
	}

	func openFolderChooser() async throws -> String? { fatalError("not implemented for this platform") }
	func openMacImportFileChooser() async throws -> [String] { fatalError("not implemented for this platform") }

	private func writeFile(at url: URL, _ content: DataWrapper) async throws { try content.data.write(to: url, options: .atomic) }

	private func readFile(at url: URL) throws -> DataWrapper {
		let data = try Data(contentsOf: url)
		return data.wrap()
	}

	public func open(_ fileUrl: String, _ mimeType: String) async throws {
		let url = try URL.from(fileUrl: fileUrl)
		await self.viewer.openFile(url)
	}

	public func openFileChooser(_ boundingRect: IpcClientRect, _ filter: [String]?, _ isFileOnly: Bool? = false) async throws -> [String] {
		let anchor = CGRect(x: boundingRect.x, y: boundingRect.y, width: boundingRect.width, height: boundingRect.height)
		let files = try await self.chooser.open(withAnchorRect: anchor, isFileOnly: isFileOnly!)
		var returnfiles = [URL]()
		for file in files {
			let fileUrl = URL(fileURLWithPath: file)
			let isDirectory: Bool = (try? fileUrl.resourceValues(forKeys: [.isDirectoryKey]))?.isDirectory == true
			// This should only be for files, but sometimes a directory masquerading as a file can slip through (such as a .band file).
			// In those cases we just zip and add it.
			if isDirectory {
				let destinationPath = try zipDirectory(fileUrl: fileUrl)
				returnfiles.append(URL(filePath: destinationPath))
			} else {
				returnfiles.append(URL(filePath: file))
			}
		}
		return returnfiles.map { $0.absoluteString }
	}

	public func deleteFile(_ fileUrl: String) async throws { try await self.tempFs.deleteFile(uri: fileUrl) }

	public func getName(_ fileUrl: String) async throws -> String { try await self.tempFs.fileInfo(uri: fileUrl).name }

	public func getMimeType(_ fileUrl: String) async throws -> String { getFileMIMETypeWithDefault(path: try filePathFrom(urlString: fileUrl)) }

	public func getSize(_ fileUrl: String) async throws -> Int { try await Int(self.tempFs.fileInfo(uri: fileUrl).size) }

	@MainActor public func putFileIntoDownloadsFolder(_ localFileUri: String, _ fileNameToSave: String) async throws -> String {
		let url = try URL.from(fileUrl: localFileUri)
		await chooser.pickDestinationDirectory(fileUri: url)
		// The file is not directly accessible after having been moved by the destination directory picker.
		// Apple docs say that we can create a security-scoped URL to a bookmark of the destination,
		// but it's currently not worth the effort as this value is not used anyway.
		return "moved by iOS"
	}

	public func upload(_ sourceFileUrl: String, _ remoteUrl: String, _ method: String, _ headers: [String: String], _ fileId: String) async throws
		-> UploadTaskResponse
	{
		var request = URLRequest(url: URL(string: remoteUrl)!)
		request.httpMethod = method
		request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
		request.allHTTPHeaderFields = headers
		defer { _ = self.activeTransfersLock.withLock { $0.removeValue(forKey: fileId) } }
		final class UploadDelegate: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
			private var progressCancellable: AnyCancellable?
			private let taskCreated: (_ task: URLSessionTask) -> Void
			private let reporter: (_ bytesSent: Int) -> Void
			init(taskCreated: @escaping (_ task: URLSessionTask) -> Void, reporter: @escaping (_ bytesSent: Int) -> Void) {
				self.reporter = reporter
				self.taskCreated = taskCreated
			}
			func urlSession(_ session: URLSession, didCreateTask task: URLSessionTask) {
				// We observe .fractionCompleted, as that changes frequently and accurately reacts to transfer progress.
				// Other properties, such as .completedUnitCount are more abstract and do not immediately reflect progress.
				// Progress handed into this method as task.progress internally consists of two progress trackers, the second
				// one of which is the *actual* transfer progress. It seems inaccessible however, which is why we ask task
				// directly for the bytes received.

				taskCreated(task)
				self.progressCancellable = task.progress.publisher(for: \.fractionCompleted)
					.throttle(for: .milliseconds(50), scheduler: RunLoop.main, latest: true)
					.sink { [weak self] _ in self?.reporter(Int(task.countOfBytesSent)) }
			}
		}
		let uploadDelegate = UploadDelegate(
			taskCreated: { [weak self] task in
				guard let fileFacade = self else { return }
				fileFacade.activeTransfersLock.withLock { $0[fileId] = task }
			},
			reporter: { bytesSent in self.uploadProgress(fileId, bytesSent) }
		)

		do {
			// We would like to do streaming upload but there's no async version
			let (data, response) = try await self.urlSession.upload(
				for: self.schemeHandler.rewriteRequest(request),
				from: self.tempFs.readAsData(uri: sourceFileUrl),
				delegate: uploadDelegate
			)
			let httpResponse = response as! HTTPURLResponse
			return UploadTaskResponse(httpResponse: httpResponse, responseBody: data)
		} catch let error as URLError where error.code == URLError.cancelled {
			throw CancelledError(message: "Upload task was canceled", underlyingError: error)
		}
	}
	public func abortUpload(_ fileId: String) async throws {
		TUTSLog("Abort upload for \(fileId)")
		activeTransfersLock.withLock { $0[fileId]?.cancel() }
	}

	public func download(_ sourceUrl: String, _ filename: String, _ headers: [String: String], _ fileId: String) async throws -> DownloadTaskResponse {
		let urlStruct = URL(string: sourceUrl)!
		var request = URLRequest(url: urlStruct)
		request.httpMethod = "GET"
		request.allHTTPHeaderFields = headers
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
	public func abortDownload(_ fileId: String) async {
		TUTSLog("Abort download for \(fileId)")
		self.activeTransfersLock.withLock { $0[fileId]?.cancel() }
	}

	private func writeEncryptedFile(fileName: String, data: Data) throws -> URL {
		let encryptedPath = try FileUtils.getEncryptedFolder()
		let filePath = (encryptedPath as NSString).appendingPathComponent(fileName)
		let url = URL(fileURLWithPath: filePath)
		try data.write(to: url, options: .atomicWrite)
		return url
	}

	public func hashFile(_ fileUrl: String) async throws -> String { try await BlobUtil(tempFs: self.tempFs).hashFile(fileUri: fileUrl) }

	func zipDirectory(fileUrl: URL) throws -> String {
		var returnPath: String = ""
		var err: NSError?
		var ourError: (any Error)?
		NSFileCoordinator()
			.coordinate(readingItemAt: fileUrl, options: [.forUploading], error: &err) { (zipUrl) in
				do {
					let decryptedFolder = try FileUtils.getDecryptedFolder()
					let destinationPath = (decryptedFolder as NSString).appendingPathComponent((zipUrl.path as NSString).lastPathComponent)
					try FileManager.default.copyItem(at: zipUrl, to: URL(fileURLWithPath: destinationPath))
					returnPath = destinationPath
				} catch {
					ourError = error
					return
				}
			}
		if let e = err ?? ourError { throw FileError(message: "could not read directory at \(fileUrl)", underlyingError: e) }
		return returnPath
	}

	public func clearFileData() async throws {
		_ = await (
			try self.clearDirectory(folderPath: FileUtils.getEncryptedFolder()), try self.clearDirectory(folderPath: FileUtils.getDecryptedFolder()),
			try self.clearDirectory(folderPath: NSTemporaryDirectory())
		)
	}

	public func joinFiles(_ filename: String, _ filePartUrls: [String]) async throws -> String {
		try await BlobUtil(tempFs: self.tempFs).joinFiles(fileName: filename, fileUrlsToJoin: filePartUrls)
	}

	public func writeTempDataFile(_ file: DataFile) async throws -> String {
		let decryptedFolder = try FileUtils.getDecryptedFolder()
		let filePath = (decryptedFolder as NSString).appendingPathComponent(file.name)
		let fileUrl = URL(fileURLWithPath: filePath)
		try await self.writeFile(at: fileUrl, file.data)
		return fileUrl.absoluteString
	}

	public func readDataFile(_ filePath: String) async throws -> DataFile? {
		let data = try readFile(at: URL.from(fileUrl: filePath))
		return DataFile(name: try await getName(filePath), mimeType: try await getMimeType(filePath), size: try await getSize(filePath), data: data)
	}
	public func writeToAppDir(_ content: TutanotaSharedFramework.DataWrapper, _ name: String) async throws {
		let supportDir = try FileUtils.getApplicationSupportFolder()
		let fileUrl = supportDir.appendingPathComponent(name)
		try await self.writeFile(at: fileUrl, content)
	}

	public func readFromAppDir(_ name: String) throws -> TutanotaSharedFramework.DataWrapper {
		let supportDir = try FileUtils.getApplicationSupportFolder()
		let fileUrl = supportDir.appendingPathComponent(name)
		return try self.readFile(at: fileUrl)
	}

	public func deleteFromAppDir(_ name: String) async throws {
		let supportDir = try FileUtils.getApplicationSupportFolder()
		let fileUrl = supportDir.appendingPathComponent(name)
		if fileUrl.absoluteString.starts(with: supportDir.absoluteString) {
			try FileUtils.delete(file: fileUrl)
		} else {
			throw FileError(message: "File not found \(fileUrl)")
		}
	}

	private func clearDirectory(folderPath: String) async throws {
		let fileManager = FileManager.default
		let folderUrl = URL(fileURLWithPath: folderPath)
		let files = try fileManager.contentsOfDirectory(at: folderUrl, includingPropertiesForKeys: nil, options: [])
		for file in files where !file.hasDirectoryPath { try fileManager.removeItem(at: file) }
	}

	public func readDirectory(_ filePath: String) async throws -> TutanotaSharedFramework.DirectoryContents { fatalError("not implemented on this platform") }
	public func openFileForReading(_ fileUrl: String) async throws -> String { try await self.tempFs.openFileForReading(uri: fileUrl) }
	public func closeFile(_ streamUrl: String) async throws { try await self.tempFs.closeFile(streamUri: streamUrl) }
	public func readChunk(_ streamUrl: String, _ maxChunkSize: Int) async throws -> String? {
		var stream = try await self.tempFs.fileStream(tutaUri: streamUrl)
		let buf = try stream.read(upToBytes: maxChunkSize)
		if let buf { return await self.tempFs.createInMemoryFile(data: buf) } else { return nil }
	}
}

extension UploadTaskResponse {
	init(httpResponse: HTTPURLResponse, responseBody: Data) {
		self.init(
			statusCode: httpResponse.statusCode,
			errorId: httpResponse.valueForHeaderField("Error-Id"),
			precondition: httpResponse.valueForHeaderField("Precondition"),
			suspensionTime: httpResponse.valueForHeaderField("Retry-After") ?? httpResponse.valueForHeaderField("Suspension-Time"),
			responseBody: responseBody.wrap()
		)
	}
}

extension DownloadTaskResponse {
	init(httpResponse: HTTPURLResponse, encryptedFileUri: String?) {
		self.init(
			statusCode: httpResponse.statusCode,
			errorId: httpResponse.valueForHeaderField("Error-Id"),
			precondition: httpResponse.valueForHeaderField("Precondition"),
			suspensionTime: httpResponse.valueForHeaderField("Retry-After") ?? httpResponse.valueForHeaderField("Suspension-Time"),
			encryptedFileUri: encryptedFileUri
		)
	}
}

/// Reading header fields from HTTPURLResponse.allHeaderFields is case-sensitive, it is a bug: https://bugs.swift.org/browse/SR-2429
/// From iOS13 we have a method to read headers case-insensitively: HTTPURLResponse.value(forHTTPHeaderField:)
/// For older iOS we use this NSDictionary cast workaround as suggested by a commenter in the bug report.
extension HTTPURLResponse { public func valueForHeaderField(_ headerField: String) -> String? { value(forHTTPHeaderField: headerField) } }

func filePathFrom(urlString: String) throws -> String {
	let url = try URL.from(fileUrl: urlString)
	return url.path(percentEncoded: false)
}
