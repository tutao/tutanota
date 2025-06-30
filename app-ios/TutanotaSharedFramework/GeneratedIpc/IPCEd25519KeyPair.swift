/* generated file, don't edit. */


public struct IPCEd25519KeyPair : Codable {
	public init(
		publicKey: IPCEd25519PublicKey,
		privateKey: IPCEd25519PrivateKey
	) {
		self.publicKey = publicKey
		self.privateKey = privateKey
	}
	public let publicKey: IPCEd25519PublicKey
	public let privateKey: IPCEd25519PrivateKey
}
