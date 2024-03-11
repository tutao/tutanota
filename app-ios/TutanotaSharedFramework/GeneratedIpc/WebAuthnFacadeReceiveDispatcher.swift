/* generated file, don't edit. */


import Foundation

public class WebAuthnFacadeReceiveDispatcher {
	let facade: WebAuthnFacade
	init(facade: WebAuthnFacade) {
		self.facade = facade
	}
	public func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "register":
			let challenge = try! JSONDecoder().decode(WebAuthnRegistrationChallenge.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.register(
				challenge
			)
			return toJson(result)
		case "sign":
			let challenge = try! JSONDecoder().decode(WebAuthnSignChallenge.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.sign(
				challenge
			)
			return toJson(result)
		case "abortCurrentOperation":
			try await self.facade.abortCurrentOperation(
			)
			return "null"
		case "isSupported":
			let result = try await self.facade.isSupported(
			)
			return toJson(result)
		case "canAttemptChallengeForRpId":
			let rpId = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.canAttemptChallengeForRpId(
				rpId
			)
			return toJson(result)
		case "canAttemptChallengeForU2FAppId":
			let appId = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.canAttemptChallengeForU2FAppId(
				appId
			)
			return toJson(result)
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
