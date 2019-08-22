// @flow
import {assertWorkerOrNode, getHttpOrigin, isWorker} from "../../Env"
import {ConnectionError, handleRestError, ServiceUnavailableError, TooManyRequestsError} from "../../common/error/RestError"
import type {HttpMethodEnum, MediaTypeEnum} from "../../common/EntityFunctions"
import {HttpMethod, MediaType} from "../../common/EntityFunctions"
import {uint8ArrayToArrayBuffer} from "../../common/utils/Encoding"
import {SuspensionHandler} from "../SuspensionHandler"

assertWorkerOrNode()

export class RestClient {
	url: string;
	id: number;
	_suspensionHandler: SuspensionHandler;

	constructor(suspensionHandler: SuspensionHandler) {
		this.url = getHttpOrigin()
		this.id = 0
		this._suspensionHandler = suspensionHandler
	}

	request(path: string, method: HttpMethodEnum, queryParams: Params, headers: Params, body: ?string | ?Uint8Array, responseType: ?MediaTypeEnum, progressListener: ?ProgressListener): Promise<any> {
		if (this._suspensionHandler.isSuspended()) {
			return this._suspensionHandler.deferRequest(() => this.request(path, method, queryParams, headers, body, responseType, progressListener))
		} else {
			return new Promise((resolve, reject) => {
				this.id++
				if (method === HttpMethod.GET && typeof body === "string") {
					if (!queryParams) {
						queryParams = {}
					}
					queryParams['_body'] = encodeURIComponent(body) // get requests are not allowed to send a body. Therefore, we convert our body to a paramater
				}
				let url = addParamsToUrl(this.url + path, queryParams)
				var xhr = new XMLHttpRequest()
				xhr.open(method, url)
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
							resolve(this._suspensionHandler.deferRequest(() => this.request(path, method, queryParams, headers, body, responseType, progressListener)))
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

export function addParamsToUrl(url: string, urlParams: Params): string {
	if (urlParams) {
		url += "?"
		for (var key in urlParams) {
			url += key + "=" + urlParams[key] + "&"
		}
		url = url.substring(0, url.length - 1)
	}
	return url
}


export function isSuspensionResponse(statusCode: number, suspensionTimeNumberString: ?string): boolean {
	return Number(suspensionTimeNumberString) > 0
		&& (statusCode === TooManyRequestsError.CODE || statusCode === ServiceUnavailableError.CODE)
}