import Foundation

/// Generate a hash using Argon2id with the given parameters
///
/// - parameters:
///   - password: password bytes (NOTE: will be zeroed out upon completion)
///   - length: desired hash length
///   - salt: salt bytes
///   - iterations: time cost (# of iterations)
///   - parallelism: degrees of parallelism
///   - memoryCostInKibibytes: memory cost in KiB (1024 bytes = 1 KiB)
func generateArgon2idHash(
	ofPassword password: DataWrapper,
	ofHashLength length: Int,
	withSalt salt: Data,
	withIterations iterations: UInt,
	withParallelism parallelism: UInt,
	withMemoryCost memoryCostInKibibytes: UInt
) throws -> Data {
	var hashOutput = [UInt8](repeating: 0, count: length)

	// We need to pass pointers directly to C, of which they have a limited lifetime (hence why we have two closures here!)
	let errorCode = password.data.withUnsafeMutableBytes { (passwordBytePtr: UnsafeMutableRawBufferPointer) in
		salt.withUnsafeBytes { (saltBytePtr: UnsafeRawBufferPointer) in
			let result = argon2id_hash_raw(
				UInt32(iterations),
				UInt32(memoryCostInKibibytes),
				UInt32(parallelism),
				passwordBytePtr.baseAddress,
				passwordBytePtr.count,
				saltBytePtr.baseAddress,
				salt.count,
				&hashOutput,
				hashOutput.count
			)
			// Erase the password once finished regardless of result
			passwordBytePtr.initializeMemory(as: UInt8.self, repeating: 0)
			return result
		}
	}

	// handle error case
	switch Argon2_ErrorCodes(errorCode) {
	case ARGON2_OK: return Data(hashOutput)
	default:
		let errorMessage = argon2_error_message(errorCode)!
		throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "argon2id_hash_raw returned \(errorCode): \(errorMessage)")
	}
}
