//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class FileOpenError extends TutanotaError {
	constructor(message: string) {
		super("FileOpenError", message)
	}
}
