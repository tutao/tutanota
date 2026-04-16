//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class MembershipRemovedError extends TutanotaError {
	constructor(message: string) {
		super("MembershipRemovedError", message)
	}
}
