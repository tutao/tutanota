// @flow
import http from 'http'
import https from 'https'

export class DesktopNetworkClient {

	/**
	 * http can't do https, https can't do http. saves typing while testing locally.
	 */
	getProtocolModule(url: string): typeof http | typeof https {
		return url.startsWith('http:') ? http : https
	}

	request(url: string, opts: any): ClientRequest {
		return this.getProtocolModule(url).request(url, opts)
	}
}