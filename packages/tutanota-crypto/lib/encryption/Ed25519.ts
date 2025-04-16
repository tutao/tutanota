export type Ed25519PrivateKey = Uint8Array
export type Ed25519PublicKey = Uint8Array

/**
 * Contains a public key and its corresponding private key
 *
 * NOTE: Keys should be cleared from memory once they are no longer needed!
 */
export type Ed25519KeyPair = {
	publicKey: Ed25519PublicKey
	privateKey: Ed25519PrivateKey
}
