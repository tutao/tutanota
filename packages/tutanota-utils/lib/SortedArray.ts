import { findAndRemove, insertIntoSortedArray } from "./ArrayUtils.js"

export type CompareFn<T> = (arg0: T, arg1: T) => number

/**
 * Compared based on the type's natural ordering
 */
function numberCompare(a: number, b: number): number {
	return a < b ? -1 : a > b ? 1 : 0
}

/**
 * An array that keeps itself sorted
 */
export class SortedArray<T> {
	private constructor(private contents: T[], private compareFn: CompareFn<T>) {}

	static fromNumbers(array: ReadonlyArray<number>): SortedArray<number> {
		return SortedArray.from(array, numberCompare)
	}

	static empty<U>(compareFn: CompareFn<U>): SortedArray<U> {
		return new SortedArray<U>([], compareFn)
	}

	static from<U>(array: ReadonlyArray<U>, compareFn: CompareFn<U>): SortedArray<U> {
		const list = new SortedArray<U>([], compareFn)
		list.insertAll(array)
		return list
	}

	get length(): number {
		return this.contents.length
	}

	get array(): ReadonlyArray<T> {
		return this.contents
	}

	get(index: number): T {
		return this.contents[index]
	}

	insertAll(array: ReadonlyArray<T>) {
		this.contents.push(...array)

		this.contents.sort(this.compareFn)
	}

	insert(item: T): void {
		insertIntoSortedArray(item, this.contents, this.compareFn)
	}

	removeFirst(finder: (arg0: T) => boolean): boolean {
		return findAndRemove(this.contents, finder)
	}
}
