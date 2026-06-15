//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"
import { errorsToString } from "../../../../../platform-kit/utils/Utils"

export class ImportError extends TutanotaError {
	data: {
		numFailed: number
	}

	constructor(errors: Error[], message: string, numFailed: number) {
		super(
			"ImportError",
			`${message}
Number of failed imports: ${numFailed} Errors:\n ${errorsToString(errors)}`,
		)
		this.data = {
			numFailed,
		}
	}

	get numFailed(): number {
		return this.data.numFailed
	}
}
