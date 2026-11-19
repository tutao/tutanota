import { HttpResponse, RestBody } from "./HttpResponse"
import { HttpMethod, MediaType, ProgressListener } from "./HttpTypes"
import { TsString } from "@tutao/lang-api"

export interface HttpClient {
	request(
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
	): Promise<HttpResponse>
}

export class HttpUtils {
	/**
	 * Rewrites the scheme to api://|apis:// which is intercepted by the ApiSchemeHandler on iOS
	 * This is done in order to avoid preflight requests with Origin asset://app
	 */
	public static rewriteSchemeForIos(url: string, isIOSApp: boolean): TsString {
		if (isIOSApp) {
			// http:// -> api:// and https:// -> apis://
			return url.replace(/^http/, "api")
		}
		return url
	}
}
