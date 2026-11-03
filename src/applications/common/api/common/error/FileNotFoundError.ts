//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class FileNotFoundError extends TutanotaError {
	constructor(msg: string) {
		super("FileNotFoundError", msg)
	}
}
