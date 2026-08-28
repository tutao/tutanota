import { HttpMethod, MediaType, ProgressListener, RestBody } from "@tutao/http-client"

export { ProgressListener, MediaType, HttpMethod, validateHttpMethod, RestBodyType, RestBody, RestTextBody, RestBinaryBody } from "@tutao/http-client"

/** A read-only view of a completed response, abstracted over the underlying transport (XMLHttpRequest or fetch's Response). */
export interface InterceptedResponse {
	url: string
	getHeader(name: string): string | null
}

/**
 * Middlewares that are invoked after the request have been made
 * Hence the implementation should only read/modify response
 */
export interface RestClientMiddleware {
	interceptResponse(sentResponse: InterceptedResponse, method: HttpMethod): Promise<void>
}

export interface RestClientOptions {
	body: RestBody | null
	responseType: MediaType | null
	uploadProgressListener: ProgressListener | null
	downloadProgressListener: ProgressListener | null
	baseUrl: string | null
	headers: Dict | null
	queryParams: Dict | null
	noCORS: boolean | null
	/** Default is to suspend all requests on rate limit. */
	suspensionBehavior: SuspensionBehavior | null
	abortSignal: AbortSignal | null
}

export const enum SuspensionBehavior {
	Suspend = 0,
	Throw = 1,
}
export interface RestClientInterface {
	request(path: string, method: HttpMethod, options: RestClientOptions): Promise<any | null>
}
