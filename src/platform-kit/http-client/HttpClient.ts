import { HttpResponse, RestBody } from "./HttpResponse"
import { HttpMethod, MediaType, ProgressListener } from "./HttpTypes"

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
