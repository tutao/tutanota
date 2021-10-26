// @flow
import {assertWorkerOrNode, getHttpOrigin, isAdminClient, isWorker} from "../../common/Env"
import {
	ConnectionError,
	handleRestError,
	PayloadTooLargeError,
	ServiceUnavailableError,
	TooManyRequestsError
} from "../../common/error/RestError"
import type {HttpMethodEnum, MediaTypeEnum} from "../../common/EntityFunctions"
import {HttpMethod, MediaType} from "../../common/EntityFunctions"
import {uint8ArrayToArrayBuffer} from "@tutao/tutanota-utils"
import {SuspensionHandler} from "../SuspensionHandler"
import {REQUEST_SIZE_LIMIT_DEFAULT, REQUEST_SIZE_LIMIT_MAP} from "../../common/TutanotaConstants"
import {assertNotNull, typedEntries} from "@tutao/tutanota-utils"

assertWorkerOrNode()

export class RestClient {
	url: string;
	id: number;
	_suspensionHandler: SuspensionHandler;
	// accurate to within a few seconds, depending on network speed
	_serverTimeOffsetMs: ?number

	constructor(suspensionHandler: SuspensionHandler) {
		this.url = getHttpOrigin()
		this.id = 0
		this._suspensionHandler = suspensionHandler
	}

	request(path: string, method: HttpMethodEnum, queryParams: Params, headers: Params, body: ?string | ?Uint8Array, responseType: ?MediaTypeEnum, progressListener: ?ProgressListener, baseUrl?: string): Promise<any> {
		this._checkRequestSizeLimit(path, method, body)
		if (this._suspensionHandler.isSuspended()) {
			return this._suspensionHandler.deferRequest(() => this.request(path, method, queryParams, headers, body, responseType, progressListener, baseUrl))
		} else {
			return new Promise((resolve, reject) => {
				this.id++
				if (method === HttpMethod.GET && typeof body === "string") {
					if (!queryParams) {
						queryParams = {}
					}
					queryParams['_body'] = body // get requests are not allowed to send a body. Therefore, we convert our body to a paramater
				}
				let url = addParamsToUrl(new URL((baseUrl ? baseUrl : this.url) + path), queryParams)
				var xhr = new XMLHttpRequest()
				xhr.open(method, url.toString())
				this._setHeaders(xhr, headers, body, responseType);
				xhr.responseType = (responseType === MediaType.Json || responseType === MediaType.Text) ? "text" : 'arraybuffer'

				const abortAfterTimeout = () => {
					let res = {
						timeoutId: ((0: any): TimeoutID),
						abortFunction: () => {
							console.log(`${this.id}: ${String(new Date())} aborting ` + String(res.timeoutId))
							xhr.abort()
						}
					}
					return res
				}
				let t = abortAfterTimeout()
				let timeout = setTimeout(t.abortFunction, env.timeout)
				t.timeoutId = timeout
				if (isWorker() && self.debug) {
					console.log(`${this.id}: set initial timeout ${String(timeout)} of ${env.timeout}`)
				}
				xhr.onload = () => { // XMLHttpRequestProgressEvent, but not needed
					if (isWorker() && self.debug) {
						console.log(`${this.id}: ${String(new Date())} finished request. Clearing Timeout ${String(timeout)}.`)
					}
					clearTimeout(timeout)
					this._saveServerTimeOffsetFromRequest(xhr)

					if (xhr.status === 200 || method === HttpMethod.POST && xhr.status === 201) {
						if (responseType === MediaType.Json || responseType === MediaType.Text) {
							resolve(xhr.response)
						} else if (responseType === MediaType.Binary) {
							resolve(new Uint8Array(xhr.response))
						} else {
							resolve()
						}
					} else {
						const suspensionTime = xhr.getResponseHeader("Retry-After") || xhr.getResponseHeader("Suspension-Time")
						if (isSuspensionResponse(xhr.status, suspensionTime)) {
							this._suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime))
							resolve(this._suspensionHandler.deferRequest(() => this.request(path, method, queryParams, headers, body, responseType, progressListener, baseUrl)))
						} else {
							console.log("failed request", method, url, xhr.status, xhr.statusText, headers, body)
							reject(handleRestError(xhr.status, `| ${method} ${path}`, xhr.getResponseHeader("Error-Id"), xhr.getResponseHeader("Precondition")))
						}
					}
				}
				xhr.onerror = function () {
					clearTimeout(timeout)
					console.log("failed to request", method, url, headers, body)
					reject(handleRestError(xhr.status, ` | ${method} ${path}`, xhr.getResponseHeader("Error-Id"), xhr.getResponseHeader("Precondition")))
				}

				try {
					xhr.upload.onprogress = (pe: any) => {
						if (isWorker() && self.debug) {
							console.log(`${this.id}: ${String(new Date())} upload progress. Clearing Timeout ${String(timeout)}`, pe)
						}
						clearTimeout(timeout)
						let t = abortAfterTimeout()
						timeout = setTimeout(t.abortFunction, env.timeout)
						t.timeoutId = timeout
						if (isWorker() && self.debug) {
							console.log(`${this.id}: set new timeout ${String(timeout)} of ${env.timeout}`)
						}
						if (progressListener != null && pe.lengthComputable) { // see https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent
							progressListener.upload(1 / pe.total * pe.loaded)
						}
					}
				} catch (e) {
					// IE <= 11 throw an error when upload.onprogress is used from workers; see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/107521/
					clearTimeout(e)
				}
				xhr.onprogress = (pe: any) => {
					if (isWorker() && self.debug) {
						console.log(`${this.id}: ${String(new Date())} download progress. Clearing Timeout ${String(timeout)}`, pe)
					}
					clearTimeout(timeout)
					let t = abortAfterTimeout()
					timeout = setTimeout(t.abortFunction, env.timeout)
					t.timeoutId = timeout
					if (isWorker() && self.debug) {
						console.log(`${this.id}: set new timeout ${String(timeout)} of ${env.timeout}`)
					}
					if (progressListener != null && pe.lengthComputable) { // see https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent
						progressListener.download(1 / pe.total * pe.loaded)
					}
				}

				xhr.onabort = function () {
					clearTimeout(timeout)
					reject(new ConnectionError(`Reached timeout of ${env.timeout}ms ${xhr.statusText} | ${method} ${path}`))
				}
				if (body instanceof Uint8Array) {
					xhr.send(uint8ArrayToArrayBuffer(body))
				} else {
					xhr.send(body)
				}
			})

		}
	}

	_saveServerTimeOffsetFromRequest(xhr: XMLHttpRequest) {

		// Dates sent in the `Date` field of HTTP headers follow the format specified by rfc7231
		// JavaScript's Date expects dates in the format specified by rfc2822
		// rfc7231 provides three options of formats, the preferred one being IMF-fixdate. This one is definitely
		// parseable by any rfc2822 compatible parser, since it is a strict subset (with no folding white space) of the
		// format of rfc5322, which is the same as rfc2822 accepting more folding white spaces.
		// Furthermore, there is no reason to expect the server to return any of the other two accepted formats, which
		// are obsolete and accepted only for backwards compatibility.
		const serverTimestamp = xhr.getResponseHeader("Date")
		if (serverTimestamp != null) { // check that serverTimestamp has been returned
			const serverTime = new Date(serverTimestamp).getTime()
			if (!isNaN(serverTime)) {
				const now = Date.now()
				this._serverTimeOffsetMs = serverTime - now
			}
		}
	}

	/**
	 * Get the time on the server based on the client time + the server time offset
	 * The server time offset is calculated based on the date field in the header returned from REST requests.
	 * will throw an error if offline or no rest requests have been made yet
	 */
	getServerTimestampMs(): number {
		const timeOffset = assertNotNull(this._serverTimeOffsetMs, "You can't get server time if no rest requests were made")
		return Date.now() + timeOffset
	}

	/**
	 * Checks if the request body is too large.
	 * Ignores the method because GET requests etc. should not exceed the limits neither.
	 * This is done to avoid making the request, because the server will return a PayloadTooLargeError anyway.
	 * */
	_checkRequestSizeLimit(path: string, method: HttpMethodEnum, body: ?string | ?Uint8Array) {
		if (isAdminClient()) {
			return
		}
		const limit = REQUEST_SIZE_LIMIT_MAP.get(path) || REQUEST_SIZE_LIMIT_DEFAULT
		if (body && body.length > limit) {
			throw new PayloadTooLargeError(`request body is too large. Path: ${path}, Method: ${method}, Body length: ${body.length}`)
		}
	}

	_setHeaders(xhr: XMLHttpRequest, headers: Params, body: ?string | ?Uint8Array, responseType: ?MediaTypeEnum) {
		headers['cv'] = env.versionNumber
		if (body instanceof Uint8Array) {
			headers["Content-Type"] = MediaType.Binary
		} else if (typeof body === 'string') {
			headers["Content-Type"] = MediaType.Json
		}
		if (responseType) {
			headers['Accept'] = responseType
		}
		for (var i in headers) {
			xhr.setRequestHeader(i, headers[i])
		}
	}
}


export function addParamsToUrl(url: URL, urlParams: Params): URL {
	if (urlParams) {
		for (const [key, value] of typedEntries(urlParams)) {
			url.searchParams.set(key, value)
		}
	}
	return url
}


export function isSuspensionResponse(statusCode: number, suspensionTimeNumberString: ?string): boolean {
	return Number(suspensionTimeNumberString) > 0
		&& (statusCode === TooManyRequestsError.CODE || statusCode === ServiceUnavailableError.CODE)
}