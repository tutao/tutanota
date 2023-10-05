/**
 * This file contains some utilities used from various build scripts in this directory.
 */
import fs from "fs-extra"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import stream from "node:stream"
import { spawn, spawnSync } from "node:child_process"
import { $ } from "zx"

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
	if (await fs.exists(cachePath)) {
		// Look for node_modules in current directory
		const content = await fs.readFile(cachePath, "utf8")
		json = JSON.parse(content)
	} else if (await fs.exists(path.join("..", cachePath))) {
		// Try to find node_modules in directory one level up (e.g. if we run tests). Should be probably more generic
		const content = await fs.readFile(path.join("..", cachePath), "utf8")
		json = JSON.parse(content)
	} else {
		console.log(`Using slow method to resolve dependency version. Add a postinstall script to dump 'npm list' into ${cachePath} to speed things up.`)
		// npm list likes to error out for no reason so we just print a warning. If it really fails, we will see it.
		// shell: true because otherwise Windows can't find npm.
		const { stdout, stderr, status, error } = spawnSync("npm", ["list", module, "--json"], { shell: true })
		if (status !== 0) {
			log(`npm list is not happy about ${module}, but it doesn't mean anything`, status, stderr, error)
		}
		json = JSON.parse(stdout.toString().trim())
	}

	const version = findVersion(json, module)
	if (version == null) {
		throw new Error(`Could not find version of ${module}`)
	}
	return version
}

// Unfortunately `npm list` is garbage and instead of just giving you the info about package it will give you some subtree with the thing you are looking for
// buried deep beneath. So we try to find it manually by descending into each dependency.
// This surfaces in admin client when keytar is not our direct dependency but rather through the tutanota-3
function findVersion({ dependencies }, nodeModule) {
	if (dependencies[nodeModule]) {
		return dependencies[nodeModule].version
	} else {
		for (const [name, dep] of Object.entries(dependencies)) {
			if ("dependencies" in dep) {
				const found = findVersion(dep, nodeModule)
				if (found) {
					return found
				}
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

export async function runStep(name, cmd) {
	const before = Date.now()
	console.log("Build >", name)
	await cmd()
	console.log("Build >", name, "took", Date.now() - before, "ms")
}

export function writeFile(targetFile, content) {
	return fs.mkdir(path.dirname(targetFile), { recursive: true }).then(() => fs.writeFile(targetFile, content, "utf-8"))
}

/**
 * A little helper that runs the command. Unlike zx stdio is set to "inherit" and we don't pipe output.
 */
export async function sh(pieces, ...args) {
	// If you need this function, but you can't use zx copy it from here
	// https://github.com/google/zx/blob/a7417430013445592bcd1b512e1f3080a87fdade/src/guards.mjs
	// (or more up-to-date version)
	const fullCommand = formatCommand(pieces, args)
	console.log(`$ ${fullCommand}`)
	const child = spawn(fullCommand, { shell: true, stdio: "inherit" })
	return new Promise((resolve, reject) => {
		child.on("close", (code) => {
			if (code === 0) {
				resolve()
			} else {
				reject(new Error("Process failed with " + code))
			}
		})
		child.on("error", (error) => {
			reject(`Failed to spawn child: ${error}`)
		})
	})
}

function formatCommand(pieces, args) {
	// Pieces are parts between arguments
	// So if you have incvcation sh`command ${myArg} something ${myArg2}`
	// then pieces will be ["command ", " something "]
	// and the args will be [(valueOfMyArg1), (valueOfMyArg2)]
	// There are always args.length + 1 pieces (if command ends with argument then the last piece is an empty string).
	let fullCommand = pieces[0]
	for (let i = 0; i < args.length; i++) {
		fullCommand += $.quote(args[i]) + pieces[i + 1]
	}
	return fullCommand
}
