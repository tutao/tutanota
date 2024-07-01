//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class FileOpenError extends TutanotaError {
	constructor(message: string) {
		super("FileOpenError", message)
	}
}
