import { OnLoadResult, OnResolveResult, PluginBuild } from "esbuild"
import path from "node:path"
import { FallbackOptions, generateImportCode, generateWasm, generateWasmFallback } from "./WasmHandler.js"
import * as fs from "node:fs"

export interface Library {
	/** Name of the module, how it is imported in JS */
	name: string
	/** Command to run to generate WASM */
	command: string
	/** Optimization level for the JavaScript fallback */
	optimizationLevel?: string
	/** Where to run the command */
	workingDir?: string
	/** Environment variables to be set for compilation */
	env?: Record<string, any>
}

/**
 * Top-level plugin options
 */
export interface PluginOptions {
	/** Output path for the webassembly files */
	output: string
	/** List of webassembly files to be compiled and get fallback generated */
	webassemblyLibraries: Library[]
	/** Whether to generate JS fallback for WASM. If {@code true} or an object it will generate fallback code. */
	fallback?: FallbackOptions | boolean
}

/** Private options */
interface NormalizedOptions {
	output: string
	libraries: Map<string, Library>
	fallback: FallbackOptions | null
}

function parseLibraries(libraries: unknown): Map<string, Library> {
	if (!Array.isArray(libraries)) {
		throw new Error(`Invalid webassemblyLibraries, expected array, got: ${libraries}`)
	}
	const librariesMap = new Map()
	for (const library of libraries) {
		if (
			typeof library.name !== "string" ||
			typeof library.command !== "string" ||
			("optimizationLevel" in library && typeof library.optimizationLevel !== "string") ||
			(library.workingDir != null && typeof library.workingDir !== "string") ||
			(library.env != null && typeof library.env !== "object")
		) {
			throw new Error(`Invalid library: ${JSON.stringify(library)}`)
		}
		librariesMap.set(library.name, library)
	}
	return librariesMap
}

function parseOptions(options: PluginOptions): NormalizedOptions {
	let output: string
	if (typeof options.output === "string") {
		output = options.output
	} else {
		throw new Error("Invalid output")
	}

	let fallback: FallbackOptions | null
	if (options.fallback === true) {
		fallback = { wasm2jsPath: undefined }
	} else if (options.fallback === false || options.fallback == null) {
		fallback = null
	} else if (typeof options.fallback === "object") {
		if (options.fallback.wasm2jsPath != null && typeof options.fallback.wasm2jsPath !== "string") {
			throw new Error("Invalid wasm2jsPath")
		}
		fallback = options.fallback
	} else {
		throw new Error("Invalid fallback")
	}
	return {
		output,
		libraries: parseLibraries(options.webassemblyLibraries),
		fallback,
	}
}

function findLib({ libraries }: NormalizedOptions, requestedLib: string): Library {
	const lib = libraries.get(requestedLib)
	if (!lib) throw new Error(`${requestedLib} isn't included in build options`)

	return lib
}

function createOutputFolderStructure(output: string) {
	if (!fs.existsSync(output)) {
		fs.mkdirSync(output, { recursive: true })
	}
}

export function esbuildWasmLoader(options: PluginOptions) {
	const normalizedOptions = parseOptions(options)
	const fallbackOptions = normalizedOptions.fallback
	return {
		name: "wasm",
		setup(build: PluginBuild) {
			createOutputFolderStructure(normalizedOptions.output)

			build.onResolve({ filter: /\.wasm$/ }, async (args): Promise<OnResolveResult | undefined> => {
				if (args.resolveDir === "" && !args.path.includes("wasm-fallback")) return

				if (fallbackOptions && args.path.includes("wasm-fallback")) {
					return {
						path: args.path.replaceAll("wasm-fallback:", ""),
						namespace: "wasm-fallback",
					}
				}

				const lib = findLib(normalizedOptions, args.path)

				await generateWasm(lib.command, lib)

				return {
					path: path.join("wasm", args.path),
					namespace: "wasm-loader",
				}
			})

			if (fallbackOptions) {
				build.onResolve({ filter: /\.wasm-fallback$/ }, async (args): Promise<OnResolveResult | undefined> => {
					if (args.resolveDir === "") return
					return {
						path: args.path,
						namespace: "wasm-fallback",
					}
				})
			}

			build.onLoad({ filter: /.*/, namespace: "wasm-loader" }, async (args): Promise<OnLoadResult> => {
				return {
					contents: await generateImportCode(args.path, fallbackOptions != null),
					loader: "js",
				}
			})

			if (fallbackOptions) {
				build.onLoad({ filter: /.*/, namespace: "wasm-fallback" }, async (args): Promise<OnLoadResult> => {
					const buildPath = normalizedOptions.output
					const lib = findLib(normalizedOptions, args.path)
					const contents = await generateWasmFallback(path.join(buildPath, args.path), lib, fallbackOptions, lib.optimizationLevel)
					return {
						contents: contents,
						loader: "js",
					}
				})
			}
			build.onResolve({ filter: /node:*/, namespace: "wasm-loader" }, async (_) => {
				return {
					external: true,
				}
			})
		},
	}
}

export function rollupWasmLoader(options: PluginOptions & { output: string }) {
	createOutputFolderStructure(options.output)
	const normalizedOptions = parseOptions(options)

	return {
		name: "wasm",
		async resolveId(source: string) {
			if (source.endsWith(".wasm")) {
				return { id: `\0wasm-loader:${source}`, external: false }
			}
		},
		async resolveDynamicImport(specifier: string, importer: string) {
			if (importer.includes("wasm-loader") && specifier.startsWith("node:")) {
				// rollup chokes on node: imports for some reason
				return { external: true, id: specifier.substring("node:".length) }
			} else if (importer.includes("wasm-loader")) {
				return {
					id: `\0${specifier}`,
					external: false,
				}
			}
		},
		async load(id: string) {
			if (id.startsWith("\0wasm-loader")) {
				const wasmLib = id.replaceAll("\0wasm-loader:", "")

				const lib = findLib(normalizedOptions, wasmLib)
				await generateWasm(lib.command, lib)

				return await generateImportCode(path.join("wasm", wasmLib), true)
			} else if (id.startsWith("\0wasm-fallback") && normalizedOptions.fallback) {
				const wasmLib = id.replaceAll("\0wasm-fallback:", "")
				const lib = findLib(normalizedOptions, wasmLib)
				const wasmPath = path.join(normalizedOptions.output, wasmLib)

				return await generateWasmFallback(wasmPath, lib, normalizedOptions.fallback, lib.optimizationLevel)
			}
		},
	}
}

export { esbuildWasmLoader as default }
