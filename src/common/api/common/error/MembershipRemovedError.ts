//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class MembershipRemovedError extends TutanotaError {
	constructor(message: string) {
		super("MembershipRemovedError", message)
	}
}
