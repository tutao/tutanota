/* generated file, don't edit. */


import Foundation

public class NativeCredentialsFacadeReceiveDispatcher {
	let facade: NativeCredentialsFacade
	init(facade: NativeCredentialsFacade) {
		self.facade = facade
	}
	public func dispatch(method: String, arg: [String]) async throws -> String {
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
		case "loadAll":
			let result = try await self.facade.loadAll(
			)
			return toJson(result)
		case "store":
			let credentials = try! JSONDecoder().decode(PersistedCredentials.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.store(
				credentials
			)
			return "null"
		case "loadByUserId":
			let id = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.loadByUserId(
				id
			)
			return toJson(result)
		case "deleteByUserId":
			let id = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.deleteByUserId(
				id
			)
			return "null"
		case "getCredentialEncryptionMode":
			let result = try await self.facade.getCredentialEncryptionMode(
			)
			return toJson(result)
		case "setCredentialEncryptionMode":
			let encryptionMode = try! JSONDecoder().decode(CredentialEncryptionMode?.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.setCredentialEncryptionMode(
				encryptionMode
			)
			return "null"
		case "getCredentialsEncryptionKey":
			let result = try await self.facade.getCredentialsEncryptionKey(
			)
			return toJson(result)
		case "setCredentialsEncryptionKey":
			let credentialsEncryptionKey = try! JSONDecoder().decode(DataWrapper?.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.setCredentialsEncryptionKey(
				credentialsEncryptionKey
			)
			return "null"
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
