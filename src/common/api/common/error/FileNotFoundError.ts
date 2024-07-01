//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class FileNotFoundError extends TutanotaError {
	constructor(msg: string) {
		super("FileNotFoundError", msg)
	}
}
