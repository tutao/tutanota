/// Generate a `Data` containing `ofLength` random bytes.
public func secureRandomData(ofLength length: Int) -> Data { Data(secureRandomBytes(ofLength: length)) }

/// Generate a `UInt8` array containing `ofLength` random bytes.
public func secureRandomBytes(ofLength length: Int) -> [UInt8] {
	var bytes = [UInt8](repeating: 0, count: length)
	let result = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
	if result != errSecSuccess {
		// This should absolutely never happen.
		fatalError("somehow failed to generate random bytes: \(result)")
	}
	return bytes
}
