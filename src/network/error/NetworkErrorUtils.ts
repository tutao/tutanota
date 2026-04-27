//If importing fails it is a good idea to bundle the error into common-min which can be achieved by annotating the module with "<at>bundleInto:common-min"
import * as restError from "@tutao/rest-client/error"
import { LoginIncompleteError } from "./LoginIncompleteError"

/**
 * Checks whether {@param e} is an error that can error before we are fully logged in and connected.
 */
export function isOfflineError(e: Error): boolean {
	return e instanceof restError.ConnectionError || e instanceof LoginIncompleteError
}
/**
 * Returns whether the error is expected for the cases where our local state might not be up-to-date with the server yet. E.g. we might be processing an update
 * for the instance that was already deleted. Normally this would be optimized away, but it might still happen due to timing.
 */
export function isExpectedErrorForSynchronization(e: Error): boolean {
	return e instanceof restError.NotFoundError || e instanceof restError.NotAuthorizedError
}
