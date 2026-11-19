import { ProgrammingError, TutanotaError } from "../app-env"
import { HttpResponse } from "./HttpResponse"

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
export function validateHttpMethod(method: string): HttpMethod {
	switch (method) {
		case HttpMethod.GET:
			return HttpMethod.GET
		case HttpMethod.POST:
			return HttpMethod.POST
		case HttpMethod.PUT:
			return HttpMethod.PUT
		case HttpMethod.PATCH:
			return HttpMethod.PATCH
		case HttpMethod.DELETE:
			return HttpMethod.DELETE
		default:
			throw new ProgrammingError(
				`Unknown http method: ${method}. Valid methods are: ${[HttpMethod.GET, HttpMethod.PUT, HttpMethod.POST, HttpMethod.PATCH, HttpMethod.DELETE]}`,
			)
	}
}

export const enum RestBodyType {
	Text,
	Binary,
}

export interface ProgressListener {
	/**
`	 * Called when data is sent / received with HTTP request.
	 * @param percent of the overall data to be sent
	 * @param bytes sent so far`
	 */
	update(percent: number, bytes: number): void
}

export class XhrError extends TutanotaError {
	constructor(
		public readonly method: HttpMethod,
		public readonly url: string,
		public readonly response: HttpResponse,
	) {
		super("XhrError", "Xhr.onError")
	}
}
