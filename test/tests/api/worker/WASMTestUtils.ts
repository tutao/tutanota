import { loadWasmModuleFallback, loadWasmModuleFromFile } from "../../../../packages/tutanota-crypto/test/WebAssemblyTestUtils.js"
import { LazyLoaded, WasmWithFallback } from "@tutao/tutanota-utils"

/**
 * Load the liboqs WASM and return its imports, automatically accounting for browser tests vs. node tests
 */
export function loadLibOQSWASM(): Promise<WebAssembly.Exports> {
	return liboqsWASM.getAsync()
}

/**
 * Load the liboqs Fallback and return its imports, automatically accounting for browser tests vs. node tests
 */
export function loadLibOQSFallback(): Promise<WasmWithFallback> {
	return liboqsFallback.getAsync()
}

/**
 * Load the argon2 WASM and return its imports, automatically accounting for browser tests vs. node tests
 */
export function loadArgon2WASM(): Promise<WebAssembly.Exports> {
	return argon2WASM.getAsync()
}

/**
 * Load the argon2 Fallback and return its imports, automatically accounting for browser tests vs. node tests
 */
export function loadArgon2Fallback(): Promise<WasmWithFallback> {
	return argon2Fallback.getAsync()
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

const liboqsFallback: LazyLoaded<WasmWithFallback> = new LazyLoaded(async () => {
	if (typeof process !== "undefined") {
		return loadWasmModuleFallback("../../packages/tutanota-crypto/lib/encryption/Liboqs/liboqs.js")
	} else {
		return loadWasmModuleFallback("/liboqs.js")
	}
})

const argon2Fallback: LazyLoaded<WasmWithFallback> = new LazyLoaded(() => {
	if (typeof process !== "undefined") {
		return loadWasmModuleFallback("../../packages/tutanota-crypto/lib/hashes/Argon2id/argon2.js")
	} else {
		return loadWasmModuleFallback("/argon2.js")
	}
})
