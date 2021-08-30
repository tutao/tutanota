import {spawn} from "child_process"
import {default as path} from "path"
import {fileURLToPath} from "url"

/**
 *
 * @param options Instance of BuildServerConfig
 * @param runDetached Boolean. If set to true, the build server will run in detached mode
 * @returns {Promise<{stop: (function(): *), disconnectStdIo: disconnectStdIo}>}
 */
export async function createBuildServer(options, runDetached) {
	const detached = typeof (runDetached) != "undefined" ? runDetached : false

	if (!options.directory) {
		throw new Error('Build directory is required')
	}

	const dirname = path.dirname(fileURLToPath(import.meta.url))
	const args = [
		path.join(dirname, "BuildServerStarter.js"),
		'-d', options.directory,
	]

	if (options.devServerPort != null) {
		args.push('-p', options.devServerPort)
	}

	if (options.preserveLogs) {
		args.push('--preserve-logs')
	}

	if (options.webRoot) {
		args.push("--web-root")
		args.push(options.webRoot)
	}

	if (options.spaRedirect) {
		args.push("--spaRedirect")
	}

	if (options.watchFolders) {
		args.push("--watchFolders")
		args.push(options.watchFolders.join(":"))
	}

	if (options.autoRebuild) {
		args.push("--autoRebuild")
	}

	args.push(options.builderPath)
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