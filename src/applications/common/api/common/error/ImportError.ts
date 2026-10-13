//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"
import { assertNotNull } from "@tutao/utils"

export type ImportErrorData = {
	numFailed: number
}
export class ImportError extends TutanotaError<ImportErrorData> {
	constructor(error: Error, message: string, numFailed: number) {
		super("ImportError", `${message} Number of failed imports: ${numFailed} First error: ${error}`, {
			numFailed,
		})
	}

	get numFailed(): number {
		return this.data.numFailed
	}
}
