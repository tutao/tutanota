import path from "node:path"
import { generateImportCode, generateWasm } from "./WasmHandler.js"
import * as fs from "node:fs"

export interface Library {
	/** Name of the module, how it is imported in JS */
	name: string
	/** Command to run to generate WASM */
	command: string
	/** Where to run the command */
	workingDir?: string
	/** Environment variables to be set for compilation */
	env?: Record<string, any>
	/**
	 * Path where the WASM output should reside.
	 * Will be passed as {@code WASM} env variable to the {@link command}.
	 */
	outputPath: string
	/**
	 * Path where the JS fallback should reside. Useful for caching.
	 * If specified wasm2js fallback will be enabled.
	 * Will be passed as {@code WASM_FALLBACK} env variable to the {@link command}.
	 */
	fallbackOutputPath?: string
}

/**
 * Top-level plugin options
 */
export interface PluginOptions {
	/** List of webassembly files to be compiled and get fallback generated */
	webassemblyLibraries: Library[]
}

/** Private options */
interface NormalizedOptions {
	libraries: Map<string, Library>
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
			(library.workingDir != null && typeof library.workingDir !== "string") ||
			(library.env != null && typeof library.env !== "object") ||
			typeof library.outputPath !== "string" ||
			("fallbackOutputPath" in library && typeof library.fallbackOutputPath !== "string")
		) {
			throw new Error(`Invalid library: ${JSON.stringify(library)}`)
		}
		librariesMap.set(library.name, library)
	}
	return librariesMap
}

function parseOptions(options: PluginOptions): NormalizedOptions {
	return {
		libraries: parseLibraries(options.webassemblyLibraries),
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

export function rollupWasmLoader(options: PluginOptions) {
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
				createOutputFolderStructure(path.dirname(lib.outputPath))
				await generateWasm(lib.command, {
					workingDir: lib.workingDir,
					env: { ...lib.env, WASM: lib.outputPath, WASM_FALLBACK: lib.fallbackOutputPath },
				})
				return await generateImportCode(path.join("wasm", wasmLib), lib.fallbackOutputPath != null)
			} else if (id.startsWith("\0wasm-fallback")) {
				const wasmLib = id.replaceAll("\0wasm-fallback:", "")
				const lib = findLib(normalizedOptions, wasmLib)
				if (lib.fallbackOutputPath) {
					await generateWasm(lib.command, {
						workingDir: lib.workingDir,
						env: { ...lib.env, WASM: lib.outputPath, WASM_FALLBACK: lib.fallbackOutputPath },
					})
					return fs.promises.readFile(lib.fallbackOutputPath, "utf-8")
				}
			}
		},
	}
}
