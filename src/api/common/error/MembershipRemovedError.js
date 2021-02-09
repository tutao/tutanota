//@flow
//@bundleInto:common-min
import {TutanotaError} from "./TutanotaError"

export class MembershipRemovedError extends TutanotaError {
	constructor(message: string) {
		super("MembershipRemovedError", message)
	}
}