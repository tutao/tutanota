import { assertWorkerOrNode } from "../../common/Env.js"
import {
	bytesToEd25519Signature,
	Ed25519KeyPair,
	Ed25519PrivateKey,
	Ed25519PublicKey,
	ed25519SignatureToBytes,
	generateEd25519KeyPair,
	initEd25519,
	signWithEd25519,
	verifyEd25519Signature,
} from "@tutao/tutanota-crypto"
import { LazyLoaded } from "@tutao/tutanota-utils"

assertWorkerOrNode()

export type SigningKeyPair = {
	type: SigningKeyPairType
	keyPair: Ed25519KeyPair
}
export type SigningPublicKey = {
	type: SigningKeyPairType
	key: Ed25519PublicKey
}
export type EncodedEd25519Signature = Uint8Array

export enum SigningKeyPairType {
	Ed25519,
}

/**
 * Implementation of EdDSA based on Ed25519.
 */
export class Ed25519Facade {
	constructor(private readonly testWASM?: BufferSource) {}

	// loads liboqs WASM
	private initEd25519: LazyLoaded<void> = new LazyLoaded(async () => {
		if (this.testWASM) {
			return initEd25519(this.testWASM)
		} else {
			await initEd25519("./crypto_primitives_bg.wasm")
		}
	})

	async generateKeypair(): Promise<Ed25519KeyPair> {
		await this.initEd25519.getAsync()
		return generateEd25519KeyPair()
	}

	async sign(privateKey: Ed25519PrivateKey, message: Uint8Array): Promise<EncodedEd25519Signature> {
		await this.initEd25519.getAsync()
		return ed25519SignatureToBytes(signWithEd25519(privateKey, message))
	}

	async verify(publicKey: Ed25519PublicKey, message: Uint8Array, signature: EncodedEd25519Signature): Promise<boolean> {
		await this.initEd25519.getAsync()
		return verifyEd25519Signature(publicKey, message, bytesToEd25519Signature(signature))
	}
}
