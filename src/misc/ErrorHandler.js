// @flow
import {assertMainOrNodeBoot, isTest} from "../api/common/Env"
import {SecondFactorPendingError} from "../api/common/error/SecondFactorPendingError"

assertMainOrNodeBoot()

export async function handleUncaughtError(e: Error) {

	if (isTest()) {
		throw e
	}
	if (e instanceof SecondFactorPendingError) {
		// ignore
	} else {
		console.log("error", e)
	}

	try {
		// decoupled to remove size of boot bundle
		const {handleUncaughtError} = await import('./ErrorHandlerImpl.js')
		await handleUncaughtError(e)
	} catch (e) {
		console.error("Encountered error when trying to handle errors with ErrorHandlerImpl", e)
	}
}

export async function loggingOut() {
	try {
		// decoupled to remove size of boot bundle
		const {loggingOut} = await import('./ErrorHandlerImpl.js')
		await loggingOut()
	} catch (e) {
		console.error("Encountered error when loading ErrorHandlerImpl", e)
	}
}
