import {createConnection} from "net"
import {spawn} from "child_process"
import {fileURLToPath} from "url"
import path from "path"

/**
 * Start build server, connect and wait for the build to finish.
 *
 * @param clean boolean, whether to restart the server
 * @param builder path to the builder which will be used by the server, relative to the buildSrc
 * @param watchFolders folders to watch for changes
 * @param socketPath path to the unix socket used by this server
 * @param buildOpts options for the builder
 * @return {Promise<void>}
 */
export function buildWithServer({clean, builder, watchFolders, socketPath, buildOpts}) {
	return new Promise((resolve, reject) => {
		function start(clean, attempt) {
			console.log("Starting build server")
			const serverPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "./BuildServer.js")
			// If server fails to start and you don't know hwy, set "stdio" to "inherit"
			spawn(process.argv[0], [
				serverPath, builder, watchFolders.join(":"), socketPath
			], {detached: true, cwd: process.cwd()})
			console.log("Started build server")
			setTimeout(() => connect(clean, attempt + 1), 2000)
		}

		function connect(restart, attempt = 0) {
			try {
				const client = createConnection(socketPath)
					.on("connect", () => {
						console.log("Connected to the build server")
						if (restart) {
							console.log("Restarting the build server!")
							client.write("clean")
							start(false, attempt)
							// setTimeout(() => connect(false, 0), 2000)
						} else {
							client.write(JSON.stringify(buildOpts))
						}
					})
					.on("data", (data) => {
						const msg = data.toString()
						for (const line of msg.split("\n").slice(0, -1)) {
							console.log("server:", line)
							if (line === "ok") {
								resolve()

							} else if (line.startsWith("err")) {
								reject(new Error("Server failed with error: " + line.substring("err:".length)))
							}
						}
					})
					.on("error", (e) => {
						if (attempt > 2) {
							reject(new Error("Failed to start build server", e))
						}
						start(clean, attempt)
					})
			} catch (e) {
				reject(e)
			}
		}

		connect(clean)
	})
}
