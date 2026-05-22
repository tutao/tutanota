//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"
import { Challenge } from "@tutao/entities/sys"

export class SecondFactorPendingError extends TutanotaError {
	data: {
		sessionId: IdTuple
		challenges: Challenge[]
		mailAddress: string | null
	}

	constructor(sessionId: IdTuple, challenges: Challenge[], mailAddress: string | null) {
		super("SecondFactorPendingError", "")
		this.data = {
			sessionId,
			challenges,
			mailAddress,
		}
	}
}
