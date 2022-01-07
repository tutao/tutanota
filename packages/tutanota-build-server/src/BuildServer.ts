import {createServer} from "net"
import fs from "fs-extra"
import {default as path} from "path"
import {DevServer} from "./DevServer.js"
import {Watchers} from "./Watchers.js"
import {BuildServerConfig} from "./BuildServerConfig.js";

/**
 * Contains the definition of status codes that are sent with each message the server sends to its client.
 *
 * <p><b>INFO</b> - Status code that is sent with messages of an informative nature.</p>
 * <p><b>OK</b> - Status code that is sent after the build server has successfully finished a build command.</p>
 * <p><b>ERROR</b> - Status code that is sent if an error occurs in the server.</p>
 * <p><b>CONFIG</b> - Status code that indicates that the message contains a dump of the server config.</p>
 * @type {{ERROR: string, OK: string, INFO: string, CONFIG: string}}
 */
export enum BuildServerStatus {
	OK = "ok",
	ERROR = "error",
	INFO = "info",
	CONFIG = "config",
}

/**
 * <p>Contains the definition of commands the server accepts</p>.
 *
 * <p><b>BUILD</b> - Command to trigger the execution of a build</p>.
 * <p><b>SHUTDOWN</b> - Command to shutdown the server</p>.
 * <p><b>CONFIG</b> - Command to have the server dump the current build config</p>.
 * @type {{BUILD: string, SHUTDOWN: string}}
 */
export enum BuildServerCommand {
	SHUTDOWN = "shutdown",
	BUILD = "build",
	CONFIG = "config",
}

/*
Name of the socket that the server will create within the directory passed via the BuildServer constructor
 */
export const SOCKET = "socket"

/*
Seperator used between server messages sent to the client (currently EOM https://en.wikipedia.org/wiki/End_of_message)
 */
export const MESSAGE_SEPARATOR = String.fromCharCode(23)

/*
Name of the logfile.
 */
export const LOGFILE = "build.log"

export class BuildServer {
	private buildServerConfig: BuildServerConfig
	private builder
	private serverSocket
	private watchers
	private socketPath: string
	private logFilePath: string
	private builderConfig
	private socketServer
	private bundleWrappers
	private devServer: DevServer | null
	private logStream

	/**
	 * @param config A BuildServerConfig object
	 */
	constructor(config) {
		/**
		 * The config for the running build server
		 */
		this.buildServerConfig = config

		/**
		 * The config that gets passed to this.builder
		 */
		this.builderConfig = null
		this.builder = null
		this.serverSocket = null
		this.watchers = new Watchers()
		this.socketPath = path.join(this.buildServerConfig.directory, SOCKET)
		this.logFilePath = path.join(this.buildServerConfig.directory, LOGFILE)
		this.devServer = null

	}

	/**
	 * Starts the build server
	 * @returns {Promise<void>}
	 */
	async start() {
		await this.createTempDir()
		await this.initLog()
		this.builder = await import(this.buildServerConfig.builderPath)

		if (fs.existsSync(this.socketPath)) {
			this.log("Socket already exists, removing", this.socketPath)
			await fs.remove(this.socketPath)
		}

		this.socketServer = createServer(this.connectionListener.bind(this))
			.listen(this.socketPath)
			.on("connection", socket => {
				this.serverSocket = socket
				this.log("Client connected to build server")
			})
		this.log("Build server listening on ", this.socketPath)

		this.startDevServer()
	}

	/**
	 * Stops the build server
	 * @returns {Promise<void>}
	 */
	async stop() {
		this.stopDevServer()

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

		await this.removeSocket()

		if (!this.buildServerConfig.preserveLogs) {
			this.log("Removing build server directory")
			await this.removeTempDir()
		}

		this.logStream.end()
		this.logStream.destroy()
	}

	private async connectionListener(socket) {
		socket
			.on("data", data => this.onData(data, (...args) => this.logTee(args)))
			.on("error", data => this.onError(data, (...args) => this.logTee(args)))
			.on("close", data => this.onClose(data, (...args) => this.logTee(args)))
	}

	/**
	 * Sends a message to the client.
	 * @param status
	 * @param message
	 * @returns {Promise<void>}
	 * @private
	 */
	private async sendToClient(status, message) {
		if (this.serverSocket && !this.serverSocket.writable) {
			return
		}

		this.serverSocket.write(
			JSON.stringify({
				status,
				message,
			}) + MESSAGE_SEPARATOR,
		)
	}

	private async onSrcDirChanged(event, path, log) {
		try {
			const normalizedPath = await fs.realpath(path)
			log("invalidating", normalizedPath)
			this.bundleWrappers.forEach(wrapper => wrapper.bundle.invalidate(normalizedPath))

			if (this.buildServerConfig.autoRebuild) {
				log("Rebuilding ...")
				await this.builder.preBuild?.(this.builderConfig, this.buildServerConfig, log)
				const updates = await this.generateBundles()
				await this.builder.postBuild?.(this.builderConfig, this.buildServerConfig, log)
				this.devServer?.updateBundles(updates)
			}
		} catch (e: any) {
			this.sendToClient(BuildServerStatus.ERROR, String(e) + e.stack)
		}
	}

	private async onBuilderChanged() {
		this.log("Builder code has changed, restarting server ...")
		// If the builder code changes, we need to force a restart
		await this.shutdown((...args) => this.log(args))
	}

	private async setupWatchers(log) {
		this.watchers.start(
			log,
			this.buildServerConfig.watchFolders,
			(event, path) => this.onSrcDirChanged(event, path, log),
			this.buildServerConfig.builderPath,
			this.onBuilderChanged.bind(this),
		)
	}

	private async runInitialBuild(log) {
		this.log("initial build")

		this.stopDevServer()

		if (this.buildServerConfig.devServerPort) {
			this.startDevServer()
		}

		await this.builder.preBuild?.(this.builderConfig, this.buildServerConfig, log)
		this.bundleWrappers = await this.builder.build(this.builderConfig, this.buildServerConfig, (...message) => {
			log("Builder: " + message.join(" "))
		})
		await this.generateBundles()
		await this.builder.postBuild?.(this.builderConfig, this.buildServerConfig, log)
		await this.setupWatchers(log)
	}

	private async generateBundles() {
		const result: any[] = []

		if (this.bundleWrappers && Array.isArray(this.bundleWrappers)) {
			for (const wrapper of this.bundleWrappers) {
				result.push(await wrapper.generate())
			}
		}

		return result
	}

	private parseClientMessage(data) {
		const dataAsString = data.toString()
		const {command, options} = JSON.parse(dataAsString)
		return {
			command,
			options,
		}
	}

	/**
	 * Stops the server and ends the process it is running in
	 * @returns {Promise<void>}
	 * @private
	 */
	private async shutdown(log) {
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

	private async onData(data, log) {
		const {command, options} = this.parseClientMessage(data)

		try {
			if (command === BuildServerCommand.SHUTDOWN) {
				await this.shutdown(log)
			} else if (command === BuildServerCommand.BUILD) {
				log("New build request with parameters: " + JSON.stringify(options))
				const newConfig = options

				if (!this.builderConfig || !this.isSameConfig(newConfig, this.builderConfig)) {
					log(
						`Config has changed, rebuilding old: ${JSON.stringify(
							this.builderConfig,
						)}, new: ${JSON.stringify(newConfig)}`,
					)
					this.bundleWrappers = null
					this.builderConfig = newConfig
				}

				if (this.bundleWrappers == null) {
					await this.runInitialBuild(log)
				} else {
					await this.builder.preBuild?.(this.builderConfig, this.buildServerConfig, log)
					await this.generateBundles()
					await this.builder.postBuild?.(this.builderConfig, this.buildServerConfig, log)
				}

				this.sendToClient(BuildServerStatus.OK, "Build finished")
			} else if (command === BuildServerCommand.CONFIG) {
				await this.sendToClient(BuildServerStatus.CONFIG, this.buildServerConfig)
			} else {
				log("Unknown command: " + command)
			}
		} catch (e: any) {
			log("Error:", String(e), e.stack)
			await this.sendToClient(BuildServerStatus.ERROR, String(e) + e.stack)
		}
	}

	/**
	 * Writes ...args to socket and logfile
	 * @param args
	 * @private
	 */
	private logTee(...args): void {
		if (!args || !Array.isArray(args)) {
			return
		}

		const message = args.join(" ").trimRight()

		if (this.canWriteToSocket()) {
			this.sendToClient(BuildServerStatus.INFO, message)
		}

		this.log(args)
	}

	private async onError(error, log): Promise<void> {
		log("Socket error: ", error)
	}

	private async onClose(data, log) {
		log("Client close")
	}

	private stopDevServer() {
		if (this.devServer) {
			this.devServer.stop()
			this.devServer = null
		}
	}

	private startDevServer() {
		if (this.buildServerConfig.webRoot != null && this.buildServerConfig.devServerPort != null) {
			this.devServer = new DevServer(
				this.buildServerConfig.webRoot,
				this.buildServerConfig.spaRedirect ?? true,
				this.buildServerConfig.devServerPort,
				this.logTee.bind(this),
			)
			this.devServer.start()
		}
	}

	private async initLog() {
		this.logStream = fs.createWriteStream(this.logFilePath)
	}

	private async createTempDir() {
		await fs.mkdirSync(this.buildServerConfig.directory, {recursive: true})
	}

	private async removeTempDir() {
		await fs.rmdirSync(this.buildServerConfig.directory)
	}

	private async removeSocket() {
		// there appears to be no reasonable way to check for the existence of a file, so we just empty catch an error if it does not exist
		try {
			await fs.unlink(this.socketPath)
		} catch (e: any) {
			this.logTee("Could not remove socket:", e.message)
		}
	}

	log(...args) {
		if (this.logStream.writable) {
			this.logStream.write(args.join(" ") + "\n")
		} else {
			console.log(args.join(" "))
		}
	}

	private canWriteToSocket() {
		if (this.serverSocket && this.serverSocket.writable) {
			return true
		}

		return false
	}

	private isSameConfig(oldConfig, newConfig) {
		// Assuming all keys are specified in both
		for (const [oldKey, oldValue] of Object.entries(oldConfig)) {
			if (newConfig[oldKey] !== oldValue) {
				return false
			}
		}

		return true
	}
}