import { HttpMethod, MediaType, ProgressListener, RestBody } from "@tutao/http-client"
import { Nullable } from "@tutao/lang-api"

export { type ProgressListener, MediaType, HttpMethod, validateHttpMethod, RestBodyType, RestBody, RestTextBody, RestBinaryBody } from "@tutao/http-client"

/** A read-only view of a completed response, abstracted over the underlying transport (XMLHttpRequest or fetch's Response). */
export interface InterceptedResponse {
	url: string
	getHeader(name: string): Nullable<string>
}

/**
 * Middlewares that are invoked after the request have been made
 * Hence the implementation should only read/modify response
 */
export interface RestClientMiddleware {
	interceptResponse(sentResponse: InterceptedResponse, method: HttpMethod): Promise<void>
}

export interface RestClientOptions {
	body: Nullable<RestBody>
	responseType: Nullable<MediaType>
	uploadProgressListener: Nullable<ProgressListener>
	downloadProgressListener: Nullable<ProgressListener>
	baseUrl: Nullable<string>
	headers: Nullable<Dict>
	queryParams: Nullable<Dict>
	noCORS: Nullable<boolean>
	/** Default is to suspend all requests on rate limit. */
	suspensionBehavior: Nullable<SuspensionBehavior>
	abortSignal: Nullable<AbortSignal>
}

export const enum SuspensionBehavior {
	Suspend = 0,
	Throw = 1,
}
export interface RestClientInterface {
	request(path: string, method: HttpMethod, options: RestClientOptions): Promise<Nullable<any>>
}
