//@flow
import {TutanotaError} from "./TutanotaError"

export class SecondFactorPendingError extends TutanotaError {
	data: {sessionId: IdTuple, challenges: Challenge[]};

	constructor(sessionId: IdTuple, challenges: Challenge[]) {
		super("SecondFactorPendingError", "")
		this.data = {sessionId, challenges}
	}

}