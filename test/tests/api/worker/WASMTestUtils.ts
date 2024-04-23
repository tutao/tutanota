import { loadWasmModuleFromFile } from "../../../../packages/tutanota-crypto/test/WebAssemblyTestUtils.js"
import { LazyLoaded } from "@tutao/tutanota-utils"
import { Argon2IDExports, LibOQSExports } from "@tutao/tutanota-crypto"

/**
 * Load the liboqs WASM and return its imports, automatically accounting for browser tests vs. node tests
 */
export function loadLibOQSWASM(): Promise<LibOQSExports> {
	return liboqsWASM.getAsync()
}

/**
 * Load the argon2 WASM and return its imports, automatically accounting for browser tests vs. node tests
 */
export function loadArgon2WASM(): Promise<Argon2IDExports> {
	return argon2WASM.getAsync()
}

const liboqsWASM: LazyLoaded<LibOQSExports> = new LazyLoaded(() => {
	if (typeof process !== "undefined") {
		return loadWasmModuleFromFile("./build/wasm/liboqs.wasm") as Promise<LibOQSExports>
	} else {
		return loadWasmModuleFromFile("/wasm/liboqs.wasm") as Promise<LibOQSExports>
	}
})

const argon2WASM: LazyLoaded<Argon2IDExports> = new LazyLoaded(() => {
	if (typeof process !== "undefined") {
		return loadWasmModuleFromFile("./build/wasm/argon2.wasm") as Promise<Argon2IDExports>
	} else {
		return loadWasmModuleFromFile("/wasm/argon2.wasm") as Promise<Argon2IDExports>
	}
})
