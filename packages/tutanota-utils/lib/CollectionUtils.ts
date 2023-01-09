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
