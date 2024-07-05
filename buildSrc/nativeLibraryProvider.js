import path from "node:path"
import fs from "node:fs"
import { fileExists, LogWriter } from "./buildUtils.js"
import { createRequire } from "node:module"
import { spawn } from "node:child_process"
import { getElectronVersion, getInstalledModuleVersion } from "./getInstalledModuleVersion.js"

/**
 * @typedef {(...args: string[]) => void} Logger
 */

/**
 * Rebuild native lib for either current node version or for electron version and
 * cache in the "native-cache" directory.
 * ABI for nodejs and for electron differs and we need to build it differently for each. We do caching
 * to avoid rebuilding between different invocations (e.g. running desktop and running tests).
 * @param params {object}
 * @param params.environment {"electron"|"node"}
 * @param params.platform {"win32"|"linux"|"darwin"} platform to compile for in case of cross compilation
 * @param params.architecture: {"arm64"|"x64"|"universal"} the instruction set used in the built desktop binary
 * @param params.rootDir {string} path to the root of the project
 * @param params.nodeModule {string} name of the npm module to rebuild
 * @param params.log {Logger}
 * @param params.copyTarget {string | undefined} Which node-gyp target (specified in binding.gyp) to copy the output of. Defaults to the same name as the module
 * @returns {Promise<string>} path to cached native module
 */
export async function getNativeLibModulePath({ environment, platform, architecture, rootDir, nodeModule, log, copyTarget }) {
	const libPath = await getCachedLibPath({ rootDir, nodeModule, environment, platform, architecture }, log)

	if (await fileExists(libPath)) {
		log(`Using cached ${nodeModule} at`, libPath)
	} else {
		let isCrossCompilation = false
		if (platform === "win32" && process.platform !== "win32") {
			isCrossCompilation = true
		} else if (platform !== process.platform) {
			// We only care about cross compiling the app when building for windows from linux
			// since it's only possible to build for mac from mac,
			// and there's no reason to build for linux from anything but linux
			// Consider it an here error since if you're doing it it's probably a mistake
			// And it's more effort than it's worth to allow arbitrary configurations
			throw new Error(`Invalid cross compilation ${process.platform} => ${platform}. only * => win32 is allowed`)
		}

		if (isCrossCompilation) {
			log(`Getting prebuilt ${nodeModule} using prebuild-install...`)
			await getPrebuiltNativeModuleForWindows({
				nodeModule,
				rootDir,
				platform,
				log,
			})
		} else {
			log(`Compiling ${nodeModule} for ${platform}...`)
			await buildNativeModule({
				environment,
				rootDir,
				log,
				nodeModule,
				copyTarget,
				architecture,
			})
		}

		const moduleDir = await getModuleDir(rootDir, nodeModule)
		await fs.promises.copyFile(path.join(moduleDir, "build/Release", `${copyTarget ?? nodeModule}.node`), libPath)
	}

	return libPath
}

/**
 * Build a native module using node-gyp
 * Runs `node-gyp rebuild ...` from within `node_modules/<nodeModule>/`
 * @param params {object}
 * @param params.nodeModule {string} the node module being built. Must be installed, and must be a native module project with a `binding.gyp` at the root
 * @param params.copyTarget {string}
 * @param params.environment {"node"|"electron"} Used to determine which node version to use
 * @param params.rootDir {string} the root dir of the project
 * @param params.log {Logger}
 * @param params.architecture the architecture to build for: "x64" | "arm64" | "universal"
 * @returns {Promise<void>}
 */
export async function buildNativeModule({ nodeModule, copyTarget, environment, rootDir, log, architecture }) {
	const moduleDir = await getModuleDir(rootDir, nodeModule)
	const electronVersion = await getElectronVersion(log)
	const doBuild = (arch) =>
		callProgram({
			command: "npm exec",
			args: [
				"--",
				"node-gyp",
				"rebuild",
				"--release",
				"--build-from-source",
				`--arch=${arch}`,
				...(environment === "electron" ? ["--runtime=electron", "--dist-url=https://www.electronjs.org/headers", `--target=${electronVersion}`] : []),
			],
			cwd: moduleDir,
			log,
		})

	if (architecture === "universal") {
		const artifactPath = path.join(moduleDir, "build/Release", `${copyTarget}.node`)
		const armArtifactPath = path.join(moduleDir, `${copyTarget}-arm64.node`)
		const intelArtifactPath = path.join(moduleDir, `${copyTarget}-x64.node`)
		await doBuild("x64")
		await fs.promises.copyFile(artifactPath, intelArtifactPath)
		await doBuild("arm64")
		await fs.promises.copyFile(artifactPath, armArtifactPath)
		await callProgram({
			command: "lipo",
			args: ["-create", "-output", artifactPath, intelArtifactPath, armArtifactPath],
			cwd: path.join(rootDir, "native-cache"),
			log,
		})
	} else {
		await doBuild(architecture)
	}
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
 * @return {Promise<{ runtime: string, version: number} | null>}
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
 * @param rootDir
 * @param nodeModule
 * @param environment
 * @param platform
 * @param architecture: {"arm64"|"x64"|"universal"} the instruction set used in the built desktop binary
 * @returns {Promise<string>}
 */
export async function getCachedLibPath({ rootDir, nodeModule, environment, platform, architecture }, log) {
	const libraryVersion = await getInstalledModuleVersion(nodeModule, log)

	let versionedEnvironment
	if (environment === "electron") {
		versionedEnvironment = `electron-${await getInstalledModuleVersion("electron", log)}`
	} else {
		// process.versions.modules is an ABI version. It is not significant for modules that use new ABI but still matters for those we use
		versionedEnvironment = `node-${process.versions.modules}`
	}
	return await buildCachedLibPath({ rootDir, nodeModule, environment, versionedEnvironment, platform, libraryVersion, architecture })
}

export async function buildCachedLibPath({ rootDir, nodeModule, environment, versionedEnvironment, platform, libraryVersion, architecture }) {
	const dir = path.join(rootDir, "native-cache", environment)
	await fs.promises.mkdir(dir, { recursive: true })
	return path.resolve(dir, `${nodeModule}-${libraryVersion}-${versionedEnvironment}-${platform}-${architecture}.node`)
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
