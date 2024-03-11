/* generated file, don't edit. */


import Foundation

public class NativeCredentialsFacadeReceiveDispatcher {
	let facade: NativeCredentialsFacade
	init(facade: NativeCredentialsFacade) {
		self.facade = facade
	}
	public func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "getSupportedEncryptionModes":
			let result = try await self.facade.getSupportedEncryptionModes(
			)
			return toJson(result)
		case "loadAll":
			let result = try await self.facade.loadAll(
			)
			return toJson(result)
		case "store":
			let credentials = try! JSONDecoder().decode(UnencryptedCredentials.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.store(
				credentials
			)
			return "null"
		case "storeEncrypted":
			let credentials = try! JSONDecoder().decode(PersistedCredentials.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.storeEncrypted(
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
			let encryptionMode = try! JSONDecoder().decode(CredentialEncryptionMode.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.setCredentialEncryptionMode(
				encryptionMode
			)
			return "null"
		case "clear":
			try await self.facade.clear(
			)
			return "null"
		case "migrateToNativeCredentials":
			let credentials = try! JSONDecoder().decode([PersistedCredentials].self, from: arg[0].data(using: .utf8)!)
			let encryptionMode = try! JSONDecoder().decode(CredentialEncryptionMode.self, from: arg[1].data(using: .utf8)!)
			let credentialsKey = try! JSONDecoder().decode(DataWrapper.self, from: arg[2].data(using: .utf8)!)
			try await self.facade.migrateToNativeCredentials(
				credentials,
				encryptionMode,
				credentialsKey
			)
			return "null"
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
