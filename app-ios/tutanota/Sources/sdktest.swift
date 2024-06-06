import Alamofire
import TutanotaSharedFramework
import tutasdk

func runSdkExample() async {
	let sdk = Sdk.init(baseUrl: "http://wec:9000", restClient: HttpClient(), clientVersion: Bundle.main.infoDictionary!["CFBundleVersion"] as! String)
	sdk.login(accessToken: "Y-6O4ugAAYABqu8kNOw2TVwevYFiEkSa_g")
	let mailId = "NyuDsia--V-0/NyuDt95--3-0".toIdTuple()
	let mailFacade = sdk.mailFacade()
	do {
		let result = try await mailFacade.loadEmailByIdEncrypted(idTuple: mailId)
		TUTSLog("Loaded result from TutaSDK: \(result)")
		let sender = try getDictionary(dictionary: result, key: "sender")
		guard let address = sender["address"] else {
			throw TUTErrorFactory.createError("The 'address' key in the 'sender' header in response is of the wrong type!")
		}
		TUTSLog("Loaded sender from TutaSDK: \(address)")
	} catch { TUTSLog("An exception occured while loading an email in the SDK test: \(error)") }
}

// Returns a ElementValue.dict from another ElementValue.dict
private func getDictionary(dictionary: [String: ElementValue], key: String) throws -> [String: ElementValue] {
	if let value = dictionary[key] {
		switch value {
		case .dict(let innerDictionary): return innerDictionary
		default: throw TUTErrorFactory.createError("\(key) in dictionary is not a dictionary!")
		}
	} else {
		throw TUTErrorFactory.createError("Dictionary is nil!")
	}
}

private extension String {
	func toIdTuple() -> tutasdk.IdTuple {
		let idParts = self.split(separator: "/", maxSplits: 1)
		return tutasdk.IdTuple(listId: String(idParts[0]), elementId: String(idParts[1]))
	}
}

private extension Alamofire.HTTPMethod {
	// Convert the SDK's HTTP method enum into Alamofire's equivalent
	init(_ sdkMethod: tutasdk.HttpMethod) {
		switch sdkMethod {
		case HttpMethod.get: self = Alamofire.HTTPMethod.get
		case HttpMethod.delete: self = Alamofire.HTTPMethod.delete
		case HttpMethod.post: self = Alamofire.HTTPMethod.post
		case HttpMethod.put: self = Alamofire.HTTPMethod.put
		}
	}
}

// The HTTP client built off the 'Alamofire' client to be injected into the SDK
public class HttpClient: RestClient {
	public func requestBinary(url: String, method: HttpMethod, options: RestClientOptions) async throws -> RestResponse {
		let response = await AF.request(url, method: HTTPMethod(method), headers: HTTPHeaders.init(options.headers)).serializingData().response

		guard let real_response = response.response else { throw RestClientError.NetworkError }

		return RestResponse(status: UInt32(real_response.statusCode), headers: real_response.headers.dictionary, body: response.data)
	}
}
