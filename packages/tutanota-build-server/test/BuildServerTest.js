import {BuildServer, BuildServerCommand, BuildServerConfiguration, BuildServerStatus} from "../index.js"
import o from "ospec"
import os from "os"
import path from "path"
import fs from "fs"
import {createConnection} from "net"
import http from "http"

const directoryPrefix = path.join(os.tmpdir(), 'tutanota-build-tools-test-')

/** using a higher port that is not associated with any known service, SHOULD make it unlikely the port we try to use
 is already bound to another process and hence prevent the tests from randomly failing ...
 **/
const devServerPort = 43124
const builderPath = path.resolve('test/DummyBuilder.js')
const preserveLogs = true
const directory = fs.mkdtempSync(directoryPrefix)
const watchFolders = path.resolve('test')
const webRoot = path.resolve('test/dummy_webroot/')
const spaRedirect = true

const logFile = path.join(directory, BuildServerConfiguration.LOGFILE)
const socketPath = path.join(directory, BuildServerConfiguration.SOCKET)

const BUILD_STATUS_WAITING = "waiting"
const BUILD_STATUS_SUCCESS = "success"
const BUILD_STATUS_ERROR = "error"


o.spec("BuildServer", function () {
	let buildServer = null
	let clientSocket = null
	let buildStatus = BUILD_STATUS_WAITING

	o.before(async function () {
		buildServer = new BuildServer({
			devServerPort,
			builderPath,
			preserveLogs,
			directory,
			watchFolders,
			webRoot,
			spaRedirect,
		})
		await buildServer.start()
		clientSocket = await connectToServer((data) => {
			const dataAsString = data.toString()
			const messagesAsJSON = dataAsString.split(BuildServerConfiguration.MESSAGE_SEPERATOR)
			messagesAsJSON.forEach((message) => {
				if (message.length > 1) {
					const {status} = JSON.parse(message)
					if (status === BuildServerStatus.OK) {
						buildStatus = BUILD_STATUS_SUCCESS
					} else if (status === BuildServerStatus.ERROR) {
						buildStatus === BUILD_STATUS_ERROR
					}
				}
			})
		})
	})

	o("Server should create required files", async function () {
		o(fs.existsSync(directory)).equals(true)
		o(fs.existsSync(logFile)).equals(true)
		o(fs.existsSync(socketPath)).equals(true)
	})

	o("Server should start a devServer", function () {
		return new Promise((resolve, reject) => {
			const request = http.request({
				hostname: 'localhost',
				port: devServerPort,
				path: '/',
				method: 'GET'
			}, (res) => {
				o(res.statusCode).equals(200)
				res.on('error', (e) => {
					reject()
				})
				res.on('data', (data) => {
					resolve()
				})
			})
			request.end()
		})
	})

	o("Server should do a SPA redirect", function () {
		const location = '/somePath/someSubPath'
		return new Promise((resolve, reject) => {
			const request = http.request({
				hostname: 'localhost',
				port: devServerPort,
				path: location,
				method: 'GET'
			}, (res) => {
				o(res.statusCode).equals(302)
				o(res.headers.location).equals("/?r=" + location)
				res.on('error', (e) => {
					reject()
				})
				res.on('data', (data) => {
					resolve()
				})
			})
			request.end()
		})
	})

	o("Server should execute build", async function () {
		buildStatus = BUILD_STATUS_WAITING
		const data = JSON.stringify(
			{
				command: BuildServerCommand.BUILD,
				options: {success: true}
			}
		)

		clientSocket.write(data)

		while (buildStatus === BUILD_STATUS_WAITING) {
			await new Promise(r => setTimeout(r, 50));
		}
		o(buildStatus).equals(BUILD_STATUS_SUCCESS)
	})

	o("Server should shutdown gracefully", async function () {
		if (clientSocket) {
			clientSocket.end()
			clientSocket.destroy()
		}

		await buildServer.stop()

		o(fs.existsSync(directory)).equals(true)
		o(fs.existsSync(logFile)).equals(true)
		o(fs.existsSync(socketPath)).equals(false)
	})
})

async function connectToServer(onData) {
	return new Promise((resolve, reject) => {
		const clientSocket = createConnection(socketPath)
			.on("data", onData)
			.on("error", function (data) {
				reject(new Error(data.toString()))
			})
			.on("connect", function (data) {
				resolve(clientSocket)
			})
	})
}