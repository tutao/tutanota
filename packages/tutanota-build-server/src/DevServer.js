import express from "express"
import expressws from "express-ws"
import http from "http"

export class DevServer {

	constructor(webRoot, spaRedirect, port, log) {
		this.webRoot = webRoot
		this.spaRedirect = spaRedirect
		this.port = port
		this.log = log
		this.webSockets = []
	}

	start() {
		if (!this.webRoot) {
			this.log("No root path defined, not starting devServer")
			return
		}

		if (!this.port) {
			this.log("No dev server port defined, not starting devServer")
			return
		}
		const app = express()
		const sockets = []

		this.httpServer = http.createServer(app)
		expressws(app, this.httpServer)

		this._setupHMR(app, sockets)

		// do not change the order of these two lines
		app.use(express.static(this.webRoot))
		this._setupSpaRedirect(app)

		this.httpServer.addListener("error", err => this.log("Web server error:", err))
		this.httpServer.addListener("listening", () => this.log(`Web Server is serving files from "${this.webRoot}" on localhost:${this.port}`))
		this.httpServer.listen(this.port)
	}

	stop() {
		this.webSockets = []
		if (this.httpServer) {
			this.httpServer.close()
		}
	}

	/**
	 * Uses HMR to push updated bundles to the DevServer.
	 * @param updates Updated bundles (as produced by rollup/nollup).
	 */
	updateBundles(updates) {
		this._messageWebSockets({status: "prepare"})
		for (const update of updates) {
			this._messageWebSockets({status: "ready"})
			this._messageWebSockets({changes: update.changes})
		}
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
}

