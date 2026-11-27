import { lazy } from "./Utils.js"

// This file is not transpiled
/* eslint-disable  @typescript-eslint/explicit-function-return-type */

/**
 * Function which accepts another function. On first invocation
 * of this resulting function result will be remembered and returned
 * on consequent invocations.
 */
export function lazyMemoized<T>(source: () => T): lazy<T> {
	// Using separate variable for tracking because value can be undefined and we want to the function call only once
	let cached = false
	let value: T
	return () => {
		if (cached) {
			return value
		} else {
			cached = true
			return (value = source())
		}
	}
}
