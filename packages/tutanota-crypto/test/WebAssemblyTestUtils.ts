/**
 * Helper function to load a wasm module from file for testing.
 */
export async function loadWasmModuleFromFile(path: string): Promise<WebAssembly.Exports> {
	if (typeof process !== "undefined") {
		try {
			const { readFile } = await import("node:fs/promises")
			const wasmBuffer = await readFile(path)
			return (await WebAssembly.instantiate(wasmBuffer)).instance.exports
		} catch (e) {
			throw new Error(`Can't load wasm module: ${path},  ${e}`)
		}
	} else {
		return (await WebAssembly.instantiateStreaming(await fetch(path))).instance.exports
	}
}
