//@bundleInto:common-min

import { DbError } from "./DbError"

export class IndexingNotSupportedError extends DbError {
	constructor(message: string, error?: Error) {
		super(message, error)
		this.name = "IndexingNotSupportedError"
	}
}
