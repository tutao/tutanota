/**
 * @file Handler for all the uncaught errors.
 * ErrorHandler is decoupled from ErrorHandlerImpl to reduce boot bundle size.
 */
import { assertMainOrNodeBoot, isTest } from "../api/common/Env"
import { delay } from "@tutao/tutanota-utils"

assertMainOrNodeBoot()

/** Produced async function which will not try to run more often than @param ms. Does not cache the result. */
function produceThrottledFunction<R>(ms: number, fn: () => Promise<R>): () => Promise<R> {
	let lastTry = 0
	return async () => {
		const previousTry = lastTry
		lastTry = Date.now()
		const sincePreviousTry = Date.now() - previousTry

		// |---|----|--------------|-----|
		//   1001  1003           1011
		//    a     b              c
		// ms: 10
		// a: previousTry
		// b: Date.now()
		// c: previousTry + ms
		// If the last call was at 1001 and we are now calling fn again at 1003 then we want to wait until 1011 which would be (a + ms) - b.

		if (previousTry !== 0 && sincePreviousTry < ms) {
			const waitShouldEndAt = previousTry + ms
			const timeUntilWaitEnd = waitShouldEndAt - Date.now()
			await delay(timeUntilWaitEnd)
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

	try {
		console.log("error", e, e.stack)
		const { handleUncaughtErrorImpl } = await importErrorHandler()
		await handleUncaughtErrorImpl(e)
	} catch (e) {
		console.error("Encountered error when trying to handle errors with ErrorHandlerImpl", e)
	}
}

export async function disableErrorHandlingDuringLogout() {
	try {
		const { disableErrorHandlingDuringLogout } = await importErrorHandler()
		disableErrorHandlingDuringLogout()
	} catch (e) {
		console.error("Could not import ErrorHandlerImpl", e)
	}
}
