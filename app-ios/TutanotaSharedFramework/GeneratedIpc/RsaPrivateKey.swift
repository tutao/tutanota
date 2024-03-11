/* generated file, don't edit. */


public struct RsaPrivateKey : Codable {
	public init(
		version: Int,
		keyLength: Int,
		modulus: String,
		privateExponent: String,
		primeP: String,
		primeQ: String,
		primeExponentP: String,
		primeExponentQ: String,
		crtCoefficient: String
	) {
		self.version = version
		self.keyLength = keyLength
		self.modulus = modulus
		self.privateExponent = privateExponent
		self.primeP = primeP
		self.primeQ = primeQ
		self.primeExponentP = primeExponentP
		self.primeExponentQ = primeExponentQ
		self.crtCoefficient = crtCoefficient
	}
	public let version: Int
	public let keyLength: Int
	public let modulus: String
	public let privateExponent: String
	public let primeP: String
	public let primeQ: String
	public let primeExponentP: String
	public let primeExponentQ: String
	public let crtCoefficient: String
}
