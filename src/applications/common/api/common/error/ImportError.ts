//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export type ImportErrorData = {
	numFailed: number
}
export class ImportError extends TutanotaError<ImportErrorData> {
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
