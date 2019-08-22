// @flow
import {assertMainOrNodeBoot, isTest} from "../api/Env"
import {asyncImport} from "../api/common/utils/Utils"
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
	asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
		`${env.rootPathPrefix}src/misc/ErrorHandlerImpl.js`).then(module => {
		module.handleUncaughtError(e)
	})
}

export function logginOut() {
	asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
		`${env.rootPathPrefix}src/misc/ErrorHandlerImpl.js`).then(module => {
		module.loggingOut()
	})
}