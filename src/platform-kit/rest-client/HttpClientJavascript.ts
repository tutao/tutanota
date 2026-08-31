import { HttpMethod, MediaType, ProgressListener, RestBinaryBody, RestBody, RestTextBody } from "@tutao/rest-client/types"
import { isNotNull, newPromise, uint8ArrayToArrayBuffer } from "@tutao/utils"
import { once } from "../utils/memoized"
import { CancelledError, EnvProvider } from "@tutao/app-env"
import { TypeChecks } from "../app-env/TsTypeChecks"
import { ConnectionError, XhrError } from "@tutao/rest-client/error"
import { isNull } from "../utils/Utils"
import { HttpClient } from "./HttpClient"

export class HttpResponse {
	constructor(
		public readonly status: number,
		public readonly statusText: string,
		public readonly body: RestBody | null,
		readonly responseHeaders: Map<string, string>,
	) {}

	getResponseHeader(name: string): string | null {
		return this.responseHeaders.get(name.toLowerCase()) ?? null
	}
}

const TAG = "[HttpClient]"

/**
 * Uses XmlHttpRequest as there is still no support for tracking
 * upload progress with fetch (see https://stackoverflow.com/a/69400632)
 */
export class HttpClientJavascript implements HttpClient {
	private lastRequestId: number
	constructor() {
		this.lastRequestId = 0
	}
	async request(
		url: string,
		method: HttpMethod,
		body: RestBody | null,
		headers: Dict,
		responseType: MediaType | null,
		timeout: number,
		abortSignal: AbortSignal | null,
		noCORS: boolean | null,
		uploadProgressListener: ProgressListener | null,
		downloadProgressListener: ProgressListener | null,
	): Promise<HttpResponse> {
		// @ts-ignore
		const debug: boolean = TypeChecks.hasProperty("self") && self.debug
		const verbose: boolean = EnvProvider.isWorker() && debug
		return newPromise((resolve, _reject) => {
			// Make sure to call reject() only once (e.g. if both xhr.onabort and xhr.upload.onabort fire) because
			// it is illegal to call resolve/reject more than once
			const reject = once(_reject)
			const id = ++this.lastRequestId

			const xhr = new XMLHttpRequest()
			xhr.open(method, url.toString())

			for (const i in headers) {
				xhr.setRequestHeader(i, headers[i])
			}

			xhr.responseType = responseType === MediaType.Json || responseType === MediaType.Text ? "text" : "arraybuffer"

			// We time out reqeuests if there is no progress for some time
			let requestTimeoutTimeoutID: TimeoutID | null = null
			const abortOnTimeout = (): void => {
				console.log(TAG, `${id}: ${String(new Date())} aborting ${requestTimeoutTimeoutID}`)
				xhr.abort()
			}
			const restartTimeoutTimer = (): void => {
				if (!usingTimeoutAbort()) {
					return
				}

				if (requestTimeoutTimeoutID != null) {
					clearTimeout(requestTimeoutTimeoutID)
				}

				requestTimeoutTimeoutID = setTimeout(abortOnTimeout, timeout)
			}
			const cancelTimeoutTimer = (): void => {
				if (requestTimeoutTimeoutID != null) clearTimeout(requestTimeoutTimeoutID)
			}

			restartTimeoutTimer()

			if (isNotNull(abortSignal)) {
				abortSignal.addEventListener(
					"abort",
					() => {
						xhr.abort()
					},
					{ once: true },
				)
			}

			if (verbose) {
				console.log(TAG, `${id}: set initial timeout ${String(requestTimeoutTimeoutID)} of ${EnvProvider.get().getTimeOutValue()}`)
			}

			xhr.onload = async (): Promise<void> => {
				try {
					// XMLHttpRequestProgressEvent, but not needed
					if (verbose) {
						console.log(TAG, `${id}: ${String(new Date())} finished request. Clearing Timeout ${String(requestTimeoutTimeoutID)}.`)
					}

					cancelTimeoutTimer()

					let responseBody: RestBody | null = null
					let responseHeaders = parseResponseHeaders(xhr)
					if (xhr.status === 200 || (method === HttpMethod.POST && xhr.status === 201)) {
						if (responseType === MediaType.Json || responseType === MediaType.Text) {
							responseBody = new RestTextBody(xhr.response)
						} else if (responseType === MediaType.Binary) {
							responseBody = new RestBinaryBody(new Uint8Array(xhr.response))
						}
					}
					resolve(new HttpResponse(xhr.status, xhr.statusText, responseBody, responseHeaders))
				} catch (e) {
					const msg = "unexpected error in RestClient::onload handler: "
					console.error(msg, e)
					reject(msg + e.stack)
				}
			}

			xhr.onerror = (): void => {
				try {
					cancelTimeoutTimer()
					reject(new XhrError(method, url.toString(), new HttpResponse(xhr.status, xhr.statusText, null, parseResponseHeaders(xhr))))
				} catch (e) {
					const msg = "unexpected error in RestClient::onerror handler: "
					console.error(msg, e)
					reject(msg + e.stack)
				}
			}

			// don't add an EventListener for non-CORS requests, otherwise it would not meet the 'CORS-Preflight simple request' requirements
			if (isNull(noCORS) || !noCORS) {
				xhr.upload.onprogress = (pe: ProgressEvent): void => {
					if (verbose) {
						console.log(TAG, `${id}: ${String(new Date())} upload progress. Clearing Timeout ${String(requestTimeoutTimeoutID)}`, pe)
					}

					restartTimeoutTimer()

					if (verbose) {
						console.log(TAG, `${id}: set new timeout ${String(requestTimeoutTimeoutID)} of ${EnvProvider.get().getTimeOutValue()}`)
					}

					if (uploadProgressListener != null && pe.lengthComputable) {
						// see https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent
						uploadProgressListener.update((1 / pe.total) * pe.loaded, pe.loaded)
					}
				}

				xhr.upload.ontimeout = (e): void => {
					if (verbose) {
						console.log(TAG, `${id}: ${String(new Date())} upload timeout. calling error handler.`, e)
					}
					xhr.onerror?.(e)
				}

				xhr.upload.onerror = (e): void => {
					if (verbose) {
						console.log(TAG, `${id}: ${String(new Date())} upload error. calling error handler.`, e)
					}
					xhr.onerror?.(e)
				}

				xhr.upload.onabort = (e): void => {
					cancelTimeoutTimer()
					if (abortSignal?.aborted ?? false) {
						reject(new CancelledError(`upload has been aborted ${method} ${url}`))
					} else {
						if (verbose) {
							console.log(TAG, `${id}: ${String(new Date())} upload aborted. calling error handler.`, e)
						}
						reject(new ConnectionError(`Reached timeout of ${EnvProvider.get().getTimeOutValue()}ms ${xhr.statusText} | ${method} ${url}`))
					}
				}
			}

			xhr.onprogress = (pe: ProgressEvent): void => {
				if (verbose) {
					console.log(TAG, `${id}: ${String(new Date())} download progress. Clearing Timeout ${String(requestTimeoutTimeoutID)}`, pe)
				}

				restartTimeoutTimer()

				if (verbose) {
					console.log(TAG, `${id}: set new timeout ${String(requestTimeoutTimeoutID)} of ${EnvProvider.get().getTimeOutValue()}`)
				}

				if (downloadProgressListener != null && pe.lengthComputable) {
					// see https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent
					downloadProgressListener.update((1 / pe.total) * pe.loaded, pe.loaded)
				}
			}

			xhr.onabort = (): void => {
				cancelTimeoutTimer()
				if (abortSignal?.aborted ?? false) {
					reject(new CancelledError(`Request canceled | ${method} ${url}`))
				} else {
					reject(new ConnectionError(`Reached timeout of ${EnvProvider.get().getTimeOutValue()}ms ${xhr.statusText} | ${method} ${url}`))
				}
			}

			if (body instanceof RestBinaryBody) {
				xhr.send(uint8ArrayToArrayBuffer(body.payload))
			} else if (body instanceof RestTextBody) {
				xhr.send(body.payload)
			} else {
				xhr.send()
			}
		})
	}
}

/** We only need to track timeout directly here on some platforms. Other platforms do it inside their network driver. */
function usingTimeoutAbort(): boolean {
	return EnvProvider.get().isWebClient() || EnvProvider.get().isAndroidApp()
}

function parseResponseHeaders(xhr: XMLHttpRequest): Map<string, string> {
	const headers = new Map<string, string>()
	const rawHeaders = xhr.getAllResponseHeaders().trim()

	for (const line of rawHeaders.split(/[\r\n]+/)) {
		const index = line.indexOf(":")

		if (index === -1) {
			continue
		}

		const key = line.slice(0, index).trim().toLowerCase()
		const value = line.slice(index + 1).trim()
		headers.set(key, value)
	}

	return headers
}
