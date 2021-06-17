import {createServer} from "net"
import fs from "fs-extra"
import chokidar from "chokidar"
import express from "express"
import http from "http"
import expressws from "express-ws"
import {default as path} from "path"
import os from "os"

// Status code that is sent after the build server has successfully finished a build command
export const STATUS_OK = "ok"
// Status code that is sent if an error occurs in the server
export const STATUS_ERROR = "error"
// Status code that is sent with messages of an informative nature
export const STATUS_INFO = "info"

// command to shutdown the server
export const COMMAND_SHUTDOWN = "shutdown"
// command to trigger a build
export const COMMAND_BUILD = "build"

// Name of the socket that the server will create within the directory passed via the BuildServer constructor
export const SOCKET = "socket"
// Seperator used between server messages sent to the client
export const MESSAGE_SEPERATOR = String.fromCharCode(23)


export class BuildServer {
	/**
	 * @param devServerPort if set, a dev server will be listening on this port
	 * @param builderPath absolute path to the builder which will be used by the server
	 * @param preserveLogs boolean, logs will not be deleted on server shutdown if set to true
	 * @param directory absolute path to directory in which the build server will create its log file and socket
	 * @param watchFolders directories to watch for file changes that re-trigger the last build
	 * @param webRoot absolute path to directory to be used as webRoot by devServer
	 * @param spaRedirect boolean, if true the devServer will redirect any requests to '/?r=<requestedURL>'
	 */
	constructor({devServerPort, builderPath, preserveLogs, directory, watchFolders, webRoot, spaRedirect}) {
		this.devServerPort = devServerPort
		this.builderPath = builderPath
		this.preserveLogs = preserveLogs || false
		this.directory = directory || path.join(os.tempdir, 'tutanota-build-server')
		this.watchFolders = watchFolders
		this.webRoot = webRoot
		this.spaRedirect = spaRedirect || true
		this.webSockets = []

		this.socketPath = path.join(this.directory, 'socket')
		this.logFilePath = path.join(this.directory, 'build.log')
	}

	/**
	 * Starts the build server
	 * @returns {Promise<void>}
	 */
	async start() {
		await this._createTempDir()
		await this._initLog()

		this.builder = await import(this.builderPath)
		this.socketServer = createServer(this._connectionListener.bind(this))
			.listen(this.socketPath)
			.on("connection", (socket) => {this.log("Client connected to build server")})
		this.log("Build server listening on ", this.socketPath)
	}

	/**
	 * Stops the build server
	 * @returns {Promise<void>}
	 */
	async stop() {
		if (this.watcher) {
			this.watcher.close()
		}
		await this._stopDevServer()
		if (this.socketServer) {
			await this.socketServer.close()
		}
		this.log("Removing build server socket")
		await this._removeSocket()
		if (!this.preserveLogs) {
			this.log("Removing build server directory")
			await this._removeTempDir()
		}
		this.logStream.end()
	}


	async _connectionListener(socket) {
		socket.on("data", (data) => this._onData(data, socket, (...args) => this._logTee(socket, args)))
		      .on("error", (data) => this._onError(data, socket, (...args) => this._logTee(socket, args)))
		      .on("close", (data) => this._onClose(data, socket, (...args) => this._logTee(socket, args)))
	}

	/**
	 * Sends a message to the client.
	 * @param socket
	 * @param status
	 * @param message
	 * @returns {Promise<void>}
	 * @private
	 */
	async _sendToClient(socket, status, message) {
		socket.write(
			JSON.stringify({
				status,
				message
			}) + MESSAGE_SEPERATOR
		)
	}

	async _setupWatchers(socket, log) {
		this.watcher && await this.watcher.close()
		if (this.watchFolders && this.watchFolders.length > 0) {
			log("Setting up watchers for: " + this.watchFolders.join(","))
			this.watcher = chokidar.watch(this.watchFolders, {
				ignoreInitial: true,
				ignored: path => path.includes('/node_modules/') || path.includes('/.git/') || path.endsWith("build.log"),
			}).on("all", async (event, path) => {
				try {
					log("invalidating", path)
					this.bundleWrappers.forEach(wrapper => wrapper.bundle.invalidate(path))
					if (this.httpServer) {
						this._messageWebSockets({status: "prepare"})
						const updates = await this._generateBundles()
						for (const update of updates) {
							this._messageWebSockets({status: "ready"})
							this._messageWebSockets({changes: update.changes})
						}
					}
				} catch (e) {
					this._sendToClient(socket, STATUS_ERROR, String(e) + e.stack)
				}
			})
		}
		log(`Setting up watcher for: "${this.builderPath}"`)
		chokidar.watch([this.builderPath], {ignoreInitial: true})
		        .on("all", async () => {
			        log("Build watcher")
			        // If the builder code changes, we need to force a restart
			        await this._shutdown(socket, log)
		        })
	}

	_messageWebSockets(obj) {
		const message = JSON.stringify(obj)
		for (const socket of this.webSockets) {
			try {
				socket.send(message)
			} catch (e) {
				this.log("Failed to message socket", e)
			}
		}
	}

	async _runInitialBuild(socket, log) {
		this.log("initial build")
		this._stopDevServer()
		if (this.devServerPort) {
			this._startDevServer()
		}

		this.bundleWrappers = await this.builder.build(
			this.lastBuildConfig,
			this._getConfig(),
			(...message) => {log("Builder: " + message.join(" "))}
		)
		await this._generateBundles(socket, log)
		await this._setupWatchers(socket, log)
	}

	async _generateBundles(socket, log) {
		const result = []
		for (const wrapper of this.bundleWrappers) {
			result.push(await wrapper.generate())
		}
		return result
	}

	_parseClientMessage(data) {
		const dataAsString = data.toString()
		const {command, options} = JSON.parse(dataAsString)
		return {command, options}
	}

	/**
	 * Stops the server and ends the process it is running in
	 * @param socket
	 * @returns {Promise<void>}
	 * @private
	 */
	async _shutdown(socket, log) {
		try {
			log("Shutting down server")
			socket.end()
			await this.stop()
			process.exit(0)
		} catch (e) {
			// logfile might be already closed now
			console.log("An error occured shutting down the server gracefully, exiting hard ...")
			console.log(e)
			process.exit(1)
		}
	}

	async _onData(data, socket, log) {
		const {command, options} = this._parseClientMessage(data)
		try {
			if (command === COMMAND_SHUTDOWN) {
				await this._shutdown(socket, log)
			} else if (command === COMMAND_BUILD) {
				log("New build request with parameters: " + JSON.stringify(options))
				const newConfig = options
				if (!this.lastBuildConfig || !this._isSameConfig(newConfig, this.lastBuildConfig)) {
					log(`Config has changed, rebuilding old: ${JSON.stringify(this.lastBuildConfig)}, new: ${JSON.stringify(newConfig)}`)
					this.bundleWrappers = null
					this.lastBuildConfig = newConfig
				}
				if (this.bundleWrappers == null) {
					await this._runInitialBuild(socket, log)
				} else {
					await this._generateBundles(socket, log)
				}
				this._sendToClient(socket, STATUS_OK, "Build finished")
			} else {
				log("Unknown command: " + command)
			}
		} catch (e) {
			log("Error:", String(e), e.stack)
			this._sendToClient(socket, STATUS_ERROR, String(e) + e.stack)
		}
	}

	/**
	 * Writes ...args to socket and logfile
	 * @param socket
	 * @param args
	 * @private
	 */
	_logTee(socket, ...args) {
		if (!socket.isDestroyed && socket.readyState === "open") {
			this._sendToClient(socket, STATUS_INFO, args.join(" "))
		}
		this.log(args)
	}

	async _onError(error, socket, log) {
		log("Socket error: ", error)
	}

	async _onClose(data, socket, log) {
		log("Client close")
	}

	async _stopDevServer() {
		this.webSockets = []
		if (this.httpServer) {
			await this.httpServer.close()
		}
	}

	_startDevServer() {
		if (!this.webRoot) return
		const app = express()
		const sockets = []

		this.httpServer = http.createServer(app)
		expressws(app, this.httpServer)

		this._setupHMR(app, sockets)

		// do not change the order of these two lines
		app.use(express.static(this.webRoot))
		this._setupSpaRedirect(app)

		this.httpServer.listen(this.devServerPort)

		this.log(`Server is serving files on ${this.devServerPort}`)
	}

	/**
	 * Sets up hot module reloading for devServer
	 * @param app
	 * @param sockets
	 * @private
	 */
	_setupHMR(app, sockets) {
		// set up hot module reloading
		app.ws("/__hmr", (ws, req) => {
			this.log("New websocket connection")
			this.webSockets.push(ws)
			ws.send(JSON.stringify({greeting: true}))
			ws.on("close", () => {
				this.log("Websocket disconnect")
				sockets.splice(sockets.includes(ws), 1)
			})
		})
	}

	/**
	 * Sets up redirect for Single Page Applications
	 * @param app
	 * @private
	 */
	_setupSpaRedirect(app) {
		if (this.spaRedirect) {
			app.use((req, res, next) => {
				if ((req.method === 'GET' || req.method === 'HEAD') && req.accepts('html')) {
					res.redirect('/?r=' + req.url.replace(/\?/g, "&"))
				} else {
					next()
				}
			})
		}
	}

	async _initLog() {
		this.logStream = fs.createWriteStream(this.logFilePath)
	}

	async _createTempDir() {
		await fs.mkdirs(this.directory)
	}

	async _removeTempDir() {
		await fs.rm(this.directory, {recursive: true})
	}

	async _removeSocket() {
		if (await fs.exists(this.socketPath)) {
			await fs.unlink(this.socketPath)
		}
	}

	_getConfig() {
		return {
			devServerPort: this.devServerPort,
			builder: this.builderPath,
			preserveLogs: this.preserveLogs,
			directory: this.directory,
			watchFolders: this.watchFolders,
			socket: this.socketPath,
			logFile: this.logFilePath,
			webRoot: this.webRoot,
			spaRedirect: this.spaRedirect
		}
	}

	log(...args) {
		console.log(args.join(" "))
		this.logStream.write(args.join(" ") + "\n")
	}

	_isSameConfig(oldConfig, newConfig) {
		// Assuming all keys are specified in both
		for (const [oldKey, oldValue] of Object.entries(oldConfig)) {
			if (newConfig[oldKey] !== oldValue) {
				return false
			}
		}
		return true
	}
}