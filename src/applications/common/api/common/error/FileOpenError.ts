//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class FileOpenError extends TutanotaError {
	constructor(message: string) {
		super("FileOpenError", message)
	}
}
