import { assertWorkerOrNode } from "../../common/Env.js"
import {
	bytesToEd25519PrivateKey,
	bytesToEd25519PublicKey,
	bytesToEd25519Signature,
	Ed25519KeyPair,
	Ed25519PrivateKey,
	ed25519PrivateKeyToBytes,
	Ed25519PublicKey,
	ed25519PublicKeyToBytes,
	ed25519SignatureToBytes,
	generateEd25519KeyPair,
	initEd25519,
	signWithEd25519,
	verifyEd25519Signature,
} from "@tutao/tutanota-crypto"
import { LazyLoaded } from "@tutao/tutanota-utils"
import { NativeCryptoFacade } from "../../../native/common/generatedipc/NativeCryptoFacade"
import { IPCEd25519PrivateKey } from "../../../native/common/generatedipc/IPCEd25519PrivateKey"
import { IPCEd25519PublicKey } from "../../../native/common/generatedipc/IPCEd25519PublicKey"
import { IPCEd25519Signature } from "../../../native/common/generatedipc/IPCEd25519Signature"

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

export interface Ed25519Facade {
	generateKeypair(): Promise<Ed25519KeyPair>

	sign(privateKey: Ed25519PrivateKey, message: Uint8Array): Promise<EncodedEd25519Signature>

	verifySignature(publicKey: Ed25519PublicKey, signature: EncodedEd25519Signature, message: Uint8Array): Promise<boolean>
}

/**
 * Implementation of EdDSA based on Ed25519.
 */
export class WASMEd25519Facade implements Ed25519Facade {
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

	async verifySignature(publicKey: Ed25519PublicKey, signature: EncodedEd25519Signature, message: Uint8Array): Promise<boolean> {
		await this.initEd25519.getAsync()
		return verifyEd25519Signature(publicKey, message, bytesToEd25519Signature(signature))
	}
}

/**
 * Implementation of EdDSA based on Ed25519.
 */
export class NativeEd25519Facade implements Ed25519Facade {
	constructor(private readonly nativeCryptoFacade: NativeCryptoFacade) {}

	async generateKeypair(): Promise<Ed25519KeyPair> {
		const ipcKeyPair = await this.nativeCryptoFacade.generateEd25519Keypair()
		const ed25519PublicKey = bytesToEd25519PublicKey(ipcKeyPair.publicKey.raw)
		const ed25519PrivateKey = bytesToEd25519PrivateKey(ipcKeyPair.privateKey.raw)
		return {
			private_key: ed25519PrivateKey,
			public_key: ed25519PublicKey,
		}
	}

	async sign(privateKey: Ed25519PrivateKey, message: Uint8Array): Promise<EncodedEd25519Signature> {
		const ipcPrivateKey: IPCEd25519PrivateKey = {
			raw: ed25519PrivateKeyToBytes(privateKey),
		}
		const ipcSignature = await this.nativeCryptoFacade.ed25519Sign(ipcPrivateKey, message)
		return ipcSignature.signature
	}

	async verifySignature(publicKey: Ed25519PublicKey, signature: EncodedEd25519Signature, message: Uint8Array): Promise<boolean> {
		const ipcPublicKey: IPCEd25519PublicKey = {
			raw: ed25519PublicKeyToBytes(publicKey),
		}
		const ipcSignature: IPCEd25519Signature = {
			signature: signature,
		}
		return this.nativeCryptoFacade.ed25519Verify(ipcPublicKey, message, ipcSignature)
	}
}
