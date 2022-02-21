import path from "path"
import fs from "fs"
import stream from "stream"
import {spawn} from "child_process"

/**
 * Rebuild native lib for either current node version or for electron version and
 * cache in the "native-cache" directory.
 * ABI for nodejs and for electron differs and we need to build it differently for each. We do caching
 * to avoid rebuilding between different invocations (e.g. running desktop and running tests).
 * @param environment {"electron"|"node"}
 * @param rootDir path to the root of the project
 * @param nodeModule name of the npm module to rebuild
 * @param builtPath relative path in the npm module to the output of node-gyp
 * @param log
 * @returns string path to .node for built better-sqlite3
 */
export async function getNativeLibModulePath({environment, rootDir, nodeModule, builtPath, log}) {
	const dir = path.join(rootDir, "native-cache", environment)
	await fs.promises.mkdir(dir, {recursive: true})

	const pj = JSON.parse(await fs.promises.readFile(path.join(rootDir, "package.json"), "utf8"))
	const electronVersion = pj.dependencies.electron
	const libraryVersion = pj.dependencies[nodeModule].replace(/\//g, '_')

	let filePath
	if (environment === "electron") {
		filePath = `${nodeModule}-${libraryVersion}-electron-${electronVersion}.node`
	} else {
		filePath = `${nodeModule}-${libraryVersion}.node`
	}
	const libPath = path.resolve(path.join(dir, filePath))
	try {
		// Check if the file is there
		await fs.promises.access(libPath)
		log(`Using cached ${nodeModule} at`, libPath)
	} catch {
		log(`Compiling ${nodeModule}...`)
		await rebuild({environment, rootDir, electronVersion, log, nodeModule})
		await fs.promises.copyFile(path.join(rootDir, `node_modules/${nodeModule}/${builtPath}`), libPath)
	}
	return libPath
}

async function rebuild({environment, rootDir, electronVersion, log, nodeModule}) {
	const libDir = path.join(rootDir, `./node_modules/${nodeModule}`)
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
				log(`Compiled ${nodeModule} successfully` + "\n")
				resolve()
			} else {
				log(`Compiling ${nodeModule} failed` + "\n")
				reject(new Error(`Compiling ${nodeModule} failed: ${code}`))
			}
		})
	})
}

