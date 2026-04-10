//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class ServerModelsUnavailableError extends TutanotaError {
	constructor(msg: string) {
		super("ServerModelsUnavailableError", msg)
	}
}
