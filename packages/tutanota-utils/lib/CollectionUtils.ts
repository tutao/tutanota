/**
 * Everything that is in both array1 and array2
 * This is a naive implementation, don't use it on large inputs
 */
export function intersection<T>(set1: Set<T>, set2: Set<T>): Set<T> {
	return new Set(Array.from(set1).filter((item) => set2.has(item)))
}

export function min<T extends Iterable<number>>(set: T): number | null {
	let min = null
	for (const item of set) {
		if (min == null || item < min) {
			min = item
		}
	}
	return min
}

export function max<T extends Iterable<number>>(set: T): number | null {
	let max = null
	for (const item of set) {
		if (max == null || item > max) {
			max = item
		}
	}
	return max
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
