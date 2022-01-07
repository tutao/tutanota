/**
 * @file Handler for all the uncaught errors.
 * ErrorHandler is decoupled from ErrorHandlerImpl to reduce boot bundle size.
 */
import {assertMainOrNodeBoot, isTest} from "../api/common/Env"
import {delay} from "@tutao/tutanota-utils"

assertMainOrNodeBoot()

/** Produced async function which will not try to run more often than @param ms. Does not cache the result. */
function produceThrottledFunction<R>(ms: number, fn: () => Promise<R>): () => Promise<R> {
	let lastTry = 0
	return async () => {
		let previousTry = lastTry
		lastTry = Date.now()

		if (previousTry - Date.now() < ms) {
			await delay(previousTry - Date.now())
		}

		return fn()
	}
}

/**
 * Throttled error handler. We have issues with error loops when reloading the page in Firefox and this gives browser a break of event
 * loop to be able to reload the page properly.
 * */
const importErrorHandler = produceThrottledFunction(200, () => import("./ErrorHandlerImpl.js"))

export async function handleUncaughtError(e: Error) {
	if (isTest()) {
		throw e
	}

	console.log("error", e, e.stack)

	try {
		const {handleUncaughtError} = await importErrorHandler()
		await handleUncaughtError(e)
	} catch (e) {
		console.error("Encountered error when trying to handle errors with ErrorHandlerImpl", e)
	}
}

export async function disableErrorHandlingDuringLogout() {
	try {
		const {disableErrorHandlingDuringLogout} = await importErrorHandler()
		disableErrorHandlingDuringLogout()
	} catch (e) {
		console.error("Could not import ErrorHandlerImpl", e)
	}
}