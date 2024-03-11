/* generated file, don't edit. */


public struct RsaPublicKey : Codable {
	public init(
		version: Int,
		keyLength: Int,
		modulus: String,
		publicExponent: Int
	) {
		self.version = version
		self.keyLength = keyLength
		self.modulus = modulus
		self.publicExponent = publicExponent
	}
	public let version: Int
	public let keyLength: Int
	public let modulus: String
	public let publicExponent: Int
}
