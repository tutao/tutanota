import { neverNull } from "./Utils.js"

/**
 * Merges multiple maps into a single map with lists of values.
 * @param maps
 */
export function mergeMaps<T>(maps: Map<string, T>[]): Map<string, T[]> {
	return maps.reduce((mergedMap: Map<string, T[]>, map: Map<string, T>) => {
		// merge same key of multiple attributes
		for (const [key, value] of map.entries()) {
			if (mergedMap.has(key)) {
				neverNull(mergedMap.get(key)).push(value)
			} else {
				mergedMap.set(key, [value])
			}
		}
		return mergedMap
	}, new Map())
}

/**
 * Gets an item from the map and returns it.
 *
 * In the case that the key-value pair was not present OR !!value === false (such as null or undefined), then
 * {@link byDefault} will be called, and its return value will be inserted into the map and returned.
 */
export function getFromMap<K, V>(map: Map<K, V>, key: K, byDefault: () => V): V {
	let value = map.get(key)

	if (!value) {
		value = byDefault()
		map.set(key, value)
	}

	return value
}

/**
 * Removes an item from the map and returns it.
 *
 * In the case that the key-value pair was present but its value was undefined, you can read wasPresent to
 * check that it was present (and therefore deleted).
 */
export function takeFromMap<K, V>(map: Map<K, V>, key: K): { item: V | undefined; wasPresent: boolean } {
	// Will return undefined if not present OR the value is actually === undefined
	const item = map.get(key)

	// Map#delete both removes the key-value and returns true/false if the key-value was present/absent
	const wasPresent = map.delete(key)

	return { item, wasPresent }
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

/**
 * Convert values of {@param map} using {@param mapper} like {@link Array.prototype.map},
 */
export function mapMap<K, V, R>(map: ReadonlyMap<K, V>, mapper: (value: V) => R): Map<K, R> {
	const resultMap = new Map<K, R>()
	for (const [key, oldValue] of map) {
		const newValue = mapper(oldValue)
		resultMap.set(key, newValue)
	}
	return resultMap
}
