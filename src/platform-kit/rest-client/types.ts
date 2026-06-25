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
export const enum RestBodyType {
	Text,
	Binary,
}

export abstract class RestBody {
	protected constructor(public readonly bodyType: RestBodyType) {}
}

export class RestTextBody extends RestBody {
	constructor(public readonly payload: string) {
		super(RestBodyType.Text)
	}
}

export class RestBinaryBody extends RestBody {
	constructor(public readonly payload: Uint8Array) {
		super(RestBodyType.Binary)
	}
}

export interface RestClientOptions {
	body: RestBody | null
	responseType: MediaType | null
	progressListener: ProgressListener | null
	baseUrl: string | null
	headers: Dict | null
	queryParams: Dict | null
	noCORS: boolean | null
	/** Default is to suspend all requests on rate limit. */
	suspensionBehavior: SuspensionBehavior | null
	abortSignal: AbortSignal | null
}

export const enum SuspensionBehavior {
	Suspend,
	Throw,
}
export interface RestClientInterface {
	request(path: string, method: HttpMethod, options: RestClientOptions): Promise<any | null>

	setHeaders(xhr: XMLHttpRequest, options: RestClientOptions): void
}
