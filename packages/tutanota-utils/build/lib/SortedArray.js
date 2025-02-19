import { findAndRemove, insertIntoSortedArray } from "./ArrayUtils.js";
/**
 * Compared based on the type's natural ordering
 */
function numberCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
/**
 * An array that keeps itself sorted
 */
export class SortedArray {
    contents;
    compareFn;
    constructor(contents, compareFn) {
        this.contents = contents;
        this.compareFn = compareFn;
    }
    static fromNumbers(array) {
        return SortedArray.from(array, numberCompare);
    }
    static empty(compareFn) {
        return new SortedArray([], compareFn);
    }
    static from(array, compareFn) {
        const list = new SortedArray([], compareFn);
        list.insertAll(array);
        return list;
    }
    get length() {
        return this.contents.length;
    }
    get array() {
        return this.contents;
    }
    get(index) {
        return this.contents[index];
    }
    insertAll(array) {
        this.contents.push(...array);
        this.contents.sort(this.compareFn);
    }
    insert(item) {
        insertIntoSortedArray(item, this.contents, this.compareFn);
    }
    removeFirst(finder) {
        return findAndRemove(this.contents, finder);
    }
}
