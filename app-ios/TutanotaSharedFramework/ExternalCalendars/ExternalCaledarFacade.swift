import Foundation

public class ExternalCalendarFacadeImpl: ExternalCalendarFacade {
	private let urlSession: URLSession
	public init(urlSession: URLSession) { self.urlSession = urlSession }

	public func fetchExternalCalendar(_ url: String) async throws -> String {
		enum FetchExternalError: Error {
			case URLError(String)
			case FetchError(String)
		}

		guard let sourceUrl = URL(string: url) else { throw FetchExternalError.URLError("Error while creating the URL") }

		let (data, _) = try await self.urlSession.data(from: sourceUrl)
		let str = String(data: data, encoding: .utf8) ?? ""

		return str
	}
}
