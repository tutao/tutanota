/* generated file, don't edit. */


import Foundation

public protocol NativeCryptoFacade {
	func rsaEncrypt(
		_ publicKey: PublicKey,
		_ base64Data: String,
		_ base64Seed: String
	) async throws -> String
	func rsaDecrypt(
		_ privateKey: PrivateKey,
		_ base64Data: String
	) async throws -> String
	func aesEncryptFile(
		_ key: String,
		_ fileUri: String,
		_ iv: String
	) async throws -> EncryptedFileInfo
	func aesDecryptFile(
		_ key: String,
		_ fileUri: String
	) async throws -> String
	func generateRsaKey(
		_ seed: String
	) async throws -> RsaKeyPair
}
