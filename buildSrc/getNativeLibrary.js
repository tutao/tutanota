/**
 * This script provides a utility for building and getting cached native modules
 */
import { fileURLToPath } from "node:url"
import { program } from "commander"
import { getCanonicalPlatformName } from "./buildUtils.js"
import fs from "node:fs"
import { getCachedLibPath, getNativeLibModulePath } from "./nativeLibraryProvider.js"

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await program
		.usage("<module> [...options]")
		.description(
			"Utility for ensuring that a built and cached version of a given node module exists. Will build using node-gyp or download the module with prebuild-install as necessary",
		)
		.arguments("<module>")
		.option("-e, --environment <environment>", "which node environment to target", "electron")
		.option("-r, --root-dir <rootDir>", "path to the root of the project", ".")
		.option("-f, --force-rebuild", "force a rebuild (don't use the cache)")
		.option(
			"-c, --copy-target <copyTarget>",
			"Which node-gyp target (specified in binding.gyp) to copy the output of. Defaults to the same name as the module",
		)
		.action(async (module, opts) => {
			validateOpts(opts)
			await cli(module, opts)
		})
		.parseAsync(process.argv)
}

function validateOpts(opts) {
	if (!["electron", "node"].includes(opts.environment)) {
		throw new Error(`Invalid value for environment: ${opts.environment}`)
	}
}

async function cli(nodeModule, { environment, rootDir, forceRebuild, copyTarget }) {
	const platform = getCanonicalPlatformName(process.platform)
	const architecture = process.arch
	const path = await getCachedLibPath({ rootDir, nodeModule, environment, platform, architecture }, console.log.bind(console))

	if (forceRebuild) {
		await fs.promises.rm(path, { force: true })
	}

	await getNativeLibModulePath({
		environment,
		rootDir,
		nodeModule,
		log: console.log.bind(console),
		platform,
		copyTarget,
		architecture,
	})
}
