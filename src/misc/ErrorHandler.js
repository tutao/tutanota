// @flow
import {assertMainOrNodeBoot, isTest} from "../api/common/Env"
import {delay} from "@tutao/tutanota-utils"

assertMainOrNodeBoot()

function throttledImport<R>(ms: number, fn: (() => Promise<R>)): (() => Promise<R>) {
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

const importErrorHandler = throttledImport(500, () => import("./ErrorHandlerImpl.js"))

export async function handleUncaughtError(e: Error) {
	if (isTest()) {
		throw e
	}

	console.log("error", e, e.stack)

	try {
		// decoupled to remove size of boot bundle
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
