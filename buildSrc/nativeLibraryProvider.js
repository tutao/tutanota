/**
 * This script provides a utility for building and getting cached native modules
 */
import path from "path"
import fs from "fs"
import options from "commander"
import {fileURLToPath} from "url"
import {fileExists, getCanonicalPlatformName, getElectronVersion, getInstalledModuleVersion, LogWriter} from "./buildUtils.js"
import {createRequire} from "module"

import {spawn} from "child_process"

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	options
		.usage('<module> [...options]')
		.description('Utility for ensuring that a built and cached version of a given node module exists. Will build using node-gyp or download the module with prebuild-install as necessary')
		.arguments('<module>')
		.option("-e, --environment <environment>", "which node environment to target", "electron")
		.option("-r, --root-dir <rootDir>", "path to the root of the project", ".")
		.option("-f, --force-rebuild", "force a rebuild (don't use the cache)")
		.option("-e, --use-existing", "Use the existing built version (e.g. when using prebuild)")
		.option("-c, --copy-target <copyTarget>", "Which node-gyp target (specified in binding.gyp) to copy the output of. Defaults to the same name as the module")
		.action(async (module, opts) => {
			validateOpts(opts)
			await cli(module, opts,)
		})
		.parseAsync(process.argv)
}

function validateOpts(opts) {
	if (!["electron", "node"].includes(opts.environment)) {
		throw new Error(`Invalid value for environment: ${opts.environment}`)
	}
}

async function cli(
	nodeModule,
	{
		environment,
		rootDir,
		forceRebuild,
		useExisting,
		copyTarget,
	}
) {
	const platform = getCanonicalPlatformName(process.platform)
	const path = await getCachedLibPath({rootDir, nodeModule, environment, platform}, console.log.bind(console))

	if (forceRebuild) {
		await fs.promises.rm(path, {force: true})
	}

	await getNativeLibModulePath({
		environment,
		rootDir,
		nodeModule,
		log: console.log.bind(console),
		useExisting,
		platform,
		copyTarget,
	})
}

/**
 * Rebuild native lib for either current node version or for electron version and
 * cache in the "native-cache" directory.
 * ABI for nodejs and for electron differs and we need to build it differently for each. We do caching
 * to avoid rebuilding between different invocations (e.g. running desktop and running tests).
 * @param environment {"electron"|"node"}
 * @param platform {"win32"|"linux"|"darwin"} platform to compile for in case of cross compilation
 * @param rootDir {string} path to the root of the project
 * @param nodeModule {string} name of the npm module to rebuild
 * @param log {(...string) => void}
 * @param noBuild {boolean} Don't build, just copy the existing built version from node_modules. Will throw if there is none there
 * @param copyTarget {string | undefined} Which node-gyp target (specified in binding.gyp) to copy the output of. Defaults to the same name as the module
 * @param prebuildTarget: {{ runtime: string, version: number} | undefined} Target parameters to use when getting a prebuild
 * @returns {Promise<string>} path to cached native module
 */
export async function getNativeLibModulePath(
	{
		environment,
		platform,
		rootDir,
		nodeModule,
		log,
		noBuild,
		copyTarget,
	}
) {

	const libPath = await getCachedLibPath({rootDir, nodeModule, environment, platform}, log)

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
			await getPrebuiltNativeModuleForWindows(
				{
					nodeModule,
					rootDir,
					log
				}
			)
		} else {
			log(`Compiling ${nodeModule} for ${platform}...`)
			await buildNativeModule(
				{
					environment,
					rootDir,
					log,
					nodeModule,
				}
			)
		}

		const moduleDir = await getModuleDir(rootDir, nodeModule)
		await fs.promises.copyFile(path.join(moduleDir, 'build/Release', `${copyTarget ?? nodeModule}.node`), libPath)
	}

	return libPath
}

/**
 * Build a native module using node-gyp
 * Runs `node-gyp rebuild ...` from within `node_modules/<nodeModule>/`
 * @param nodeModule {string} the node module being built. Must be installed, and must be a native module project with a `binding.gyp` at the root
 * @param environment {"node"|"electron"} Used to determine which node version to use
 * @param rootDir {string} the root dir of the project
 * @param log {(string) => void} a logger
 * @returns {Promise<void>}
 */
export async function buildNativeModule({nodeModule, environment, rootDir, log}) {
	await callProgram({
			command: "npm exec",
			args: [
				"--",
				"node-gyp",
				"rebuild",
				"--release",
				"--build-from-source",
				`--arch=${process.arch}`,
				...(
					environment === "electron"
						? [
							"--runtime=electron",
							'--dist-url=https://www.electronjs.org/headers',
							`--target=${getElectronVersion(log)}`,
						]
						: []
				)
			],
			cwd: await getModuleDir(rootDir, nodeModule),
			log
		}
	)
}

/**
 * Get a prebuilt version of a node native module
 *
 * we can't cross-compile with node-gyp, so we need to use the prebuilt version when building a desktop client for windows on linux
 *
 * For getting keytar we would want {target: { runtime: "napi", version: 3 }}
 * the current release artifacts on github are named accordingly,
 * e.g. keytar-v7.7.0-napi-v3-linux-x64.tar.gz for N-API v3
 *
 * @param nodeModule {string}
 * @param rootDir
 * @param platform: {"win32" | "darwin" | "linux"}
 * @param target {{ runtime: "napi"|"electron", version: number }}
 * @param log
 * @returns {Promise<void>}
 */
export async function getPrebuiltNativeModuleForWindows(
	{
		nodeModule,
		rootDir,
		log
	}
) {
	// We never want to use prebuilt native modules when building on jenkins, so it is considered an error as a safeguard
	if (process.env.JENKINS) {
		throw new Error("Should not be getting prebuilt native modules in CI")
	}

	const target = getPrebuildConfiguration(nodeModule, log)

	await callProgram({
		command: "npm exec",
		args: [
			"--",
			"prebuild-install",
			`--platform=win32`,
			"--tag-prefix=v",
			...(target != null
					? [
						`--runtime=${target.runtime}`,
						`--target=${target.version}`,
					]
					: []
			),
			"--verbose"
		],
		cwd: await getModuleDir(rootDir, nodeModule),
		log
	})
}


/**
 * prebuild-install {runtime, target} configurations are a pain to maintain because they are specific for whichever native module you want to get a prebuild for,
 * So we just define them here and throw an error if we try to obtain a configuration for an unknown module
 * @return {{ runtime: string, version: number} | null}
 */
function getPrebuildConfiguration(nodeModule, environment, log) {
	switch (nodeModule) {
		// Keytar uses NAPI v3, so we just specify that as our desired prebuild
		case "keytar":
			return {
				runtime: "napi",
				version: "3"
			}
		// better-sqlite3 doesn't use NAPI, so if we are building for electron, we have to specify which electron version
		// otherwise it will just use whichever version of node we are currently running
		case "better-sqlite3":
			return environment === "electron"
				? {
					runtime: "electron",
					version: getElectronVersion(log)
				}
				: null
		default:
			throw new Error(`Unknown prebuild-configuration for node module ${nodeModule}, requires a definition`)
	}
}


/**
 * Call a program, piping stdout and stderr to log, and resolves when the process exits
 * @returns {Promise<void>}
 */
function callProgram({command, args, cwd, log}) {

	const process = spawn(
		command,
		args,
		{
			stdio: [null, "pipe", "pipe"],
			shell: true,
			cwd,
		}
	)

	const logStream = new LogWriter(log)

	process.stdout.pipe(logStream)
	process.stderr.pipe(logStream)

	return new Promise((resolve, reject) => {
		process.on('exit', (code) => {
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
 * @returns {Promise<string>}
 */
async function getCachedLibPath({rootDir, nodeModule, environment, platform}, log) {
	const dir = path.join(rootDir, "native-cache", environment)
	const libraryVersion = getInstalledModuleVersion(nodeModule, log)
	await fs.promises.mkdir(dir, {recursive: true})

	if (environment === "electron") {
		return path.resolve(dir, `${nodeModule}-${libraryVersion}-electron-${getInstalledModuleVersion("electron", log)}-${platform}.node`)
	} else {
		return path.resolve(dir, `${nodeModule}-${libraryVersion}-${platform}.node`)
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