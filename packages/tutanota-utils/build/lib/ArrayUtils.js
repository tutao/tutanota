import { downcast, identity, neverNull } from "./Utils.js";
import { getFromMap } from "./MapUtils.js";
export function concat(...arrays) {
    let length = arrays.reduce((previous, current) => previous + current.length, 0);
    let result = new Uint8Array(length);
    let index = 0;
    for (const array of arrays) {
        result.set(array, index);
        index += array.length;
    }
    return result;
}
/**
 * Create an array filled with the numbers min..max (inclusive)
 */
export function numberRange(min, max) {
    return [...Array(max + 1).keys()].slice(min);
}
/**
 * Compares two arrays for equality based on ===.
 * @param {Array} a1 The first array.
 * @param {Array} a2 The second array.
 * @return {boolean} True if the arrays are equal, false otherwise.
 *
 * It is valid to compare Uint8Array to Array<T>, don't restrict it to be one type
 */
export function arrayEquals(a1, a2) {
    if (a1 === a2) {
        return true;
    }
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
/**
 * Compares two arrays for equality based on a predicate
 * @param a1
 * @param a2
 * @param predicate
 * @returns {boolean}
 */
export function arrayEqualsWithPredicate(a1, a2, predicate) {
    if (a1.length === a2.length) {
        for (let i = 0; i < a1.length; i++) {
            if (!predicate(a1[i], a2[i])) {
                return false;
            }
        }
        return true;
    }
    return false;
}
export function arrayHash(array) {
    let hash = 0;
    hash |= 0;
    for (let i = 0; i < array.length; i++) {
        hash = (hash << 5) - hash + array[i];
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
export function remove(theArray, elementToRemove) {
    let i = theArray.indexOf(elementToRemove);
    if (i !== -1) {
        theArray.splice(i, 1);
        return true;
    }
    else {
        return false;
    }
}
/**
 * truncates the array and discards all elements
 */
export function clear(theArray) {
    theArray.length = 0;
}
/**
 * Find all items in an array that pass the given predicate
 */
export function findAll(theArray, finder) {
    const found = [];
    for (let element of theArray) {
        if (finder(element)) {
            found.push(element);
        }
    }
    return found;
}
/**
 * @param theArray
 * @param finder
 * @return {boolean} if the element was found
 */
export function findAndRemove(theArray, finder) {
    const index = theArray.findIndex(finder);
    if (index !== -1) {
        theArray.splice(index, 1);
        return true;
    }
    else {
        return false;
    }
}
/** find all matches inside an array and remove them. returns true if any instances were removed. */
export function findAllAndRemove(theArray, finder, startIndex = 0) {
    let removedElement = false;
    for (let i = theArray.length - 1; i >= startIndex; i--) {
        if (finder(theArray[i])) {
            theArray.splice(i, 1);
            removedElement = true;
        }
    }
    return removedElement;
}
export function replace(theArray, oldElement, newElement) {
    let i = theArray.indexOf(oldElement);
    if (i !== -1) {
        theArray.splice(i, 1, newElement);
        return true;
    }
    else {
        return false;
    }
}
/**
 * Same as filterMap in some languages. Apply mapper and then only include non-nullable items.
 */
export function mapAndFilterNull(array, mapper) {
    const resultList = [];
    for (const item of array) {
        const resultItem = mapper(item);
        if (resultItem != null) {
            resultList.push(resultItem);
        }
    }
    return resultList;
}
export function filterNull(array) {
    return downcast(array.filter((item) => item != null));
}
/**
 * Provides the last element of the given array.
 * @param theArray The array.
 * @return The last element of the array.
 */
export function last(theArray) {
    return theArray[theArray.length - 1];
}
export function isEmpty(array) {
    return array.length === 0;
}
export function isNotEmpty(array) {
    return array.length != 0;
}
export function lastThrow(array) {
    if (isEmpty(array)) {
        throw new RangeError("Array is empty");
    }
    return neverNull(last(array));
}
/**
 * get first item or throw if there is none
 */
export function getFirstOrThrow(array) {
    if (isEmpty(array)) {
        throw new RangeError("Array is empty");
    }
    return array[0];
}
export function first(array) {
    return array[0] || null;
}
export function findLast(array, predicate) {
    const index = findLastIndex(array, predicate);
    if (index !== -1) {
        return array[index];
    }
    return null;
}
export function findLastIndex(array, predicate) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i])) {
            return i;
        }
    }
    return -1;
}
export function contains(theArray, elementToCheck) {
    return theArray.indexOf(elementToCheck) !== -1;
}
/**
 * count how many of the items in {@param theArray} return true when passed to the predicate {@param pred}
 */
export function count(theArray, pred) {
    return theArray.reduce((acc, next) => (pred(next) ? ++acc : acc), 0);
}
export function addAll(array, elements) {
    array.push(...elements);
}
export function removeAll(array, elements) {
    for (const element of elements) {
        remove(array, element);
    }
}
/**
 * Group an array based on the given discriminator, but each group will have only unique items
 */
export function groupByAndMapUniquely(iterable, discriminator, mapper) {
    const map = new Map();
    for (let el of iterable) {
        const key = discriminator(el);
        getFromMap(map, key, () => new Set()).add(mapper(el));
    }
    return map;
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
export function groupByAndMap(iterable, discriminator, mapper) {
    const map = new Map();
    for (const el of iterable) {
        const key = discriminator(el);
        getFromMap(map, key, () => []).push(mapper(el));
    }
    return map;
}
/**
 * Group array elements based on keys produced by a discriminator
 * @param iterable the array to split into groups
 * @param discriminator a function that produces the keys to group the elements by
 * @returns {NodeJS.Global.Map<R, Array<T>>}
 */
export function groupBy(iterable, discriminator) {
    return groupByAndMap(iterable, discriminator, identity);
}
/**
 * Collect an iterable into a map based on {@param keyExtractor}.
 */
export function collectToMap(iterable, keyExtractor) {
    const map = new Map();
    for (const el of iterable) {
        const key = keyExtractor(el);
        if (map.has(key)) {
            throw new Error(`The elements of iterable are not unique, duplicated key: ${key}`);
        }
        map.set(key, el);
    }
    return map;
}
/**
 * split an array into chunks of a given size.
 * the last chunk will be smaller if there are less than chunkSize elements left.
 * @param chunkSize
 * @param array
 * @returns {Array<Array<T>>}
 */
export function splitInChunks(chunkSize, array) {
    return downcast(_chunk(chunkSize, array));
}
export function splitUint8ArrayInChunks(chunkSize, array) {
    return downcast(_chunk(chunkSize, array));
}
function _chunk(chunkSize, array) {
    if (chunkSize < 1) {
        return [];
    }
    let chunkNum = 0;
    const chunks = [];
    let end;
    do {
        let start = chunkNum * chunkSize;
        end = start + chunkSize;
        chunks[chunkNum] = array.slice(start, end);
        chunkNum++;
    } while (end < array.length);
    return chunks;
}
/**
 * Maps an array into a nested array and then flattens it
 * @param array
 * @param mapper
 * @returns {T|*[]}
 */
export function flatMap(array, mapper) {
    const result = [];
    for (const item of array) {
        const mapped = mapper(item);
        result.push(...mapped);
    }
    return result;
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
export function insertIntoSortedArray(element, array, comparator, replaceIf = () => false) {
    let i = 0;
    while (i < array.length) {
        const compareResult = comparator(array[i], element);
        // We need to check for replacement for each element that is equal or we might miss it
        if (compareResult === 0 && replaceIf(element, array[i])) {
            array.splice(i, 1, element);
            return;
        }
        else if (compareResult <= 0) {
            // We continue searching until the last suitable position
            i++;
        }
        else {
            break;
        }
    }
    // This also handles empty array
    array.splice(i, 0, element);
}
export function zip(arr1, arr2) {
    const zipped = [];
    for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
        zipped.push([arr1[i], arr2[i]]);
    }
    return zipped;
}
export function deduplicate(arr, comp = (a, b) => a === b) {
    const deduplicated = [];
    for (const a of arr) {
        const isDuplicate = deduplicated.some((b) => comp(a, b));
        if (!isDuplicate) {
            deduplicated.push(a);
        }
    }
    return deduplicated;
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
export function binarySearch(array, element, compareFn) {
    let m = 0;
    let n = array.length - 1;
    while (m <= n) {
        const k = (n + m) >> 1;
        const cmp = compareFn(element, array[k]);
        if (cmp > 0) {
            m = k + 1;
        }
        else if (cmp < 0) {
            n = k - 1;
        }
        else {
            return k;
        }
    }
    return -m - 1;
}
export function lastIndex(array) {
    if (array.length === 0) {
        return 0;
    }
    else {
        return array.length - 1;
    }
}
/**
 * All of the elements in all of the arguments combined, and deduplicated
 */
export function union(...iterables) {
    return new Set(...iterables.map((iterable) => Array.from(iterable)));
}
/**
 * return a new array containing every item from array1 that isn't in array2
 * @template T
 * @param array1
 * @param array2
 * @param compare {(l: T, r: T) => boolean} compare items in the array for equality
 * @returns {Array<T>}
 */
export function difference(array1, array2, compare = (a, b) => a === b) {
    return array1.filter((element1) => !array2.some((element2) => compare(element1, element2)));
}
/**
 * Returns a set with elements that are *not* in both sets.
 *
 * {a, b, c} △ {b, c, d} == {a, d}
 */
export function symmetricDifference(set1, set2) {
    const diff = new Set();
    for (const el of set1) {
        if (!set2.has(el)) {
            diff.add(el);
        }
    }
    for (const el of set2) {
        if (!set1.has(el)) {
            diff.add(el);
        }
    }
    return diff;
}
// this is an implementation signature and is not visible from the outside
export function partition(array, predicate) {
    const left = [];
    const right = [];
    for (let item of array) {
        if (predicate(item)) {
            left.push(item);
        }
        else {
            right.push(item);
        }
    }
    return [left, right];
}
/**
 * Like {@link partition}, but async and only for TL = TR.
 * Rejects if any of the predicates reject.
 */
export async function partitionAsync(array, predicate) {
    const left = [];
    const right = [];
    for (let item of array) {
        if (await predicate(item)) {
            left.push(item);
        }
        else {
            right.push(item);
        }
    }
    return [left, right];
}
/**
 * Create an array with n elements by calling the provided factory
 */
export function arrayOf(n, factory) {
    return numberRange(0, n - 1).map(factory);
}
/**
 * Destroy contents of the byte arrays passed. Useful for purging unwanted memory.
 */
export function zeroOut(...arrays) {
    for (const a of arrays) {
        a.fill(0);
    }
}
/**
 * @return 1 if first is bigger than second, -1 if second is bigger than first and 0 otherwise
 */
export function compare(first, second) {
    if (first.length > second.length) {
        return 1;
    }
    else if (first.length < second.length) {
        return -1;
    }
    for (let i = 0; i < first.length; i++) {
        const a = first[i];
        const b = second[i];
        if (a > b) {
            return 1;
        }
        else if (a < b) {
            return -1;
        }
    }
    return 0;
}
