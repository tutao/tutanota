export { pMap as promiseMap } from "./PromiseMap.js"

export function delay(ms: number): Promise<void> {
	if (Number.isNaN(ms) || ms < 0) {
		throw new Error(`Invalid delay: ${ms}`)
	}
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

/**
 * Pass to Promise.then to perform an action while forwarding on the result
 * @param action
 */
export function tap<T>(action: (arg0: T) => unknown): (arg0: T) => T {
	return function (value) {
		action(value)
		return value
	}
}

/**
 * Helper utility intended to be used with typed exceptions and .catch() method of promise like so:
 *
 * ```js
 *  class SpecificError extends Error {}
 *
 *  Promise.reject(new SpecificError())
 *      .catch(ofClass(SpecificError, (e) => console.log("some error", e)))
 *      .catch((e) => console.log("generic error", e))
 * ```
 *
 * @param cls Class which will be caught
 * @param catcher to handle only errors of type cls
 * @returns handler which either forwards to catcher or rethrows
 */
export function ofClass<E, R>(cls: Class<E>, catcher: (arg0: E) => R): (arg0: any) => Promise<R> {
	return (e) => {
		if (e instanceof cls) {
			return Promise.resolve(catcher(e))
		} else {
			// It's okay to rethrow because:
			// 1. It preserves the original stacktrace
			// 2. Because of 1. it is not that expensive
			throw e
		}
	}
}

export function ofClassAsync<E, R>(cls: Class<E>, catcher: (arg0: E) => Promise<R>): (arg0: any) => Promise<R> {
	return async (e) => {
		if (e instanceof cls) {
			return catcher(e)
		} else {
			// It's okay to rethrow because:
			// 1. It preserves the original stacktrace
			// 2. Because of 1. it is not that expensive
			throw e
		}
	}
}

/**
 * Filter iterable. Just like Array.prototype.filter but callback can return promises
 */
export async function promiseFilter<T>(iterable: Iterable<T>, filter: (item: T, index: number) => Promise<boolean>): Promise<Array<T>> {
	let index = 0
	const result: T[] = []

	for (let item of iterable) {
		if (await filter(item, index)) {
			result.push(item)
		}

		index++
	}

	return result
}

/** Call the handler for both resolution and rejection. Unlike finally() will not propagate the error. */
export function settledThen<T, R>(promise: Promise<T>, handler: () => R): Promise<R> {
	return promise.then(handler, handler)
}
