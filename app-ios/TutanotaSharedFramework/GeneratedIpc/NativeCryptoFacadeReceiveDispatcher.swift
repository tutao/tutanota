/* generated file, don't edit. */


import Foundation

public class NativeCryptoFacadeReceiveDispatcher {
	let facade: NativeCryptoFacade
	init(facade: NativeCryptoFacade) {
		self.facade = facade
	}
	public func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "rsaEncrypt":
			let publicKey = try! JSONDecoder().decode(RsaPublicKey.self, from: arg[0].data(using: .utf8)!)
			let data = try! JSONDecoder().decode(DataWrapper.self, from: arg[1].data(using: .utf8)!)
			let seed = try! JSONDecoder().decode(DataWrapper.self, from: arg[2].data(using: .utf8)!)
			let result = try await self.facade.rsaEncrypt(
				publicKey,
				data,
				seed
			)
			return toJson(result)
		case "rsaDecrypt":
			let privateKey = try! JSONDecoder().decode(RsaPrivateKey.self, from: arg[0].data(using: .utf8)!)
			let data = try! JSONDecoder().decode(DataWrapper.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.rsaDecrypt(
				privateKey,
				data
			)
			return toJson(result)
		case "aesEncryptFile":
			let key = try! JSONDecoder().decode(DataWrapper.self, from: arg[0].data(using: .utf8)!)
			let fileUri = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let iv = try! JSONDecoder().decode(DataWrapper.self, from: arg[2].data(using: .utf8)!)
			let result = try await self.facade.aesEncryptFile(
				key,
				fileUri,
				iv
			)
			return toJson(result)
		case "aesDecryptFile":
			let key = try! JSONDecoder().decode(DataWrapper.self, from: arg[0].data(using: .utf8)!)
			let fileUri = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.aesDecryptFile(
				key,
				fileUri
			)
			return toJson(result)
		case "argon2idGeneratePassphraseKey":
			let passphrase = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let salt = try! JSONDecoder().decode(DataWrapper.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.argon2idGeneratePassphraseKey(
				passphrase,
				salt
			)
			return toJson(result)
		case "generateKyberKeypair":
			let seed = try! JSONDecoder().decode(DataWrapper.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.generateKyberKeypair(
				seed
			)
			return toJson(result)
		case "kyberEncapsulate":
			let publicKey = try! JSONDecoder().decode(KyberPublicKey.self, from: arg[0].data(using: .utf8)!)
			let seed = try! JSONDecoder().decode(DataWrapper.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.kyberEncapsulate(
				publicKey,
				seed
			)
			return toJson(result)
		case "kyberDecapsulate":
			let privateKey = try! JSONDecoder().decode(KyberPrivateKey.self, from: arg[0].data(using: .utf8)!)
			let ciphertext = try! JSONDecoder().decode(DataWrapper.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.kyberDecapsulate(
				privateKey,
				ciphertext
			)
			return toJson(result)
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
