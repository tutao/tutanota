import { neverNull } from "./Utils.js"

/**
 * Merges multiple maps into a single map with lists of values.
 * @param maps
 */
export function mergeMaps<T>(maps: Map<string, T>[]): Map<string, T[]> {
	return maps.reduce((mergedMap: Map<string, T[]>, map: Map<string, T>) => {
		// merge same key of multiple attributes
		map.forEach((value: T, key: string) => {
			if (mergedMap.has(key)) {
				neverNull(mergedMap.get(key)).push(value)
			} else {
				mergedMap.set(key, [value])
			}
		})
		return mergedMap
	}, new Map())
}

export function getFromMap<K, V>(map: Map<K, V>, key: K, byDefault: () => V): V {
	let value = map.get(key)

	if (!value) {
		value = byDefault()
		map.set(key, value)
	}

	return value
}

/** Creates a new map with key and value added to {@param map}. It is like set() but for immutable map. */
export function addMapEntry<K, V>(map: ReadonlyMap<K, V>, key: K, value: V): Map<K, V> {
	const newMap = new Map(map)
	newMap.set(key, value)
	return newMap
}

export function deleteMapEntry<K, V>(map: ReadonlyMap<K, V>, key: K): Map<K, V> {
	const newMap = new Map(map)
	newMap.delete(key)
	return newMap
}
