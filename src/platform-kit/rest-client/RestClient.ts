import { DomainConfig, EnvProvider } from "@tutao/app-env"
import { assertNotNull, isNotNull, Nullable, typedEntries } from "@tutao/utils"
import * as restSuspension from "./SuspensionHandler.js"
import { handleRestError, PayloadTooLargeError, SuspensionError, XhrError } from "./error.js"
import {
	HttpMethod,
	InterceptedResponse,
	MediaType,
	RestBinaryBody,
	RestBody,
	RestClientInterface,
	RestClientMiddleware,
	RestClientOptions,
	RestTextBody,
	SuspensionBehavior,
} from "./types"
import { TypeChecks } from "../app-env/TsTypeChecks"
import { isNull } from "../utils/Utils"
import { TsDate } from "../app-env/TranspileCompatibility"
import { HttpResponse } from "./HttpClientJavascript"
import { HttpClient } from "./HttpClient"

EnvProvider.assertWorkerOrNode()

const TAG = "[RestClient]"

// visible for testing
export const MAX_BLOB_SIZE_BYTES = 1024 * 1024 * 10
export const REQUEST_SIZE_LIMIT_DEFAULT = 1024 * 1024
export const IMPORT_MAIL_SERVICE_SIZE_LIMIT = 1024 * 1024 * 8
export const REQUEST_SIZE_LIMIT_MAP: Map<string, number> = new Map([
	["/rest/storage/blobservice", MAX_BLOB_SIZE_BYTES + 100], // overhead for encryption
	["/rest/tutanota/filedataservice", REQUEST_SIZE_LIMIT_DEFAULT * 25],
	["/rest/tutanota/draftservice", REQUEST_SIZE_LIMIT_DEFAULT * 5], // should be large enough
	["/rest/tutanota/importmailservice", IMPORT_MAIL_SERVICE_SIZE_LIMIT],
])
export const BLOB_REQUEST_TIMEOUT_MS = 5 * 60 * 1000 + 1000

export const DEFAULT_REST_CLIENT_OPTIONS: RestClientOptions = {
	body: null,
	responseType: null,
	uploadProgressListener: null,
	downloadProgressListener: null,
	baseUrl: null,
	headers: null,
	queryParams: null,
	noCORS: null,
	abortSignal: null,
	suspensionBehavior: SuspensionBehavior.Suspend,
}

/**
 * Allows REST communication with the server.
 * The RestClient observes upload/download progress and times
 * out in case no data is sent or received for a certain time.
 */
export class RestClient implements RestClientInterface {
	// accurate to within a few seconds, depending on network speed
	private serverTimeOffsetMs: number | null = null
	private responseMiddlewares: Array<RestClientMiddleware> = new Array<RestClientMiddleware>()

	constructor(
		private readonly suspensionHandler: restSuspension.SuspensionHandler,
		private readonly domainConfig: DomainConfig,
		private readonly clientPlatform: string,
		private readonly httpClient: HttpClient,
	) {}

	addMiddleware(middleware: RestClientMiddleware): RestClient {
		this.responseMiddlewares.push(middleware)
		return this
	}

	async request(path: string, method: HttpMethod, options: RestClientOptions): Promise<any | null> {
		this.checkRequestSizeLimit(path, method, options.body ?? null)

		if (this.suspensionHandler.isSuspended()) {
			return this.suspensionHandler.deferRequest(() => this.request(path, method, options))
		} else {
			const queryParams: Dict = options.queryParams ?? {}

			if (method === HttpMethod.GET && options.body instanceof RestTextBody) {
				queryParams["_body"] = options.body.payload // get requests are not allowed to send a body. Therefore, we convert our body to a parameter
			}

			if (isNotNull(options.noCORS) && options.noCORS) {
				queryParams["cv"] = EnvProvider.get().getVersionNumber()
				if (EnvProvider.get().networkDebuggingEnabled()) {
					queryParams["network-debugging"] = "enable-network-debugging"
				}
			}

			const origin = options.baseUrl ?? EnvProvider.get().getApiBaseUrl(this.domainConfig)
			const resourceURL = new URL(origin)
			resourceURL.pathname = path
			const url = addParamsToUrl(resourceURL, queryParams).toString()
			const headers = this.createHeaders(options)
			const { downloadProgressListener, uploadProgressListener, body, abortSignal, responseType, noCORS } = options
			const timeout = options.body instanceof RestBinaryBody ? BLOB_REQUEST_TIMEOUT_MS : EnvProvider.get().getTimeOutValue()

			let response: HttpResponse
			try {
				response = await this.httpClient.request(
					url.toString(),
					method,
					body,
					headers,
					responseType,
					timeout,
					abortSignal,
					noCORS,
					uploadProgressListener,
					downloadProgressListener,
				)
				this.saveServerTimeOffsetFromRequest(response)
			} catch (e) {
				if (e instanceof XhrError) {
					logFailedRequest(method, url.toString(), e.response, options)
					this.saveServerTimeOffsetFromRequest(e.response)
					throw handleRestError(
						e.response.status,
						` | ${method} ${url}`,
						e.response.getResponseHeader("Error-Id"),
						e.response.getResponseHeader("Precondition"),
					)
				} else {
					throw e
				}
			}

			const interceptedResponse: InterceptedResponse = { url: url.toString(), getHeader: (name) => response.getResponseHeader(name) }
			await Promise.all(this.responseMiddlewares.map((middleware) => middleware.interceptResponse(interceptedResponse, method)))

			if (response.status === 200 || (method === HttpMethod.POST && response.status === 201)) {
				const body = response.body
				if (body instanceof RestTextBody) {
					return body.payload
				} else if (body instanceof RestBinaryBody) {
					return body.payload
				} else {
					return null
				}
			} else {
				const suspensionTime = response.getResponseHeader("Retry-After") ?? response.getResponseHeader("Suspension-Time") ?? null
				const isSuspensionResp = restSuspension.isSuspensionResponse(response.status, suspensionTime)

				if (isSuspensionResp && options.suspensionBehavior === SuspensionBehavior.Throw) {
					throw new SuspensionError(
						`blocked for ${suspensionTime}, not suspending (${response.status})`,
						isNotNull(suspensionTime) ? (parseInt(suspensionTime) * 1000).toString() : "unknown time",
					)
				} else if (isSuspensionResp) {
					this.suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime), resourceURL)

					return this.suspensionHandler.deferRequest(() => this.request(path, method, options))
				} else {
					logFailedRequest(method, url, response, options)
					throw handleRestError(
						response.status,
						`| ${method} ${path}`,
						response.getResponseHeader("Error-Id"),
						response.getResponseHeader("Precondition"),
					)
				}
			}
		}
	}

	private saveServerTimeOffsetFromRequest(response: HttpResponse): void {
		// Dates sent in the `Date` field of HTTP headers follow the format specified by rfc7231
		// JavaScript's Date expects dates in the format specified by rfc2822
		// rfc7231 provides three options of formats, the preferred one being IMF-fixdate. This one is definitely
		// parseable by any rfc2822 compatible parser, since it is a strict subset (with no folding white space) of the
		// format of rfc5322, which is the same as rfc2822 accepting more folding white spaces.
		// Furthermore, there is no reason to expect the server to return any of the other two accepted formats, which
		// are obsolete and accepted only for backwards compatibility.
		const serverTimestamp = response.getResponseHeader("Date")

		if (serverTimestamp != null) {
			// check that serverTimestamp has been returned
			const serverTime = new TsDate(serverTimestamp).getTime()

			if (!isNaN(serverTime)) {
				const now = TsDate.now()
				this.serverTimeOffsetMs = serverTime - now
			}
		}
	}

	/**
	 * Get the time on the server based on the client time + the server time offset
	 * The server time offset is calculated based on the date field in the header returned from REST requests.
	 * will throw an error if offline or no rest requests have been made yet
	 */
	getServerTimestampMs(): number {
		const timeOffset = assertNotNull(this.serverTimeOffsetMs, "You can't get server time if no rest requests were made")
		return TsDate.now() + timeOffset
	}

	/**
	 * Checks if the request body is too large.
	 * Ignores the method because GET requests etc. should not exceed the limits neither.
	 * This is done to avoid making the request, because the server will return a PayloadTooLargeError anyway.
	 * */
	private checkRequestSizeLimit(path: string, method: HttpMethod, body: RestBody | null): void {
		if (EnvProvider.get().isAdminClient()) {
			return
		}

		const limit = REQUEST_SIZE_LIMIT_MAP.get(path) ?? REQUEST_SIZE_LIMIT_DEFAULT

		if ((body instanceof RestBinaryBody || body instanceof RestTextBody) && body.payload.length > limit) {
			throw new PayloadTooLargeError(`request body is too large. Path: ${path}, Method: ${method}, Body length: ${body.payload.length}`)
		}
	}

	private createHeaders(options: RestClientOptions): Dict {
		if (options.headers == null) {
			options.headers = {}
		}
		const { headers, body, responseType } = options

		// don't add custom and content-type headers for non-CORS requests, otherwise it would not meet the 'CORS-Preflight simple request' requirements
		if (isNull(options.noCORS) || !options.noCORS) {
			headers["cv"] = EnvProvider.get().getVersionNumber()
			headers["cp"] = this.clientPlatform
			if (body instanceof RestBinaryBody) {
				headers["Content-Type"] = MediaType.Binary
			} else if (body instanceof RestTextBody) {
				headers["Content-Type"] = MediaType.Json
			}

			// add networkDebugging header iff network debugging is activated
			// network debugging can be activated by building with --network-debugging,
			// and essentially activates both attributeNames and attributeIds in the request/response payload
			if (EnvProvider.get().networkDebuggingEnabled()) {
				headers["Network-Debugging"] = "enable-network-debugging"
			}
		}

		const clientName = EnvProvider.get().getClientName()
		if (isNotNull(clientName)) {
			headers["Client-Name"] = clientName
		}

		if (isNotNull(responseType)) {
			headers["Accept"] = responseType
		} else {
			headers["Accept"] = MediaType.Json
		}
		return headers
	}
}

export function addParamsToUrl(url: URL, urlParams: Nullable<Dict>): URL {
	if (isNotNull(urlParams)) {
		for (const [key, value] of typedEntries(urlParams)) {
			if (isNotNull(value)) {
				url.searchParams.set(key, value)
			}
		}
	}

	return url
}

function logFailedRequest(method: HttpMethod, url: string, response: HttpResponse, options: RestClientOptions): void {
	const args: Array<unknown> = [TAG, "failed request", method, url.toString(), response.status, response.statusText]
	if (options.headers != null) {
		args.push(Object.keys(options.headers))
	}
	const body = options.body
	if (body instanceof RestTextBody) {
		const logBody = `[${body.payload.length} characters]`
		args.push(logBody)
	} else if (body instanceof RestBinaryBody) {
		args.push(`[${body.payload.length} bytes]`)
	} else {
		args.push("no body")
	}
	console.log(...args)
}
