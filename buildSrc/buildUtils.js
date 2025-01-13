/**
 * This file contains some utilities used from various build scripts in this directory.
 */
import fs from "node:fs/promises"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import stream from "node:stream"

const __dirname = dirname(fileURLToPath(import.meta.url))

/** global used by the measure() function to mark the start of measurement **/
var measureStartTime

/**
 * Returns tutanota app version (as in package.json).
 * @returns {Promise<string>}
 */
export async function getTutanotaAppVersion() {
	const packageJson = JSON.parse(await fs.readFile(path.join(__dirname, "..", "package.json"), "utf8"))
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
	return path.resolve("build")
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
	return fs
		.stat(filePath)
		.then((stats) => stats.isFile())
		.catch(() => false)
}

/**
 * There are various possibilities for how a given platform could be identified
 * We need to make sure to be consistent at certain points, such as when caching files or processing CLI args
 * @param platformName {string}
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

/**
 * Checks whether the combination of OS & architecture is supported by the build system
 * @param platformName {NodeJS.Platform}
 * @param architecture {NodeJS.Architecture|"universal"}
 * @returns {architecture is "x64"|"arm64"|"universal"}
 */
export function checkArchitectureIsSupported(platformName, architecture) {
	switch (architecture) {
		case "x64":
			return true
		case "arm64":
		case "universal":
			return platformName === "darwin"
		default:
			return false
	}
}

/**
 *
 * @param platformName {NodeJS.Platform}
 * @param architecture {NodeJS.Architecture|"universal"}
 * @return {"x64"|"arm64"|"universal"}
 */
export function getValidArchitecture(platformName, architecture) {
	if (!checkArchitectureIsSupported(platformName, architecture)) {
		throw new Error(`Unsupported architecture: ${platformName} ${architecture}`)
	}
	return architecture
}

export async function runStep(name, cmd) {
	const before = Date.now()
	console.log("Build >", name)
	await cmd()
	console.log("Build >", name, "took", Date.now() - before, "ms")
}

export function writeFile(targetFile, content) {
	return fs.mkdir(path.dirname(targetFile), { recursive: true }).then(() => fs.writeFile(targetFile, content, "utf-8"))
}

export function normalizeCopyTarget(target) {
	return removeNpmNamespacePrefix(changeHypenToUnderscore(target))
}

export function changeHypenToUnderscore(target) {
	// because its name is used as a C identifier, the binary produced by better-sqlite3 is called better_sqlite3.node
	return target.replace("better-sqlite3", "better_sqlite3")
}

export function removeNpmNamespacePrefix(target) {
	// linear complexity Array.last(), wth not?
	// gets us the moduleName out of @tutao/moduleName
	return target.split("/").reduce((p, c) => c, null)
}

/**
 * @param arch {NodeJS.Architecture|"universal"}
 * @returns {Array<import("./nativeLibraryProvider.js").BuildArch>}
 */
export function resolveArch(arch) {
	if (arch === "universal") {
		return ["x64", "arm64"]
	} else if (arch === "x64" || arch === "arm64") {
		return [arch]
	} else {
		throw new Error(`Unsupported arch: ${arch}`)
	}
}

/**
 * napi appends abi to the architecture (see https://napi.rs/docs/cli/napi-config)
 * @param platform {NodeJS.Platform}
 * @param architecture {NodeJS.Architecture}
 */
export function getTargetTriple(platform, architecture) {
	if (platform === "linux") {
		return `${platform}-${architecture}-gnu`
	} else if (platform === "win32") {
		return `${platform}-${architecture}-msvc`
	} else {
		return `${platform}-${architecture}`
	}
}
