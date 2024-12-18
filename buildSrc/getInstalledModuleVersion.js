import fs from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileExists } from "./buildUtils.js"

/**
 * Returns the version of electron used by the app (as in package.json).
 * @returns Promise<{string}>
 */
export async function getElectronVersion(log = console.log.bind(console)) {
	return await getInstalledModuleVersion("electron", log)
}

/**
 * Get the installed version of a module
 * @param module {string}
 * @returns Promise<{string}>
 */
export async function getInstalledModuleVersion(module, log) {
	let json
	const cachePath = "node_modules/.npm-deps-resolved"
	if (await fileExists(cachePath)) {
		// Look for node_modules in current directory
		const content = await fs.readFile(cachePath, "utf8")
		json = JSON.parse(content)
	} else if (await fileExists(path.join("..", cachePath))) {
		// Try to find node_modules in directory one level up (e.g. if we run tests). Should be probably more generic
		const content = await fs.readFile(path.join("..", cachePath), "utf8")
		json = JSON.parse(content)
	} else {
		console.log(`Using slow method to resolve dependency version. Add a postinstall script to dump 'npm list' into ${cachePath} to speed things up.`)
		// npm list likes to error out for no reason so we just print a warning. If it really fails, we will see it.
		// shell: true because otherwise Windows can't find npm.
		const { stdout, stderr, status, error } = spawnSync("npm", ["list", module, "--json"], { shell: true })
		if (status !== 0) {
			log(`npm list is not happy about ${module}, but it doesn't mean anything`, status, stderr.toString(), error)
		}
		json = JSON.parse(stdout.toString().trim())
	}
	const version = findVersion(json, module)
	if (version == null) {
		throw new Error(`Could not find version of ${module}`)
	}
	return version
}

/**
 *  Unfortunately `npm list` is garbage and instead of just giving you the info about package it will give you some subtree with the thing you are looking for
 * buried deep beneath. So we try to find it manually by descending into each dependency.
 *  This surfaces in admin client when keytar is not our direct dependency but rather through the tutanota-3
 *
 * @param {*} dependencies a json object containing all dependencies as installed
 * @param {*} nodeModule the name of the module we want the version for
 * @returns {string} the version string of the dependency
 */
function findVersion({ dependencies }, nodeModule) {
	const candidates = Object.entries(dependencies)
		.filter(([name, _]) => !name.startsWith("@types"))
		.filter(([name, _]) => name.endsWith(nodeModule))

	if (candidates.length > 1) {
		throw new Error(`Could not find version of ${nodeModule} because of multiple candidates: ${JSON.stringify(candidates)}`)
	}

	if (candidates.length < 1) {
		return null
	}

	return candidates[0][1].version
}
