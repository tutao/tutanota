// @flow

import net from 'net'
import {app} from 'electron'
import {neverNull} from "../api/common/utils/Utils"

const SOCKET_PATH = '/tmp/tutadb.sock'

/**
 * this is used to control our administration tool
 */
export class Socketeer {
	_server: ?net.Server;
	_connection: ?net.Socket;
	_delayHandler: typeof setTimeout

	constructor(delayHandler: typeof setTimeout = setTimeout) {
		this._delayHandler = delayHandler

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
				this._delayHandler(() => {
					neverNull(this._server).close()
					neverNull(this._server).listen(SOCKET_PATH)
				}, 1000)
			}
		}).on('close', () => {
			this._server = null
		})

		this._server.listen(SOCKET_PATH)
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
			.createConnection(SOCKET_PATH)
			.on('connect', () => {
				console.log('socket connected')
			})
			.on('close', hadError => {
				if (hadError) {
					this._tryReconnect(ondata)
				}
			})
			.on('end', () => {
				console.log("socket disconnected")
				this._tryReconnect(ondata)
			})
			.on('error', e => {
				if (e.code !== 'ENOENT') {
					console.error("Unexpected Socket Error:", e)
				}
			})
			.on('data', ondata)
	}

	_tryReconnect(ondata: (string)=>void): void {
		this._connection = null
		this._delayHandler(() => {
			this.startClient(ondata)
		}, 1000)
	}
}
