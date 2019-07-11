//@flow
import o from "ospec/ospec.js"
import {arrayEquals, concat, findLastIndex, insertIntoSortedArray, splitInChunks} from "../../../src/api/common/utils/ArrayUtils"

o.spec("array utils", function () {

	o("concat arrays", function () {
		o([1, 2, 3, 4, 5, 6]).deepEquals(Array.from(concat(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]))))
		o([1]).deepEquals(Array.from(concat(new Uint8Array([]), new Uint8Array([1]))))
		o([1]).deepEquals(Array.from(concat(new Uint8Array([1]), new Uint8Array([]))))
		o([]).deepEquals(Array.from(concat(new Uint8Array(0), new Uint8Array(0))))
		o([1, 2, 3]).deepEquals(Array.from(concat(new Uint8Array([1, 2, 3]))))
		o([1, 2, 3, 4, 5, 6])
			.deepEquals(Array.from(concat(new Uint8Array([1, 2]), new Uint8Array([3, 4]), new Uint8Array([5, 6]))))
	})

	o("ArrayEquals ", function () {
		o(arrayEquals([], [])).equals(true)
		o(arrayEquals(["a"], ["a"])).equals(true)
		o(arrayEquals(["a"], ["b"])).equals(false)
		o(arrayEquals(["a"], [])).equals(false)
		o(arrayEquals([], ["a"])).equals(false)
	})

	o("splitInChunks", function () {
		o(splitInChunks(3, [1, 2, 3, 4, 5])).deepEquals([[1, 2, 3], [4, 5]])
		o(splitInChunks(5, [1, 2, 3, 4, 5])).deepEquals([[1, 2, 3, 4, 5]])
		o(splitInChunks(6, [1, 2, 3, 4, 5])).deepEquals([[1, 2, 3, 4, 5]])
		o(splitInChunks(0, [1, 2, 3, 4, 5])).deepEquals([])
		o(splitInChunks(3, [])).deepEquals([[]])
	})

	o.spec("findLastIndex", function () {
		o("returns the last index", function () {
			o(findLastIndex([8, 1, 2, 8, 4, 5], (n) => n === 8)).equals(3)
		})

		o("returns -1 if not found", function () {
			o(findLastIndex([1, 2, 3, 4, 5], (n) => n === 8)).equals(-1)
		})
	})

	o.spec("insertIntoSortedArray", function () {
		o("works", function () {
			let arr = [1, 2, 8, 10]
			insertIntoSortedArray(4, arr, (l, r) => l - r)
			o(arr).deepEquals([1, 2, 4, 8, 10])
		})

		o("works with empty array", function () {
			let arr = []
			insertIntoSortedArray(4, arr, (l, r) => l - r)
			o(arr).deepEquals([4])
		})
	})
})
