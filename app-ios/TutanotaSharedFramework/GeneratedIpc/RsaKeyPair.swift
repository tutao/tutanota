/* generated file, don't edit. */


public struct RsaKeyPair : Codable, Sendable {
	public init(
		publicKey: RsaPublicKey,
		privateKey: RsaPrivateKey
	) {
		self.publicKey = publicKey
		self.privateKey = privateKey
	}
	public let publicKey: RsaPublicKey
	public let privateKey: RsaPrivateKey
}
