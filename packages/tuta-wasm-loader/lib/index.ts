import { OnLoadResult, OnResolveResult, PluginBuild } from "esbuild"
import path from "node:path"
import { generateImportCode, generateWasm, generateWasmFallback } from "./WasmHandler.js"

export enum WAS2JSOptimizationLevels {
	default = "O",
	O0 = "O0",
	O1 = "O1",
	O2 = "O2",
	O3 = "O3",
	O4 = "O4",
	Os = "Os",
	Oz = "Oz",
}

export interface WasmMakefile {
	name: string
	makefilePath: string
}

export interface LoadOptions {
	// Tool needed to transpile the wasm file to a JavaScript file
	wasm2jsPath?: string
	// Optimization level used during the file transpile, default O3
	optimizationLevel: WAS2JSOptimizationLevels
	// List of webassembly files to be compiled and get fallback generated
	webassemblyLibraries: WasmMakefile[]
}

async function generateAndGetWasm(libraries: WasmMakefile[], requestedLib: string, output: string): Promise<WasmMakefile> {
	const lib = libraries.find((lib) => lib.name === requestedLib)
	if (!lib) throw new Error(`${requestedLib} isn't included in build options`)

	await generateWasm(lib.makefilePath, output)
	return lib
}

function esbuildWasmLoader(options: LoadOptions) {
	return {
		name: "wasm",
		setup(build: PluginBuild) {
			build.onResolve({ filter: /\.(?:wasm)$/ }, async (args): Promise<OnResolveResult | undefined> => {
				if (args.resolveDir === "") return

				if (args.namespace === "wasm-gen-fallback") {
					return {
						path: args.importer,
						namespace: "wasm-bin-fallback",
					}
				}

				const outPath = path.join(build.initialOptions.outdir ?? "", "wasm", args.path)
				await generateAndGetWasm(options.webassemblyLibraries, args.path, outPath)

				return {
					path: path.join("wasm", args.path),
					namespace: "wasm-gen-fallback",
				}
			})

			build.onLoad({ filter: /.*/, namespace: "wasm-gen-fallback" }, async (args): Promise<OnLoadResult> => {
				const buildPath = build.initialOptions.outdir ?? ""

				return {
					contents: await generateImportCode(args.path),
					loader: "js",
				}
			})

			build.onLoad({ filter: /.*/, namespace: "wasm-bin-fallback" }, async (args): Promise<OnLoadResult> => {
				const buildPath = build.initialOptions.outdir ?? ""

				return {
					contents: await generateWasmFallback(path.join(buildPath, args.path), options.optimizationLevel, options.wasm2jsPath),
					loader: "js",
				}
			})
		},
	}
}

function rollupWasmLoader(options: LoadOptions & { output: string }) {
	return {
		name: "wasm",
		async resolveId(source: string) {
			if (source.endsWith(".wasm")) {
				return { id: `\0wasm-gen-fallback:${source}`, external: false }
			}
		},
		async resolveDynamicImport(specifier: string, importer: string) {
			if (importer.includes("wasm-gen-fallback")) {
				return {
					id: `\0${specifier}`,
					external: false,
				}
			}
		},
		async load(id: string) {
			if (id.startsWith("\0wasm-gen-fallback")) {
				if (!options.output) {
					throw Error("No output provided, aborting...")
				}

				const wasmLib = id.replaceAll("\0wasm-gen-fallback:", "")
				const outputPath = path.join(options.output, "wasm", wasmLib)
				await generateAndGetWasm(options.webassemblyLibraries, wasmLib, outputPath)
				return await generateImportCode(path.join("wasm", wasmLib))
			} else if (id.startsWith("\0wasm-bin-fallback")) {
				const wasmLib = id.replaceAll("\0wasm-bin-fallback:", "")
				const wasmFilePath = path.join(options.output, "wasm", wasmLib)
				return await generateWasmFallback(wasmFilePath, options.optimizationLevel, options.wasm2jsPath)
			}
		},
		async transform(source: string, id: string) {
			if (id.includes(".wasm")) {
				return source
			}

			return null
		},
	}
}

export { esbuildWasmLoader, rollupWasmLoader, esbuildWasmLoader as default }
