import Foundation
import Testing

@testable import TutanotaSharedFramework

@propertyWrapper struct Base64Data { var wrappedValue: Data }

extension Base64Data: Decodable {
	init(from decoder: any Decoder) throws {
		let container = try decoder.singleValueContainer()
		let base64 = try container.decode(String.self)
		self.wrappedValue = Data(base64Encoded: base64)!
	}
}

@propertyWrapper struct HexData { var wrappedValue: Data }

extension HexData: Decodable {
	init(from decoder: any Decoder) throws {
		let container = try decoder.singleValueContainer()
		let hex = try container.decode(String.self)
		self.wrappedValue = Data(hexEncoded: hex)!
	}
}

struct AesTestData: Decodable {
	@HexData var seed: Data
	@Base64Data var plainText: Data
	@Base64Data var cipherText: Data
	@HexData var key: Data
	@HexData var keyToEncrypt128: Data
	@HexData var keyToEncrypt256: Data
	@Base64Data var encryptedKey128: Data
	@Base64Data var encryptedKey256: Data

	enum CodingKeys: String, CodingKey {
		case seed
		case plainText = "plainTextBase64"
		case cipherText = "cipherTextBase64"
		case key = "hexKey"
		case keyToEncrypt128
		case keyToEncrypt256
		case encryptedKey128
		case encryptedKey256
	}
}

struct AeadTestData: Decodable {
	@HexData var seed: Data
	@Base64Data var plainText: Data
	@Base64Data var cipherText: Data
	@HexData var plaintextKey: Data
	@HexData var encryptionKey: Data
	@Base64Data var encryptedKey: Data
	@Base64Data var associatedData: Data

	enum CodingKeys: String, CodingKey {
		case seed
		case plainText = "plainTextBase64"
		case cipherText = "cipherTextBase64"
		case plaintextKey
		case encryptionKey
		case encryptedKey
		case associatedData
	}
}

struct AesMacTestData: Decodable {
	@HexData var seed: Data
	@Base64Data var plainText: Data
	@Base64Data var cipherText: Data
	@HexData var key: Data

	enum CodingKeys: String, CodingKey {
		case seed
		case plainText = "plainTextBase64"
		case cipherText = "cipherTextBase64"
		case key = "hexKey"
	}
}

struct Argon2idTestData: Decodable {
	var password: String
	@HexData var key: Data
	@HexData var salt: Data

	enum CodingKeys: String, CodingKey {
		case password
		case key = "keyHex"
		case salt = "saltHex"
	}
}

struct RsaTestData: Decodable {
	@HexRsaPublicKey var publicKey: RsaPublicKey
	@HexRsaPrivateKey var privateKey: RsaPrivateKey
	@HexData var input: Data
	@HexData var result: Data
	@HexData var seed: Data
}

@propertyWrapper struct HexRsaPublicKey: Decodable {
	var wrappedValue: RsaPublicKey

	init(from decoder: any Decoder) throws {
		let container = try decoder.singleValueContainer()
		let hex = try container.decode(String.self)
		let components = try hexComponents(fromHex: hex, sizeDivisor: 2)
		self.wrappedValue = RsaPublicKey(
			version: 0,
			keyLength: RSA_KEY_LENGTH_IN_BITS,
			modulus: components[0].base64EncodedString(),
			publicExponent: PUBLIC_EXPONENT
		)
	}
}

@propertyWrapper struct HexRsaPrivateKey: Decodable {
	var wrappedValue: RsaPrivateKey

	init(from decoder: any Decoder) throws {
		let container = try decoder.singleValueContainer()
		let hex = try container.decode(String.self)
		let components = try hexComponents(fromHex: hex, sizeDivisor: 2)
		let base64Components = components.map { $0.base64EncodedString() }
		self.wrappedValue = RsaPrivateKey(
			version: 0,
			keyLength: RSA_KEY_LENGTH_IN_BITS,
			modulus: base64Components[0],
			privateExponent: base64Components[1],
			primeP: base64Components[2],
			primeQ: base64Components[3],
			primeExponentP: base64Components[4],
			primeExponentQ: base64Components[5],
			crtCoefficient: base64Components[6]
		)
	}
}

@propertyWrapper struct HexKyberPublicKey: Decodable {
	var wrappedValue: KyberPublicKey

	init(from decoder: any Decoder) throws {
		let container = try decoder.singleValueContainer()
		let hex = try container.decode(String.self)
		let components = try hexComponents(fromHex: hex, sizeDivisor: 1)
		// key is expected by oqs in the same order t, rho
		self.wrappedValue = KyberPublicKey(raw: DataWrapper(data: components[0] + components[1]))
	}
}

@propertyWrapper struct HexKyberPrivateKey: Decodable {
	var wrappedValue: KyberPrivateKey

	init(from decoder: any Decoder) throws {
		let container = try decoder.singleValueContainer()
		let hex = try container.decode(String.self)
		// key is expected by oqs in this order (vs how we encode it on the server): s, t, rho, hpk, nonce
		let components = try hexComponents(fromHex: hex, sizeDivisor: 1)
		self.wrappedValue = KyberPrivateKey(raw: DataWrapper(data: components[0] + components[3] + components[4] + components[1] + components[2]))
	}
}

struct KyberTestData: Decodable {
	@HexKyberPublicKey var publicKey: KyberPublicKey
	@HexKyberPrivateKey var privateKey: KyberPrivateKey
	@HexData var seed: Data
	@HexData var cipherText: Data
	@HexData var sharedSecret: Data
}

struct Ed25519TestData: Decodable {
	@HexData var alicePrivateKeyHex: Data
	@HexData var alicePublicKeyHex: Data
	@HexData var message: Data
	@HexData var signature: Data
	@HexData var seed: Data
}

struct EncryptedTestData: Decodable {
	let aes128Tests: [AesTestData]
	let aes128MacTests: [AesMacTestData]
	let aes256Tests: [AesTestData]
	let argon2idTests: [Argon2idTestData]
	let rsaEncryptionTests: [RsaTestData]
	let kyberEncryptionTests: [KyberTestData]
	let ed25519Tests: [Ed25519TestData]
	let aeadTests: [AeadTestData]
}

// used for testing Swift code
struct CryptoCompatibilityTest {
	private let facade = IosNativeCryptoFacade()
	private var testData: EncryptedTestData = CompatibilityTestData.load()

	@Test func testArgon2id() async throws {
		for test in testData.argon2idTests {
			let passphrase = test.password
			let expectedHash = test.key
			let salt = test.salt
			let result = try await facade.argon2idGeneratePassphraseKey(passphrase, salt.wrap())
			#expect(result.data == expectedHash)
		}
	}

	@Test func testRsa() async throws {
		for test in testData.rsaEncryptionTests {
			let encrypted = try await facade.rsaEncrypt(test.publicKey, test.input.wrap(), test.seed.wrap())
			#expect(encrypted.data == test.result)

			let decrypted = try await facade.rsaDecrypt(test.privateKey, test.result.wrap())
			#expect(test.input == decrypted.data)
		}
	}

	@Test func testAes128() throws {
		for test in testData.aes128Tests {
			try testAesDataEncryption(test: test, withMAC: false)
			let resultingEncryptedKey128 = try aesEncryptKey(test.keyToEncrypt128, withKey: test.key)
			#expect(resultingEncryptedKey128 == test.encryptedKey128)
			let resultingEncryptedKey256 = try aesEncryptKey(test.keyToEncrypt256, withKey: test.key)
			#expect(resultingEncryptedKey256 == test.encryptedKey256)

			let resultingDecryptedKey128 = try aesDecryptKey(resultingEncryptedKey128, withKey: test.key)
			#expect(resultingDecryptedKey128 == test.keyToEncrypt128)
			let resultingDecryptedKey256 = try aesDecryptKey(resultingEncryptedKey256, withKey: test.key)
			#expect(resultingDecryptedKey256 == test.keyToEncrypt256)
		}
	}

	@Test func testAes128Mac() throws {
		// AES-128 with MAC is not used for keys, so it's not tested here
		for test in testData.aes128MacTests {
			let encrypted = try aesEncrypt(
				data: test.plainText,
				withKey: test.key,
				withIV: test.seed.subdata(in: 0..<TUTAO_IV_BYTE_SIZE),
				withPadding: true,
				withMAC: true
			)
			let decrypted = try aesDecryptData(encrypted, withKey: test.key)
			#expect(encrypted == test.cipherText)
			#expect(decrypted == test.plainText)
		}

	}

	@Test func testAes256() throws {
		for test in testData.aes256Tests {
			try testAesDataEncryption(test: test, withMAC: true)
			// aesEncrypt(key:withKey:) does not support passing in IVs, and AES and TUTCrypto do not currently support mocking, so we use the
			// full aesEncrypt function that the key function would've called anyway

			let resultingEncryptedKey128 = try aesEncrypt(
				data: test.keyToEncrypt128,
				withKey: test.key,
				withIV: test.seed.subdata(in: 0..<TUTAO_IV_BYTE_SIZE),
				withPadding: false,
				withMAC: true
			)
			#expect(resultingEncryptedKey128 == test.encryptedKey128)
			let resultingEncryptedKey256 = try aesEncrypt(
				data: test.keyToEncrypt256,
				withKey: test.key,
				withIV: test.seed.subdata(in: 0..<TUTAO_IV_BYTE_SIZE),
				withPadding: false,
				withMAC: true
			)
			#expect(resultingEncryptedKey256 == test.encryptedKey256)

			let resultingDecryptedKey128 = try aesDecryptKey(resultingEncryptedKey128, withKey: test.key)
			#expect(resultingDecryptedKey128 == test.keyToEncrypt128)
			let resultingDecryptedKey256 = try aesDecryptKey(resultingEncryptedKey256, withKey: test.key)
			#expect(resultingDecryptedKey256 == test.keyToEncrypt256)
		}
	}

	@Test func testKyber() async throws {
		for test in testData.kyberEncryptionTests {
			let decaps = try await facade.kyberDecapsulate(test.privateKey, test.cipherText.wrap())
			#expect(decaps.data == test.sharedSecret)
		}
	}

	@Test func ed25519() async throws {
		for test in testData.ed25519Tests {
			let alicePrivateKey = IPCEd25519PrivateKey(raw: DataWrapper(data: test.alicePrivateKeyHex))
			let alicePublicKey = IPCEd25519PublicKey(raw: DataWrapper(data: test.alicePublicKeyHex))
			let message = DataWrapper(data: test.message)

			let signature = IPCEd25519Signature(signature: DataWrapper(data: test.signature))
			let reproducedSignature = try await facade.ed25519Sign(alicePrivateKey, message)
			#expect(reproducedSignature.signature.data == signature.signature.data)

			let verifyResult = try await facade.ed25519Verify(alicePublicKey, message, signature)
			#expect(verifyResult == true)
		}
	}

	private func testAesDataEncryption(test: AesTestData, withMAC: Bool) throws {
		let encrypted = try aesEncrypt(
			data: test.plainText,
			withKey: test.key,
			withIV: test.seed.subdata(in: 0..<TUTAO_IV_BYTE_SIZE),
			withPadding: true,
			withMAC: withMAC
		)
		let decrypted = try aesDecryptData(encrypted, withKey: test.key)
		#expect(encrypted == test.cipherText)
		#expect(decrypted == test.plainText)
	}
}

private func hexComponents(fromHex hex: String, sizeDivisor: Int) throws -> [Data] {
	let converted = Data(hexEncoded: hex)!
	var offset = 0

	var d = [Data]()
	while offset < converted.count {
		// Make sure we can read a full size
		guard offset + 2 <= converted.count else { throw TutanotaError(message: "Badly formatted hex components string (size cutoff)") }

		// Get the size count
		let sizeBytes = (Int(converted[offset]) << 8 | Int(converted[offset + 1])) / sizeDivisor  // big endian

		offset += 2
		guard offset + sizeBytes <= converted.count else { throw TutanotaError(message: "Badly formatted hex components string (size cutoff)") }
		d.append(Data(converted[offset..<offset + sizeBytes]))
		offset += sizeBytes
	}

	return d
}
