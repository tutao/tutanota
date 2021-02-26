//@flow

import {downcast} from "./Utils"

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


export type PromiseMapFn = <T, U>(values: T[], callback: PromiseMapCallback<T, U>, concurrency?: Bluebird$ConcurrencyOption) => PromisableWrapper<U[]>

export const promiseMapCompat = (useMapInCallContext: boolean): PromiseMapFn => useMapInCallContext
	? mapInCallContext
	: <T, U>(values: Array<T>, callback: PromiseMapCallback<T, U>, concurrency) => PromisableWrapper.from(Promise.map(values, callback, concurrency))

function flatWrapper<T>(value: PromisableWrapper<T> | T): $Promisable<T> {
	return value instanceof PromisableWrapper ? value.value : value
}

// It kinda implements 'thenable' protocol so you can freely pass it around as a generic promise
export class PromisableWrapper<T> {
	static from(value: $Promisable<T>): PromisableWrapper<T> {
		return new PromisableWrapper(value)
	}

	value: $Promisable<T>;

	constructor(value: $Promisable<PromisableWrapper<T> | T>) {
		this.value = value instanceof Promise ? value.then(flatWrapper) : flatWrapper(value);
	}

	thenOrApply<R>(onFulfill: (T) => $Promisable<PromisableWrapper<R> | R>, onReject?: (any) => $Promisable<R | PromisableWrapper<R>>): PromisableWrapper<R> {
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
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

export function promiseMap<T, R>(_iterable: $Promisable<Iterable<T>>, mapper: (T) => $Promisable<R>): Promise<Array<R>> {
	return Promise.resolve(_iterable).then(iterable => {
		const iterator: Iterator<T> = downcast(iterable)[Symbol.iterator]()
		const result = []

		function iterate() {
			const item = iterator.next()
			if (item.done === true) {
				return Promise.resolve()
			} else {
				return Promise.resolve(mapper(item.value)).then((newItem) => {
					result.push(newItem)
					return iterate()
				})
			}
		}

		return iterate().then(() => result)
	})
}

/**
 * Pass to Promise.then to perform an action while forwarding on the result
 * @param action
 */
export function tap<T>(action: T => mixed): T => T {
	return function (value) {
		action(value)
		return value
	}
}