import path from "node:path"
import fs from "node:fs"
import { fileExists, LogWriter, removeNpmNamespacePrefix } from "./buildUtils.js"
import { createRequire } from "node:module"
import { getElectronVersion, getInstalledModuleVersion } from "./getInstalledModuleVersion.js"
import { spawn } from "node:child_process"

/**
 * @typedef {(...args: string[]) => void} Logger
 */

/**
 * @typedef {"nodeGyp"|"copyFromDist"} BuildStrategy
 */

/**
 * @typedef {"arm64"|"x64"|"universal"} InputArch
 */

/**
 * @typedef {"arm64"|"x64"} BuildArch
 */

/**
 * @typedef {"node"|"electron"} Environment
 */

/**
 * @typedef {"win32"|"linux"|"darwin"} Platform
 */

/**
 * Rebuild native lib for either current node version or for electron version and
 * cache in the "native-cache" directory.
 * ABI for nodejs and for electron differs and we need to build it differently for each. We do caching
 * to avoid rebuilding between different invocations (e.g. running desktop and running tests).
 * @param params {object}
 * @param params.environment {Environment}
 * @param params.platform {Platform} platform to compile for in case of cross compilation
 * @param params.architecture {InputArch} the instruction set used in the built desktop binary
 * @param params.rootDir {string} path to the root of the project
 * @param params.nodeModule {string} name of the npm module to rebuild
 * @param params.log {Logger}
 * @param params.copyTarget {string | undefined} Which node-gyp target (specified in binding.gyp) to copy the output of. Defaults to the same name as the module
 * @returns {Promise<Record<string, string>>} paths to cached native module by architecture
 */
export async function getNativeLibModulePaths({ environment, platform, architecture, rootDir, nodeModule, log, copyTarget }) {
	const namespaceTrimmedNodeModule = removeNpmNamespacePrefix(nodeModule)
	const libPaths = await getCachedLibPaths({ rootDir, nodeModule: namespaceTrimmedNodeModule, environment, platform, architecture }, log)

	const isCrossCompilation = checkIsCrossCompilation(platform)
	for (/** @type {[BuildArch, string]} */ const entry of Object.entries(libPaths)) {
		/** @type BuildArch */
		// @ts-ignore
		const architecture = entry[0]
		const libPath = entry[1]
		if (await fileExists(libPath)) {
			log(`Using cached ${nodeModule} at`, libPath)
		} else {
			const moduleDir = await getModuleDir(rootDir, nodeModule)
			if (isCrossCompilation) {
				log(`Getting prebuilt ${nodeModule} using prebuild-install...`)
				await getPrebuiltNativeModuleForWindows({
					nodeModule,
					rootDir,
					platform,
					log,
				})

				await fs.promises.copyFile(path.join(moduleDir, "build/Release", `${copyTarget ?? nodeModule}.${platform}-${architecture}.node`), libPath)
			} else {
				log(`Compiling ${nodeModule} for ${platform}...`)
				const artifactPath = await buildNativeModule({
					environment,
					platform,
					rootDir,
					log,
					nodeModule,
					copyTarget,
					architecture,
				})
				await fs.promises.copyFile(artifactPath, libPath)
			}
		}
	}

	return libPaths
}

function checkIsCrossCompilation(platform) {
	if (platform === "win32" && process.platform !== "win32") {
		return true
	} else if (platform !== process.platform) {
		// We only care about cross compiling the app when building for windows from linux
		// since it's only possible to build for mac from mac,
		// and there's no reason to build for linux from anything but linux
		// Consider it an here error since if you're doing it it's probably a mistake
		// And it's more effort than it's worth to allow arbitrary configurations
		throw new Error(`Invalid cross compilation ${process.platform} => ${platform}. only * => win32 is allowed`)
	}

	return false
}

/**
 * Build a native module using node-gyp
 * Runs `node-gyp rebuild ...` from within `node_modules/<nodeModule>/`
 * @param params {object}
 * @param params.nodeModule {string} the node module being built. Must be installed, and must be a native module project with a `binding.gyp` at the root
 * @param params.copyTarget {string}
 * @param params.platform {Platform} the platform to build the binary for
 * @param params.environment {Environment} Used to determine which node version to use
 * @param params.rootDir {string} the root dir of the project
 * @param params.architecture {BuildArch} the architecture to build for: "x64" | "arm64"
 * @param params.log {Logger}
 * @returns {Promise<string>} the path to the binary that was ordered
 */
export async function buildNativeModule({ nodeModule, copyTarget, environment, platform, rootDir, architecture, log }) {
	const moduleDir = await getModuleDir(rootDir, nodeModule)

	const allowedArch = ["x64", "arm64"].includes(architecture)
	if (!allowedArch) {
		throw new Error("this should not have been called with universal architecture since we're not using lipo anymore.")
	}
	return await buildWithGyp(architecture, environment, platform, moduleDir, copyTarget, log)
}

/**
 * @typedef {(arch: BuildArch, environment: Environment, platform: Platform, moduleDir: string, copyTarget: string, log: Logger) => Promise<string>} Builder
 */

/**
 * rebuild a native module to avoid using the prebuilt version
 * @type Builder
 */
async function buildWithGyp(arch, environment, platform, moduleDir, copyTarget, log) {
	await callProgram({
		command: "npm exec",
		args: [
			"--",
			"node-gyp",
			"rebuild",
			"--release",
			"--build-from-source",
			`--arch=${arch}`,
			...(environment === "electron"
				? ["--runtime=electron", "--dist-url=https://www.electronjs.org/headers", `--target=${await getElectronVersion(log)}`]
				: []),
		],
		cwd: moduleDir,
		log,
	})
	const gypResult = path.join(moduleDir, "build", "Release", `${copyTarget}.node`)
	// we're building two archs one after another and gyp nukes the output folder before starting a build
	const resultWithArch = path.join(moduleDir, `${copyTarget}-${arch}.node`)
	await fs.promises.copyFile(gypResult, resultWithArch)
	return resultWithArch
}

/**
 * Get a prebuilt version of a node native module
 *
 * we can't cross-compile with node-gyp, so we need to use the prebuilt version when building a desktop client for windows on linux
 *
 * @param params {object}
 * @param params.nodeModule {string}
 * @param params.rootDir {string}
 * @param params.platform: {"win32" | "darwin" | "linux"}
 * @param params.log {Logger}
 * @returns {Promise<void>}
 */
export async function getPrebuiltNativeModuleForWindows({ nodeModule, rootDir, platform, log }) {
	// We never want to use prebuilt native modules when building on jenkins, so it is considered an error as a safeguard
	if (process.env.JENKINS_HOME) {
		throw new Error("Should not be getting prebuilt native modules in CI")
	}

	const target = await getPrebuildConfiguration(nodeModule, platform, log)

	await callProgram({
		command: "npm exec",
		args: [
			"--",
			"prebuild-install",
			`--platform=win32`,
			"--tag-prefix=v",
			...(target != null ? [`--runtime=${target.runtime}`, `--target=${target.version}`] : []),
			"--verbose",
		],
		cwd: await getModuleDir(rootDir, nodeModule),
		log,
	})
}

/**
 * prebuild-install {runtime, target} configurations are a pain to maintain because they are specific for whichever native module you want to get a prebuild for,
 * So we just define them here and throw an error if we try to obtain a configuration for an unknown module
 * @param nodeModule {string}
 * @param platform {"electron"|"node"}
 * @param log {Logger}
 * @return {Promise<{ runtime: string, version: string} | null>}
 */
async function getPrebuildConfiguration(nodeModule, platform, log) {
	if (nodeModule === "better-sqlite3") {
		return platform === "electron"
			? {
					runtime: "electron",
					version: await getElectronVersion(log),
			  }
			: null
	} else {
		throw new Error(`Unknown prebuild-configuration for node module ${nodeModule}, requires a definition`)
	}
}

/**
 * Call a program, piping stdout and stderr to log, and resolves when the process exits
 * @returns {Promise<void>}
 */
function callProgram({ command, args, cwd, log }) {
	const process = spawn(command, args, {
		stdio: [null, "pipe", "pipe"],
		shell: true,
		cwd,
	})

	const logStream = new LogWriter(log)

	process.stdout.pipe(logStream)
	process.stderr.pipe(logStream)

	return new Promise((resolve, reject) => {
		process.on("exit", (code) => {
			if (code === 0) {
				resolve()
			} else {
				reject(new Error(`command "${command}" failed with error code: ${code}`))
			}
		})
	})
}

/**
 * Get the target name for the built native library when cached
 * @param params {object}
 * @param params.rootDir {string}
 * @param params.nodeModule {string}
 * @param params.environment {Environment}
 * @param params.platform {Platform}
 * @param params.architecture {InputArch} the instruction set used in the built desktop binary
 * @param log {Logger}
 * @returns {Promise<Partial<Record<BuildArch, string>>>} map of the location of the built binaries for each architecture that needs to be built
 */
export async function getCachedLibPaths({ rootDir, nodeModule, environment, platform, architecture }, log) {
	const libraryVersion = await getInstalledModuleVersion(nodeModule, log)

	let versionedEnvironment
	if (environment === "electron") {
		versionedEnvironment = `electron-${await getInstalledModuleVersion("electron", log)}`
	} else {
		// process.versions.modules is an ABI version. It is not significant for modules that use new ABI but still matters for those we use
		versionedEnvironment = `node-${process.versions.modules}`
	}
	return await buildCachedLibPaths({ rootDir, nodeModule, environment, versionedEnvironment, platform, libraryVersion, architecture })
}

/**
 *
 * @param params {object}
 * @param params.rootDir {string}
 * @param params.nodeModule {string}
 * @param params.environment {Environment}
 * @param params.versionedEnvironment {string}
 * @param params.platform {Platform}
 * @param params.libraryVersion {string}
 * @param params.architecture {InputArch} the instruction set used in the built desktop binary
 * @return {Promise<Partial<Record<BuildArch, string>>>}
 */
export async function buildCachedLibPaths({ rootDir, nodeModule, environment, versionedEnvironment, platform, libraryVersion, architecture }) {
	const dir = path.join(rootDir, "native-cache", environment)
	await fs.promises.mkdir(dir, { recursive: true })
	if (architecture === "universal") {
		return {
			x64: path.resolve(dir, `${nodeModule}-${libraryVersion}-${versionedEnvironment}-${platform}-x64.node`),
			arm64: path.resolve(dir, `${nodeModule}-${libraryVersion}-${versionedEnvironment}-${platform}-arm64.node`),
		}
	} else {
		return {
			[architecture]: path.resolve(dir, `${nodeModule}-${libraryVersion}-${versionedEnvironment}-${platform}-${architecture}.node`),
		}
	}
}

async function getModuleDir(rootDir, nodeModule) {
	// We resolve relative to the rootDir passed to us
	// however, if we just use rootDir as the base for require() it doesn't work: node_modules must be at the directory up from yours (for whatever reason).
	// so we provide a directory one level deeper. Practically it doesn't matter if "src" subdirectory exists or not, this is just to give node some
	// subdirectory to work against.
	const someChild = path.resolve(path.join(rootDir, "src")).toString()
	const filePath = createRequire(someChild).resolve(nodeModule)
	const pathEnd = path.join("node_modules", nodeModule)
	const endIndex = filePath.lastIndexOf(pathEnd)
	return path.join(filePath.substring(0, endIndex), pathEnd)
}
