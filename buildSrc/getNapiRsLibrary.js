/**
 * This script provides a utility for resolving and copying modules built with napi-rs
 */
import { fileURLToPath, pathToFileURL } from "node:url"
import { program } from "commander"
import fs from "node:fs"
import { getCanonicalPlatformName, getTargetTriple, getValidArchitecture, removeNpmNamespacePrefix, resolveArch } from "./buildUtils.js"
import path from "node:path"
import { createRequire } from "node:module"

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await program
		.usage("<module> [...options]")
		.arguments("<module>")
		.option("-r, --root-dir <rootDir>", "path to the root of the project", ".")
		.option("-c, --dst-dir <dstDir>", "Where to place the resolved native module")
		.action(async (module, opts) => {
			await cli(module, opts)
		})
		.parseAsync(process.argv)
}

/**
 *
 * @param nodeModule {string}
 * @param opts {object}
 * @param opts.rootDir {string}
 * @param opts.dstDir {string}
 * @returns {Promise<void>}
 */
async function cli(nodeModule, { rootDir, dstDir }) {
	const platform = getCanonicalPlatformName(process.platform)
	const architecture = getValidArchitecture(process.platform, process.arch)
	const require = createRequire(pathToFileURL(path.join(rootDir, "src")))
	const resolvedModulePath = require.resolve(nodeModule)
	if (resolvedModulePath == null) {
		throw new Error(`Could not resolve module ${nodeModule}`)
	}
	const modulePath = path.dirname(resolvedModulePath)
	const moduleName = removeNpmNamespacePrefix(nodeModule)
	for (let arch of resolveArch(architecture)) {
		const targetTriple = getTargetTriple(platform, arch)
		const fileName = `${moduleName}.${targetTriple}.node`
		const normalizedDstDir = path.normalize(dstDir)
		await fs.promises.mkdir(normalizedDstDir, { recursive: true })
		const srcFilePath = path.join(modulePath, fileName)
		const dstFilePath = path.join(normalizedDstDir, fileName)
		await fs.promises.copyFile(srcFilePath, dstFilePath)
		console.log(`Copied ${srcFilePath} -> ${dstFilePath}`)
	}
}
