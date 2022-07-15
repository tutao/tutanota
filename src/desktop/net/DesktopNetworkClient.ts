import http from "http"
import https from "https"
import {ConnectionError} from "../../api/common/error/RestError.js"
import {log} from "../DesktopLog.js"

const TAG = "[DesktopNetworkClient]"

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
	request(url: string, opts: ClientRequestOptions): http.ClientRequest {
		return this.getModule(url).request(url, opts)
	}

	/**
	 * resolves when we get the first part of the response
	 * rejects on errors that happen before that point
	 *
	 * later errors must be handled on the response onerror handler
	 */
	executeRequest(url: string, opts: ClientRequestOptions): Promise<http.IncomingMessage> {
		return new Promise<http.IncomingMessage>((resolve, reject) => {
			let resp: http.IncomingMessage | null = null
			const req: http.ClientRequest = this.request(url, opts)
												.on("response", r => {
													resp = r
													resolve(r)
												})
												.on("error", (e) => {
													log.debug(TAG, `aborting req due to err`, e)
													if (resp != null) {
														resp.destroy(e)
														return
													}
													reject(e)
												})
												.on("timeout", () => {
													log.debug(TAG, "timed out req")
													req.destroy(new ConnectionError("timed out"))
												})
												.end()
		})
	}

	private getModule(url: string): typeof import("http") | typeof import("https") {
		if (url.startsWith("https")) {
			return https
		} else {
			return http
		}
	}
}