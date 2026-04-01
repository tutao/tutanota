import { isNotNull, WASMExports } from "@tutao/utils"
import { Argon2IDExports, LibOQSExports } from "@tutao/crypto"

export async function loadWasmFromFileOrNetwork(wasmFile: string): Promise<ArrayBuffer> {
	const loadWasmInNode: ArrayBuffer = await node(async () => {
		const { default: fs } = await import("node:fs/promises")
		return await fs.readFile(process.cwd() + "/build/" + wasmFile)
	})()
	const loadWasmInBrowser: ArrayBuffer = await browser(async () => {
		const r = await fetch("/" + wasmFile)
		return await r.arrayBuffer()
	})()

	const wasmBuffer = loadWasmInBrowser ?? loadWasmInNode
	if (isNotNull(wasmBuffer)) {
		return wasmBuffer
	}
	throw new Error("Could not load wasm file: " + wasmFile)
}

/**
 * Helper function to load a wasm module from file for testing.
 */
export async function loadWasmExports(path: string): Promise<WASMExports> {
	const wasmBuffer = await loadWasmFromFileOrNetwork(path)
	return (await WebAssembly.instantiate(wasmBuffer)).instance.exports as unknown as WASMExports
}

export async function loadWasmModuleFallback(path: string): Promise<WASMExports> {
	return await import(path)
}

/**
 * Load the argon2 WASM and return its imports, automatically accounting for browser tests vs. node tests
 */
export async function loadArgon2WASM(): Promise<Argon2IDExports> {
	const libOqsWasmExports = await loadWasmExports("argon2.wasm")
	return libOqsWasmExports as Argon2IDExports
}

/**
 * Load the liboqs WASM and return its imports, automatically accounting for browser tests vs. node tests
 */
export async function loadLibOQSWASM(): Promise<LibOQSExports> {
	const libOqsWasmExports = await loadWasmExports("liboqs.wasm")
	return libOqsWasmExports as LibOQSExports
}
