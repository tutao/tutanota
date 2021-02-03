//@flow
import {TutanotaError} from "./TutanotaError"

//assertMainOrNodeBoot()

export class FileOpenError extends TutanotaError {
	constructor(message: string) {
		super("FileOpenError", message)
	}
}