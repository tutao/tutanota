import path from "node:path"
import { exec } from "node:child_process"
import * as util from "node:util"

export interface WasmGeneratorOptions {
	workingDir?: string
	env?: Record<string, any>
}

async function runCommand(command: string, options: WasmGeneratorOptions) {
	const runner = util.promisify(exec)
	const promise = runner(`${command}`, {
		env: {
			...process.env,
			...options.env,
		},
		cwd: options.workingDir ?? process.cwd(),
	})
	promise.child.stdout?.on("data", (data) => {
		console.log("wasm build:", data)
	})
	promise.child.stderr?.on("data", (data) => {
		console.log("wasm build:", data)
	})
	await promise
}

async function generateImportCode(wasmFilePath: string, enableFallback: boolean) {
	const fallback = enableFallback
		? `await import("wasm-fallback:${path.basename(wasmFilePath)}")`
		: `(() => {throw new TypeError("WASM is not supported")})()`
	return `
		async function loadWasm(options) {
			const shouldForceFallback = options && options.forceFallback
			if (typeof WebAssembly !== "object" || typeof WebAssembly.instantiate !== "function" || shouldForceFallback) {
				return ${fallback}
			} else if (typeof process !== "undefined") {
				const {readFile} = await import("node:fs/promises")
				const {dirname, join} = await import("node:path")
				const {fileURLToPath} = await import("node:url")

				const __dirname = dirname(fileURLToPath(import.meta.url))
				const wasmPath = join(__dirname, "${wasmFilePath}")
				const wasmSource = await readFile(wasmPath)

				return (await WebAssembly.instantiate(wasmSource)).instance.exports
			} else {
				const wasm = fetch("${wasmFilePath}")
				if (WebAssembly.instantiateStreaming) {
					return (await WebAssembly.instantiateStreaming(wasm)).instance.exports
				} else {
					// Fallback if the client does not support instantiateStreaming
					const buffer = await (await wasm).arrayBuffer()
					return (await WebAssembly.instantiate(buffer)).instance.exports
				}
			}
		}

		export { loadWasm }
	`
}

export { generateImportCode, runCommand }
