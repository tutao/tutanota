import http from "node:http"
import https from "node:https"
import net from "node:net"
import tls from "node:tls"
import type { Duplex } from "node:stream"
import { ConnectionError } from "@tutao/rest-client/error"
import { log } from "../DesktopLog.js"
import type { ReadStream } from "node:fs"
import { newPromise } from "@tutao/utils"
import { connectWithHappyEyeballs } from "./HappyEyeballsConnector.js"

const TAG = "[DesktopNetworkClient]"

class HappyEyeballsHttpsAgent extends https.Agent {
	constructor() {
		// Preserve https.globalAgent's pooling policy. Its five-second socket
		// timeout is deliberately omitted so the connector owns establishment's
		// single 20-second deadline.
		super({ keepAlive: true, scheduling: "lifo" })
	}

	override createConnection(options: https.RequestOptions, callback?: (error: Error | null, stream: Duplex) => void): Duplex | null | undefined {
		const hostname = options.hostname ?? options.host
		if (callback == null || hostname == null || options.socketPath != null) {
			return super.createConnection(options, callback)
		}
		// Node omits the stream when reporting an asynchronous connection error,
		// although @types/node declares the callback's stream as always present.
		const finishConnection = callback as (error: Error | null, stream?: Duplex) => void

		const port = Number(options.port ?? 443)
		const servername = options.servername ?? (net.isIP(hostname) === 0 ? hostname : undefined)
		void connectWithHappyEyeballs({
			hostname,
			port,
			family: options.family,
			localAddress: options.localAddress,
			readyEvent: "secureConnect",
			createConnection: (candidate) => {
				const socket = super.createConnection({
					...options,
					host: candidate.address,
					hostname: candidate.address,
					family: candidate.family,
					servername,
				})
				if (!(socket instanceof tls.TLSSocket)) {
					socket?.destroy()
					throw new TypeError("HTTPS agent did not create a TLS socket")
				}
				socket.setNoDelay(true)
				return socket
			},
		}).then(
			(socket) => finishConnection(null, socket),
			(error) => finishConnection(error),
		)

		return undefined
	}
}

const httpsAgent = new HappyEyeballsHttpsAgent()

/**
 * Manually re-doing http$requestOptions because built-in definition is crap.
 */
export type ClientRequestOptions = {
	auth?: string
	defaultPort?: number
	family?: number
	headers?: Record<string, string>
	host?: string
	hostname?: string
	localAddress?: string
	method?: string
	path?: string
	port?: number
	protocol?: string
	setHost?: boolean
	socketPath?: string
	timeout?: number
}

export class DesktopNetworkClient {
	request(url: URL, opts: ClientRequestOptions): http.ClientRequest {
		if (url.protocol === "https:") {
			return https.request(url, { ...opts, agent: httpsAgent })
		} else {
			// Production SSE and POST endpoints use HTTPS. Preserve Node's default
			// behavior for the plain-HTTP path instead of broadening this adapter.
			return http.request(url, opts)
		}
	}

	/**
	 * resolves when we get the first part of the response
	 * rejects on errors that happen before that point
	 *
	 * later errors must be handled on the response onerror handler
	 */
	executeRequest(url: URL, opts: ClientRequestOptions, uploadStream?: ReadStream): Promise<http.IncomingMessage> {
		return newPromise<http.IncomingMessage>((resolve, reject) => {
			let resp: http.IncomingMessage | null = null

			function onerror(e: Error) {
				log.debug(TAG, `aborting req due to err`, e)
				if (resp != null) {
					resp.destroy(e)
					return
				}
				reject(e)
			}

			const req: http.ClientRequest = this.request(url, opts)
				.on("response", (r) => {
					resp = r
					resolve(r)
				})
				.on("error", onerror)
				.on("timeout", () => {
					log.debug(TAG, "timed out req")
					req.destroy(new ConnectionError("timed out"))
				})
			if (uploadStream) {
				uploadStream.on("error", onerror).pipe(req)
			} else {
				req.end()
			}
		})
	}
}
