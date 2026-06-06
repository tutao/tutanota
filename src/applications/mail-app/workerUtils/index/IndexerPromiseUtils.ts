import type { Options as PromiseMapOptions } from "../../../../platform-kit/utils/PromiseMap"
import { promiseMap } from "../../../../platform-kit/utils/PromiseUtils"

export type $Promisable<T> = Promise<T> | T

export type PromiseMapCallback<T, U> = (el: T, index: number) => $Promisable<U>
export type PromiseMapFn = <T, U>(values: T[], callback: PromiseMapCallback<T, U>, options?: PromiseMapOptions) => PromisableWrapper<U[]>

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
