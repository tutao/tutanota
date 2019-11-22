//@flow
import o from "ospec/ospec.js"
import {arrayEquals, concat, findLastIndex, insertIntoSortedArray, splitInChunks} from "../../../src/api/common/utils/ArrayUtils"

type ObjectWithId = {
	v: number,
	id: number,
	replaced?: boolean,
}

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
		// We wrap them into objects
		const comparator = (l, r) => l.v - r.v
		const equals = (l, r) => l.id === r.id

		function test(arr: Array<ObjectWithId>, insert: ObjectWithId, expect: Array<ObjectWithId>, equalsFn?: (ObjectWithId, ObjectWithId) => boolean) {
			insertIntoSortedArray(insert, arr, comparator, equalsFn)
			o(arr).deepEquals(expect)
		}

		o("appends in the beginning", function () {
			test([{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}],
				{v: 1, id: -1},
				[{v: 1, id: 0}, {v: 1, id: -1}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}])
		})

		o("appends in the middle", function () {
			test([{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}],
				{v: 4, id: -1},
				[{v: 1, id: 0}, {v: 2, id: 1}, {v: 4, id: -1}, {v: 8, id: 3}, {v: 10, id: 4}])
		})

		o("appends in the end", function () {
			test([{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}],
				{v: 10, id: -1},
				[{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}, {v: 10, id: -1}])
			test([{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}],
				{v: 12, id: -1},
				[{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}, {v: 12, id: -1}])
		})

		o("works with empty array", function () {
			test([],
				{v: 4, id: -1},
				[{v: 4, id: -1}])
		})
		o("replaces in the beginning", function () {
			test([{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}],
				{v: 1, id: 0, replaced: true}
				, [{v: 1, id: 0, replaced: true}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}], equals)
		})

		o("replaces in the middle", function () {
			test([{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}],
				{v: 2, id: 1, replaced: true},
				[{v: 1, id: 0}, {v: 2, id: 1, replaced: true}, {v: 8, id: 3}, {v: 10, id: 4}], equals)
		})

		o("replaces in the end", function () {
			test([{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}],
				{v: 10, id: 4, replaced: true},
				[{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4, replaced: true}], equals)
			test([{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}],
				{v: 12, id: 5},
				[{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}, {v: 12, id: 5}], equals)
		})
	})
})
