import { downcast, neverNull } from "./Utils.js"

/**
 * Compares two arrays for equality based on ===.
 * @param {Array} a1 The first array.
 * @param {Array} a2 The second array.
 * @return {boolean} True if the arrays are equal, false otherwise.
 *
 * It is valid to compare Uint8Array to Array<T>, don't restrict it to be one type
 */
export function arrayEquals<T>(a1: ArrayLike<T>, a2: ArrayLike<T>): boolean {
	if (a1 === a2) {
		return true
	}

	if (a1.length === a2.length) {
		for (let i = 0; i < a1.length; i++) {
			if (a1[i] !== a2[i]) {
				return false
			}
		}

		return true
	}

	return false
}

/**
 * Compares two arrays for equality based on a predicate
 * @param a1
 * @param a2
 * @param predicate
 * @returns {boolean}
 */
export function arrayEqualsBy<T>(a1: ReadonlyArray<T>, a2: ReadonlyArray<T>, predicate: (arg0: T, arg1: T) => boolean): boolean {
	if (a1.length === a2.length) {
		for (let i = 0; i < a1.length; i++) {
			if (!predicate(a1[i], a2[i])) {
				return false
			}
		}

		return true
	}

	return false
}

/**
 * Remove the element from theArray if it is contained in the array.
 * @param theArray The array to remove the element from.
 * @param elementToRemove The element to remove from the array.
 * @return True if the element was removed, false otherwise.
 */
export function arrayRemove<T>(theArray: Array<T>, elementToRemove: T): boolean {
	let i = theArray.indexOf(elementToRemove)

	if (i !== -1) {
		theArray.splice(i, 1)
		return true
	} else {
		return false
	}
}

/**
 * truncates the array and discards all elements
 */
export function arrayClear(theArray: Array<unknown>): void {
	theArray.length = 0
}

/**
 * Find all items in an array that pass the given predicate
 */
export function arrayFindAll<T>(theArray: Array<T>, finder: (arg0: T) => boolean): Array<T> {
	const found: T[] = []

	for (let element of theArray) {
		if (finder(element)) {
			found.push(element)
		}
	}

	return found
}

/**
 * @param theArray
 * @param finder
 * @return {boolean} if the element was found
 */
export function arrayRemoveBy<T>(theArray: Array<T>, finder: (arg0: T) => boolean): boolean {
	const index = theArray.findIndex(finder)

	if (index !== -1) {
		theArray.splice(index, 1)
		return true
	} else {
		return false
	}
}

/** find all matches inside an array and remove them. returns true if any instances were removed. */
export function arrayRemoveAllBy<T>(theArray: Array<T>, finder: (arg0: T) => boolean, startIndex: number = 0): boolean {
	let removedElement = false

	for (let i = theArray.length - 1; i >= startIndex; i--) {
		if (finder(theArray[i])) {
			theArray.splice(i, 1)
			removedElement = true
		}
	}

	return removedElement
}

export function arrayReplace(theArray: Array<any>, oldElement: any, newElement: any): boolean {
	let i = theArray.indexOf(oldElement)

	if (i !== -1) {
		theArray.splice(i, 1, newElement)
		return true
	} else {
		return false
	}
}

/**
 * Same as filterMap in some languages. Apply mapper and then only include non-nullable items.
 */
export function arrayMapFilterNull<T, R>(array: ReadonlyArray<T>, mapper: (arg0: T) => R | null): Array<R> {
	const resultList: R[] = []

	for (const item of array) {
		const resultItem = mapper(item)

		if (resultItem != null) {
			resultList.push(resultItem)
		}
	}

	return resultList
}

export function arrayFilterNull<T>(array: ReadonlyArray<T | null>): Array<NonNullable<T>> {
	return downcast(array.filter((item) => item != null))
}

/**
 * Provides the last element of the given array.
 * @param theArray The array.
 * @return The last element of the array.
 */
export function arrayLast<T>(theArray: ReadonlyArray<T>): T | null {
	return theArray.length > 0 ? theArray[theArray.length - 1] : null
}

export function arrayIsEmpty(array: ReadonlyArray<unknown>): boolean {
	return array.length === 0
}

export function arrayIsNotEmpty(array: ReadonlyArray<unknown>): boolean {
	return array.length !== 0
}

export function arrayLastOrThrow<T>(array: ReadonlyArray<T>): T {
	if (arrayIsEmpty(array)) {
		throw new RangeError("Array is empty")
	}

	return neverNull(arrayLast(array))
}

/**
 * get first item or throw if there is none
 */
export function arrayFirstOrThrow<T>(array: ReadonlyArray<T>): T {
	if (arrayIsEmpty(array)) {
		throw new RangeError("Array is empty")
	}

	return array[0]
}

export function arrayFirst<T>(array: ReadonlyArray<T>): T | null {
	return array[0] ?? null
}

export function arrayFindLast<T>(array: ReadonlyArray<T>, predicate: (arg0: T) => boolean): T | null {
	const index = arrayLastIndexBy(array, predicate)

	if (index !== -1) {
		return array[index]
	}

	return null
}

export function arrayLastIndexBy<T>(array: ReadonlyArray<T>, predicate: (arg0: T) => boolean): number {
	for (let i = array.length - 1; i >= 0; i--) {
		if (predicate(array[i])) {
			return i
		}
	}

	return -1
}

export function arrayContains(theArray: ReadonlyArray<any>, elementToCheck: any): boolean {
	return theArray.indexOf(elementToCheck) !== -1
}

/**
 * count how many of the items in {@param theArray} return true when passed to the predicate {@param pred}
 */
export function arrayCount<T>(theArray: ReadonlyArray<T>, pred: (e: T) => boolean): number {
	return theArray.reduce<number>((acc, next) => (pred(next) ? ++acc : acc), 0)
}

export function arrayAddAll(array: Array<any>, elements: Array<any>): void {
	array.push(...elements)
}

export function arrayRemoveAll(array: Array<any>, elements: Array<any>): void {
	for (const element of elements) {
		arrayRemove(array, element)
	}
}

/**
 * split an array into chunks of a given size.
 * the last chunk will be smaller if there are less than chunkSize elements left.
 * if array is empty, the last (and only) chunk will be empty (i.e. `[[]]` gets returned)
 * @param chunkSize
 * @param array
 * @returns {Array<Array<T>>}
 */
export function arrayChunked<T>(chunkSize: number, array: ReadonlyArray<T>): Array<Array<T>> {
	return _chunkArray(chunkSize, array)
}

function _chunkArray<T>(chunkSize: number, array: ReadonlyArray<T>): Array<Array<T>> {
	if (chunkSize < 1) {
		return []
	}
	let chunkNum = 0
	const chunks: Array<Array<T>> = []
	let end
	do {
		let start = chunkNum * chunkSize
		end = start + chunkSize
		chunks[chunkNum] = array.slice(start, end)
		chunkNum++
	} while (end < array.length)
	return chunks
}

/**
 * Maps an array into a nested array and then flattens it
 * @param array
 * @param mapper
 * @returns {T|*[]}
 * @deprecated use `Array.protype.flatMap` instead
 */
export function flatMap<T, U>(array: ReadonlyArray<T>, mapper: (arg0: T) => Array<U>): Array<U> {
	const result: U[] = []
	for (const item of array) {
		const mapped = mapper(item)
		result.push(...mapped)
	}
	return result
}

/**
 * Inserts element into the sorted array. Will find <b>the last</b> matching position.
 * Might add or replace element based on {@param replaceIf} identity check.
 * Equality per {@param comparator} is precondition for replacement.
 * @param element to place
 * @param array where element should be placed
 * @param comparator for sorting
 * @param replaceIf identity comparison for replacement
 */
export function arrayInsertIntoSorted<T>(
	element: T,
	array: Array<T>,
	comparator: (left: T, right: T) => number,
	replaceIf: (newElement: T, existing: T) => boolean = () => false,
): void {
	let i = 0

	while (i < array.length) {
		const compareResult = comparator(array[i], element)

		// We need to check for replacement for each element that is equal or we might miss it
		if (compareResult === 0 && replaceIf(element, array[i])) {
			array.splice(i, 1, element)
			return
		} else if (compareResult <= 0) {
			// We continue searching until the last suitable position
			i++
		} else {
			break
		}
	}

	// This also handles empty array
	array.splice(i, 0, element)
}

export function arrayZip<A, B>(arr1: Array<A>, arr2: Array<B>): Array<[A, B]> {
	const zipped: Array<[A, B]> = []

	for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
		zipped.push([arr1[i], arr2[i]])
	}

	return zipped
}

export function arrayDeduplicated<T>(arr: Array<T>, comp: (arg0: T, arg1: T) => boolean = (a, b) => a === b): Array<T> {
	const deduplicated: T[] = []
	for (const a of arr) {
		const isDuplicate = deduplicated.some((b) => comp(a, b))

		if (!isDuplicate) {
			deduplicated.push(a)
		}
	}
	return deduplicated
}

/**
 * http://jsfiddle.net/aryzhov/pkfst550/
 * Binary search in JavaScript.
 * Returns the index of the element in a sorted array or (-n-1) where n is the insertion point for the new element.
 * Parameters:
 *     array - A sorted array
 *     element - An element to search for
 *     compareFn - A comparator function. The function takes two arguments: (a, b) and returns:
 *        a negative number  if a is less than b;
 *        0 if a is equal to b;
 *        a positive number of a is greater than b.
 * The array may contain duplicate elements. If there are more than one equal elements in the array,
 * the returned value can be the index of any one of the equal elements.
 */
export function arrayBinarySearch<T>(array: ReadonlyArray<T>, element: T, compareFn: (left: T, right: T) => number): number {
	let m = 0
	let n = array.length - 1

	while (m <= n) {
		const k = (n + m) >> 1
		const cmp = compareFn(element, array[k])

		if (cmp > 0) {
			m = k + 1
		} else if (cmp < 0) {
			n = k - 1
		} else {
			return k
		}
	}

	return -m - 1
}

export function arrayLastIndex<T>(array: ReadonlyArray<T>): number {
	if (array.length === 0) {
		return 0
	} else {
		return array.length - 1
	}
}

/**
 * Splits an array into two based on a predicate, where elements that match the predicate go into the left side.
 *
 * This exists in two overloads:
 *  - one that requires a type guard. Specifically, if an item is A | B and type guard is "item is A" it returns [Array<A>, Array<B>]
 *  - one that takes a plain predicate and returns two arrays of the same type, without type narrowing
 *
 * Please note that tsc cannot infer that a function is a type predicate/type guard. Declaring function as a type predicate is also unsafe.
 * see: https://github.com/microsoft/TypeScript/issues/16069
 *
 * @return a tuple of partitioned elements. The first array has all the matching elements and the second one has the rest.
 */
export function arrayPartitioned<Generic, Specific extends Generic>(
	array: ReadonlyArray<Generic>,
	predicate: (item: Generic) => item is Specific,
): [Array<Specific>, Array<Exclude<Generic, Specific>>]
export function arrayPartitioned<TL>(array: ReadonlyArray<TL>, predicate: (item: TL) => boolean): [Array<TL>, Array<TL>]
// this is an implementation signature and is not visible from the outside
export function arrayPartitioned<T>(array: ReadonlyArray<T>, predicate: (item: T) => boolean): [Array<T>, Array<T>] {
	const left: Array<T> = []
	const right: Array<T> = []

	for (let item of array) {
		if (predicate(item)) {
			left.push(item)
		} else {
			right.push(item)
		}
	}

	return [left, right]
}

/**
 * Like {@link arrayPartitioned}, but async and only for TL = TR.
 * Rejects if any of the predicates reject.
 */
export async function arrayPartitionedAsync<T>(array: Array<T>, predicate: (item: T) => Promise<boolean>): Promise<[Array<T>, Array<T>]> {
	const left: Array<T> = []
	const right: Array<T> = []

	for (let item of array) {
		if (await predicate(item)) {
			left.push(item)
		} else {
			right.push(item)
		}
	}

	return [left, right]
}

/**
 * Create an array with n elements by calling the provided factory
 */
export function arrayOf<T>(n: number, factory: (idx: number) => T): Array<T> {
	return new Array(n).map((_, idx) => factory(idx))
}

/**
 * Split the array at the given index, returning the left and right side.
 *
 * The element at the given index will be included in the right side if it exists. For example, splitting at index 3 for
 * `[0,1,2,3,4,5]` returns `[[0,1,2], [3,4,5]]`
 *
 * If `index >= array.length` then the right side will be an empty array, and the left side will be a shallow copy of
 * {@link array}.
 *
 * @param {Array} array array to split
 * @param {number} index index to split at (exclusive for left side, inclusive for right side)
 * @returns An array containing two arrays: all elements from 0 to {@link index} (exclusive), and all elements from
 *          {@link index} to the end.
 */
export function arraySplitAt<T>(array: readonly T[], index: number): [T[], T[]] {
	const left = array.slice(0, index)
	const right = array.slice(index)

	return [left, right]
}
