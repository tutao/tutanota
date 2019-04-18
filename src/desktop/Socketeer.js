// @flow

import net from 'net'
import {app} from 'electron'
import {neverNull} from "../api/common/utils/Utils"

const socketPath = '/tmp/tutadb.sock'

/**
 * this is used to control our administration tool
 */
export class Socketeer {
	_server: ?net.Server;
	_connection: ?net.Socket;

	constructor() {
		app.on('will-quit', () => {
			if (this._server || this._connection) {
				console.log("cleaning up socket...")
				if (this._connection) {
					this._connection.end()
				}
				if (this._server) {
					this._server.close()
				}
			}
		})
	}

	startServer() {
		console.log('opening admin socket')
		if (this._server) {
			return
		}
		this._server = net.createServer(c => {
			console.log("got connection")
			this._connection = c
			c.on('data', () => {
				console.warn("Data was pushed through admin socket, aborting connection")
				c.destroy()
			}).on('end', () => {
				this._connection = null
			})
		}).on('error', e => {
			if (e.code === 'EADDRINUSE' && this._server) {
				console.log('Socket in use, retrying...')
				setTimeout(() => {
					neverNull(this._server).close()
					neverNull(this._server).listen(socketPath)
				}, 1000)
			}
		}).on('close', () => {
			this._server = null
		})

		this._server.listen(socketPath)
	}

	sendSocketMessage(msg: any) {
		if (this._connection) {
			this._connection.write(JSON.stringify(msg), 'utf8')
		}
	}

	startClient(ondata: (string)=>void) {
		if (this._connection) {
			return
		}
		this._connection = net
			.createConnection(socketPath)
			.on('connect', () => {
				console.log('socket connected')
			}).on('close', hadError => {
				if (hadError) { // try reconnecting
					setTimeout(() => {
						this._connection = null
						this.startClient(ondata)
					}, 1000)
				}
			}).on('end', () => {
				console.log("socket disconnected")
				this._connection = null
				setTimeout(() => {
					this.startClient(ondata)
				}, 1000)
			}).on('error', e => {
				if (e.code !== 'ENOENT') {
					console.error("Unexpected Socket Error:", e)
				}
			}).on('data', ondata)
	}
}
