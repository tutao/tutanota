//@flow
//@bundleInto:common-min
import {TutanotaError} from "./TutanotaError"

export class FileOpenError extends TutanotaError {
	constructor(message: string) {
		super("FileOpenError", message)
	}
}