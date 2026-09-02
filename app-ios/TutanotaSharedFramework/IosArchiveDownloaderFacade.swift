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
			let it = data.
		}
	}

	public func abortDownloadAndStoreArchive(_ archive: String) async throws {
		// FIXME implement
	}

	public func clearStoredArchives() async throws {
		try await sqlCipherFacade.run("DELETE FROM encrypted_mail_details_blobs", [])
		try await sqlCipherFacade.run("DELETE FROM fully_persisted_mail_details_archives", [])
	}

	private func storeBytes(data: Data) async throws {
		let expectedBlobIdPrefix = "\"1300\":"

		var currentBlobBytes = []

		for (byte, i) in data {
			
		}
	}

}
