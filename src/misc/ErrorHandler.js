// @flow
import {assertMainOrNodeBoot, isTest} from "../api/common/Env"

assertMainOrNodeBoot()

export async function handleUncaughtError(e: Error) {

	if (isTest()) {
		throw e
	}

	console.log("error", e, e.stack)

	try {
		// decoupled to remove size of boot bundle
		const {handleUncaughtError} = await import('./ErrorHandlerImpl.js')
		await handleUncaughtError(e)
	} catch (e) {
		console.error("Encountered error when trying to handle errors with ErrorHandlerImpl", e)
	}
}

export async function disableErrorHandlingDuringLogout() {
	try {
		const {disableErrorHandlingDuringLogout} = await import('./ErrorHandlerImpl.js')
		disableErrorHandlingDuringLogout()
	} catch (e) {
		console.error("Could not import ErrorHandlerImpl", e)
	}
}
