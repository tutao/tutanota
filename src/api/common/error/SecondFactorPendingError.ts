//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"
import type { Challenge } from "../../entities/sys/TypeRefs.js"

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
