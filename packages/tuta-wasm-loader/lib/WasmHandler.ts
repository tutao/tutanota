import path from "node:path"
import { exec } from "node:child_process"
import * as util from "node:util"

export interface WasmGeneratorOptions {
	workingDir?: string
	env?: Record<string, any>
}

export interface FallbackGeneratorOptions extends WasmGeneratorOptions {
	optimizationLevel: string
	wasm2jsPath?: string
}

async function generateWasm(command: string, options: WasmGeneratorOptions) {
	const runner = util.promisify(exec)
	await runner(`${command}`, {
		env: {
			...process.env,
			...options.env,
		},
		cwd: options.workingDir ?? process.cwd(),
	})
}

async function generateWasmFallback(wasmFilePath: string, options: FallbackGeneratorOptions) {
	const transpiler = util.promisify(exec)
	const result = await transpiler(`${options.wasm2jsPath ?? "wasm2js"} ${wasmFilePath} -${options.optimizationLevel}`, {
		env: {
			...process.env,
			...options.env,
		},
	})
	return result.stdout
}

async function generateImportCode(wasmFilePath: string) {
	const fallback = `wasm-fallback:${path.basename(wasmFilePath)}`
	return `
		async function loadWasm(options) {
			const shouldForceFallback = options && options.forceFallback
			if (typeof WebAssembly !== "object" || typeof WebAssembly.instantiate !== "function" || shouldForceFallback) {
				return await import("${fallback}").catch((e) => console.log(e))
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

export { generateWasmFallback, generateImportCode, generateWasm }
