import { neverNull } from "./Utils.js";
/**
 * Merges multiple maps into a single map with lists of values.
 * @param maps
 */
export function mergeMaps(maps) {
    return maps.reduce((mergedMap, map) => {
        // merge same key of multiple attributes
        for (const [key, value] of map.entries()) {
            if (mergedMap.has(key)) {
                neverNull(mergedMap.get(key)).push(value);
            }
            else {
                mergedMap.set(key, [value]);
            }
        }
        return mergedMap;
    }, new Map());
}
export function getFromMap(map, key, byDefault) {
    let value = map.get(key);
    if (!value) {
        value = byDefault();
        map.set(key, value);
    }
    return value;
}
/** Creates a new map with key and value added to {@param map}. It is like set() but for immutable map. */
export function addMapEntry(map, key, value) {
    const newMap = new Map(map);
    newMap.set(key, value);
    return newMap;
}
export function deleteMapEntry(map, key) {
    const newMap = new Map(map);
    newMap.delete(key);
    return newMap;
}
/**
 * Convert values of {@param map} using {@param mapper} like {@link Array.prototype.map},
 */
export function mapMap(map, mapper) {
    const resultMap = new Map();
    for (const [key, oldValue] of map) {
        const newValue = mapper(oldValue);
        resultMap.set(key, newValue);
    }
    return resultMap;
}
