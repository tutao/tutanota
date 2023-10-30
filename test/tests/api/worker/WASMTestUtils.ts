import { loadWasmModuleFromFile } from "../../../../packages/tutanota-crypto/test/WebAssemblyTestUtils.js"
import { LazyLoaded } from "@tutao/tutanota-utils"

/**
 * Load the liboqs WASM and return its imports, automatically accounting for browser tests vs. node tests
 */
export function loadLibOQSWASM(): Promise<WebAssembly.Exports> {
	return liboqsWASM.getAsync()
}

/**
 * Load the argon2 WASM and return its imports, automatically accounting for browser tests vs. node tests
 */
export function loadArgon2WASM(): Promise<WebAssembly.Exports> {
	return argon2WASM.getAsync()
}

const liboqsWASM: LazyLoaded<WebAssembly.Exports> = new LazyLoaded(() => {
	if (typeof process !== "undefined") {
		return loadWasmModuleFromFile("../packages/tutanota-crypto/lib/encryption/Liboqs/liboqs.wasm")
	} else {
		return loadWasmModuleFromFile("/liboqs.wasm")
	}
})

const argon2WASM: LazyLoaded<WebAssembly.Exports> = new LazyLoaded(() => {
	if (typeof process !== "undefined") {
		return loadWasmModuleFromFile("../packages/tutanota-crypto/lib/hashes/Argon2id/argon2.wasm")
	} else {
		return loadWasmModuleFromFile("/argon2.wasm")
	}
})
