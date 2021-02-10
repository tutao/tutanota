import {createServer} from "net"
import {createWriteStream, unlinkSync} from "fs"
import chokidar from "chokidar"
import express from "express"
import http from "http"
import expressws from "express-ws"
import fs from "fs"
import {fileURLToPath} from "url"
import {default as path} from "path"

const HTTP_PORT = 9001

const logStream = createWriteStream("/tmp/build.log")

process.on("SIGINT", () => {
	// IDEs tend to send SIGINT to all child processes but we want to keep running
	log("SIGINT received, ignoring")
})
process.on("uncaughtException", (e) => {
	log("Uncaught exception: ", e)
})

const args = process.argv.slice(2)
const [builderPath, watchFoldersString, addr] = args
if (!builderPath || !watchFoldersString || !addr) {
	console.log("Invalid arguments!", args)
	process.exit(1)
}
const watchFolders = watchFoldersString.split(":")

cleanup()


runServer().catch((e) => {
	log("Failed to run server", e)
	process.exit(1)
})

async function runServer() {
	log("Starting the server", args)
	const {build} = await import(builderPath)
	let oldConfig = null
	let watcher = null
	let bundleWrappers = null
	let httpServer = null

	const server = createServer((socket) => {
		const outerLog = log
		socket.on("data", async (data) => {
			const log = (...args) => {
				outerLog(...args)
				socket.write(args.join(" ") + "\n")
			}
			log("new build request " + data.toString())
			try {
				const msg = data.toString()
				if (msg === "clean") {
					log("clean")
					await fs.promises.rmdir("build", {recursive: true})
					log("Clean completed")
					closeServer(httpServer)
					return
				}
				const newConfig = JSON.parse(msg)
				if (!oldConfig || !isSameConfig(newConfig, oldConfig)) {
					log(`config has changed, rebuilding old: ${JSON.stringify(oldConfig)}, new: ${JSON.stringify(newConfig)}`)
					bundleWrappers = null
				}
				oldConfig = newConfig

				if (bundleWrappers == null) {
					log("initial build")
					httpServer && await httpServer.close()
					if (newConfig.watch) {
						httpServer = runHttpServer(log)
					}

					bundleWrappers = await build(newConfig, log)
					await generateBundles(bundleWrappers)
					socket.write("ok\n")
					watcher && watcher.close()
					watcher = chokidar.watch(watchFolders, {
						ignoreInitial: true,
						ignored: path => path.includes('/node_modules/') || path.includes('/.git/') || path.endsWith("build.log"),
					}).on("all", async (event, path) => {
						try {
							log("invalidating", path)
							bundleWrappers.forEach(wrapper => wrapper.bundle.invalidate(path))

							if (httpServer) {
								httpServer.messageAllSockets({status: "prepare"})

								const updates = await generateBundles(bundleWrappers)
								for (const update of updates) {
									httpServer.messageAllSockets({status: "ready"})
									httpServer.messageAllSockets({changes: update.changes})
								}
							}
						} catch (e) {
							socket.write("err: " + String(e) + e.stack + "\n")
						}
					})
					const fullBuilderPath = path.join(path.dirname(fileURLToPath(import.meta.url)), builderPath)
					chokidar.watch(["buildSrc", fullBuilderPath], {ignoreInitial: true})
					        .on("all", () => {
						        // If any build-related things have changed, we want to restart
						        closeServer(httpServer)
					        })
				} else {
					await generateBundles(bundleWrappers)
					socket.write("ok\n")
				}
			} catch (e) {
				log("error:", String(e), e.stack)
				socket.write("err: " + String(e) + e.stack + "\n")
			}
		}).on("error", (e) => {
			outerLog("socket error: ", e)
		}).on("close", () => {
			outerLog("client close")
			// If the client disconnected when we are in watch node, stop watching
			if (httpServer) {
				closeServer(httpServer)
			}
		})
	}).listen(addr)
	  .on("connection", () => {
		  log("connection")
	  })
	  .on("close", () => {
		  log("server closed")
		  cleanup()
	  })

	log("server listening")

	async function closeServer(httpServer) {
		log("stopping the serverP")
		// In case server closing does not work
		setTimeout(() => process.exit(0), 4000)
		httpServer && await httpServer.close()
		server.close(() => process.exit(0))
	}
}

function cleanup() {
	try {
		unlinkSync(addr)
	} catch (e) {
		if (e.code !== "ENOENT") {
			throw e
		}
	}
}

function isSameConfig(oldConfig, newConfig) {
	// Assuming all keys are specified in both
	for (const [oldKey, oldValue] of Object.entries(oldConfig)) {
		if (newConfig[oldKey] !== oldValue) {
			return false
		}
	}
	return true
}

async function generateBundles(bundleWrappers) {
	const result = []
	for (const wrapper of bundleWrappers) {
		result.push(await wrapper.generate())
	}
	return result
}

function log(...args) {
	console.log.apply(console.log, args)
	logStream.write(args.join(" ") + "\n")
}

function runHttpServer(log) {
	const app = express()
	const server = http.createServer(app)
	expressws(app, server)
	const sockets = []

	app.ws("/__hmr", (ws, req) => {
		log("new ws connection")
		sockets.push(ws)
		ws.send(JSON.stringify({greeting: true}))
		ws.on("close", () => {
			log("ws disconnect")
			sockets.splice(sockets.includes(ws), 1)
		})
	})
	app.use(express.static("build"))
	app.use((req, res, next) => {
		if ((req.method === 'GET' || req.method === 'HEAD') && req.accepts('html')) {
			res.redirect('/?r=' + req.url.replace(/\?/g, "&"))
		} else {
			next()
		}
	})
	server.listen(HTTP_PORT)
	log(`Server is serving files on ${HTTP_PORT}`)
	return {
		async close() {
			return new Promise((resolve) => server.close(resolve))
		},
		messageAllSockets(obj) {
			const message = JSON.stringify(obj)
			for (const socket of sockets) {
				try {
					socket.send(message)
				} catch (e) {
					log("Failed to message socket", e)
				}
			}
		}
	}
}