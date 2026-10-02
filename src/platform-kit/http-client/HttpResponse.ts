import { RestBodyType } from "./HttpTypes"
import { assert, downcast } from "@tutao/utils"

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

	public getTextBody(): string {
		assert(this.body?.bodyType === RestBodyType.Text, `Expected the response type to be ${RestBodyType.Text}. Got: ${this.body?.bodyType}`)
		return downcast<RestTextBody>(this.body).payload
	}

	public getJsonBody<T>(): T {
		return JSON.parse(this.getTextBody())
	}

	public getBinaryBody(): Uint8Array {
		assert(this.body?.bodyType === RestBodyType.Binary, `Expected the response type to be ${RestBodyType.Binary}. Got: ${this.body?.bodyType}`)
		return downcast<RestBinaryBody>(this.body).payload
	}
}
