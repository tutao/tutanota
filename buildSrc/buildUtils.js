/**
 * This file contains some utilities used from various build scripts in this directory.
 */
import fs from "fs-extra"
import path, {dirname} from "path"
import {fileURLToPath} from "url"
import stream from "stream"

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
export function getElectronVersion() {
	return getInstalledModuleVersion("electron")
}

/**
 * Get the installed version of a module
 * @param module {string}
 * @returns {string}
 */
export function getInstalledModuleVersion(module) {
	const moduleDir = path.join(__dirname, "..", "node_modules", module)
	const packageJson = JSON.parse(fs.readFileSync(path.join(moduleDir, "package.json"), "utf8"))
	return packageJson.version.trim()
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