public actor TempFs {
	private var inMemoryFiles = [Filename: Data]()
	private var openStreams = [Filename: SimpleInputStream]()
	public init() {}

	func fileStream(tutaUri: String) async throws -> SimpleInputStream {
		let tutaUrl = try TutaUrl(url: tutaUri)
		switch tutaUrl {
		case .tmp(let name):
			let data = try self.readInMemoryFile(name)
			return DataSimpleInputStream(data: data)
		case .stream(let name): return try self.openedStream(fileName: name)
		case .file(let url):
			try assertInTmp(url: url)
			return try FileHandleSimpleInputStream(fileHandle: FileHandle(forReadingFrom: url))
		}
	}
	func fileInfo(uri: String) throws -> FileInfo {
		let tutaUrl = try TutaUrl(url: uri)
		switch tutaUrl {
		case .tmp(let name):
			let chunk = try self.readInMemoryFile(name)
			return FileInfo(name: name.fileName, size: Int64(chunk.count))
		case .stream: throw GenericTutanotaError(message: "fileInfo is not available for tuta-stream uris")
		case .file(let url):
			try self.assertInTmp(url: url)
			let fileInfo = try getFileInfo(fileUri: url)
			return fileInfo
		}
	}

	func openFileForReading(uri: String) throws -> String {
		let fileUrl = try URL.from(fileUrl: uri)
		let stream = try FileHandleSimpleInputStream(fileHandle: FileHandle(forReadingFrom: fileUrl))
		let fileName = self.generateFilename()
		self.openStreams[fileName] = stream
		return TutaUrl.stream(name: fileName).asString()
	}
	func closeFile(streamUri: String) throws {
		guard case .stream(let name) = try TutaUrl(url: streamUri) else { throw GenericTutanotaError(message: "not a valid URL: \(streamUri)") }
		self.openStreams.removeValue(forKey: name)  // deinit will close it
	}
	func deleteFile(uri: String) throws {
		let tutaUrl = try TutaUrl(url: uri)
		switch tutaUrl {
		case .tmp(let name): self.deleteInMemoryFile(name: name)
		case .stream(let name): throw GenericTutanotaError(message: "cannot delete stream \(name)")
		case .file(let url):
			try assertInTmp(url: url)
			do { try FileManager.default.removeItem(at: url) } catch {
				if (error as NSError).code == NSFileNoSuchFileError { return printLog("Tried to delete file \(uri) that does not exist.") }
				throw FileError(message: "Failed to delete file \(uri)", underlyingError: error)
			}
		}
	}
	func createInMemoryFile(data: Data) -> String {
		let fileName = self.generateFilename()
		self.inMemoryFiles[fileName] = data
		return TutaUrl.tmp(name: fileName).asString()
	}
	func readAsData(uri: String) async throws -> Data {
		let tutaUrl = try TutaUrl(url: uri)
		switch tutaUrl {
		case .tmp(let name): return try self.readInMemoryFile(name)
		case .stream(let name):
			var stream = try self.openedStream(fileName: name)
			return try stream.readUntilEnd() ?? Data()
		case .file(let url):
			try assertInTmp(url: url)
			return try Data(contentsOf: url)
		}
	}
	private func readInMemoryFile(_ fileName: Filename) throws -> Data {
		guard let buffer = self.inMemoryFiles[fileName] else { throw FileError(message: "File not found \(fileName.fileName)") }
		return buffer
	}
	private func openedStream(fileName: Filename) throws -> SimpleInputStream {
		guard let stream = self.openStreams[fileName] else { throw FileError(message: "stream not found: \(fileName.fileName)") }
		return stream
	}
	func closeFileStream(stream: SimpleInputStream) {
		// deinit will close it
	}
	private func assertInTmp(url: URL) throws {
		if !url.path(percentEncoded: false).starts(with: (FileManager().temporaryDirectory.path(percentEncoded: false))) {
			throw FileError(message: "file does not exist on this url \(url)")
		}
	}
	private func deleteInMemoryFile(name: Filename) { self.inMemoryFiles.removeValue(forKey: name) }
	private func generateFilename() -> Filename { Filename(fileName: secureRandomData(ofLength: 16).hexEncodedString()) }
}

private struct Filename: Equatable, Hashable { let fileName: String }

private enum TutaUrl {
	case file(url: URL)
	case tmp(name: Filename)
	case stream(name: Filename)
	init(url urlString: String) throws {
		guard let url = URL(string: urlString) else { throw GenericTutanotaError(message: "Invalid URL: \(urlString)") }
		switch url.scheme {
		case "tuta-tmp":
			let name = Filename(fileName: url.path(percentEncoded: false))
			self = .tmp(name: name)
		case "tuta-stream":
			let name = Filename(fileName: url.path(percentEncoded: false))
			self = .stream(name: name)
		case "file": self = .file(url: url)
		default: throw GenericTutanotaError(message: "Invalid URL: \(urlString)")
		}
	}
	func asString() -> String {
		switch self {
		case .file(let url): return url.absoluteString
		case .tmp(let name): return "tuta-tmp:\(name.fileName)"
		case .stream(let name): return "tuta-stream:\(name.fileName)"
		}
	}
}
