import { identity } from "./Utils.js"

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

export function minBy<E, T extends Iterable<E>>(collection: T, selector: (item: E) => number): E | null {
	let min: { item: E; value: number } | null = null
	for (const item of collection) {
		const value = selector(item)
		if (min == null || value < min.value) {
			min = { item, value }
		}
	}
	return min ? min.item : null
}

export function max<T extends Iterable<number>>(set: T): number | null {
	return maxBy(set, identity)
}

export function maxBy<E, T extends Iterable<E>>(collection: T, selector: (item: E) => number): E | null {
	let max: { item: E; value: number } | null = null
	for (const item of collection) {
		const value = selector(item)
		if (max == null || value > max.value) {
			max = { item, value }
		}
	}
	return max ? max.item : null
}

export function setAddAll<T>(set: Set<T>, toAdd: Iterable<T>) {
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

/**
 * diff two maps by keys
 * @param before the map that's considered the old contents
 * @param after the map that's representing the current contents.
 * @returns arrays containing the kept, added, and deleted values.
 */
export function trisectingDiff<T>(
	before: ReadonlyMap<unknown, T>,
	after: ReadonlyMap<unknown, T>,
): {
	kept: Array<T>
	added: Array<T>
	deleted: Array<T>
} {
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
