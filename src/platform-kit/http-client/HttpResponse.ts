import { RestBodyType } from "./HttpTypes"

export abstract class RestBody {
	protected constructor(public readonly bodyType: RestBodyType) {}
}

export class RestTextBody extends RestBody {
	constructor(public readonly payload: string) {
		super(RestBodyType.Text)
	}
}

export class RestBinaryBody extends RestBody {
	constructor(public readonly payload: Uint8Array<ArrayBuffer>) {
		super(RestBodyType.Binary)
	}
}

export class HttpResponse {
	constructor(
		public readonly status: number,
		public readonly statusText: string,
		public readonly body: RestBody | null,
		readonly responseHeaders: Map<string, string>,
	) {}

	getResponseHeader(name: string): string | null {
		return this.responseHeaders.get(name.toLowerCase()) ?? null
	}
}
