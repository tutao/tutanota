import { assertWorkerOrNode } from "../../../common/Env"

assertWorkerOrNode()

export class KeyVerificationFacade {
	constructor() {}

	async meow(): Promise<string> {
		return Promise.resolve("meow")
	}
}
