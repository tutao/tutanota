import fs from "node:fs"
import path from "node:path"
import { getNativeLibModulePaths } from "./nativeLibraryProvider.js"
import { normalizeCopyTarget, removeNpmNamespacePrefix } from "./buildUtils.js"

/**
 * Prepare native module that is compiled with node-gyp to be loaded.
 * Will either get cached version of make a fresh build.
 * The module will be copied to {@param params.dstPath}.
 * Will define {@code `__NODE_GYP_${unprefixedModuleName.replace("-", "_")}`} as a path to the native module.
 * e.g. for `better-sqlite3` on x86_64-unknown-linux-gnu it will define `__NODE_GYP_better_sqlite3 = "./better-sqlite3.linux-x64.node"`
 * @param params {object}
 * @param params.environment {import("./nativeLibraryProvider.js").Environment}
 * @param params.platform {import("./nativeLibraryProvider.js").Platform} platform to compile for in case of cross compilation
 * @param params.architecture {import("./nativeLibraryProvider.js").InputArch} the instruction set used in the built desktop binary
 * @param params.rootDir {string} path to the root of the project
 * @param params.nodeModule {string} name of the npm module to rebuild
 * @param log {import("./nativeLibraryProvider.js").Logger}
 */
export function nodeGypPlugin({ rootDir, platform, architecture, nodeModule, environment }, log = console.log.bind(console)) {
	environment = environment ?? "electron"
	// We do not use emitFile() machinery even though it would probably be more correct.
	let modulePaths
	return {
		name: "node-gyp-plugin",
		async buildStart() {
			modulePaths = await getNativeLibModulePaths({
				nodeModule,
				environment,
				rootDir,
				log,
				platform,
				architecture,
				copyTarget: normalizeCopyTarget(nodeModule),
			})
		},
		banner() {
			// Would be nicer to use define option but Rollup doesn't support it, only Rolldown.
			// Since it's a banner we have to be careful about what we use (e.g. process) since it will be added even somewhere where it is not used.
			// Rollup will remove all unused declarations so it shouldn't hurt.
			const unprefixedModuleName = removeNpmNamespacePrefix(nodeModule)
			const constName = `__NODE_GYP_${unprefixedModuleName.replace("-", "_")}`
			return `const ${constName} = \`./${unprefixedModuleName}.${platform}-\${typeof process !== 'undefined' ? process.arch : "unknown"}.node\``
		},
		async writeBundle(opts) {
			const dstDir = path.normalize(opts.dir)
			for (let [architecture, modulePath] of Object.entries(modulePaths)) {
				const normalDst = path.join(dstDir, `${removeNpmNamespacePrefix(nodeModule)}.${platform}-${architecture}.node`)
				await fs.promises.mkdir(dstDir, { recursive: true })
				await fs.promises.copyFile(modulePath, normalDst)
			}
		},
	}
}
