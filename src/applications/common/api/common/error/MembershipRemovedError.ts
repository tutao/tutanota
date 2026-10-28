//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class MembershipRemovedError extends TutanotaError {
	constructor(message: string) {
		super("MembershipRemovedError", message)
	}
}
