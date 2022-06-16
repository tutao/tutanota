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
			let data = try! JSONDecoder().decode(DataWrapper.self, from: arg[0].data(using: .utf8)!)
			let encryptionMode = try! JSONDecoder().decode(CredentialEncryptionMode.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.encryptUsingKeychain(
				data,
				encryptionMode
			)
			return toJson(result)
		case "decryptUsingKeychain":
			let encryptedData = try! JSONDecoder().decode(DataWrapper.self, from: arg[0].data(using: .utf8)!)
			let encryptionMode = try! JSONDecoder().decode(CredentialEncryptionMode.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.decryptUsingKeychain(
				encryptedData,
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
