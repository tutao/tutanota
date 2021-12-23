//@flow
//@bundleInto:common-min
import {TutanotaError} from "./TutanotaError"
import type {Challenge} from "../../entities/sys/Challenge"

export class SecondFactorPendingError extends TutanotaError {
	data: {sessionId: IdTuple, challenges: Challenge[], mailAddress: ?string};

	constructor(sessionId: IdTuple, challenges: Challenge[], mailAddress: ?string) {
		super("SecondFactorPendingError", "")
		this.data = {sessionId, challenges, mailAddress}
	}

}