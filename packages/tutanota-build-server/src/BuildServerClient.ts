import {createConnection} from "net"
import {tmpdir, userInfo} from "os"
import path from "path"
import {createBuildServer} from "./BuildServerFactory.js"
import {BuildServerCommand, BuildServerStatus, MESSAGE_SEPARATOR, SOCKET} from "./BuildServer.js"
import {BuildServerConfig} from "./BuildServerConfig.js"

const waitTimeinMs = 600

enum BuildServerClientState {
	STATE_SERVER_START_PENDING = "SERVER_START_PENDING",
	STATE_CONNECTED = "CONNECTED",
	STATE_DISCONNECTED = "DISCONNECTED"
}

export interface BuildServerClientOptions {
	forceRestart: boolean,
	builderPath: string,
	watchFolders: any,
	devServerPort: number,
	webRoot: string,
	spaRedirect: boolean,
	preserveLogs: boolean,
	autoRebuild: boolean,
}

export interface BuildOptions{
	clean: boolean,
	stage: string,
	host: string
}

/**
 * This class provides a convenient interface to BuildServer.js taking care of bootstrapping a BuildServer instance in a
 * dedicated, detached process and inter-process communication between the client and BuildServer.
 * See @buildWithServer method for details.
 */
export class BuildServerClient {
	private state: BuildServerClientState
	private buildServerHandle
	private clientSocket
	private buildId: string
	private config: BuildServerConfig
	private buildOpts: BuildOptions

	constructor(buildId: string) {
		this.state = BuildServerClientState.STATE_DISCONNECTED
		this.buildServerHandle = null
		this.clientSocket = null
		this.buildId = buildId
	}

	/**
	 * Start a build server, connect and wait for the build to finish.
	 *
	 * @param forceRestart boolean, whether to restart the server
	 * @param builderPath absolute path to the builder which will be used by the server
	 * @param watchFolders absolute paths to folders to watch for changes
	 * @param devServerPort if set, a dev server will be listening on this port
	 * @param webRoot absolute path to directory to be used as webRoot by devServer
	 * @param spaRedirect boolean, if true the devServer will redirect any requests to '/?r=<requestedURL>'
	 * @param preserveLogs boolean
	 * @param buildOpts these will be passed through to the builder's build() method - ignored by BuildServer and BuildServerClient
	 * @return {Promise<void>}
	 */
	async buildWithServer(opts: BuildServerClientOptions, buildOpts: BuildOptions) {
		this.config = new BuildServerConfig(
				opts.builderPath,
				opts.watchFolders,
				opts.devServerPort,
				opts.webRoot,
				opts.spaRedirect,
				opts.preserveLogs,
				this.getBuildServerDirectory(),
				opts.autoRebuild,
		)

		this.buildOpts = buildOpts

		if (opts.forceRestart) {
			console.log("Called with forceRestart")
			await this.restartServer()
		} else {
			await this.bootstrapBuildServer()
		}

		let connectionAttempts = 0
		let lastError = null

		while (connectionAttempts < 2 && this.state !== BuildServerClientState.STATE_CONNECTED) {
			await new Promise(r => setTimeout(r, waitTimeinMs))

			try {
				await this.connectAndBuild()

				if (this.clientSocket != null) {
					this.clientSocket.unref()
					this.clientSocket = null
				}

				lastError = null
			} catch (e) {
				lastError = e
				connectionAttempts++
			}
		}

		if (lastError) {
			throw lastError
		}
	}

	/**
	 * Checks whether a server is already running using the requested configuration. Starts a new server if that is not the case.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async bootstrapBuildServer(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.connect({
				onConnect: socket => {
					const data = JSON.stringify({
						command: BuildServerCommand.CONFIG,
					})
					socket.write(data)
				},
				onData: async (socket, data) => {
					const serverMessages = this.parseServerMessages(data)

					if (serverMessages.length > 1 || serverMessages[0].status !== BuildServerStatus.CONFIG) {
						console.log("Received an unexpected reply from the server, ignoring it ...")

						/** We might get output from an earlier build command here that was working against the same build server instance
						 *  We simply ignore any output here, until we get a reply to the BuildServerCommand.CONFIG request
						 **/
						return
					}

					if (!this.config.equals(serverMessages[0].message)) {
						console.log("Build server is already running, but uses different configuration, restarting ...")
						socket.removeAllListeners()
						await this.restartServer()
						resolve()
					} else {
						console.log("Build server is already running, using existing instance ...")

						/** Prevent server output to be handled by the handlers above rather than the ones in connectAndBuild
						 * after we have established that the old build server can be reused**/
						socket.removeAllListeners()
						resolve()
					}
				},
				onError: async () => {
					// no server is running - start an instance
					await this.start()
					resolve()
				},
			})
		})
	}

	/**
	 * Returns path to build server directory. Our convention is to use a directory in the os-specific tempdir and create a sub directory name
	 * as the current user. This prevents collisions and permission issues when building with multiple users on one system.
	 * @returns {string} Absolute path to build server directory
	 */
	private getBuildServerRootDirectory() {
		const tempDir = tmpdir()
		const buildServerBaseDir = path.join(tempDir, "tutanota-build-server")
		const userName = userInfo().username
		return path.join(buildServerBaseDir, userName)
	}

	private getBuildServerDirectory() {
		return path.join(this.getBuildServerRootDirectory(), this.buildId)
	}

	/**
	 * Updates the client's state to reflect a connection has been established.
	 * @private
	 */
	private onConnectionEstablished() {
		this.state = BuildServerClientState.STATE_CONNECTED

		/* If the buildserver process was started by the current client process, we should have a handle to it.
		 *  Initially we connect the client's and server's StdIO so that we can receive and print any server error messages
		 *  during server bootstrap.Once a socket connection has been established between server and client, the server has an
		 *  alternative way of sending messages to the client, so we can disconnect StdIO at this point.
		 * If we run in watch mode (autoRebuild) we want to stay connected to the buildServer's STDIO.
		 */
		if (this.buildServerHandle && !this.config.autoRebuild) {
			console.log("Disconnecting StdIO from server process")
			this.buildServerHandle.disconnectStdIo()
		}
	}

	/**
	 * Connects to the build server (starts an instance if none is running) and triggers the build.
	 * See @buildWithServer() for parameter descriptions.
	 * @returns {Promise<unknown>}
	 * @private
	 */
	private async connectAndBuild() {
		return new Promise((resolve, reject) => {
			this.connect({
				onConnect: socket => {
					this.onConnectionEstablished()

					console.log("Connected to the build server")
					const data = JSON.stringify({
						command: BuildServerCommand.BUILD,
						options: this.buildOpts,
					})
					socket.write(data)
				},
				onData: (socket, data) => {
					const serverMessages = this.parseServerMessages(data)

					serverMessages.forEach(serverMessage => {
						const {status, message} = serverMessage

						if (status === BuildServerStatus.OK) {
							console.log("Server:", message)
							resolve(true)
						} else if (status === BuildServerStatus.INFO) {
							console.log("Server:", message)
						} else if (status === BuildServerStatus.ERROR) {
							reject(new Error("Server failed with error: " + message))
						} else {
							console.log("Unknown status code in server message: " + status)
						}
					})
				},
				onError: async () => {
					// If no build server is running, onError will be called on first connection attempt, start one if required
					if (this.state !== BuildServerClientState.STATE_SERVER_START_PENDING) {
						console.log("No build server running, starting a fresh instance ...")
						await this.start()
						reject()
					} else {
						reject()
					}
				},
			})
		})
	}

	/**
	 *
	 * @param data Raw data received from the build server
	 * @returns {[]} Array of objects that contain a status (String) and a message (String) by the server
	 * @private
	 */
	private parseServerMessages(data) {
		/*
	The code here assumes that multiple writes to the socket by the server can be received at once, but
	that no message by the server will be split across multiple calls of onData(). This might not be the case for large messages
	or environments with a relatively small MTU. As long as we are using a local connection, this should not be an issue.
	 */
		const dataAsString = data.toString()
		const messagesAsJSON = dataAsString.split(MESSAGE_SEPARATOR)
		const messagesAsObjects = []
		messagesAsJSON.forEach(message => {
			try {
				if (message.length > 1) {
					const parsedMessage = JSON.parse(message)
					messagesAsObjects.push(parsedMessage)
				}
			} catch {
				console.log("Warning: Unable to parse message from server: " + message)
			}
		})
		return messagesAsObjects
	}

	/**
	 * Shuts down any running BuildServer and starts a fresh instance.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async restartServer(): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			this.connect({
				onConnect: async socket => {
					console.log("Shutting down build server")
					const message = JSON.stringify({
						command: BuildServerCommand.SHUTDOWN,
					})
					socket.write(message)
					await this.start()
					resolve()
				},
				onData: (socket, data) => {
				},
				onError: async error => {
					console.log("No build server running, starting a new one")
					await this.start()
					resolve()
				},
			})
		})
	}

	/**
	 * Wrapper around net.createConnection()
	 * @param onConnect Function that expects clientSocket (net.Socket)
	 * @param onData Function that expects clientSocket (net.Socket) and data
	 * @param onError Function that expects clientSocket (net.Socket) and data
	 * @private
	 */
	private connect({onConnect, onData, onError}) {
		this.clientSocket = createConnection(
				path.join(this.getBuildServerDirectory(), SOCKET),
		)
				.on("connect", () => onConnect(this.clientSocket))
				.on("error", data => onError(this.clientSocket, data))
				.on("data", data => onData(this.clientSocket, data))
	}

	/**
	 * Starts a BuildServer in a new process. Sets this.buildServerHandle.
	 * @returns {Promise<void>}
	 */
	private async start() {
		this.state = BuildServerClientState.STATE_SERVER_START_PENDING
		this.buildServerHandle = await createBuildServer(this.config, this.config.autoRebuild ? false : true)
	}
}