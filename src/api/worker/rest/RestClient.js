// @flow
import {assertWorkerOrNode, getHttpOrigin} from "../../Env"
import {ConnectionError, handleRestError} from "../../common/error/RestError"
import type {HttpMethodEnum, MediaTypeEnum} from "../../common/EntityFunctions"
import {HttpMethod, MediaType} from "../../common/EntityFunctions"
import {uint8ArrayToArrayBuffer} from "../../common/utils/Encoding"

assertWorkerOrNode()

export class RestClient {
	url: string;

	constructor() {
		this.url = getHttpOrigin()
	}

	request(path: string, method: HttpMethodEnum, queryParams: Params, headers: Params, body: ?string | ?Uint8Array, responseType: ?MediaTypeEnum, progressListener: ?ProgressListener): Promise<any> {
		return new Promise((resolve, reject) => {
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
			xhr.responseType = responseType === MediaType.Json ? "text" : 'arraybuffer'

			let timeout = setTimeout(() => xhr.abort(), env.timeout)
			xhr.onload = () => { // XMLHttpRequestProgressEvent, but not needed
				clearTimeout(timeout)
				if (xhr.status === 200 || method === HttpMethod.POST && xhr.status === 201) {
					if (responseType === MediaType.Json) {
						resolve(xhr.response)
					} else if (responseType === MediaType.Binary) {
						resolve(new Uint8Array(xhr.response))
					} else {
						resolve()
					}
				} else {
					let retryAfter = xhr.getResponseHeader("Retry-After")
					if (xhr.status == 429 && retryAfter) {
						setTimeout(() => {
							resolve(this.request(path, method, queryParams, headers, body, responseType, progressListener))
						}, Number(retryAfter) * 1000)
						console.log(`rate limited request to ${path}, retry after ${retryAfter}s`)
					} else {
						console.log("failed request", method, url, headers, body)
						reject(handleRestError(xhr.status, `${xhr.statusText} | ${method} ${path}`))
					}
				}
			}
			xhr.onerror = function () {
				clearTimeout(timeout)
				console.log("failed to request", method, url, headers, body)
				reject(handleRestError(xhr.status, `${xhr.statusText} | ${method} ${path}`))
			}

			try {
				xhr.upload.onprogress = function (pe: any) {
					clearTimeout(timeout)
					timeout = setTimeout(() => xhr.abort(), env.timeout)
					if (progressListener != null && pe.lengthComputable) { // see https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent
						progressListener.upload(1 / pe.total * pe.loaded)
					}
				}
			} catch (e) {
				// IE <= 11 throw an error when upload.onprogress is used from workers; see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/107521/
				clearTimeout(e)
			}
			xhr.onprogress = function (pe: any) {
				clearTimeout(timeout)
				timeout = setTimeout(() => xhr.abort(), env.timeout)
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

export function addParamsToUrl(url: string, urlParams: Params) {
	if (urlParams) {
		url += "?"
		for (var key in urlParams) {
			url += key + "=" + urlParams[key] + "&"
		}
		url = url.substring(0, url.length - 1)
	}
	return url
}

export const restClient: RestClient = new RestClient()