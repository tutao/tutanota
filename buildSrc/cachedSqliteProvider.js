import fs from "fs"
import path from "path"
import {spawn} from "child_process"
import stream from "stream"

/**
 * Rebuild better-sqlite3 for either current node version or for electron version and
 * cache in the "native-cache" directory.
 * ABI for nodejs and for electron differs and we need to build it differently for each. We do caching
 * to avoid rebuilding between different invocations (e.g. running desktop and running tests).
 * @param environment {"electron"|"node"}
 * @param rootDir path to the root of the project
 * @param log
 * @returns string path to .node for built better-sqlite3
 */
export async function getSqliteNativeModulePath(environment, rootDir, log) {
	const dir = path.join(rootDir, "native-cache", environment)
	await fs.promises.mkdir(dir, {recursive: true})

	const pj = JSON.parse(await fs.promises.readFile(path.join(rootDir, "package.json"), "utf8"))
	const electronVersion = pj.dependencies.electron
	const sqliteVersion = pj.dependencies["better-sqlite3"]

	let filePath
	if (environment === "electron") {
		filePath = `better_sqlite3-${sqliteVersion}-electron-${electronVersion}.node`
	} else {
		filePath = `better_sqlite3-${sqliteVersion}.node`
	}
	const libPath = path.resolve(path.join(dir, filePath))
	try {
		// Check if the file is there
		await fs.promises.access(libPath)
		log("Using cached sqlite at", libPath)
	} catch {
		log("Compiling sqlite...")
		await rebuild(environment, rootDir, electronVersion, log)
		await fs.promises.copyFile(path.join(rootDir, "node_modules/better-sqlite3/build/Release/better_sqlite3.node"), libPath)
	}
	return libPath
}

async function rebuild(environment, rootDir, electronVersion, log) {
	const libDir = path.join(rootDir, "./node_modules/better-sqlite3")
	const logStream = new stream.Writable({
		autoDestroy: true,
		write(chunk, encoding, callback) {
			log(chunk.toString())
			callback()
		},
	})
	const gypForSqlite = spawn(
		"npm exec",
		[
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
						`--target=${electronVersion}`,
					]
					: []
			)
		],
		{
			stdio: [null, "pipe", "pipe"],
			shell: true,
			cwd: libDir,
		}
	)
	gypForSqlite.stdout.pipe(logStream)
	gypForSqlite.stderr.pipe(logStream)
	return new Promise((resolve, reject) => {
		gypForSqlite.on('exit', (code) => {
			if (code === 0) {
				log('Compiled sqlite3 successfully \n')
				resolve()
			} else {
				log('Compiling sqlite3 failed \n')
				reject(new Error("Compiling sqlite3 failed: " + code))
			}
		})
	})
}

/**
 * Rollup plugin which injects path to better-sqlite3 native code.
 * See DesktopMain.
 */
export function sqliteNativeBannerPlugin(
	{environment, rootDir, dstPath},
	log = console.log.bind(console)
) {
	return {
		name: "sqlite-native-banner-plugin",
		async buildStart() {
			const modulePath = await getSqliteNativeModulePath(environment, rootDir, log)
			await fs.promises.mkdir(path.dirname(dstPath), {recursive: true})
			await fs.promises.copyFile(modulePath, dstPath)
		},
		banner() {
			return `
			globalThis.buildOptions = globalThis.buildOptions ?? {}
			globalThis.buildOptions.sqliteNativePath = "${dstPath}";
			`
		}
	}
}