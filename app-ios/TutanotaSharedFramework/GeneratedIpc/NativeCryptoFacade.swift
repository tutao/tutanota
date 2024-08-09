/* generated file, don't edit. */


import Foundation

public protocol NativeCryptoFacade {
	func rsaEncrypt(
		_ publicKey: RsaPublicKey,
		_ data: DataWrapper,
		_ seed: DataWrapper
	) async throws -> DataWrapper
	func rsaDecrypt(
		_ privateKey: RsaPrivateKey,
		_ data: DataWrapper
	) async throws -> DataWrapper
	/**
	 * Encrypt file specified by the `fileUri`. Returns URI of the encrypted file.
	 */
	func aesEncryptFile(
		_ key: DataWrapper,
		_ fileUri: String,
		_ iv: DataWrapper
	) async throws -> EncryptedFileInfo
	/**
	 * Decrypt file specified by the `fileUri`. Returns URI of the decrypted file.
	 */
	func aesDecryptFile(
		_ key: DataWrapper,
		_ fileUri: String
	) async throws -> String
	func argon2idGeneratePassphraseKey(
		_ passphrase: String,
		_ salt: DataWrapper
	) async throws -> DataWrapper
	func generateKyberKeypair(
		_ seed: DataWrapper
	) async throws -> KyberKeyPair
	func kyberEncapsulate(
		_ publicKey: KyberPublicKey,
		_ seed: DataWrapper
	) async throws -> KyberEncapsulation
	func kyberDecapsulate(
		_ privateKey: KyberPrivateKey,
		_ ciphertext: DataWrapper
	) async throws -> DataWrapper
}
