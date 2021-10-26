// @flow
import http from 'http'
import https from 'https'
import {downcast} from "@tutao/tutanota-utils"

export type DesktopClientRequest = http$ClientRequest<*>

/**
 * Manually re-doing http$requestOptions because built-in definition is crap.
 */
export type ClientRequestOptions = {
	auth?: string,
	defaultPort?: number,
	family?: number,
	headers?: {[key: string]: string, ...},
	host?: string,
	hostname?: string,
	localAddress?: string,
	method?: string,
	path?: string,
	port?: number,
	protocol?: string,
	setHost?: boolean,
	socketPath?: string,
	timeout?: number,
}

export class DesktopNetworkClient {
	request(url: string, opts: ClientRequestOptions): DesktopClientRequest {
		// It's impossible to play smart here, you can't satisfy type constraints with all
		// the Object.assign() in the world.
		if (url.startsWith("https")) {
			return https.request(url, downcast(opts))
		} else {
			return http.request(url, downcast(opts))
		}
	}
}