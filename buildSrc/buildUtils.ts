/**
 * This file contains some utilities used from various build scripts in this directory.
 */
import fs from "node:fs/promises"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import stream from "node:stream"
import { SpawnSyncReturns } from "node:child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))

/** global used by the measure() function to mark the start of measurement **/
let measureStartTime: number

/**
 * Returns tutanota app version (as in package.json).
 */
export async function getTutanotaAppVersion(): Promise<string> {
	const packageJson = JSON.parse(await fs.readFile(path.join(__dirname, "..", "package.json"), "utf8"))
	return packageJson.version.trim()
}

/**
 * Returns the elapsed time between the last and current call of measure().
 */
export function measure(): number {
	if (!measureStartTime) {
		measureStartTime = Date.now()
	}
	return (Date.now() - measureStartTime) / 1000
}

/**
 * Returns the (absolute) path to the default dist directory/prefix.
 */
export function getDefaultDistDirectory(): string {
	return path.resolve("build")
}

/** Throws if result has a value other than 0. **/
export function exitOnFail(result: SpawnSyncReturns<any>) {
	if (result.status !== 0) {
		throw new Error("error invoking process" + JSON.stringify(result))
	}
}

/**
 * Utility for writing to a logging function when a Writable is expected
 */
export class LogWriter extends stream.Writable {
	constructor(logger: (_: string) => void) {
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
 */
export async function fileExists(filePath: string): Promise<boolean> {
	return fs
		.stat(filePath)
		.then((stats) => stats.isFile())
		.catch(() => false)
}

/**
 * There are various possibilities for how a given platform could be identified
 * We need to make sure to be consistent at certain points, such as when caching files or processing CLI args
 */
export function getCanonicalPlatformName(platformName: string): "darwin" | "win32" | "linux" {
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
 */
export function checkArchitectureIsSupported(
	platformName: NodeJS.Platform,
	architecture: NodeJS.Architecture | "universal",
): architecture is "x64" | "arm64" | "universal" {
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

export function getValidArchitecture(platformName: NodeJS.Platform, architecture: NodeJS.Architecture | "universal"): "x64" | "arm64" | "universal" {
	if (!checkArchitectureIsSupported(platformName, architecture)) {
		throw new Error(`Unsupported architecture: ${platformName} ${architecture}`)
	}
	return architecture
}

export async function runStep(name: string, cmd: () => void | Promise<void>): Promise<void> {
	const before = Date.now()
	console.log("Build >", name)
	await cmd()
	console.log("Build >", name, "took", Date.now() - before, "ms")
}

export async function writeFile(targetFile: string, content: string) {
	await fs.mkdir(path.dirname(targetFile), { recursive: true })
	return await fs.writeFile(targetFile, content, "utf-8")
}

export function normalizeCopyTarget(target: string) {
	return removeNpmNamespacePrefix(changeHypenToUnderscore(target))
}

export function changeHypenToUnderscore(target: string) {
	// because its name is used as a C identifier
	return target.replace("-", "_")
}

export function removeNpmNamespacePrefix(target: string) {
	// linear complexity Array.last(), wth not?
	// gets us the moduleName out of @tutao/moduleName
	return target.split("/").reduce((p, c) => c, null!)
}

export function resolveArch(arch: NodeJS.Architecture | "universal"): Array<import("./nativeLibraryProvider.js").BuildArch> {
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
 *
 * NOTE: this is not a triple as in "target triple" known to rust, it is a "tuple" with Clib appended to it.
 *
 */
export function getTargetTupleWithLibc(platform: NodeJS.Platform, architecture: NodeJS.Architecture) {
	if (platform === "linux") {
		return `${platform}-${architecture}-gnu`
	} else if (platform === "win32") {
		return `${platform}-${architecture}-msvc`
	} else {
		return `${platform}-${architecture}`
	}
}
