//@bundleInto:common-min

import { TutanotaError } from "./TutanotaError"

export class ImportError extends TutanotaError {
	data: {
		numFailed: number
	}

	constructor(error: Error, message: string, numFailed: number) {
		super(
			"ImportError",
			`${message}
Number of failed imports: ${numFailed} First error: ${error}`,
		)
		this.data = {
			numFailed,
		}
	}

	get numFailed(): number {
		return this.data.numFailed
	}
}
