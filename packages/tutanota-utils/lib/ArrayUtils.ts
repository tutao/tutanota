import { downcast, identity, neverNull } from "./Utils.js"
import { getFromMap } from "./MapUtils.js"

export function concat(...arrays: Uint8Array[]): Uint8Array {
	let length = arrays.reduce((previous, current) => previous + current.length, 0)
	let result = new Uint8Array(length)
	let index = 0
	for (const array of arrays) {
		result.set(array, index)
		index += array.length
	}
	return result
}

/**
 * Create an array filled with the numbers min..max (inclusive)
 */
export function numberRange(min: number, max: number): Array<number> {
	return [...Array(max + 1).keys()].slice(min)
}

/**
 * Compares two arrays for equality based on ===.
 * @param {Array} a1 The first array.
 * @param {Array} a2 The second array.
 * @return {boolean} True if the arrays are equal, false otherwise.
 *
 * It is valid to compare Uint8Array to Array<T>, don't restrict it to be one type
 */
export function arrayEquals<T, A extends Uint8Array | Array<T>>(a1: A, a2: A): boolean {
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
export function arrayEqualsWithPredicate<T>(a1: ReadonlyArray<T>, a2: ReadonlyArray<T>, predicate: (arg0: T, arg1: T) => boolean): boolean {
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

export function arrayHash(array: Uint8Array): number {
	let hash = 0
	hash |= 0

	for (let i = 0; i < array.length; i++) {
		hash = (hash << 5) - hash + array[i]
		hash |= 0 // Convert to 32bit integer
	}

	return hash
}

/**
 * Remove the element from theArray if it is contained in the array.
 * @param theArray The array to remove the element from.
 * @param elementToRemove The element to remove from the array.
 * @return True if the element was removed, false otherwise.
 */
export function remove<T>(theArray: Array<T>, elementToRemove: T): boolean {
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
export function clear(theArray: Array<unknown>): void {
	theArray.length = 0
}

/**
 * Find all items in an array that pass the given predicate
 */
export function findAll<T>(theArray: Array<T>, finder: (arg0: T) => boolean): Array<T> {
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
export function findAndRemove<T>(theArray: Array<T>, finder: (arg0: T) => boolean): boolean {
	const index = theArray.findIndex(finder)

	if (index !== -1) {
		theArray.splice(index, 1)
		return true
	} else {
		return false
	}
}

/** find all matches inside an array and remove them. returns true if any instances were removed. */
export function findAllAndRemove<T>(theArray: Array<T>, finder: (arg0: T) => boolean, startIndex: number = 0): boolean {
	let removedElement = false

	for (let i = theArray.length - 1; i >= startIndex; i--) {
		if (finder(theArray[i])) {
			theArray.splice(i, 1)
			removedElement = true
		}
	}

	return removedElement
}

export function replace(theArray: Array<any>, oldElement: any, newElement: any): boolean {
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
export function mapAndFilterNull<T, R>(array: ReadonlyArray<T>, mapper: (arg0: T) => R | null | undefined): Array<R> {
	const resultList: R[] = []

	for (const item of array) {
		const resultItem = mapper(item)

		if (resultItem != null) {
			resultList.push(resultItem)
		}
	}

	return resultList
}

export function filterNull<T>(array: ReadonlyArray<T | null | undefined>): Array<T> {
	return downcast(array.filter((item) => item != null))
}

/**
 * Provides the last element of the given array.
 * @param theArray The array.
 * @return The last element of the array.
 */
export function last<T>(theArray: ReadonlyArray<T>): T | null | undefined {
	return theArray[theArray.length - 1]
}

export function isEmpty<T>(array: ReadonlyArray<T>): boolean {
	return array.length === 0
}

export function isNotEmpty(array: ReadonlyArray<unknown>): boolean {
	return array.length != 0
}

export function lastThrow<T>(array: ReadonlyArray<T>): T {
	if (isEmpty(array)) {
		throw new RangeError("Array is empty")
	}

	return neverNull(last(array))
}

/**
 * get first item or throw if there is none
 */
export function getFirstOrThrow<T>(array: ReadonlyArray<T>): T {
	if (isEmpty(array)) {
		throw new RangeError("Array is empty")
	}

	return array[0]
}

export function first<T>(array: ReadonlyArray<T>): T | null {
	return array[0] || null
}

export function findLast<T>(array: ReadonlyArray<T>, predicate: (arg0: T) => boolean): T | null | undefined {
	const index = findLastIndex(array, predicate)

	if (index !== -1) {
		return array[index]
	}

	return null
}

export function findLastIndex<T>(array: ReadonlyArray<T>, predicate: (arg0: T) => boolean): number {
	for (let i = array.length - 1; i >= 0; i--) {
		if (predicate(array[i])) {
			return i
		}
	}

	return -1
}

export function contains(theArray: ReadonlyArray<any>, elementToCheck: any): boolean {
	return theArray.indexOf(elementToCheck) !== -1
}

/**
 * count how many of the items in {@param theArray} return true when passed to the predicate {@param pred}
 */
export function count<T>(theArray: ReadonlyArray<T>, pred: (e: T) => boolean): number {
	return theArray.reduce<number>((acc, next) => (pred(next) ? ++acc : acc), 0)
}

export function addAll(array: Array<any>, elements: Array<any>) {
	array.push(...elements)
}

export function removeAll(array: Array<any>, elements: Array<any>) {
	for (const element of elements) {
		remove(array, element)
	}
}

/**
 * Group an array based on the given discriminator, but each group will have only unique items
 */
export function groupByAndMapUniquely<T, R, E>(iterable: Iterable<T>, discriminator: (arg0: T) => R, mapper: (arg0: T) => E): Map<R, Set<E>> {
	const map = new Map()

	for (let el of iterable) {
		const key = discriminator(el)
		getFromMap(map, key, () => new Set()).add(mapper(el))
	}

	return map
}

/**
 * convert an Array of T's into a Map of Arrays of E's by
 * * grouping them based on a discriminator
 * * mapping them from T to E
 * @param iterable the array to split into groups
 * @param discriminator a function that produces the keys to group the elements by
 * @param mapper a function that maps the array elements before they get added to the group
 * @returns {Map<R, Array<E>>}
 */
export function groupByAndMap<T, R, E>(iterable: Iterable<T>, discriminator: (arg0: T) => R, mapper: (arg0: T) => E): Map<R, Array<E>> {
	const map = new Map()

	for (const el of iterable) {
		const key = discriminator(el)
		getFromMap(map, key, () => []).push(mapper(el))
	}

	return map
}

/**
 * Group array elements based on keys produced by a discriminator
 * @param iterable the array to split into groups
 * @param discriminator a function that produces the keys to group the elements by
 * @returns {NodeJS.Global.Map<R, Array<T>>}
 */
export function groupBy<T, R>(iterable: Iterable<T>, discriminator: (arg0: T) => R): Map<R, Array<T>> {
	return groupByAndMap(iterable, discriminator, identity)
}

/**
 * split an array into chunks of a given size.
 * the last chunk will be smaller if there are less than chunkSize elements left.
 * @param chunkSize
 * @param array
 * @returns {Array<Array<T>>}
 */
export function splitInChunks<T>(chunkSize: number, array: Array<T>): Array<Array<T>> {
	return downcast(_chunk(chunkSize, array))
}

export function splitUint8ArrayInChunks(chunkSize: number, array: Uint8Array): Array<Uint8Array> {
	return downcast(_chunk(chunkSize, array))
}

function _chunk<T>(chunkSize: number, array: Array<T> | Uint8Array): Array<Array<T> | Uint8Array> {
	if (chunkSize < 1) {
		return []
	}

	let chunkNum = 0
	const chunks: Array<Array<T> | Uint8Array> = []
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
export function insertIntoSortedArray<T>(
	element: T,
	array: Array<T>,
	comparator: (left: T, right: T) => number,
	replaceIf: (newElement: T, existing: T) => boolean = () => false,
) {
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

export function zip<A, B>(arr1: Array<A>, arr2: Array<B>): Array<[A, B]> {
	const zipped: Array<[A, B]> = []

	for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
		zipped.push([arr1[i], arr2[i]])
	}

	return zipped
}

export function deduplicate<T>(arr: Array<T>, comp: (arg0: T, arg1: T) => boolean = (a, b) => a === b): Array<T> {
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
export function binarySearch<T>(array: ReadonlyArray<T>, element: T, compareFn: (left: T, right: T) => number): number {
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

export function lastIndex<T>(array: ReadonlyArray<T>): number {
	if (array.length === 0) {
		return 0
	} else {
		return array.length - 1
	}
}

/**
 * All of the elements in all of the arguments combined, and deduplicated
 */
export function union<T>(...iterables: Array<Iterable<T>>): Set<T> {
	return new Set(...iterables.map((iterable) => Array.from(iterable)))
}

/**
 * return a new array containing every item from array1 that isn't in array2
 * @template T
 * @param array1
 * @param array2
 * @param compare {(l: T, r: T) => boolean} compare items in the array for equality
 * @returns {Array<T>}
 */
export function difference<T>(array1: ReadonlyArray<T>, array2: ReadonlyArray<T>, compare: (l: T, r: T) => boolean = (a, b) => a === b): Array<T> {
	return array1.filter((element1) => !array2.some((element2) => compare(element1, element2)))
}

/**
 * Returns a set with elements that are *not* in both sets.
 *
 * {a, b, c} △ {b, c, d} == {a, d}
 */
export function symmetricDifference<T>(set1: ReadonlySet<T>, set2: ReadonlySet<T>): Set<T> {
	const diff = new Set<T>()

	for (const el of set1) {
		if (!set2.has(el)) {
			diff.add(el)
		}
	}

	for (const el of set2) {
		if (!set1.has(el)) {
			diff.add(el)
		}
	}

	return diff
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
 */
export function partition<Generic, Specific extends Generic>(
	array: ReadonlyArray<Generic>,
	predicate: (item: Generic) => item is Specific,
): [Array<Specific>, Array<Exclude<Generic, Specific>>]
export function partition<TL>(array: ReadonlyArray<TL>, predicate: (item: TL) => boolean): [Array<TL>, Array<TL>]
// this is an implementation signature and is not visible from the outside
export function partition<T>(array: ReadonlyArray<T>, predicate: any): [Array<T>, Array<T>] {
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
 * Like {@link partition}, but async and only for TL = TR.
 * Rejects if any of the predicates reject.
 */
export async function partitionAsync<T>(array: Array<T>, predicate: (item: T) => Promise<boolean>): Promise<[Array<T>, Array<T>]> {
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
	return numberRange(0, n - 1).map(factory)
}

/**
 * Destroy contents of the byte arrays passed. Useful for purging unwanted memory.
 */
export function zeroOut(...arrays: (Uint8Array | Int8Array)[]) {
	for (const a of arrays) {
		a.fill(0)
	}
}

/**
 * @return 1 if first is bigger than second, -1 if second is bigger than first and 0 otherwise
 */
export function compare(first: Uint8Array, second: Uint8Array): number {
	if (first.length > second.length) {
		return 1
	} else if (first.length < second.length) {
		return -1
	}

	for (let i = 0; i < first.length; i++) {
		const a = first[i]
		const b = second[i]
		if (a > b) {
			return 1
		} else if (a < b) {
			return -1
		}
	}

	return 0
}
