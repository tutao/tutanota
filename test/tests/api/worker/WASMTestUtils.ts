import { loadWasmModuleFallback, loadWasmModuleFromFile } from "../../../../packages/tutanota-crypto/test/WebAssemblyTestUtils.js"
import { LazyLoaded } from "@tutao/tutanota-utils"
import { Argon2IDExports, LibOQSExports } from "@tutao/tutanota-crypto"

/**
 * Load the liboqs WASM and return its imports, automatically accounting for browser tests vs. node tests
 */
export function loadLibOQSWASM(): Promise<LibOQSExports> {
	return liboqsWASM.getAsync()
}

/**
 * Load the liboqs Fallback and return its imports, automatically accounting for browser tests vs. node tests
 */
export function loadLibOQSFallback(): Promise<LibOQSExports> {
	return liboqsFallback.getAsync()
}

/**
 * Load the argon2 WASM and return its imports, automatically accounting for browser tests vs. node tests
 */
export function loadArgon2WASM(): Promise<Argon2IDExports> {
	return argon2WASM.getAsync()
}

/**
 * Load the argon2 Fallback and return its imports, automatically accounting for browser tests vs. node tests
 */
export function loadArgon2Fallback(): Promise<Argon2IDExports> {
	return argon2Fallback.getAsync()
}

const liboqsWASM: LazyLoaded<LibOQSExports> = new LazyLoaded(() => {
	if (typeof process !== "undefined") {
		return loadWasmModuleFromFile("../packages/tutanota-crypto/lib/encryption/Liboqs/liboqs.wasm") as Promise<LibOQSExports>
	} else {
		return loadWasmModuleFromFile("/liboqs.wasm") as Promise<LibOQSExports>
	}
})

const argon2WASM: LazyLoaded<Argon2IDExports> = new LazyLoaded(() => {
	if (typeof process !== "undefined") {
		return loadWasmModuleFromFile("../packages/tutanota-crypto/lib/hashes/Argon2id/argon2.wasm") as Promise<Argon2IDExports>
	} else {
		return loadWasmModuleFromFile("/argon2.wasm") as Promise<Argon2IDExports>
	}
})

const liboqsFallback: LazyLoaded<LibOQSExports> = new LazyLoaded(async () => {
	if (typeof process !== "undefined") {
		return loadWasmModuleFallback("../../packages/tutanota-crypto/lib/encryption/Liboqs/liboqs.js") as Promise<LibOQSExports>
	} else {
		return loadWasmModuleFallback("/liboqs.js") as Promise<LibOQSExports>
	}
})

const argon2Fallback: LazyLoaded<Argon2IDExports> = new LazyLoaded(() => {
	if (typeof process !== "undefined") {
		return loadWasmModuleFallback("../../packages/tutanota-crypto/lib/hashes/Argon2id/argon2.js") as Promise<Argon2IDExports>
	} else {
		return loadWasmModuleFallback("/argon2.js") as Promise<Argon2IDExports>
	}
})
