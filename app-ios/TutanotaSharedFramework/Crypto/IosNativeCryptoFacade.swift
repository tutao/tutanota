import TutanotaSharedFramework
import tutasdk

/// High-level cryptographic operations API
/// Is an actor because we want to have serial execution for all the cryptogaphic operations, doing them in parallel is usually too
/// much for the device.
public actor IosNativeCryptoFacade: NativeCryptoFacade {
	public init() {}

	public func aesEncryptFile(_ key: DataWrapper, _ fileUri: String, _ iv: DataWrapper) async throws -> EncryptedFileInfo {

		if !FileUtils.fileExists(atPath: fileUri) { throw CryptoError(message: "File to encrypt does not exist \(fileUri)") }
		let encryptedFolder = try FileUtils.getEncryptedFolder()
		let fileName = (fileUri as NSString).lastPathComponent
		let encryptedFilePath = (encryptedFolder as NSString).appendingPathComponent(fileName)
		let plainTextData = try Data(contentsOf: URL(fileURLWithPath: fileUri))
		let outputData = try aesEncryptData(plainTextData, withKey: key.data, withIV: iv.data)
		let result = EncryptedFileInfo(uri: encryptedFilePath, unencryptedSize: plainTextData.count)

		try outputData.write(to: URL(fileURLWithPath: encryptedFilePath))

		return result
	}

	public func aesDecryptFile(_ key: DataWrapper, _ fileUri: String) async throws -> String {
		if !FileUtils.fileExists(atPath: fileUri) { throw CryptoError(message: "File to decrypt does not exist") }

		let encryptedData = try Data(contentsOf: URL(fileURLWithPath: fileUri))
		let plaintextData = try aesDecryptData(encryptedData, withKey: key.data)

		let decryptedFolder = try FileUtils.getDecryptedFolder()
		let fileName = (fileUri as NSString).lastPathComponent
		let plaintextPath = (decryptedFolder as NSString).appendingPathComponent(fileName)
		try plaintextData.write(to: URL(fileURLWithPath: plaintextPath), options: .atomic)

		return plaintextPath
	}

	public func rsaEncrypt(_ publicKey: RsaPublicKey, _ data: DataWrapper, _ seed: DataWrapper) async throws -> DataWrapper {
		try tutasdk.rsaEncryptWithPublicKeyComponents(
			data: data.data,
			seed: seed.data,
			modulus: publicKey.modulus,
			publicExponent: UInt32(publicKey.publicExponent)
		)
		.wrap()
	}

	public func rsaDecrypt(_ privateKey: RsaPrivateKey, _ data: DataWrapper) async throws -> DataWrapper {
		try tutasdk.rsaDecryptWithPrivateKeyComponents(
			ciphertext: data.data,
			modulus: privateKey.modulus,
			privateExponent: privateKey.privateExponent,
			primeP: privateKey.primeP,
			primeQ: privateKey.primeQ
		)
		.wrap()
	}

	public func argon2idGeneratePassphraseKey(_ passphrase: String, _ salt: DataWrapper) async throws -> DataWrapper {
		try tutasdk.argon2idGenerateKeyFromPassphrase(passphrase: passphrase, salt: salt.data).wrap()
	}

	public func generateKyberKeypair(_ seed: DataWrapper) async throws -> TutanotaSharedFramework.KyberKeyPair {
		let keypair = tutasdk.generateKyberKeypair()
		return KyberKeyPair(publicKey: KyberPublicKey(raw: keypair.publicKey.wrap()), privateKey: KyberPrivateKey(raw: keypair.privateKey.wrap()))
	}

	public func kyberEncapsulate(_ publicKey: KyberPublicKey, _ seed: DataWrapper) async throws -> TutanotaSharedFramework.KyberEncapsulation {
		do {
			let sdkEncapsulation = try tutasdk.kyberEncapsulateWithPubKey(publicKeyBytes: publicKey.raw.data)
			return KyberEncapsulation(ciphertext: sdkEncapsulation.ciphertext.wrap(), sharedSecret: sdkEncapsulation.sharedSecret.wrap())
		} catch { throw CryptoError(message: error.localizedDescription) }
	}

	public func kyberDecapsulate(_ privateKey: KyberPrivateKey, _ ciphertext: DataWrapper) async throws -> DataWrapper {
		do { return try tutasdk.kyberDecapsulateWithPrivKey(privateKeyBytes: privateKey.raw.data, ciphertext: ciphertext.data).wrap() } catch {
			throw CryptoError(message: error.localizedDescription)
		}

	}
}

private func CryptoError(message: String) -> Error { TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: message) }
