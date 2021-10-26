// @flow

import o from "ospec"
import {SortedArray} from "../lib/SortedArray"

o.spec("SortedArray", function () {

	o("with default compare", function () {
		const array = new SortedArray()
		array.insert(2)
		array.insert(5)
		array.insert(3)
		array.insert(1)
		array.insert(8)
		array.insert(13)
		array.insert(1)

		o(array.array).deepEquals([1, 1, 2, 3, 5, 8, 13])
	})

	o("with custom compare", function () {
		const reverseCompare = (a, b) => a < b ? 1 : a > b ? -1 : 0
		const array = new SortedArray(reverseCompare)
		array.insert(2)
		array.insert(5)
		array.insert(3)
		array.insert(1)
		array.insert(8)
		array.insert(13)
		array.insert(1)

		o(array.array).deepEquals([13, 8, 5, 3, 2, 1, 1])
	})

	o("initialize from array with default compare", function () {
		const array = SortedArray.from([2, 5, 3, 1, 8, 13, 1])
		o(array.array).deepEquals([1, 1, 2, 3, 5, 8, 13])
	})


	o("initialize from array with custom compare", function () {
		const reverseCompare = (a, b) => a < b ? 1 : a > b ? -1 : 0
		const array = SortedArray.from([2, 5, 3, 1, 8, 13, 1], reverseCompare)
		o(array.array).deepEquals([13, 8, 5, 3, 2, 1, 1])
	})

	o("insertAll with default compare", function () {
		const array = new SortedArray()
		array.insertAll([2, 5, 3, 1, 8, 13, 1])
		o(array.array).deepEquals([1, 1, 2, 3, 5, 8, 13])
	})

	o("insertAll with custom compare", function () {
		const reverseCompare = (a, b) => a < b ? 1 : a > b ? -1 : 0
		const array = new SortedArray(reverseCompare)
		array.insertAll([2, 5, 3, 1, 8, 13, 1])
		o(array.array).deepEquals([13, 8, 5, 3, 2, 1, 1])
	})
})