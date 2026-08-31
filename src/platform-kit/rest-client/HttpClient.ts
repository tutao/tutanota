import { HttpMethod, MediaType, ProgressListener, RestBody } from "@tutao/rest-client/types"
import { HttpResponse } from "./HttpClientJavascript"

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
