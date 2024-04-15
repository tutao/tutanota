import path from "node:path"
import fs from "node:fs"
import { $ } from "zx"
import { WAS2JSOptimizationLevels } from "./index.js"

async function generateWasm(makefilePath: string, output: string) {
	const currentPath = process.cwd()
	const outDir = path.dirname(output)
	const outputFile = path.relative(path.dirname(makefilePath), output)
	if (fs.existsSync(output)) {
		return console.log(`Build > WASM: ${path.basename(output)} already exists, skipping WASM build`)
	}

	const make = $
	make.verbose = false
	make.cwd = path.dirname(makefilePath)
	make.env = {
		...process.env,
		WASM: `"${outputFile}"`,
	}
	await make`make -f ${path.basename(makefilePath)} build`

	make.cwd = currentPath
}

async function generateWasmFallback(wasmFilePath: string, optimizationLevel: WAS2JSOptimizationLevels, wasm2jsPath?: string) {
	const transpiler = await $`${wasm2jsPath ?? "wasm2js"} ${wasmFilePath} -${optimizationLevel}`
	return transpiler.stdout
}

async function generateImportCode(wasmFilePath: string) {
	const fallback = `wasm-bin-fallback:${path.basename(wasmFilePath)}`
	return `
		async function loadWasm() {
			if (typeof WebAssembly !== "object" || typeof WebAssembly.instantiate !== "function") {
				console.log("Loading fallback")
				return await import("${fallback}").catch((e) => console.log(e))
			} else {
				console.log("Loading wasm")
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
