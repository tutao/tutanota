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
 * Forces long-running microtasks to yield to the queued macrotasks after some time.
 *
 * We need to do this, because the task queue will stall if the microtask queue never clears.
 *
 * For example, if a Promise queues other promises that immediately resolve (and add more immediately resolving/resolved
 * promises - this can be recursively or in a long-running loop), it will just keep adding tasks to the end.
 *
 * If the macrotask queue is stalled, other events (websocket, sleep detection, user events, etc.) won't be handled.
 *
 * This class works by forcing microtasks that await {@link MicrotaskBouncer#bounce} to wait for a new macrotask once
 * the maximum allotted time is reached.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide
 */
export class MicrotaskBouncer {
	private evictTimestamp: number | null = null

	// Next macrotask that the microtasks are allowed to run in.
	private nextMacrotaskPromise: Promise<void> | null = null

	/**
	 * Create a new bouncer
	 * @param maxTimeMillis maximum time in milliseconds; this should be a small number (i.e. 100 ms)
	 * @param dateProvider the current time in milliseconds
	 */
	constructor(
		private readonly maxTimeMillis: number = 100,
		private readonly dateProvider: () => number = () => Date.now(),
	) {}

	/**
	 * If the time slice is over, return a promise that yields to any queued macrotask(s).
	 */
	bounce(): Promise<void> {
		const now = this.dateProvider()

		if (this.evictTimestamp == null) {
			this.evictTimestamp = now + this.maxTimeMillis
		} else if (now > this.evictTimestamp) {
			if (this.nextMacrotaskPromise == null) {
				// this enqueues a macrotask, forcing anything resolving this to wait until this macrotask is handled
				// rather than create a new microtask
				this.nextMacrotaskPromise = new Promise((resolve) => {
					// no delay = resolve on the next event cycle
					//
					// (this will be put at the *end* of the task queue, after all currently scheduled macrotasks)
					setTimeout(resolve)
				}).then(() => {
					// this will only happen once our new macrotask is reached (thus this is safe from race conditions
					// even if we go beyond our timestamp)
					this.evictTimestamp = null
					this.nextMacrotaskPromise = null
				})
			}

			// this will make all microtasks using this bouncer converge on this promise
			return this.nextMacrotaskPromise
		}

		return Promise.resolve()
	}
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
