//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"
import { Nullable } from "@tutao/utils"

export class FileNotFoundError extends TutanotaError<Nullable<never>> {
	constructor(msg: string) {
		super("FileNotFoundError", msg, null)
	}
}
