import Combine

public final class IosArchiveDownloaderFacade: ArchiveDownloaderFacade {
	private let sqlCipherFacade: IosSqlCipherFacade
	private let schemeHandler: ApiSchemeHandler
	private let urlSession: URLSession

	public init(sqlCipherFacade: IosSqlCipherFacade, schemeHandler: ApiSchemeHandler, urlSession: URLSession) {
		self.sqlCipherFacade = sqlCipherFacade
		self.schemeHandler = schemeHandler
		self.urlSession = urlSession
	}

	public func downloadAndStoreArchive(_ sourceUrl: String, _ archiveId: String, _ typeref: String, _ modelVersion: Int) async throws {
		let urlStruct = URL(string: sourceUrl)!
		var request = URLRequest(url: urlStruct)
		request.httpMethod = "GET"

		var response: URLResponse
		var data: Data
		TUTSLog("Downloading archive with id \(archiveId)")
		do { (data, response) = try await self.urlSession.data(for: self.schemeHandler.rewriteRequest(request)) } catch let error as URLError
			where error.code == URLError.cancelled
		{ throw CancelledError(message: "Download task was canceled", underlyingError: error) }
		TUTSLog("Finished downloading archive with id \(archiveId)")

		let httpResponse = response as! HTTPURLResponse
		if httpResponse.statusCode == 200 { try await storeArchive(data, archiveId, typeref, modelVersion) }
	}

	public func abortDownloadAndStoreArchive(_ archive: String) async throws {
		// FIXME implement abort mechanism
	}

	public func clearStoredArchives() async throws {
		try await sqlCipherFacade.run("DELETE FROM encrypted_mail_details_blobs", [])
		try await sqlCipherFacade.run("DELETE FROM fully_persisted_mail_details_archives", [])
	}

	private func storeArchive(_ data: Data, _ archiveId: String, _ typeref: String, _ modelVersion: Int) async throws {
		TUTSLog("Storing archive with id \(archiveId)")

		// strings we listen for in the switch statement, as utf8 bytes
		let quote = [UInt8]("\"".utf8)[0]
		let openedCurlyBrace = [UInt8]("{".utf8)[0]
		let closedCurlyBrace = [UInt8]("}".utf8)[0]
		let closedBracket = [UInt8]("]".utf8)[0]
		let comma = [UInt8](",".utf8)[0]

		// getting blob id
		let expectedBlobIdPrefixBytes = [UInt8]("\"1300\":".utf8)
		var currentBlobIdPrefixIndex = 0
		let decoder = JSONDecoder()

		var currentFullBlobId = ""
		var currentlyReadingFullBlobId = false
		var finishedReadingFullBlobId = false

		// defines range of bytes that make up one blob
		var currentBlobStartIndex = 0
		var currentBlobEndIndex = 0

		// general parsing stuff
		var openCurlyBraces = 0
		var isInString = false

		// current byte, alias for data[i]
		var byte: UInt8 = 0

		for i in 0..<data.count {
			if currentBlobStartIndex > i { continue }

			currentBlobEndIndex = i
			byte = data[i]

			if currentlyReadingFullBlobId {
				currentFullBlobId += String(bytes: [byte], encoding: .utf8)!
			} else if !finishedReadingFullBlobId {
				if byte == expectedBlobIdPrefixBytes[currentBlobIdPrefixIndex] { currentBlobIdPrefixIndex += 1 }
				if currentBlobIdPrefixIndex == expectedBlobIdPrefixBytes.count {
					currentlyReadingFullBlobId = true
					continue
				}
			}

			switch byte {
			case quote: isInString.toggle()
			case openedCurlyBrace: if !isInString { openCurlyBraces += 1 }
			case closedCurlyBrace:
				if !isInString {
					openCurlyBraces -= 1

					if openCurlyBraces == 0 {
						// TUTSLog("Trying to store blob \(currentFullBlobId) after \(currentBlobEndIndex - currentBlobStartIndex) bytes")
						let json = currentFullBlobId.data(using: .utf8)!
						let blobId = try decoder.decode(Array<String>.self, from: json)

						// FIXME introduce chuning
						try await storeBlob(blobId[1], data[currentBlobStartIndex...currentBlobEndIndex], archiveId, typeref, modelVersion)

						// cleanup
						currentlyReadingFullBlobId = false
						finishedReadingFullBlobId = false
						currentFullBlobId = ""
						currentBlobIdPrefixIndex = 0
					}
				}
			case closedBracket:
				if !finishedReadingFullBlobId && openCurlyBraces == 1 && currentFullBlobId.count > 0 && !isInString {
					finishedReadingFullBlobId = true
					currentlyReadingFullBlobId = false
				}
			case comma: if !isInString && openCurlyBraces == 0 { currentBlobStartIndex = i + 1 }
			default: continue
			}
		}
		try await sqlCipherFacade.run("INSERT OR IGNORE INTO fully_persisted_mail_details_archives VALUES (?)", [TaggedSqlValue.string(value: archiveId)])
		TUTSLog("Finished storing archive with id \(archiveId)")
	}

	private func storeBlob(_ blobId: String, _ data: Data, _ archiveId: String, _ typeref: String, _ modelVersion: Int) async throws {
		do {
			try await sqlCipherFacade.run(
				"INSERT OR REPLACE INTO encrypted_mail_details_blobs (blobId, archiveId, data, typeref, modelVersion) VALUES (?, ?, ?, ?, ?)",
				[
					TaggedSqlValue.string(value: blobId), TaggedSqlValue.string(value: archiveId), TaggedSqlValue.bytes(value: DataWrapper(data: data)),
					TaggedSqlValue.string(value: typeref), TaggedSqlValue.number(value: modelVersion),
				]
			)
		} catch { throw error }
	}

}
