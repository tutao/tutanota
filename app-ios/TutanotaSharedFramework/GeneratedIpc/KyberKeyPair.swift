/* generated file, don't edit. */


public struct KyberKeyPair : Codable {
	public init(
		publicKey: KyberPublicKey,
		privateKey: KyberPrivateKey
	) {
		self.publicKey = publicKey
		self.privateKey = privateKey
	}
	public let publicKey: KyberPublicKey
	public let privateKey: KyberPrivateKey
}
