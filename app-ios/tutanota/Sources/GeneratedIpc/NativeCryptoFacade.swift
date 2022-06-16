/* generated file, don't edit. */


import Foundation

public protocol NativeCryptoFacade {
	func rsaEncrypt(
		_ publicKey: PublicKey,
		_ data: DataWrapper,
		_ seed: DataWrapper
	) async throws -> DataWrapper
	func rsaDecrypt(
		_ privateKey: PrivateKey,
		_ data: DataWrapper
	) async throws -> DataWrapper
	func aesEncryptFile(
		_ key: DataWrapper,
		_ fileUri: String,
		_ iv: DataWrapper
	) async throws -> EncryptedFileInfo
	func aesDecryptFile(
		_ key: DataWrapper,
		_ fileUri: String
	) async throws -> String
	func generateRsaKey(
		_ seed: DataWrapper
	) async throws -> RsaKeyPair
}
