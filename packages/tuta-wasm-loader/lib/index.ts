import { OnLoadResult, OnResolveResult, PluginBuild } from "esbuild"
import path from "node:path"
import { FallbackGeneratorOptions, generateImportCode, generateWasm, generateWasmFallback } from "./WasmHandler.js"
import * as fs from "node:fs"

export interface Library {
	name: string
	command: string
	options: FallbackGeneratorOptions
}

export interface LoadOptions {
	/** Tool needed to transpile the wasm file to a JavaScript file */
	wasm2jsPath?: string
	/** Output path for the webassembly files */
	output: string
	/** List of webassembly files to be compiled and get fallback generated */
	webassemblyLibraries: Library[]
}

function findLib(libraries: Library[], requestedLib: string): Library {
	const lib = libraries.find((lib) => lib.name === requestedLib)
	if (!lib) throw new Error(`${requestedLib} isn't included in build options`)

	return lib
}

function createOutputFolderStructure(output: string) {
	if (!fs.existsSync(output)) {
		fs.mkdirSync(output, { recursive: true })
	}
}

function esbuildWasmLoader(options: LoadOptions) {
	return {
		name: "wasm",
		setup(build: PluginBuild) {
			createOutputFolderStructure(options.output)

			build.onResolve({ filter: /\.(?:wasm)$/ }, async (args): Promise<OnResolveResult | undefined> => {
				if (args.resolveDir === "" && !args.path.includes("wasm-fallback")) return

				if (args.path.includes("wasm-fallback")) {
					return {
						path: args.path.replaceAll("wasm-fallback:", ""),
						namespace: "wasm-fallback",
					}
				}

				const lib = findLib(options.webassemblyLibraries, args.path)

				await generateWasm(lib.command, lib.options)

				return {
					path: path.join("wasm", args.path),
					namespace: "wasm-loader",
				}
			})

			build.onResolve({ filter: /\.(?:wasm-fallback)$/ }, async (args): Promise<OnResolveResult | undefined> => {
				if (args.resolveDir === "") return
				return {
					path: args.path,
					namespace: "wasm-fallback",
				}
			})

			build.onLoad({ filter: /.*/, namespace: "wasm-loader" }, async (args): Promise<OnLoadResult> => {
				return {
					contents: await generateImportCode(args.path),
					loader: "js",
				}
			})

			build.onLoad({ filter: /.*/, namespace: "wasm-fallback" }, async (args): Promise<OnLoadResult> => {
				const buildPath = options.output
				const lib = findLib(options.webassemblyLibraries, args.path)
				return {
					contents: await generateWasmFallback(path.join(buildPath, args.path), {
						optimizationLevel: lib.options.optimizationLevel,
						env: lib.options.env,
						wasm2jsPath: lib.options.wasm2jsPath,
					}),
					loader: "js",
				}
			})
		},
	}
}

function rollupWasmLoader(options: LoadOptions & { output: string }) {
	createOutputFolderStructure(options.output)

	return {
		name: "wasm",
		async resolveId(source: string) {
			if (source.endsWith(".wasm")) {
				return { id: `\0wasm-loader:${source}`, external: false }
			}
		},
		async resolveDynamicImport(specifier: string, importer: string) {
			if (importer.includes("wasm-loader")) {
				return {
					id: `\0${specifier}`,
					external: false,
				}
			}
		},
		async load(id: string) {
			if (id.startsWith("\0wasm-loader")) {
				const wasmLib = id.replaceAll("\0wasm-loader:", "")

				const lib = findLib(options.webassemblyLibraries, wasmLib)
				await generateWasm(lib.command, lib.options)

				return await generateImportCode(path.join("wasm", wasmLib))
			} else if (id.startsWith("\0wasm-fallback")) {
				const wasmLib = id.replaceAll("\0wasm-fallback:", "")
				const lib = findLib(options.webassemblyLibraries, wasmLib)
				const wasmPath = path.join(options.output, wasmLib)

				return await generateWasmFallback(wasmPath, {
					optimizationLevel: lib.options.optimizationLevel,
					env: lib.options.env,
					wasm2jsPath: lib.options.wasm2jsPath,
				})
			}
		},
	}
}

export { esbuildWasmLoader, rollupWasmLoader, esbuildWasmLoader as default }
