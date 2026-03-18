import { default as initializeEd25519WasmModule, Ed25519PrivateKey, Ed25519PublicKey, Ed25519Signature } from "./ed25519wasm/crypto_primitives.js"

export {
	ed25519_generate_keypair as generateEd25519KeyPair,
	ed25519_sign as signWithEd25519,
	ed25519_verify as verifyEd25519Signature,
	Ed25519PrivateKey,
	Ed25519PublicKey,
	Ed25519KeyPair,
	Ed25519Signature,
} from "./ed25519wasm/crypto_primitives.js"

export async function initEd25519(webAssemblySrc: BufferSource | string): Promise<void> {
	// the initialization function internally manage wether or not the wasm module has already been
	// initialized, no need for an internal state

	// we assume the wasm file has been provided at this url by the build process
	// this prevent writing a plugin that would be run on all files of the project and make rolldown even faster
	// if you change the name of this file be sure to change copyCryptoPrimitiveCrateIntoWasmDir accordingly
	await initializeEd25519WasmModule({ module_or_path: webAssemblySrc })
}

export function bytesToEd25519PublicKey(publicKey: Uint8Array): Ed25519PublicKey {
	return Array.from(publicKey)
}

export function ed25519PublicKeyToBytes(publicKey: Ed25519PublicKey): Uint8Array {
	return new Uint8Array(publicKey)
}

export function bytesToEd25519PrivateKey(privateKey: Uint8Array): Ed25519PrivateKey {
	return Array.from(privateKey)
}

export function ed25519PrivateKeyToBytes(privateKey: Ed25519PrivateKey): Uint8Array {
	return new Uint8Array(privateKey)
}

export function bytesToEd25519Signature(signature: Uint8Array): Ed25519Signature {
	return Array.from(signature)
}

export function ed25519SignatureToBytes(signature: Ed25519Signature): Uint8Array {
	return new Uint8Array(signature)
}
