import {createConnection} from "net"
import os from "os"
import path from "path"
import {createBuildServer} from "./BuildServerFactory.js"
import {BuildServerStatus, BuildServerCommand, BuildServerConfiguration} from "./BuildServer.js"

const directory = getBuildServerDirectory()
const socketPath = path.join(directory, BuildServerConfiguration.SOCKET)
const waitTimeinMs = 600
const STATE_SERVER_START_PENDING = "SERVER_START_PENDING"
const STATE_CONNECTED = "CONNECTED"
const STATE_DISCONNECTED = "DISCONNECTED"

/**
 * Returns path to build server directory. Our convention is to use a directory in the os-specific tempdir and create a sub directory name
 * as the current user. This prevents collisions and permission issues when building with multiple users on one system.
 * @returns {string} Absolute path to build server directory
 */
function getBuildServerDirectory() {
	const tempDir = os.tmpdir()
	const buildServerBaseDir = path.join(tempDir, 'tutanota-build-server')
	const userName = os.userInfo().username
	return path.join(buildServerBaseDir, userName)
}

/**
 * This class provides a convenient interface to BuildServer.js taking care of bootstrapping a BuildServer instance in a
 * dedicated, detached process and inter-process communication between the client and BuildServer.
 * See @buildWithServer method for details.
 */
export class BuildServerClient {
	constructor() {
		this.state = STATE_DISCONNECTED
		this.buildServerHandle = null
	}

	/**
	 * Start a build server, connect and wait for the build to finish.
	 *
	 * @param forceRestart boolean, whether to restart the server
	 * @param builder absolute path to the builder which will be used by the server
	 * @param watchFolders absolute paths to folders to watch for changes
	 * @param devServerPort if set, a dev server will be listening on this port
	 * @param webRoot absolute path to directory to be used as webRoot by devServer
	 * @param spaRedirect boolean, if true the devServer will redirect any requests to '/?r=<requestedURL>'
	 * @param buildOpts these will be passed through to the builder's build() method - ignored by BuildServer and BuildServerClient
	 * @return {Promise<void>}
	 */
	async buildWithServer({forceRestart, builder, watchFolders, devServerPort, webRoot, spaRedirect, buildOpts}) {
		if (forceRestart) {
			await this._restartServer({builder, watchFolders, devServerPort, webRoot, spaRedirect})
		}
		let connectionAttempts = 0
		let lastError = null
		while (connectionAttempts < 2 && this.state !== STATE_CONNECTED) {
			await new Promise(r => setTimeout(r, waitTimeinMs));
			try {
				await this._connectAndBuild({
						builder,
						watchFolders,
						devServerPort,
						webRoot,
						spaRedirect,
						buildOpts
					}
				)
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
	 * Updates the client's state to reflect a connection has been established.
	 * @private
	 */
	_onConnectionEstablished() {
		this.state = STATE_CONNECTED
		/* If the buildserver process was started by the current client process, we should have a handle to it.
		*  Initially we connect the client's and server's StdIO so that we can receive and print any server error messages
		*  during server bootstrap.Once a socket connection has been established between server and client, the server has an
		*  alternative way of sending messages to the client, so we can disconnect StdIO at this point.
		*/
		if (this.buildServerHandle) {
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
	async _connectAndBuild({builder, watchFolders, devServerPort, webRoot, spaRedirect, buildOpts}) {
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
						await this._start({
								builder,
								watchFolders,
								devServerPort,
								webRoot,
								spaRedirect,
							}
						)
						this.state = STATE_SERVER_START_PENDING
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
		Note: It is not quite clear to me how node's socket functions work and if this code handles all possible cases.
		The code here assumes that multiple writes to the socket by the server can be received at once, but
		that no message by the server will be split across multiple calls of onData().
		 */
		const dataAsString = data.toString()
		const messagesAsJSON = dataAsString.split(BuildServerConfiguration.MESSAGE_SEPERATOR)
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
	 * @param builder
	 * @param watchFolders
	 * @param devServerPort
	 * @param webRoot
	 * @param spaRedirect
	 * @returns {Promise<void>}
	 * @private
	 */
	async _restartServer({builder, watchFolders, devServerPort, webRoot, spaRedirect}) {
		console.log("Called with forceRestart")
		await new Promise((resolve, reject) => {
			this._connect({
					onConnect: (socket) => {
						console.log("Shutting down build server")
						const message = JSON.stringify({command: BuildServerCommand.SHUTDOWN})
						socket.write(message)
						resolve()
					},
					onData: (socket, data) => {},
					onError: async (socket, data) => {
						console.log("No build server running, starting a new one")
						await this._start({
								builder,
								watchFolders,
								devServerPort,
								webRoot,
								spaRedirect
							}
						)
						this.state = STATE_SERVER_START_PENDING
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
		const clientSocket = createConnection(socketPath)
			.on("connect", () => onConnect(clientSocket))
			.on("error", (data) => onError(clientSocket, data))
			.on("data", (data) => onData(clientSocket, data))
	}

	/**
	 * Starts a BuildServer in a new process. Sets this.buildServerHandle.
	 * @param builder
	 * @param watchFolders
	 * @param devServerPort
	 * @param webRoot
	 * @param spaRedirect
	 * @returns {Promise<void>}
	 */
	async _start({builder, watchFolders, devServerPort, webRoot, spaRedirect}) {
		this.buildServerHandle = await createBuildServer({
			builder,
			watchFolders,
			directory,
			detached: true,
			devServerPort,
			webRoot,
			spaRedirect,
		})
	}
}