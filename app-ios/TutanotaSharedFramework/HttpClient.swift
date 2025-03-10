import Foundation

public enum HttpMethod: String {
	case get = "GET"
	case post = "POST"
	case put = "PUT"
	case delete = "DELETE"
	case patch = "PATCH"
}

public protocol HttpClient { func fetch(url: URL, method: HttpMethod, headers: [String: String], body: Data?) async throws -> (Data, HTTPURLResponse) }

public extension HttpClient {
	func fetch(url: URL, method: HttpMethod = .get, headers: [String: String] = [:], body: Data? = nil) async throws -> (Data, HTTPURLResponse) {
		try await self.fetch(url: url, method: method, headers: headers, body: body)
	}
}

public class URLSessionHttpClient: HttpClient {
	private let session: URLSession

	public init(session: URLSession) { self.session = session }

	public func fetch(url: URL, method: HttpMethod, headers: [String: String], body: Data?) async throws -> (Data, HTTPURLResponse) {
		var request = URLRequest(url: url)
		request.httpMethod = method.rawValue
		request.httpBody = body
		for (headerName, headerValue) in headers { request.setValue(headerValue, forHTTPHeaderField: headerName) }
		let (data, response) = try await self.session.data(for: request)
		return (data, response as! HTTPURLResponse)
	}
}
