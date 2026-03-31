import type { Options as PromiseMapOptions } from "./PromiseMap.js"
import { pMap as promiseMap } from "./PromiseMap.js"

export type $Promisable<T> = Promise<T> | T
type PromiseMapCallback<T, U> = (el: T, index: number) => $Promisable<U>

/**
 * Map array of values to promise of arrays or array. Mapper function may return promise or value. If value is returned,
 * we avoid promise scheduling.
 *
 * This is needed to run the whole operation in one microtask (e.g. keep IndexedDB transaction active, which is closed in
 * some browsers (e.g. Safari) when event loop iteration ends).
 */
export function mapInCallContext<T, U>(values: T[], callback: PromiseMapCallback<T, U>): PromisableWrapper<Array<U>> {
	return new PromisableWrapper(_mapInCallContext(values, callback, 0, []))
}

function _mapInCallContext<T, U>(values: T[], callback: PromiseMapCallback<T, U>, index: number, acc: U[]): $Promisable<Array<U>> {
	if (index >= values.length) {
		return acc
	}

	let mappedValue = callback(values[index], index)

	if (mappedValue instanceof Promise) {
		return mappedValue.then((v) => {
			acc.push(v)
			return _mapInCallContext(values, callback, index + 1, acc)
		})
	} else {
		acc.push(mappedValue)
		return _mapInCallContext(values, callback, index + 1, acc)
	}
}

export { pMap as promiseMap } from "./PromiseMap.js"
export type PromiseMapFn = <T, U>(values: T[], callback: PromiseMapCallback<T, U>, options?: PromiseMapOptions) => PromisableWrapper<U[]>

function mapNoFallback<T, U>(values: Array<T>, callback: PromiseMapCallback<T, U>, options?: PromiseMapOptions) {
	return PromisableWrapper.from(promiseMap(values, callback, options))
}

/** Factory function which gives you ack promiseMap implementation. {@see mapInCallContext} for what it means. */
export function promiseMapCompat(useMapInCallContext: boolean): PromiseMapFn {
	return useMapInCallContext ? mapInCallContext : mapNoFallback
}

function flatWrapper<T>(value: PromisableWrapper<T> | T): $Promisable<T> {
	return value instanceof PromisableWrapper ? value.value : value
}

// It kinda implements 'thenable' protocol so you can freely pass it around as a generic promise
export class PromisableWrapper<T> {
	static from<U>(value: $Promisable<U>): PromisableWrapper<U> {
		return new PromisableWrapper<U>(value)
	}

	value: $Promisable<T>

	constructor(value: $Promisable<PromisableWrapper<T> | T>) {
		this.value = value instanceof Promise ? value.then(flatWrapper) : flatWrapper(value)
	}

	thenOrApply<R>(
		onFulfill: (arg0: T) => $Promisable<PromisableWrapper<R> | R>,
		onReject?: (arg0: any) => $Promisable<R | PromisableWrapper<R>>,
	): PromisableWrapper<R> {
		if (this.value instanceof Promise) {
			const v: Promise<PromisableWrapper<R> | R> = this.value.then(onFulfill, onReject)
			return new PromisableWrapper(v)
		} else {
			try {
				return new PromisableWrapper(onFulfill(this.value))
			} catch (e) {
				if (onReject) {
					return new PromisableWrapper<R>(onReject(e))
				}

				throw e
			}
		}
	}

	toPromise(): Promise<T> {
		return Promise.resolve(this.value)
	}
}

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
export function ofClass<E, R>(cls: Class<E>, catcher: (arg0: E) => $Promisable<R>): (arg0: any) => Promise<R> {
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
export async function promiseFilter<T>(iterable: Iterable<T>, filter: (item: T, index: number) => $Promisable<boolean>): Promise<Array<T>> {
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
