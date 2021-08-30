import {createConnection} from "net"
import os from "os"
import path from "path"
import {createBuildServer} from "./BuildServerFactory.js"
import {BuildServerCommand, BuildServerConfiguration, BuildServerStatus} from "./BuildServer.js"
import {BuildServerConfig} from "./BuildServerConfig.js"

const waitTimeinMs = 600
const STATE_SERVER_START_PENDING = "SERVER_START_PENDING"
const STATE_CONNECTED = "CONNECTED"
const STATE_DISCONNECTED = "DISCONNECTED"

/**
 * This class provides a convenient interface to BuildServer.js taking care of bootstrapping a BuildServer instance in a
 * dedicated, detached process and inter-process communication between the client and BuildServer.
 * See @buildWithServer method for details.
 */
export class BuildServerClient {
	constructor(buildId) {
		this.state = STATE_DISCONNECTED
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
	async buildWithServer({
		                      forceRestart,
		                      builderPath,
		                      watchFolders,
		                      devServerPort,
		                      webRoot,
		                      spaRedirect,
		                      preserveLogs,
		                      autoRebuild,
		                      buildOpts
	                      }) {
		this.config = new BuildServerConfig(builderPath, watchFolders, devServerPort, webRoot, spaRedirect, preserveLogs, this._getBuildServerDirectory(), autoRebuild)
		if (forceRestart) {
			console.log("Called with forceRestart")
			await this._restartServer(this.config)
		} else {
			await this._bootstrapBuildServer(this.config)
		}

		let connectionAttempts = 0
		let lastError = null

		while (connectionAttempts < 2 && this.state !== STATE_CONNECTED) {
			await new Promise(r => setTimeout(r, waitTimeinMs));
			try {
				await this._connectAndBuild(this.config, buildOpts)

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
	 * @param config
	 * @returns {Promise<*>}
	 * @private
	 */
	async _bootstrapBuildServer(config) {
		return new Promise((resolve, reject) => {
			this._connect({
				onConnect: (socket) => {
					const data = JSON.stringify({
						command: BuildServerCommand.CONFIG,
					})
					socket.write(data)
				},
				onData: async (socket, data) => {
					const serverMessages = this._parseServerMessages(data)
					if (serverMessages.length > 1 || serverMessages[0].status !== BuildServerStatus.CONFIG) {
						console.log("Received an unexpected reply from the server, ignoring it ...")
						/** We might get output from an earlier build command here that was working against the same build server instance
						 *  We simply ignore any output here, until we get a reply to the BuildServerCommand.CONFIG request
						 **/
						return
					}
					if (!config.equals(serverMessages[0].message)) {
						console.log("Build server is already running, but uses different configuration, restarting ...")
						socket.removeAllListeners()
						await this._restartServer(config)
						resolve()
					} else {
						console.log("Build server is already running, using existing instance ...")
						/** Prevent server output to be handled by the handlers above rather than the ones in _connectAndBuild
						 * after we have established that the old build server can be reused**/
						socket.removeAllListeners()
						resolve()
					}
				},
				onError: async () => {
					// no server is running - start an instance
					await this._start(config)
					resolve()
				}
			})
		})
	}

	/**
	 * Returns path to build server directory. Our convention is to use a directory in the os-specific tempdir and create a sub directory name
	 * as the current user. This prevents collisions and permission issues when building with multiple users on one system.
	 * @returns {string} Absolute path to build server directory
	 */
	_getBuildServerRootDirectory() {
		const tempDir = os.tmpdir()
		const buildServerBaseDir = path.join(tempDir, 'tutanota-build-server')
		const userName = os.userInfo().username
		return path.join(buildServerBaseDir, userName)
	}

	_getBuildServerDirectory() {
		return path.join(this._getBuildServerRootDirectory(), this.buildId)
	}

	/**
	 * Updates the client's state to reflect a connection has been established.
	 * @private
	 */
	_onConnectionEstablished() {
		this.state = STATE_CONNECTED
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
	async _connectAndBuild(config, buildOpts) {
		return new Promise((resolve, reject) => {
			this._connect({
				onConnect: (socket) => {
					this._onConnectionEstablished()
					console.log("Connected to the build server")
					const data = JSON.stringify({
						command: BuildServerCommand.BUILD,
						options: buildOpts
					})
					socket.write(data)
				},
				onData: (socket, data) => {
					const serverMessages = this._parseServerMessages(data)
					serverMessages.forEach((serverMessage) => {
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
					if (this.state !== STATE_SERVER_START_PENDING) {
						console.log("No build server running, starting a fresh instance ...")
						await this._start(config)
						reject()
					} else {
						reject()
					}
				}
			})
		})
	}

	/**
	 *
	 * @param data Raw data received from the build server
	 * @returns {[]} Array of objects that contain a status (String) and a message (String) by the server
	 * @private
	 */
	_parseServerMessages(data) {
		/*
		The code here assumes that multiple writes to the socket by the server can be received at once, but
		that no message by the server will be split across multiple calls of onData(). This might not be the case for large messages
		or environments with a relatively small MTU. As long as we are using a local connection, this should not be an issue.
		 */
		const dataAsString = data.toString()
		const messagesAsJSON = dataAsString.split(BuildServerConfiguration.MESSAGE_SEPARATOR)
		const messagesAsObjects = []
		messagesAsJSON.forEach((message) => {
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
	 * @param config Instance of BuildServerConfig
	 * @returns {Promise<void>}
	 * @private
	 */
	async _restartServer(config) {
		await new Promise((resolve, reject) => {
			this._connect({
					onConnect: async (socket) => {
						console.log("Shutting down build server")
						const message = JSON.stringify({command: BuildServerCommand.SHUTDOWN})
						socket.write(message)
						await this._start(config)
						resolve()
					},
					onData: (socket, data) => {},
					onError: async (error) => {
						console.log("No build server running, starting a new one")
						await this._start(config)
						resolve()
					}
				}
			)
		})
	}

	/**
	 * Wrapper around net.createConnection()
	 * @param onConnect Function that expects clientSocket (net.Socket)
	 * @param onData Function that expects clientSocket (net.Socket) and data
	 * @param onError Function that expects clientSocket (net.Socket) and data
	 * @private
	 */
	_connect({onConnect, onData, onError}) {
		this.clientSocket = createConnection(path.join(this._getBuildServerDirectory(), BuildServerConfiguration.SOCKET))
			.on("connect", () => onConnect(this.clientSocket))
			.on("error", (data) => onError(this.clientSocket, data))
			.on("data", (data) => onData(this.clientSocket, data))
	}

	/**
	 * Starts a BuildServer in a new process. Sets this.buildServerHandle.
	 * @param config Instance of BuildServerConfig
	 * @returns {Promise<void>}
	 */
	async _start(config) {
		this.state = STATE_SERVER_START_PENDING

		this.buildServerHandle = await createBuildServer(
			config,
			config.autoRebuild ? false : true,
		)
	}
}