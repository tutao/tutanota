import {findAndRemove, insertIntoSortedArray} from "./ArrayUtils.js"
export type CompareFn<T> = (arg0: T, arg1: T) => number

/**
 * Compared based on the type's natural ordering
 * @param a
 * @param b
 * @returns {number}
 */
// It should be fine for 99% of use cases? worst case it just returns 0 always
function defaultCompare<T extends Record<string, any>>(a: T, b: T): number {
    return a < b ? -1 : a > b ? 1 : 0
}

/**
 * An array that keeps itself sorted
 */
export class SortedArray<T> {
    readonly _contents: Array<T>
    readonly _compareFn: CompareFn<T>

    constructor(compareFn: CompareFn<T> = defaultCompare) {
        this._contents = []
        this._compareFn = compareFn
    }

    static from<U>(array: ReadonlyArray<U>, compareFn?: CompareFn<U>): SortedArray<U> {
        const list = new SortedArray<U>(compareFn)
        list.insertAll(array)
        return list
    }

    get length(): number {
        return this._contents.length
    }

    get array(): ReadonlyArray<T> {
        return this._contents
    }

    get(index: number): T {
        return this._contents[index]
    }

    insertAll(array: ReadonlyArray<T>) {
        this._contents.push(...array)

        this._contents.sort(this._compareFn)
    }

    insert(item: T): void {
        insertIntoSortedArray(item, this._contents, this._compareFn)
    }

    removeFirst(finder: (arg0: T) => boolean): boolean {
        return findAndRemove(this._contents, finder)
    }
}