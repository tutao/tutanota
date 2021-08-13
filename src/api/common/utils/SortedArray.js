// @flow

import {findAndRemove, insertIntoSortedArray} from "./ArrayUtils"

export type CompareFn<T> = (T, T) => number

/**
 * Compared based on the type's natural ordering
 * @param a
 * @param b
 * @returns {number}
 */
// <T: Object> to get flow off my back about using comparison operator
// It should be fine for 99% of use cases? worst case it just returns 0 always
function defaultCompare<T: Object>(a: T, b: T): number {
	return a < b
		? -1
		: a > b
			? 1 : 0
}

/**
 * An array that keeps itself sorted
 */
export class SortedArray<T> {
	+_contents: Array<T>
	+_compareFn: CompareFn<T>

	constructor(compareFn: CompareFn<T> = defaultCompare) {
		this._contents = []
		this._compareFn = compareFn
	}

	static from(array: $ReadOnlyArray<T>, compareFn?: CompareFn<T>): SortedArray<T> {
		const list = new SortedArray<T>(compareFn)
		list.insertAll(array)
		return list
	}

	get length(): number {
		return this._contents.length
	}

	get array(): $ReadOnlyArray<T> {
		return this._contents
	}

	get(index: number): T {
		return this._contents[index]
	}

	insertAll(array: $ReadOnlyArray<T>) {
		this._contents.push(...array)
		this._contents.sort(this._compareFn)
	}

	insert(item: T): void {
		insertIntoSortedArray(item, this._contents, this._compareFn)
	}

	removeFirst(finder: (T) => boolean): boolean {
		return findAndRemove(this._contents, finder)
	}
}


