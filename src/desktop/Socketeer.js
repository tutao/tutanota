// @flow

import type {App} from 'electron'
import type {WindowManager} from "./DesktopWindowManager"
import type {IPC} from "./IPC"
import {isMailAddress} from "../misc/FormatValidator"
import {log} from "./DesktopLog";
import type {TimeoutSetter} from "@tutao/tutanota-utils"

const SOCKET_PATH = '/tmp/tutadb.sock'

type net = $Exports<"net">

/**
 * this is used to control our administration tool
 */
export class Socketeer {
	_server: ?net$Server;
	_connection: ?net$Socket;
	_delayHandler: TimeoutSetter
	_net: net

	constructor(net: net, app: App, delayHandler: TimeoutSetter = setTimeout) {
		this._net = net
		this._delayHandler = delayHandler

		app.on('will-quit', () => {
			if (this._server || this._connection) {
				if (this._connection) {
					this._connection.end()
				}
				if (this._server) {
					this._server.close()
				}
			}
		})
	}

	attach(wm: WindowManager, ipc: IPC) {
		this.startClient(async msg => {
			const mailAddress = JSON.parse(msg).mailAddress
			if (typeof mailAddress === 'string' && isMailAddress(mailAddress, false)) {
				const targetWindowId = (await wm.getLastFocused(false)).id
				ipc.sendRequest(targetWindowId, 'openCustomer', [mailAddress])
			}
		})
	}

	startServer() {
		log.debug('opening admin socket')
		if (this._server) {
			return
		}
		const server = this._server = this._net.createServer(c => {
			log.debug("got connection")
			this._connection = c
			c.on('data', () => {
				console.warn("Data was pushed through admin socket, aborting connection")
				c.destroy()
			}).on('end', () => {
				this._connection = null
			})
		}).on("listening", () => {
			log.debug("Socketeer: server is listening")
		}).on('error', e => {
			log.warn("Socketeer: server error", e)
			if (e.code === 'EADDRINUSE') {
				this._delayHandler(() => {
					try {
						server.close()
						server.listen(SOCKET_PATH)
					} catch (e) {
						log.error("Socketeer: restart error: ", e)
					}
				}, 1000)
			}
		}).on('close', () => {
			log.debug("Socketeer: server is closed")
			this._server = null
		})

		this._server.listen(SOCKET_PATH)
	}

	sendSocketMessage(msg: any) {
		if (this._connection) {
			this._connection.write(JSON.stringify(msg), 'utf8')
		}
	}

	startClient(ondata: (string)=>mixed) {
		if (this._connection) {
			return
		}
		this._connection = this._net
		                       .createConnection(SOCKET_PATH)
		                       .on('connect', () => {
			                       log.debug('socket connected')
		                       })
		                       .on('close', hadError => {
			                       if (hadError) {
				                       this._tryReconnect(ondata)
			                       }
		                       })
		                       .on('end', () => {
			                       log.debug("socket disconnected")
			                       this._tryReconnect(ondata)
		                       })
		                       .on('error', e => {
			                       if (e.code !== 'ENOENT') {
				                       console.error("Unexpected Socket Error:", e)
			                       }
		                       })
		                       .on('data', ondata)
	}

	_tryReconnect(ondata: (string)=>mixed): void {
		this._connection = null
		this._delayHandler(() => {
			this.startClient(ondata)
		}, 1000)
	}
}
