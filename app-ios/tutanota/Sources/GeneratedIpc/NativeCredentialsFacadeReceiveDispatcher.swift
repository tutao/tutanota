/* generated file, don't edit. */


import Foundation

public class NativeCredentialsFacadeReceiveDispatcher {
	let facade: NativeCredentialsFacade
	init(facade: NativeCredentialsFacade) {
		self.facade = facade
	}
	func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "encryptUsingKeychain":
			let base64EncodedData = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let encryptionMode = try! JSONDecoder().decode(CredentialEncryptionMode.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.encryptUsingKeychain(
				base64EncodedData,
				encryptionMode
			)
			return toJson(result)
		case "decryptUsingKeychain":
			let base64EncodedEncryptedData = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let encryptionMode = try! JSONDecoder().decode(CredentialEncryptionMode.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.decryptUsingKeychain(
				base64EncodedEncryptedData,
				encryptionMode
			)
			return toJson(result)
		case "getSupportedEncryptionModes":
			let result = try await self.facade.getSupportedEncryptionModes(
			)
			return toJson(result)
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
