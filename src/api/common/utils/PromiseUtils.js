//@flow

import {downcast} from "./Utils"

// flow erases types to empty (bottom) if we write them inline so we give them a name
type PromiseAllTyped = (<A, B>(a: $Promisable<A>, b: $Promisable<B>) => Promise<[A, B]>)
	& (<A, B, C>(a: $Promisable<A>, b: $Promisable<B>, c: $Promisable<C>) => Promise<[A, B, C]>)
	& (<A, B, C, D>(a: $Promisable<A>, b: $Promisable<B>, c: $Promisable<C>, d: $Promisable<D>) =>
	Promise<[A, B, C, D]>)

export const all: PromiseAllTyped = downcast((...promises) => Promise.all(promises))

/**
 * Map array of values to promise of arrays or array. Mapper function may return promise or value. If value is returned,
 * we avoid promise scheduling.
 *
 * This is needed to run the whole operation in one microtask (e.g. keep IndexedDB transaction active, which is closed in
 * some browsers (e.g. Safari) when event loop iteration ends).
 */
export function mapInCallContext<T, U>(values: T[], callback: (T) => Promise<U> | U): Promise<U[]> | U[] {
	return _mapInCallContext(values, callback, 0, [])
}

function _mapInCallContext<T, U>(values: T[], callback: (T) => Promise<U> | U, index: number, acc: U[]): U[] | Promise<U[]> {
	if (index >= values.length) {
		return acc
	}
	let mappedValue = callback(values[index])
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


export type PromiseMapFn = <T, U>(values: T[], callback: (T) => Promise<U> | U,
                                  concurrency?: Bluebird$ConcurrencyOption) => Promise<U[]> | U[]

export const promiseMapCompat = (useMapInCallContext: boolean): PromiseMapFn =>
	useMapInCallContext ? mapInCallContext : Promise.map

export function thenOrApply<A, R>(v: $Promisable<A>, mapper: (A) => R): R | Promise<R> {
	if (v instanceof Promise) {
		return v.then(mapper)
	} else {
		return mapper(v)
	}
}