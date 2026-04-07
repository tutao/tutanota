/* generated file, don't edit. */


public struct KyberEncapsulation : Codable, Sendable {
	public init(
		ciphertext: DataWrapper,
		sharedSecret: DataWrapper
	) {
		self.ciphertext = ciphertext
		self.sharedSecret = sharedSecret
	}
	public let ciphertext: DataWrapper
	public let sharedSecret: DataWrapper
}
