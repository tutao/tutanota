// @flow
//@bundleInto:common-min
import {TutanotaError} from "./TutanotaError"

export class ImportError extends TutanotaError {
	data: {numFailed: number}

	constructor(message: string, numFailed: number) {
		super("ImportError", message + "\nNumber of failed imports: " + numFailed)
		this.data = {numFailed}
	}

	get numFailed(): number {
		return this.data.numFailed
	}
}
