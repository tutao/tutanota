// @flow
import {assertMainOrNodeBoot, isTest} from "../api/common/Env"
import {SecondFactorPendingError} from "../api/common/error/SecondFactorPendingError"

assertMainOrNodeBoot()

export function handleUncaughtError(e: Error) {

	if (isTest()) {
		throw e
	}
	if (e instanceof SecondFactorPendingError) {
		// ignore
	} else {
		console.log("error", e)
	}

	// decoupled to remove size of boot bundle
	import('./ErrorHandlerImpl.js').then(module => {
		module.handleUncaughtError(e)
	})
}

export function logginOut() {
	import('./ErrorHandlerImpl.js').then(module => {
		module.loggingOut()
	})
}
