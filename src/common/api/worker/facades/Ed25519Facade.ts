import { assertWorkerOrNode } from "../../common/Env.js"
import { generateEd25519KeyPair, signWithEd25519, verifyEd25519Signature, initEd25519 } from "@tutao/tutanota-crypto"

assertWorkerOrNode()

/**
 * due to wasm generating number: [] from crypto-primitive crate
 * which api is responsible for converting those number arrays
 * tutanota-crypto or this facade ?
 *
 * should we find a way to export directly uint8array from rust?
 */

export type Ed25519PublicKey = Uint8Array
export type Ed25519PrivateKey = Uint8Array

export type SigningKeyPair = Ed25519KeyPair
export type SigningPublicKey = Ed25519PublicKey

export type Ed25519Signature = Uint8Array

export type Ed25519KeyPair = {
	publicKey: Uint8Array
	privateKey: Uint8Array
}

/**
 * Implementation of EdDSA based on Ed25519.
 */
export class Ed25519Facade {
	async generateKeypair(): Promise<Ed25519KeyPair> {
		await initEd25519()
		let generated = generateEd25519KeyPair()
		return {
			publicKey: new Uint8Array(generated.public_key),
			privateKey: new Uint8Array(generated.private_key),
		}
	}

	async sign(privateKey: Ed25519PrivateKey, message: Uint8Array): Promise<Ed25519Signature> {
		await initEd25519()
		return new Uint8Array(signWithEd25519([...privateKey], message))
	}

	async verify(publicKey: Ed25519PublicKey, message: Uint8Array, signature: Ed25519Signature): Promise<boolean> {
		await initEd25519()
		return verifyEd25519Signature([...publicKey], message, [...signature])
	}
}
