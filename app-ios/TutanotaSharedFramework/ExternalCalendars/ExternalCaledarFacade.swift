import Foundation

public class ExternalCalendarFacadeImpl: ExternalCalendarFacade {
	private let urlSession: URLSession
	private let userAgent: String

	public init(urlSession: URLSession, userAgent: String) {
		self.urlSession = urlSession
		self.userAgent = userAgent
	}

	public func fetchExternalCalendar(_ url: String) async throws -> String {
		enum FetchExternalError: Error {
			case URLError(String)
			case FetchError(String)
		}

		guard let sourceUrl = URL(string: url) else { throw FetchExternalError.URLError("Error while creating the URL") }
		var request = URLRequest(url: sourceUrl)
		request.httpMethod = "GET"
		request.setValue(self.userAgent, forHTTPHeaderField: "User-Agent")

		let (data, _) = try await self.urlSession.data(for: request)
		let str = String(data: data, encoding: .utf8) ?? ""

		return str
	}
}
