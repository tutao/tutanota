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
	func generateEd25519Keypair(
	) async throws -> IPCEd25519KeyPair
	func ed25519Sign(
		_ privateKey: IPCEd25519PrivateKey,
		_ data: DataWrapper
	) async throws -> IPCEd25519Signature
	func ed25519Verify(
		_ publicKey: IPCEd25519PublicKey,
		_ data: DataWrapper,
		_ signature: IPCEd25519Signature
	) async throws -> Bool
}
