/**
 * Middlewares that are invoked after the request have been made
 * Hence the implementation should only read/modify response
 */
export interface RestClientMiddleware {
	interceptResponse(sentRequest: XMLHttpRequest, method: HttpMethod): Promise<void>
}

interface ProgressListener {
	/**
	 * Called when data is sent with HTTP request.
	 * @param percent of the overall data to be sent
	 * @param bytes sent so far
	 */
	upload(percent: number, bytes: number): void

	/**
	 * Called when data is downloaded with HTTP request.
	 * @param percent of the overall data to be downloded
	 * @param bytes downloaded so far
	 */
	download(percent: number, bytes: number): void
}

export const enum MediaType {
	Json = "application/json",
	Binary = "application/octet-stream",
	Text = "text/plain",
}

export const enum HttpMethod {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	PATCH = "PATCH",
	DELETE = "DELETE",
}

export interface RestClientOptions {
	body?: string | Uint8Array
	responseType?: MediaType
	progressListener?: ProgressListener
	baseUrl?: string
	headers?: Dict
	queryParams?: Dict
	noCORS?: boolean
	/** Default is to suspend all requests on rate limit. */
	suspensionBehavior?: SuspensionBehavior
	abortSignal?: AbortSignal
}

export const enum SuspensionBehavior {
	Suspend,
	Throw,
}
