//@flow
import {TutanotaError} from "./TutanotaError"

//assertMainOrNodeBoot()

export class MembershipRemovedError extends TutanotaError {
	constructor(message: string) {
		super("MembershipRemovedError", message)
	}
}