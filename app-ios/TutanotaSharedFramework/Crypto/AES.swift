import CommonCrypto
import CryptoKit
import Foundation

private let TUTAO_CRYPT_BLOCK_SIZE = 16
private let MAC_DIGEST_LENGTH = SHA256.byteCount
private let MAC_IDENTIFIER: [UInt8] = [0x01]
private let TUTAO_FIXED_IV: Data = Data(repeating: 0x88, count: TUTAO_IV_BYTE_SIZE)
private let MAC_TOTAL_OVERHEAD_LENGTH = MAC_DIGEST_LENGTH + MAC_IDENTIFIER.count

public func aesGenerateKey() -> Data { secureRandomData(ofLength: AES_256_KEY_LENGTH_IN_BITS / 8) }

public func aesGenerateIV() -> Data { secureRandomData(ofLength: TUTAO_IV_BYTE_SIZE) }

/// Decrypt the encrypted data with padding.
///
/// - Parameters:
///   - data: Encrypted data contents
///   - withKey: Encryption key
///
/// - Returns: plaintext
public func aesDecryptData(_ data: Data, withKey key: Data) throws -> Data {
	let enforceMac = key.count == kCCKeySizeAES256
	return try aesDecrypt(data: data, withKey: key, withPadding: true, enforceMac: enforceMac)
}

/// Decrypt an encryption key.
///
/// - Parameters:
///   - encryptedKey: Key that is encrypted
///   - withKey: Encryption key
///
/// - Returns: the decrypted key
public func aesDecryptKey(_ encryptedKey: Data, withKey key: Data) throws -> Data {
	switch key.count {
	case kCCKeySizeAES128:
		// We prepend with a fixed IV when doing AES-128 decryption on an encrypted key
		return try aesDecrypt(data: TUTAO_FIXED_IV + encryptedKey, withKey: key, withPadding: false, enforceMac: false)
	case kCCKeySizeAES256: return try aesDecrypt(data: encryptedKey, withKey: key, withPadding: false, enforceMac: true)
	default: throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "invalid key size \(key.count)")
	}
}

/// Encrypt the data with AES and return it. This function always uses MAC and padding.
///
/// - Parameters:
///   - data: Data to encrypt
///   - withKey: Encryption key
///   - withIV: IV to use
///
/// - Returns: Encrypted cyphertext
public func aesEncryptData(_ data: Data, withKey key: Data, withIV iv: Data = aesGenerateIV()) throws -> Data {
	try aesEncrypt(data: data, withKey: key, withIV: iv, withPadding: true, withMAC: true)
}

/// Encrypt the key with AES and return it. Uses MAC if AES-256 and no MAC if AES-128.
///
/// Note: The IV will also be randomly generated for AES-256, where fixed IVs will be used for AES-128.
///
/// - Parameters:
///   - data: Data to encrypt
///   - withKey: Encryption key
///
/// - Returns: Encrypted cyphertext
public func aesEncryptKey(_ keyToBeEncrypted: Data, withKey key: Data) throws -> Data {
	switch key.count {
	case kCCKeySizeAES128:
		let encrypted = try aesEncrypt(data: keyToBeEncrypted, withKey: key, withIV: TUTAO_FIXED_IV, withPadding: false, withMAC: false)
		return encrypted[TUTAO_IV_BYTE_SIZE...]  // IV is fixed, so we can extract everything after it
	case kCCKeySizeAES256: return try aesEncrypt(data: keyToBeEncrypted, withKey: key, withIV: aesGenerateIV(), withPadding: false, withMAC: true)
	default: throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "invalid key size \(key.count)")
	}
}

/// ONLY VISIBLE FOR TESTING: Use aesEncryptData or aesEncryptKey instead
public func aesEncrypt(data: Data, withKey key: Data, withIV iv: Data, withPadding: Bool, withMAC: Bool) throws -> Data {
	if iv.count != TUTAO_IV_BYTE_SIZE {
		throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "invalid IV length (expected \(TUTAO_IV_BYTE_SIZE), got \(iv.count) instead)")
	}

	let data = [UInt8](data)  // to allow for slicing
	let subKeys = try getSubKeys(withAESKey: key, withMAC: withMAC)
	let hmacOverhead = withMAC ? MAC_TOTAL_OVERHEAD_LENGTH : 0

	// allocate upfront to avoid reallocation cost; will be slightly more but that's OK
	var output: [UInt8] = []
	output.reserveCapacity(hmacOverhead + iv.count + data.count + TUTAO_CRYPT_BLOCK_SIZE)

	if withMAC { output.append(contentsOf: MAC_IDENTIFIER) }

	output.append(contentsOf: iv)

	try aesDoCrypt(operation: CCOperation(kCCEncrypt), withKey: subKeys.cKey, withData: data[...], toOutput: &output, withIV: iv, withPadding: withPadding)

	if withMAC {
		let hmac = HMAC<SHA256>.authenticationCode(for: output[MAC_IDENTIFIER.count..<output.count], using: subKeys.mKey!)
		output.append(contentsOf: hmac)
	}

	return Data(output)
}

private func aesDecrypt(data: Data, withKey key: Data, withPadding: Bool, enforceMac: Bool) throws -> Data {
	let data = [UInt8](data)  // to allow for slicing

	let hasMac = hasMAC(data)
	let subKeys = try getSubKeys(withAESKey: key, withMAC: hasMac)
	let ivOffset: Int

	if enforceMac && !hasMac { throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "mac expected but not found") }

	if hasMac {
		try verifyMAC(forData: data, withMKey: subKeys.mKey!)
		ivOffset = MAC_IDENTIFIER.count
	} else {
		ivOffset = 0
	}

	let dataOffset = ivOffset + TUTAO_CRYPT_BLOCK_SIZE
	let macOffset = data.count - (hasMac ? MAC_DIGEST_LENGTH : 0)

	guard dataOffset < data.count && macOffset <= data.count else {
		throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "Invalid data length: \(data.count), macOffset: \(macOffset)")
	}

	let iv = data[ivOffset..<dataOffset]
	let encryptedData = data[dataOffset..<macOffset]

	var output: [UInt8] = []
	output.reserveCapacity(encryptedData.count)  // allocate upfront to avoid reallocation cost; this may be slightly more due to padding but that's OK
	try aesDoCrypt(
		operation: CCOperation(kCCDecrypt),
		withKey: subKeys.cKey,
		withData: encryptedData,
		toOutput: &output,
		withIV: Data(iv),
		withPadding: withPadding
	)
	return Data(output)
}

private func verifyMAC(forData data: [UInt8], withMKey key: SymmetricKey) throws {
	if !data.starts(with: MAC_IDENTIFIER) {
		throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "invalid MAC: first byte is not \(MAC_IDENTIFIER) but actually \(data[0])")
	}

	let macOffset = data.count - MAC_DIGEST_LENGTH
	guard macOffset < data.count && MAC_IDENTIFIER.count < macOffset else { throw TUTErrorFactory.createError("invalid mac, data.count \(data.count)") }
	let dataToCheck = data[MAC_IDENTIFIER.count..<macOffset]
	let mac = data[macOffset..<data.count]

	let isValid = HMAC<SHA256>.isValidAuthenticationCode(mac, authenticating: dataToCheck, using: key)
	if !isValid { throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "invalid MAC: checksum and/or key is wrong") }
}

/// Execute a CryptoCommons operation on the whole data input and append to the output buffer passed.
private func aesDoCrypt(
	operation: CCOperation,
	withKey key: Data,
	withData input: ArraySlice<UInt8>,
	toOutput output: inout [UInt8],
	withIV iv: Data,
	withPadding padding: Bool
) throws {
	var cryptor: CCCryptorRef?
	let cryptorCreationResult = key.withUnsafeBytes { keyBytes in
		iv.withUnsafeBytes { ivBytes in
			CCCryptorCreate(
				operation,  // operation
				CCAlgorithm(kCCAlgorithmAES),  // algorithm
				padding ? CCOptions(kCCOptionPKCS7Padding) : 0,
				keyBytes.baseAddress,  // key
				keyBytes.count,  // keylength
				ivBytes.baseAddress,  // IV
				&cryptor
			)
		}
	}

	if cryptorCreationResult != kCCSuccess {
		throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "CCCryptorCreate returned \(cryptorCreationResult)")
	}

	defer { CCCryptorRelease(cryptor) }

	var currentOffset = input.startIndex
	var outputBufferLength = 0
	var outputBuffer = [UInt8](repeating: 0, count: TUTAO_CRYPT_BLOCK_SIZE)

	while currentOffset < input.endIndex {
		let end = min(currentOffset + TUTAO_CRYPT_BLOCK_SIZE, input.endIndex)
		let inputSlice = input[currentOffset..<end]
		currentOffset = end

		let cryptoActionResult = inputSlice.withUnsafeBytes { inputBytes in
			CCCryptorUpdate(cryptor, inputBytes.baseAddress, inputBytes.count, &outputBuffer, outputBuffer.count, &outputBufferLength)
		}
		if cryptoActionResult != kCCSuccess {
			throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "CCCryptorUpdate returned \(cryptoActionResult)")
		}

		output.append(contentsOf: outputBuffer[0..<outputBufferLength])
	}

	let finalResult = CCCryptorFinal(cryptor, &outputBuffer, outputBuffer.count, &outputBufferLength)
	if finalResult != kCCSuccess { throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "CCCryptorFinal returned \(finalResult)") }

	output.append(contentsOf: outputBuffer[0..<outputBufferLength])
}

private func getSubKeys(withAESKey key: Data, withMAC: Bool) throws -> SubKeys {
	if !withMAC { return SubKeys(cKey: key, mKey: nil) }

	let digest: Data
	switch key.count {
	case Int(kCCKeySizeAES128): digest = Data(SHA256.hash(data: key))
	case Int(kCCKeySizeAES256): digest = Data(SHA512.hash(data: key))
	default: throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "can't generate subkeys for encryption key of length \(key.count)")
	}

	let median = digest.count / 2
	return SubKeys(cKey: digest[0..<median], mKey: SymmetricKey(data: digest[median..<digest.count]))
}

private struct SubKeys {
	/// Encryption key
	let cKey: Data

	/// MAC key, if present
	let mKey: SymmetricKey?
}

/// Determine if the collection of data has a MAC or not.
private func hasMAC(_ data: any RandomAccessCollection<UInt8>) -> Bool { (data.count % 2) == 1 }
