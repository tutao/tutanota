// @flow
import {assertMainOrNode} from "../api/Env"
import {asyncImport} from "../api/common/utils/Utils"
import {SecondFactorPendingError} from "../api/common/error/SecondFactorPendingError"

assertMainOrNode()

export function handleUncaughtError(e: Error) {
	if (e instanceof SecondFactorPendingError) {
		// ignore
	} else if (e.stack) {
		console.log("error", e.stack)
	} else {
		console.log("error", e)
	}

	// decoupled to remove size of boot bundle
	asyncImport(typeof module != "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}src/misc/ErrorHandlerImpl.js`).then(module => {
		module.handleUncaughtError(e)
	})
}
