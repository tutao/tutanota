import tutasdk

public class SdkRestClient: RestClient {
	public init() {}
	public func requestBinary(url: String, method: tutasdk.HttpMethod, options: tutasdk.RestClientOptions) async throws -> tutasdk.RestResponse {
		let configuration = URLSessionConfiguration.ephemeral
		configuration.httpAdditionalHeaders = options.headers
		let urlSession = URLSession(configuration: configuration)
		var request = URLRequest(url: URL(string: url)!)
		request.httpMethod =
			switch method {
			case .get: "get"
			case .post: "post"
			case .delete: "delete"
			case .put: "put"
			}
		request.httpBody = options.body
		let (data, urlResponse) = try await urlSession.data(for: request)
		let httpUrlResponse = urlResponse as! HTTPURLResponse  // We should only ever receive HTTP URLs
		guard let headers = httpUrlResponse.allHeaderFields as? [String: String] else {
			throw TUTErrorFactory.createError("Response headers were not a [String:String]")
		}
		return RestResponse(status: UInt32(httpUrlResponse.statusCode), headers: headers, body: data)
	}
}
