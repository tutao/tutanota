/** @fileoverview build packages programmatically. */

// it would be faster to just run from "../node_modules/.bin/tsc" because we wouldn't need to wait for the (sluggish) npm to start
// but since we are imported from other places (like admin client) we don't have a luxury of knowing where our node_modules will end up.
import { $, glob } from "zx"
import fs from "node:fs/promises"

/**
 * Build packages that are needed at runtime, the list is taken from tsconfig.json -> references.
 */
export async function buildRuntimePackages() {
	// tsconfig is rather JSON5, if it becomes a problem switch to JSON5 parser here
	const tsconfig = JSON.parse(await fs.readFile("tsconfig.json", { encoding: "utf-8" }))
	const packagePaths = tsconfig.references.map((ref) => ref.path)
	await Promise.all(packagePaths.map((dir) => $`cd ${dir} && npm run build`))
}

/**
 * Build all packages in packages directory.
 */
export async function buildPackages(pathPrefix = ".") {
	const packages = await glob(`${pathPrefix}/packages/*`, { deep: 1, onlyDirectories: true })
	await Promise.all(packages.map((dir) => $`cd ${dir} && npm run build`))
}
