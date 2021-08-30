import {createServer} from "net"
import fs from "fs-extra"
import {default as path} from "path"
import {DevServer} from "./DevServer.js"
import {Watchers} from "./Watchers.js"


const STATUS_OK = "ok"
const STATUS_ERROR = "error"
const STATUS_INFO = "info"
const STATUS_CONFIG = "config"
/**
 * Contains the definition of status codes that are sent with each message the server sends to its client.
 *
 * <p><b>INFO</b> - Status code that is sent with messages of an informative nature.</p>
 * <p><b>OK</b> - Status code that is sent after the build server has successfully finished a build command.</p>
 * <p><b>ERROR</b> - Status code that is sent if an error occurs in the server.</p>
 * <p><b>CONFIG</b> - Status code that indicates that the message contains a dump of the server config.</p>
 * @type {{ERROR: string, OK: string, INFO: string, CONFIG: string}}
 */
export const BuildServerStatus = {
	OK: STATUS_OK,
	ERROR: STATUS_ERROR,
	INFO: STATUS_INFO,
	CONFIG: STATUS_CONFIG
}

const COMMAND_SHUTDOWN = "shutdown"
const COMMAND_BUILD = "build"
const COMMAND_DUMP_CONFIG = "config"
/**
 * <p>Contains the definition of commands the server accepts</p>.
 *
 * <p><b>BUILD</b> - Command to trigger the execution of a build</p>.
 * <p><b>SHUTDOWN</b> - Command to shutdown the server</p>.
 * <p><b>CONFIG</b> - Command to have the server dump the current build config</p>.
 * @type {{BUILD: string, SHUTDOWN: string}}
 */
export const BuildServerCommand = {
	SHUTDOWN: COMMAND_SHUTDOWN,
	BUILD: COMMAND_BUILD,
	CONFIG: COMMAND_DUMP_CONFIG
}

const SOCKET = "socket"
const MESSAGE_SEPARATOR = String.fromCharCode(23)
const LOGFILE = 'build.log'
/**
 * Contains static configuration parameters of the server.
 *
 * <p><b>MESSAGE_SEPARATOR</b> - Seperator used between server messages sent to the client (currently EOM https://en.wikipedia.org/wiki/End_of_message)</p>
 * <p><b>SOCKET</b> - Name of the socket that the server will create within the directory passed via the BuildServer constructor</p>
 * <p><b>LOGFILE</b> - Name of the logfile.</p>
 * @type {{SOCKET: string, MESSAGE_SEPARATOR: string}}
 */
export const BuildServerConfiguration = {
	SOCKET,
	MESSAGE_SEPARATOR,
	LOGFILE
}


export class BuildServer {
	/**
	 * @param config A BuildServerConfig object
	 */
	constructor(config) {
		this.config = config

		this.serverSocket = null
		this.watchers = new Watchers()

		this.socketPath = path.join(this.config.directory, SOCKET)
		this.logFilePath = path.join(this.config.directory, LOGFILE)
	}

	/**
	 * Starts the build server
	 * @returns {Promise<void>}
	 */
	async start() {
		await this._createTempDir()
		await this._initLog()

		this.builder = await import(this.config.builderPath)
		if (await fs.exists(this.socketPath)) {
			this.log("Socket already exists, removing", this.socketPath)
			await fs.remove(this.socketPath)
		}
		this.socketServer = createServer(this._connectionListener.bind(this))
			.listen(this.socketPath)
			.on("connection", (socket) => {
				this.serverSocket = socket
				this.log("Client connected to build server")
			})
		this.log("Build server listening on ", this.socketPath)

		this._startDevServer(this.config.webRoot, this.config.devServerPort)
	}

	/**
	 * Stops the build server
	 * @returns {Promise<void>}
	 */
	async stop() {
		this._stopDevServer()

		if (this.socketServer) {
			await this.socketServer.close()
		}
		if (this.watchers) {
			this.watchers.stop()
		}
		if (this.serverSocket) {
			this.log("Removing build server socket")
			this.serverSocket.end()
			this.serverSocket.destroy()
		}
		await this._removeSocket()
		if (!this.config.preserveLogs) {
			this.log("Removing build server directory")
			await this._removeTempDir()
		}
		this.logStream.end()
		this.logStream.destroy()
	}


	async _connectionListener(socket) {
		socket.on("data", (data) => this._onData(data, (...args) => this._logTee(args)))
		      .on("error", (data) => this._onError(data, (...args) => this._logTee(args)))
		      .on("close", (data) => this._onClose(data, (...args) => this._logTee(args)))
	}

	/**
	 * Sends a message to the client.
	 * @param socket
	 * @param status
	 * @param message
	 * @returns {Promise<void>}
	 * @private
	 */
	async _sendToClient(status, message) {
		if (this.serverSocket && !this.serverSocket.writable) {
			return
		}
		this.serverSocket.write(
			JSON.stringify({
				status,
				message
			}) + MESSAGE_SEPARATOR
		)
	}

	async _onSrcDirChanged(event, path) {
		try {
			this.log("invalidating", path)
			this.bundleWrappers.forEach(wrapper => wrapper.bundle.invalidate(path))
			if (this.config.autoRebuild) {
				const updates = await this._generateBundles()
				this.devServer?.updateBundles(updates)
			}
		} catch (e) {
			this._sendToClient(STATUS_ERROR, String(e) + e.stack)
		}
	}

	async _onBuilderChanged() {
		this.log("Builder code has changed, restarting server ...")
		// If the builder code changes, we need to force a restart
		await this._shutdown((...args) => this.log(args))
	}

	async _setupWatchers(log) {
		this.watchers.start(log, this.config.watchFolders, this._onSrcDirChanged.bind(this), this.config.builderPath, this._onBuilderChanged.bind(this))
	}

	async _runInitialBuild(log) {
		this.log("initial build")
		this._stopDevServer()
		if (this.config.devServerPort) {
			this._startDevServer()
		}

		this.bundleWrappers = await this.builder.build(
			this.lastBuildConfig,
			this.config,
			(...message) => {log("Builder: " + message.join(" "))}
		)
		await this._generateBundles(log)
		await this._setupWatchers(log)
	}

	async _generateBundles(log) {
		const result = []
		if (this.bundleWrappers && Array.isArray(this.bundleWrappers)) {
			for (const wrapper of this.bundleWrappers) {
				result.push(await wrapper.generate())
			}
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
	async _shutdown(log) {
		try {
			log("Shutting down server")
			await this.stop()
			process.exit(0)
		} catch (e) {
			// logfile might be already closed now
			console.log("An error occured shutting down the server gracefully, exiting hard ...")
			console.log(e)
			process.exit(1)
		}
	}

	async _onData(data, log) {
		const {command, options} = this._parseClientMessage(data)
		try {
			if (command === COMMAND_SHUTDOWN) {
				await this._shutdown(log)
			} else if (command === COMMAND_BUILD) {
				log("New build request with parameters: " + JSON.stringify(options))
				const newConfig = options
				if (!this.lastBuildConfig || !this._isSameConfig(newConfig, this.lastBuildConfig)) {
					log(`Config has changed, rebuilding old: ${JSON.stringify(this.lastBuildConfig)}, new: ${JSON.stringify(newConfig)}`)
					this.bundleWrappers = null
					this.lastBuildConfig = newConfig
				}
				if (this.bundleWrappers == null) {
					await this._runInitialBuild(log)
				} else {
					await this._generateBundles(log)
				}
				this._sendToClient(STATUS_OK, "Build finished")
			} else if (command === COMMAND_DUMP_CONFIG) {
				await this._sendToClient(STATUS_CONFIG, this.config)
			} else {
				log("Unknown command: " + command)
			}
		} catch (e) {
			log("Error:", String(e), e.stack)
			await this._sendToClient(STATUS_ERROR, String(e) + e.stack)
		}
	}

	/**
	 * Writes ...args to socket and logfile
	 * @param args
	 * @private
	 */
	_logTee(...args) {
		if (!args || !Array.isArray(args)) {
			return
		}
		if (this._canWriteToSocket()) {
			this._sendToClient(STATUS_INFO, args.join(" "))
		}
		this.log(args)
	}

	async _onError(error, log) {
		log("Socket error: ", error)
	}

	async _onClose(data, log) {
		log("Client close")
	}

	_stopDevServer() {
		if (this.devServer) {
			this.devServer.stop()
			this.devServer = null
		}
	}

	_startDevServer() {
		this.devServer = new DevServer(this.config.webRoot, this.config.spaRedirect, this.config.devServerPort, this._logTee.bind(this))
		this.devServer.start()
	}

	async _initLog() {
		this.logStream = fs.createWriteStream(this.logFilePath)
	}

	async _createTempDir() {
		await fs.mkdirs(this.config.directory)
	}

	async _removeTempDir() {
		await fs.rm(this.config.directory, {recursive: true})
	}

	async _removeSocket() {
		// there appears to be no reasonable way to check for the existence of a file, so we just empty catch an error if it does not exist
		try {
			await fs.unlink(this.socketPath)
		} catch (e) {
			this._logTee("Could not remove socket:", e.message)
		}
	}

	log(...args) {
		if (this.logStream.writable) {
			this.logStream.write(args.join(" ") + "\n")
		} else {
			console.log(args.join(" "))
		}
	}

	_canWriteToSocket() {
		if (this.serverSocket && this.serverSocket.writable) {
			return true
		}
		return false
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