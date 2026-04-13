//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"
import { sysTypeRefs } from "@tutao/typeRefs"

export class SecondFactorPendingError extends TutanotaError {
	data: {
		sessionId: IdTuple
		challenges: sysTypeRefs.Challenge[]
		mailAddress: string | null
	}

	constructor(sessionId: IdTuple, challenges: sysTypeRefs.Challenge[], mailAddress: string | null) {
		super("SecondFactorPendingError", "")
		this.data = {
			sessionId,
			challenges,
			mailAddress,
		}
	}
}
