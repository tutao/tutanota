//@flow

import {identity, neverNull} from "./Utils"
import {getFromMap} from "./MapUtils"

export function concat(...arrays: Uint8Array[]): Uint8Array {
	let length = arrays.reduce((previous, current) => previous + current.length, 0)
	let result = new Uint8Array(length)
	let index = 0
	arrays.forEach(array => {
		result.set(array, index)
		index += array.length
	})
	return result
}

export function numberRange(min: number, max: number): Array<number> {
	return [...Array(max + 1).keys()].slice(min)
}

/**
 * Compares two arrays for equality.
 * @param {Array} a1 The first array.
 * @param {Array} a2 The second array.
 * @return {boolean} True if the arrays are equal, false otherwise.
 *
 * It is valid to compare Uint8Array to Array<T>, don't restrict it to be one type
 */
export function arrayEquals<T, A: Uint8Array | Array<T>>(a1: A, a2: A) {
	if (a1.length === a2.length) {
		for (let i = 0; i < a1.length; i++) {
			if (a1[i] !== a2[i]) {
				return false;
			}
		}
		return true;
	}
	return false;
}

export function arrayHash(array: Uint8Array): number {
	let hash = 0;
	hash |= 0;
	for (let i = 0; i < array.length; i++) {
		hash = ((hash << 5) - hash) + array[i];
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}

/**
 * Remove the element from theArray if it is contained in the array.
 * @param theArray The array to remove the element from.
 * @param elementToRemove The element to remove from the array.
 * @return True if the element was removed, false otherwise.
 */
export function remove(theArray: Array<any>, elementToRemove: any): boolean {
	let i = theArray.indexOf(elementToRemove)
	if (i !== -1) {
		theArray.splice(i, 1)
		return true;
	} else {
		return false;
	}
}

export function findAndRemove<T>(theArray: Array<T>, finder: finder<T>): boolean {
	const index = theArray.findIndex(finder)
	if (index !== -1) {
		theArray.splice(index, 1)
		return true
	} else {
		return false
	}
}

export function findAllAndRemove<T>(theArray: Array<T>, finder: finder<T>): boolean {
	var removedElement = false
	for (var i = theArray.length - 1; i >= 0; i--) {
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
		return true;
	} else {
		return false;
	}
}

export function mapAndFilterNull<T, R>(theArray: Array<T>, mapper: mapper<T, R>): R[] {
	let resultList = []
	theArray.forEach(item => {
		let resultItem = mapper(item)
		if (resultItem) {
			resultList.push(resultItem)
		}
	})
	return resultList
}

/**
 * Provides the last element of the given array.
 * @param theArray The array.
 * @return The last element of the array.
 */
export function last<T>(theArray: $ReadOnlyArray<T>): ?T {
	return theArray[theArray.length - 1];
}

export function isEmpty<T>(array: $ReadOnlyArray<T>): boolean {
	return array.length === 0
}

export function lastThrow<T>(array: $ReadOnlyArray<T>): T {
	if (isEmpty(array)) {
		throw new RangeError("Array is empty")
	}
	return neverNull(last(array))
}

export function findLast<T>(array: Array<T>, predicate: (T) => boolean): ?T {
	const index = findLastIndex(array, predicate)
	if (index !== -1) {
		return array[index]
	}
	return null
}

export function findLastIndex<T>(array: Array<T>, predicate: (T) => boolean): number {
	for (let i = array.length - 1; i >= 0; i--) {
		if (predicate(array[i])) {
			return i
		}
	}
	return -1
}

export function contains(theArray: Array<any>, elementToCheck: any): boolean {
	return theArray.indexOf(elementToCheck) !== -1
}

export function addAll(array: Array<any>, elements: Array<any>) {
	array.push.apply(array, elements)
}

export function removeAll(array: Array<any>, elements: Array<any>) {
	elements.forEach(element => {
		remove(array, element)
	})
}

export function groupByAndMap<T, R, E>(iterable: Iterable<T>, separator: (T) => R, mapper: (T) => E): Map<R, Array<E>> {
	const map = new Map()
	for (let el of iterable) {
		const key = separator(el)
		getFromMap(map, key, () => []).push(mapper(el))
	}
	return map
}

export function groupBy<T, R>(iterable: Iterable<T>, separator: (T) => R): Map<R, Array<T>> {
	return groupByAndMap(iterable, separator, identity)
}

export function splitInChunks<T>(chunkSize: number, array: Array<T>): Array<Array<T>> {
	if (chunkSize < 1) {
		return []
	}
	let chunkNum = 0
	const chunks = []
	let end
	do {
		let start = chunkNum * chunkSize
		end = start + chunkSize
		chunks[chunkNum] = array.slice(start, end)
		chunkNum++
	} while (end < array.length)
	return chunks
}

export function flat<T>(arrays: Array<Array<T>>): Array<T> {
	return arrays.reduce((acc, val) => {
		acc.push(...val)
		return acc
	}, [])
}
