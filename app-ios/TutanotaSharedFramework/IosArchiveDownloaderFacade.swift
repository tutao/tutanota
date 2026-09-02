import Combine

public final class IosArchiveDownloaderFacade: ArchiveDownloaderFacade {
	private let sqlCipherFacade: IosSqlCipherFacade
	private let schemeHandler: ApiSchemeHandler
	private let urlSession: URLSession

	public init(schemeHandler: ApiSchemeHandler, urlSession: URLSession) {
		self.sqlCipherFacade = IosSqlCipherFacade()
		self.schemeHandler = schemeHandler
		self.urlSession = urlSession
	}

	public func downloadAndStoreArchive(_ sourceUrl: String, _ archiveId: String, _ typeref: String, _ modelVersion: Int) async throws {
		let urlStruct = URL(string: sourceUrl)!
		var request = URLRequest(url: urlStruct)
		request.httpMethod = "GET"

		var response: URLResponse
		var data: Data
		do { (data, response) = try await self.urlSession.data(for: self.schemeHandler.rewriteRequest(request)) } catch let error
			as URLError where error.code == URLError.cancelled
		{ throw CancelledError(message: "Download task was canceled", underlyingError: error) }
		let httpResponse = response as! HTTPURLResponse
		if httpResponse.statusCode == 200 {
			storeBytes(blobId[0], data, archiveId, typeref, modelVersion)
		}
	}

	public func abortDownloadAndStoreArchive(_ archive: String) async throws {
		// FIXME implement
	}

	public func clearStoredArchives() async throws {
		try await sqlCipherFacade.run("DELETE FROM encrypted_mail_details_blobs", [])
		try await sqlCipherFacade.run("DELETE FROM fully_persisted_mail_details_archives", [])
	}

	private func storeBytes(data: Data, _ archiveId: String, _ typeref: String, _ modelVersion: Int) async throws {
		let expectedBlobIdPrefix = "\"1300\":"
		let currentBlobIdPrefixIndex = 0
		let decoder = JSONDecoder()

		var currentFullBlobId = ""
		var currentlyReadingFullBlobId = false
		var finishedReadingFullBlobId = false

        var currentBlobStartIndex = 0
        var currentBlobEndIndex = 0

		var openCurlyBraces = 0
		var isInString = false

        var byte: UInt8 = 0

        for i in 0..data.count {
            if currentBlobStartIndex > i { continue }

            currentBlobEndIndex = i
            byte = data[i]

        	if currentlyReadingFullBlobId {
                currentFullBlobId += String(decoding: byte, as: UTF8.self)
        	} else if currentBlobIdPrefix.count > 0 && !finishedReadingFullBlobId {
        	    let char = String(decoding: byte, as: UTF8.self)
        	    if char == expectedBlobIdPrefix[currentBlobIdPrefixIndex] {
        	        currentBlobIdPrefixIndex++
        	    }
        	    if (currentBlobIdPrefixIndex == expectedBlobIdPrefix.count) {
        	        finishedReadingFullBlobId = true
        	        continue
        	    }
        	}


            switch byte {
                case "\"".utf8:
                    isInString = !isInString
                case "{".utf8:
                    if !isInString { openCurlyBraces++ }
                case "}".utf8:
                    if !isInString {
                        openCurlyBraces--

                        if openCurlyBraces == 0 {
                            let blobId = try decoder.decode(String[].self, from: currentFullBlobId)
                            storeBlob(blobId[1], data.copy(from: currentBlobStartIndex, to: currentBlobEndIndex), archiveId, typeref, modelVersion)

                            // cleanup
                            currentlyReadingFullBlobId = false
                            finishedReadingFullBlobId = false
                            // skip comma
                            currentBlobStartIndex = i+1
                            currentBlobEndIndex = i+1
                        }

                    }
                case "]".utf8:
                    if !finishedReadingFullBlobId && openCurlyBraces == 1 && currentFullBlobId.count > 0 && !isInString {
                        finishedReadingFullBlobId = true
                    }
                case ",".utf8:
                    if !isInString && openCurlyBraces == 0 {
                        currentBlobStartIndex++
                    }
            }
        }
	}

	private func storeBlob(_ blobId: String, _ data: UInt8[], _ archiveId: String, _ typeref: String, _ modelVersion: Int) async throws {
	    // largely copied from NotificationService
		do {
			try await sqlCipherFacade.run(
				"INSERT OR IGNORE INTO encrypted_mail_details_blobs (blobId, archiveId, data, typeref, modelVersion) VALUES (?, ?, ?, ?, ?)",
				[
					TaggedSqlValue.string(value: blobId), TaggedSqlValue.string(value: archiveId),
					TaggedSqlValue.bytes(value: DataWrapper(data: data)), TaggedSqlValue.string(value: typeref),
					TaggedSqlValue.number(value: modelVersion),
				]
			)

			// Have to have two of these because defer doesn't support async.
			//
			// Better hope this doesn't throw because we'll call this again!
			try await sqlCipherFacade.closeDb()
		} catch {
			// This is fine 🔥🐶🔥
			try await sqlCipherFacade.closeDb()
			throw error
		}

	}

}
