import {spawn} from "child_process"
import {default as path} from "path"
import {fileURLToPath} from "url"

/**
 *
 * @param options
 * @returns {Promise<{stop: (function(): *), disconnectStdIo: disconnectStdIo}>}
 */
export async function createBuildServer(options) {
	const port = options.devServerPort
	const builder = options.builder
	const preserveLogs = options.preserveLogs || false
	const detached = options.detached || false
	const directory = options.directory
	const watchFolders = options.watchFolders
	const webRoot = options.webRoot
	const spaRedirect = options.spaRedirect || true

	if (!directory) {
		throw new Error('Build directory is required')
	}

	const dirname = path.dirname(fileURLToPath(import.meta.url))
	const args = [
		path.join(dirname, "BuildServerStarter.js"),
		'-d', directory,
	]

	if (port != null) {
		args.push('-p', port)
	}

	if (preserveLogs) {
		args.push('--preserve-logs')
	}

	if (webRoot) {
		args.push("--web-root")
		args.push(webRoot)
	}

	if (spaRedirect) {
		args.push("--single-page")
	}

	if (watchFolders) {
		args.push("--watch")
		args.push(watchFolders.join(":"))
	}

	args.push(builder)
	const spawnOptions = {
		detached: detached,
		serialization: "json",
		stdio: ['ignore', 'pipe', 'pipe'],
	}

	console.log(`Spawning build server process with args: ${args} and options: ${JSON.stringify(spawnOptions)}`)
	const buildServerProcess = await spawn(
		"node",
		args,
		spawnOptions,
	)

	buildServerProcess.stdout.on("data", data => {
		if (data && data.length > 0) {
			console.log("Server: " + data.toString())
		}
	})
	buildServerProcess.stderr.on("data", data => {
			if (data && data.length > 0) {
				console.error("Server: " + data.toString())
			}
		}
	)

	// this prevents the parent process from waiting for the child process
	buildServerProcess.unref()

	return {
		disconnectStdIo: function () {
			buildServerProcess.stdout.destroy()
			buildServerProcess.stderr.destroy()
		},
		stop: async function () {
			return await buildServerProcess.kill()
		},
	}
}