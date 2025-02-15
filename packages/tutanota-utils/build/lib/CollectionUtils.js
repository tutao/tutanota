import { identity } from "./Utils.js";
/**
 * Everything that is in both array1 and array2
 * This is a naive implementation, don't use it on large inputs
 */
export function intersection(set1, set2) {
    return new Set(Array.from(set1).filter((item) => set2.has(item)));
}
export function setEquals(set1, set2) {
    if (set1.size !== set2.size) {
        return false;
    }
    for (let item of set1) {
        if (!set2.has(item)) {
            return false;
        }
    }
    return true;
}
export function setMap(set, mapper) {
    const result = new Set();
    for (const item of set) {
        result.add(mapper(item));
    }
    return result;
}
export function min(set) {
    return minBy(set, identity);
}
export function minBy(collection, selector) {
    let min = null;
    for (const item of collection) {
        const value = selector(item);
        if (min == null || value < min.value) {
            min = { item, value };
        }
    }
    return min ? min.item : null;
}
export function max(set) {
    return maxBy(set, identity);
}
export function maxBy(collection, selector) {
    let max = null;
    for (const item of collection) {
        const value = selector(item);
        if (max == null || value > max.value) {
            max = { item, value };
        }
    }
    return max ? max.item : null;
}
export function setAddAll(set, toAdd) {
    for (const item of toAdd) {
        set.add(item);
    }
}
/**
 * Returns an element of the {@param collection} if it satisfies {@param selector} or {@code null} otherwise.
 */
export function findBy(collection, selector) {
    for (const item of collection) {
        if (selector(item)) {
            return item;
        }
    }
    return null;
}
export function mapWith(map, key, value) {
    const newMap = new Map(map);
    newMap.set(key, value);
    return newMap;
}
export function mapWithout(map, key) {
    const newMap = new Map(map);
    newMap.delete(key);
    return newMap;
}
/**
 * diff two maps by keys
 * @param before the map that's considered the old contents
 * @param after the map that's representing the current contents.
 * @returns arrays containing the kept, added, and deleted values.
 */
export function trisectingDiff(before, after) {
    const kept = [];
    const added = [];
    const deleted = [];
    const beforeScratch = new Map(before);
    const afterScratch = new Map(after);
    for (const [k, v] of beforeScratch.entries()) {
        beforeScratch.delete(k);
        if (afterScratch.has(k)) {
            afterScratch.delete(k);
            kept.push(v);
        }
        else {
            deleted.push(v);
        }
    }
    for (const v of afterScratch.values()) {
        added.push(v);
    }
    return { kept, added, deleted };
}
