public actor TempFs {
	var tutaUriToNativeUri = [URL: String]()
	public init() {}
	func createFileChunkUri(fileUri: String, start: Int64, length: Int64) throws -> URL {
		let chunkId = base64ToBase64Url(inputText: (secureRandomData(ofLength: 16).base64EncodedString()))
		let tutaUriString = "tuta-chunk://\(chunkId)?start=\(start)&length=\(length)"
		let tutaUri = try urlFromString(string: tutaUriString)
		self.tutaUriToNativeUri[tutaUri] = fileUri
		return tutaUri
	}
	func fileStream(tutaUri: String) throws -> Data {
		let chunk = try parseChunkUri(uri: tutaUri)
		let handle = try FileHandle(forReadingFrom: try urlFromString(string: chunk.nativeUri))
		try handle.seek(toOffset: chunk.start)
		// Conversion from Int64 to Int should be OK here as we're on 64 bit-platforms anyway.
		let readCount = Int(chunk.length)
		// Apple's documentation for FileHandle.read() does not explain *at all* when the optional type
		// returning Data is empty. It seems that in all cases it either returns a valid (potentially
		// empty) Data object or throws. So we'll just assume it's OK to force-unwrap.
		return try handle.read(upToCount: readCount)!
	}

	func fileInfo(uri: String) throws -> FileInfo {
		let chunk = try parseChunkUri(uri: uri)
		let fileInfo = try getFileInfo(fileUri: try urlFromString(string: chunk.nativeUri))
		return FileInfo(name: "\(fileInfo.name).\(chunk.start).chunk", size: chunk.length)
	}

	func fileExists(uri: String) throws -> Bool {
		let chunk = try self.parseChunkUri(uri: uri)
		return FileUtils.fileExists(atPath: chunk.nativeUri)
	}
	func parseChunkUri(uri: String) throws -> ChunkUri {
		guard let parsed = URL(string: uri), parsed.scheme == "tuta-chunk", let startString = parsed.queryParameter("start"),
			let lengthString = parsed.queryParameter("length")
		else { throw FileError(message: "uri cannot be parsed: \(uri)") }

		guard let start = UInt64(startString), let length = Int64(lengthString) else {
			throw FileError(message: "invalid start or length: \(startString), \(lengthString)")
		}
		guard let nativeUri = self.tutaUriToNativeUri[parsed] else { throw FileError(message: "tuta uri does not map to native: \(parsed)") }
		return ChunkUri(start: start, length: length, nativeUri: nativeUri)
	}
}

struct ChunkUri {
	let start: UInt64
	let length: Int64
	let nativeUri: String
}
