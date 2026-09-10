import { identity } from "./Utils.js"
import { getFromMap } from "./MapUtils"

/**
 * Everything that is in both array1 and array2
 * This is a naive implementation, don't use it on large inputs
 */
export function intersection<T>(set1: Set<T>, set2: Set<T>): Set<T> {
	return new Set(Array.from(set1).filter((item) => set2.has(item)))
}

export function setEquals<T>(set1: ReadonlySet<T>, set2: ReadonlySet<T>): boolean {
	if (set1.size !== set2.size) {
		return false
	}
	for (let item of set1) {
		if (!set2.has(item)) {
			return false
		}
	}
	return true
}

export function setMap<T, R>(set: ReadonlySet<T>, mapper: (item: T) => R): Set<R> {
	const result = new Set<R>()
	for (const item of set) {
		result.add(mapper(item))
	}
	return result
}

export function min<T extends Iterable<number>>(set: T): number | null {
	return minBy(set, identity)
}

export type MinByResult<T> = { item: T; value: number }
export type MaxByResult<T> = { item: T; value: number }

export function minBy<E, T extends Iterable<E>>(collection: T, selector: (item: E) => number): E | null {
	let min: MinByResult<E> | null = null
	for (const item of collection) {
		const value = selector(item)
		if (min == null || value < min.value) {
			min = { item, value }
		}
	}
	return min?.item ?? null
}

export function max<T extends Iterable<number>>(set: T): number | null {
	return maxBy(set, identity)
}

export function maxBy<E, T extends Iterable<E>>(collection: T, selector: (item: E) => number): E | null {
	let max: MaxByResult<E> | null = null
	for (const item of collection) {
		const value = selector(item)
		if (max == null || value > max.value) {
			max = { item, value }
		}
	}
	return max?.item ?? null
}

export function setAddAll<T>(set: Set<T>, toAdd: Iterable<T>): void {
	for (const item of toAdd) {
		set.add(item)
	}
}

/**
 * Returns an element of the {@param collection} if it satisfies {@param selector} or {@code null} otherwise.
 */
export function findBy<T>(collection: Iterable<T>, selector: (item: T) => boolean): T | null {
	for (const item of collection) {
		if (selector(item)) {
			return item
		}
	}
	return null
}

export function mapWith<K, V>(map: ReadonlyMap<K, V>, key: K, value: V): Map<K, V> {
	const newMap = new Map(map)
	newMap.set(key, value)
	return newMap
}

export function mapWithout<K, V>(map: ReadonlyMap<K, V>, key: K): Map<K, V> {
	const newMap = new Map(map)
	newMap.delete(key)
	return newMap
}

export type TrisectionResult<T> = {
	kept: Array<T>
	added: Array<T>
	deleted: Array<T>
}

/**
 * diff two maps by keys
 * @param before the map that's considered the old contents
 * @param after the map that's representing the current contents.
 * @returns arrays containing the kept, added, and deleted values.
 */
export function trisectingDiff<T>(before: ReadonlyMap<unknown, T>, after: ReadonlyMap<unknown, T>): TrisectionResult<T> {
	const kept: Array<T> = []
	const added: Array<T> = []
	const deleted: Array<T> = []

	const beforeScratch = new Map(before)
	const afterScratch = new Map(after)

	for (const [k, v] of beforeScratch.entries()) {
		beforeScratch.delete(k)
		if (afterScratch.has(k)) {
			afterScratch.delete(k)
			kept.push(v)
		} else {
			deleted.push(v)
		}
	}

	for (const v of afterScratch.values()) {
		added.push(v)
	}

	return { kept, added, deleted }
}

/**
 * return a new set containing every item from {@param set1} that isn't in {@param set2}
 */
export function setDifference<T>(set1: ReadonlySet<T>, set2: ReadonlySet<T>): Set<T> {
	const result = new Set<T>()
	for (const item of set1) {
		if (!set2.has(item)) {
			result.add(item)
		}
	}
	return result
}

/**
 * Count a sum of all numbers in {@param collection}
 */
export function collectionSum(collection: Iterable<number>): number {
	let sum = 0
	for (const item of collection) {
		sum += item
	}
	return sum
}

/**
 * Return a new collection with only unique members of {@param collection} when mapping each via {@param discriminator}
 */
export function collectionUniqueBy<T>(collection: Iterable<T>, discriminator: (item: T) => string): ArrayIterator<T> {
	const map = new Map()
	for (const item of collection) {
		map.set(discriminator(item), item)
	}
	return map.values()
}
/**
 * Group an array based on the given discriminator, but each group will have only unique items
 */
export function iterableGroupedUniqByMapped<T, R, E>(iterable: Iterable<T>, discriminator: (arg0: T) => R, mapper: (arg0: T) => E): Map<R, Set<E>> {
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
export function iterableGroupedByMapped<T, R, E>(iterable: Iterable<T>, discriminator: (arg0: T) => R, mapper: (arg0: T) => E): Map<R, Array<E>> {
	const map = new Map()

	for (const el of iterable) {
		const key = discriminator(el)
		getFromMap(map, key, () => Array<E>()).push(mapper(el))
	}

	return map
}

/**
 * Group array elements based on keys produced by a discriminator
 * @param iterable the array to split into groups
 * @param discriminator a function that produces the keys to group the elements by
 * @returns {NodeJS.Global.Map<R, Array<T>>}
 */
export function iterableGroupedBy<T, R>(iterable: Iterable<T>, discriminator: (arg0: T) => R): Map<R, Array<T>> {
	return iterableGroupedByMapped(iterable, discriminator, identity)
}

/**
 * Collect an iterable into a map based on {@param keyExtractor}.
 */
export function iterableCollectToMap<T, R>(iterable: Iterable<T>, keyExtractor: (element: T) => R): Map<R, T> {
	const map = new Map()
	for (const el of iterable) {
		const key = keyExtractor(el)
		if (map.has(key)) {
			throw new Error(`The elements of iterable are not unique, duplicated key: ${key}`)
		}
		map.set(key, el)
	}
	return map
}

/**
 * All of the elements in all of the arguments combined, and deduplicated
 */
export function iterableUnion<T>(...iterables: Array<Iterable<T>>): Set<T> {
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
export function iterableDifference<T>(array1: ReadonlyArray<T>, array2: ReadonlyArray<T>, compare: (l: T, r: T) => boolean = (a, b) => a === b): Array<T> {
	return array1.filter((element1) => !array2.some((element2) => compare(element1, element2)))
}

/**
 * Returns a set with elements that are *not* in both sets.
 *
 * {a, b, c} △ {b, c, d} == {a, d}
 */
export function setSymmetricDifference<T>(set1: ReadonlySet<T>, set2: ReadonlySet<T>): Set<T> {
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
 * Create an array filled with the numbers min..max (inclusive)
 */
export function numberRange(min: number, max: number): Array<number> {
	return [...Array(max + 1).keys()].slice(min)
}

/**
 * Create a generator for integer range in [min; max).
 */
export function* lazyNumberRange(min: number, max: number): Generator<number> {
	let current = min

	while (current < max) {
		yield current
		current++
	}
}
