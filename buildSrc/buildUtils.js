/**
 * This file contains some utilities used from various build scripts in this directory.
 */
import fs from "fs-extra"
import path, {dirname} from "path"
import {fileURLToPath} from "url"
import stream from "stream"
import {spawnSync} from "child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))

/** global used by the measure() function to mark the start of measurement **/
var measureStartTime

/**
 * Returns tutanota app version (as in package.json).
 * @returns {string}
 */
export function getTutanotaAppVersion() {
	const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"))
	return packageJson.version.trim()
}

/**
 * Returns the version of electron used by the app (as in package.json).
 * @returns {string}
 */
export function getElectronVersion(log = console.log.bind(console)) {
	return getInstalledModuleVersion("electron", log)
}

/**
 * Get the installed version of a module
 * @param module {string}
 * @returns {string}
 */
export function getInstalledModuleVersion(module, log) {
	// npm list likes to error out for no reason so we just print a warning. If it really fails, we will see it.
	// shell: true because otherwise Windows can't find npm.
	const {stdout, stderr, status, error} = spawnSync("npm", ["list", module, "--json"], {shell: true})
	if (status !== 0) {
		log(`npm list is not happy about ${module}, but it doesn't mean anything`, status, stderr, error)
	}
	const json = JSON.parse(stdout.toString().trim())
	return findVersion(json, module)
}

// Unfortunately `npm list` is garbage and instead of just giving you the info about package it will give you some subtree with the thing you are looking for
// buried deep beneath. So we try to find it manually by descending into each dependency.
// This surfaces in admin client when keytar is not our direct dependency but rather through the tutanota-3
function findVersion({dependencies}, nodeModule) {
	if (dependencies[nodeModule]) {
		return dependencies[nodeModule].version
	} else {
		for (const dep of Object.values(dependencies)) {
			const found = findVersion(dep, nodeModule)
			if (found) {
				return found
			}
		}
	}
}

/**
 * Returns the elapsed time between the last and current call of measure().
 * @returns {number}
 */
export function measure() {
	if (!measureStartTime) {
		measureStartTime = Date.now()
	}
	return (Date.now() - measureStartTime) / 1000
}

/**
 * Returns the (absolute) path to the default dist directory/prefix.
 * @returns {string}
 */
export function getDefaultDistDirectory() {
	return path.resolve('build/dist')
}

/** Throws if result has a value other than 0. **/
export function exitOnFail(result) {
	if (result.status !== 0) {
		throw new Error("error invoking process" + JSON.stringify(result))
	}
}

/**
 * Utility for writing to a logging function when a Writable is expected
 */
export class LogWriter extends stream.Writable {

	/**
	 * @param logger {(string) => void}
	 */
	constructor(logger) {
		super({
			autoDestroy: true,
			write(chunk, encoding, callback) {
				logger(chunk.toString().trim())
				callback()
			},
		})
	}
}

/**
 * Check if a file exists and is a normal file
 * @param filePath {string}
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
	return fs.stat(filePath)
			 .then(stats => stats.isFile())
			 .catch(() => false)
}

/**
 * There are various possibilities for how a given platform could be identified
 * We need to make sure to be consistent at certain points, such as when caching files or processing CLI args
 * @param platformName {"mac"|"darwin"|"win"|"win32"|"linux"}
 * @returns {"darwin"|"win32"|"linux"}
 */
export function getCanonicalPlatformName(platformName) {
	switch (platformName) {
		case "mac":
		case "darwin":
			return "darwin"
		case "win":
		case "win32":
			return "win32"
		case "linux":
			return "linux"
		default:
			throw new Error(`Unknown platform name ${platformName}`)
	}
}