import { assertWorkerOrNode } from "../../common/Env.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"

assertWorkerOrNode()

// Dummy types for now
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

export type Ed25519Signature = Uint8Array

/**
 * Implementation of EdDSA based on Ed25519.
 */
export class Ed25519Facade {
	async generateKeypair(): Promise<Ed25519KeyPair> {
		throw new CryptoError("not yet implemented")
	}

	async sign(privateKey: Ed25519PrivateKey, message: Uint8Array): Promise<Ed25519Signature> {
		throw new CryptoError("not yet implemented")
	}

	async verify(publicKey: Ed25519PublicKey, message: Uint8Array, signature: Ed25519Signature): Promise<void> {
		throw new CryptoError("not yet implemented")
	}
}
