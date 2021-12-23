//@flow
//@bundleInto:common-min
import {TutanotaError} from "./TutanotaError"

export class FileNotFoundError extends TutanotaError {
	constructor(msg: string) {
		super("FileNotFoundError", msg)
	}
}
