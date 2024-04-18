import { WASMExports } from "@tutao/tutanota-utils/dist/WebAssembly.js"

/**
 * Helper function to load a wasm module from file for testing.
 */
export async function loadWasmModuleFromFile(path: string): Promise<WASMExports> {
	if (typeof process !== "undefined") {
		try {
			const { readFile } = await import("node:fs/promises")
			const wasmBuffer = await readFile(path)
			return (await WebAssembly.instantiate(wasmBuffer)).instance.exports as unknown as WASMExports
		} catch (e) {
			throw new Error(`Can't load wasm module: ${path},  ${e}`)
		}
	} else {
		return (await WebAssembly.instantiateStreaming(await fetch(path))).instance.exports as unknown as WASMExports
	}
}

export async function loadWasmModuleFallback(path: string): Promise<WASMExports> {
	return await import(path)
}
