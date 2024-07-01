//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class MembershipRemovedError extends TutanotaError {
	constructor(message: string) {
		super("MembershipRemovedError", message)
	}
}
