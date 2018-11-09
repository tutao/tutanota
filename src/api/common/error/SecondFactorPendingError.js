//@flow
import {TutanotaError} from "./TutanotaError"

export class SecondFactorPendingError extends TutanotaError {
	data: {sessionId: IdTuple, challenges: Challenge[], mailAddress: ?string};

	constructor(sessionId: IdTuple, challenges: Challenge[], mailAddress: ?string) {
		super("SecondFactorPendingError", "")
		this.data = {sessionId, challenges, mailAddress}
	}

}