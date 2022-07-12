import http from "http"
import https from "https"

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

	executeRequest(url: string, opts: ClientRequestOptions): Promise<http.IncomingMessage> {
		return new Promise<http.IncomingMessage>((resolve, reject) => {
			this.request(url, opts)
				.on("response", resolve)
				.on("error", reject)
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