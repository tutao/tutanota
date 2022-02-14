/**
 * This file contains some utilities used from various build scripts in this directory.
 */
import fs from "fs-extra"
import path, {dirname} from "path"
import {fileURLToPath} from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

/** global used by the measure() function to mark the start of measurement **/
var measureStartTime

/**
 * Returns tutanota app version (as in package.json).
 * @returns {Promise<*>}
 */
export async function getTutanotaAppVersion() {
	const packageJson = await loadPackageJson()
	return packageJson.version
}

/**
 * Returns the version of electron used by the app (as in package.json).
 * @returns {Promise<string>}
 */
export async function getElectronVersion() {
	const packageJson = await loadPackageJson()
	return packageJson.dependencies.electron
}

async function loadPackageJson() {
	return JSON.parse(await fs.readFile(path.join(__dirname, "..", "package.json"), "utf8"))
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

