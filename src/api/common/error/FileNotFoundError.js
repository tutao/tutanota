//@flow
import {TutanotaError} from "./TutanotaError"

//assertMainOrNodeBoot()

export class FileNotFoundError extends TutanotaError {
	constructor(msg: string) {
		super("FileNotFoundError", msg)
	}
}
