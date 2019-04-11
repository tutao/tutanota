//@flow

import {downcast} from "./Utils"

// flow erases types to empty (bottom) if we write them inline so we give them a name
type PromiseAllTyped = (<A, B>(a: $Promisable<A>, b: $Promisable<B>) => Promise<[A, B]>)
	& (<A, B, C>(a: $Promisable<A>, b: $Promisable<B>, c: $Promisable<C>) => Promise<[A, B, C]>)
	& (<A, B, C, D>(a: $Promisable<A>, b: $Promisable<B>, c: $Promisable<C>, d: $Promisable<D>) =>
	Promise<[A, B, C, D]>)

export const all: PromiseAllTyped = downcast((...promises) => Promise.all(promises))

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

	constructor(value: $Promisable<T>) {
		this.value = value instanceof Promise ? value.then(flatWrapper) : flatWrapper(value);
	}

	thenOrApply<R>(fn: (T) => $Promisable<R>): PromisableWrapper<R> {
		if (this.value instanceof Promise) {
			return new PromisableWrapper(this.value.then(fn))
		} else {
			return new PromisableWrapper(fn(this.value))
		}
	}

	toPromise(): Promise<T> {
		return Promise.resolve(this.value)
	}

	then<R>(fn: (T) => $Promisable<R>): Promise<R> {
		return Promise.resolve(this.value).then(fn)
	}
}
