import { default as initializeEd25519WasmModule } from "./ed25519wasm/crypto_primitives.js"

export {
	ed25519_generate_keypair as generateEd25519KeyPair,
	ed25519_sign as signWithEd25519,
	ed25519_verify as verifyEd25519Signature,
} from "./ed25519wasm/crypto_primitives.js"

export async function initEd25519(): Promise<void> {
	// the initialization function internally manage wether or not the wasm module has already been
	// initialized, no need for an internal state

	// we assume the wasm file has been provided at this url by the build process
	// this prevent writing a plugin that would be run on all files of the project and make rolldown even faster
	// if you change the name of this file be sure to change copyCryptoPrimitiveCrateIntoWasmDir accordingly
	await initializeEd25519WasmModule("./crypto_primitives_bg.wasm")
}
