/**
 * @file Script to do postinstall tasks without resorting to shell (or batch) scripts.
 */

import { spawnSync } from "node:child_process"

dumpResolvedModuleVersions()
await tryToUpdateLibs()

/**
 * Dumps the dependency tree into `node_modules/.npm-deps-resolved`.
 * We need to query module versions in a few places during build and npm is very slow, so it's faster to resolve everything once and read from disk later.
 */
function dumpResolvedModuleVersions() {
	const command = `npm list --json > node_modules/.npm-deps-resolved`
	console.log(command)
	// We only depend on zx as devDependency but postinstall is also run when we are installed as a dependency so we can't use zx here.
	// We anyway do not really care if it fails or not
	spawnSync(command, { shell: true, stdio: "inherit" })
}

async function tryToUpdateLibs() {
	try {
		await import("rollup")
	} catch (e) {
		console.log("cannot update vendored libs as rollup is not installed (installed as a dependency?)")
		return
	}
	const { updateLibs } = await import("./updateLibs.js")
	await updateLibs()
}
