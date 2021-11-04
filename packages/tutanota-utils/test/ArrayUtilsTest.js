//@flow
import o from "ospec"
import {
	arrayEquals,
	arrayEqualsWithPredicate,
	concat,
	deduplicate,
	difference,
	findLastIndex,
	flat,
	flatMap,
	groupBy,
	groupByAndMap,
	groupByAndMapUniquely,
	insertIntoSortedArray,
	splitInChunks,
	symmetricDifference
} from "../lib/ArrayUtils"

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

	o("arrayEqualsWithPredicate ", function () {
		const predicate = (a: any, b: any) => a.value === b.value

		o(arrayEqualsWithPredicate([], [], predicate)).equals(true)
		o(arrayEqualsWithPredicate([{value: "a"}], [{value: "a"}], predicate)).equals(true)
		o(arrayEqualsWithPredicate([{value: "a"}], [{value: "b"}], predicate)).equals(false)
		o(arrayEqualsWithPredicate([{value: "a"}], [], predicate)).equals(false)
		o(arrayEqualsWithPredicate([{value: "a"}], [{someOtherValue: "a"}], predicate)).equals(false)
		o(arrayEqualsWithPredicate([{someOtherValue: "a"}], [{value: "a"}], predicate)).equals(false)
		o(arrayEqualsWithPredicate([{someOtherValue: "a"}], [{someOtherValue: "a"}], predicate)).equals(true)
		o(arrayEqualsWithPredicate([], [{value: "a"}], predicate)).equals(false)
	})

	o("splitInChunks", function () {
		o(splitInChunks(3, [1, 2, 3, 4, 5])).deepEquals([[1, 2, 3], [4, 5]])
		o(splitInChunks(5, [1, 2, 3, 4, 5])).deepEquals([[1, 2, 3, 4, 5]])
		o(splitInChunks(6, [1, 2, 3, 4, 5])).deepEquals([[1, 2, 3, 4, 5]])
		o(splitInChunks(0, [1, 2, 3, 4, 5])).deepEquals([])
		o(splitInChunks(3, [])).deepEquals([[]])
		o(splitInChunks(-1, [])).deepEquals([])
		o(splitInChunks(-1, [1, 2, 3, 4])).deepEquals([])
		o(splitInChunks(0, [])).deepEquals([])
		o(splitInChunks(0, [1, 2, 3])).deepEquals([])
		o(splitInChunks(1, [1, 2, 3])).deepEquals([[1], [2], [3]])
		o(splitInChunks(2, [1, 2, 3])).deepEquals([[1, 2], [3]])
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
		const same = (l, r) => l.id === r.id

		function test(arr: Array<ObjectWithId>, insert: ObjectWithId, expect: Array<ObjectWithId>, equalsFn?: (ObjectWithId, ObjectWithId) => boolean) {
			insertIntoSortedArray(insert, arr, comparator, equalsFn)
			o(arr).deepEquals(expect)
		}

		o("appends in the beginning", function () {
			// Here is takes the last matching position, not the first one
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
				{v: 1, id: 0, replaced: true},
				[{v: 1, id: 0, replaced: true}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}],
				same)
		})
		o("replaced in the beginning even if the last is equal", function () {
			test(
				[{v: 1, id: 0}, {v: 1, id: 1}],
				{v: 1, id: 0, replaced: true},
				[{v: 1, id: 0, replaced: true}, {v: 1, id: 1}],
				same
			)
		})

		o("replaces in the middle", function () {
			test([{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}],
				{v: 2, id: 1, replaced: true},
				[{v: 1, id: 0}, {v: 2, id: 1, replaced: true}, {v: 8, id: 3}, {v: 10, id: 4}], same)
		})

		o("replaces in the end", function () {
			test([{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}],
				{v: 10, id: 4, replaced: true},
				[{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4, replaced: true}], same)
			test([{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}],
				{v: 12, id: 5},
				[{v: 1, id: 0}, {v: 2, id: 1}, {v: 8, id: 3}, {v: 10, id: 4}, {v: 12, id: 5}], same)
		})
	})

	o("deduplicate", function () {
		const comp = (a, b) => a === b
		o(deduplicate([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], comp)).deepEquals([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
		o(deduplicate([1, 1, 2, 3, 4, 4, 5, 6, 7, 0, 0, 8, 6, 5, 9, 4, 9, 3, 2, 1, 2, 3, 4], comp).sort()).deepEquals([
			0, 1, 2, 3, 4, 5, 6, 7, 8, 9
		])
		const object = {a: 20}
		o(deduplicate([
			null, 1, null, 2, 3, 0, 0, "word", "word", "anotherword", undefined, undefined, {a: 10}, {a: 10}, object, object, {a: 20}
		]))
			.deepEquals([null, 1, 2, 3, 0, "word", "anotherword", undefined, {a: 10}, {a: 10}, object, {a: 20}])
	})

	o("flat", function () {
		o(flat([]))
			.deepEquals([])

		o(flat([[], [], []]))
			.deepEquals([])

		o(flat([[0, 1, 2, 3]]))
			.deepEquals([0, 1, 2, 3])

		o(flat([[], [0], [1, 2, 3], [4, 5, 6], [], [7, 8, 9]]))
			.deepEquals([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

		o(flat([[[0]], [[1, 2, 3], [4, 5, 6]], [], [[]]]))
			.deepEquals([[0], [1, 2, 3], [4, 5, 6], []])
	})

	o("flatMap", function () {

		o(flatMap([], v => [v]))
			.deepEquals([])

		o(flatMap([0, 1, 2, 3], _ => []))
			.deepEquals([])

		o(flatMap([0, 1, 2, 3], v => [v * v]))
			.deepEquals([0, 1, 4, 9])

		o(flatMap([0, 1, 2, 3], v => [v, v * v]))
			.deepEquals([0, 0, 1, 1, 2, 4, 3, 9])

		o(flatMap([0, 1, 2, 3], v => [[v, v * v]]))
			.deepEquals([[0, 0], [1, 1], [2, 4], [3, 9]])

		o(flatMap([[0, 1, 2], [3, 4, 5]], v => v))
			.deepEquals([0, 1, 2, 3, 4, 5])
	})

	o("groupBy", function () {

		const toRaw = map => Array.from(map.entries())

		o(toRaw(groupBy([], v => v % 2)))
			.deepEquals([])

		o(toRaw(groupBy([0], v => v % 2)))
			.deepEquals([
				[0, [0]]
			])

		o(toRaw(groupBy([0, 1, 2, 3, 4], _ => 1)))
			.deepEquals([
				[1, [0, 1, 2, 3, 4]]
			])

		o(toRaw(groupBy([0, 1, 2, 3, 4], v => v % 2)))
			.deepEquals([
				[0, [0, 2, 4]],
				[1, [1, 3]]
			])

		o(toRaw(groupBy([0, 1, 2, 3, 3, 4, 4], v => v % 3)))
			.deepEquals([
				[0, [0, 3, 3]],
				[1, [1, 4, 4]],
				[2, [2]]
			])
	})

	o("groupByAndMap", function () {

		const toRaw = map => Array.from(map.entries())
		const mapper = v => v * v

		o(toRaw(groupByAndMap([], v => v % 2, mapper)))
			.deepEquals([])

		o(toRaw(groupByAndMap([0], v => v % 2, mapper)))
			.deepEquals([
				[0, [0]]
			])
		o(toRaw(groupByAndMap([0, 1, 2, 3, 4], _ => 1, mapper)))
			.deepEquals([
				[1, [0, 1, 4, 9, 16]]
			])

		o(toRaw(groupByAndMap([0, 1, 2, 3, 4], v => v % 2, mapper)))
			.deepEquals([
				[0, [0, 4, 16]],
				[1, [1, 9]]
			])

		o(toRaw(groupByAndMap([0, 1, 2, 3, 3, 4, 4], v => v % 3, mapper)))
			.deepEquals([
				[0, [0, 9, 9]],
				[1, [1, 16, 16]],
				[2, [4]]
			])
	})

	o("groupByAndMapUniquely", function () {

		const toRaw = map => Array.from(map.entries()).map(([k, v]) => [k, Array.from(v)])
		const mapper = v => v * v

		o(toRaw(groupByAndMapUniquely([], v => v % 2, mapper)))
			.deepEquals([])

		o(toRaw(groupByAndMapUniquely([0], v => v % 2, mapper)))
			.deepEquals([
				[0, [0]]
			])
		o(toRaw(groupByAndMapUniquely([0, 1, 2, 3, 4], _ => 1, mapper)))
			.deepEquals([
				[1, [0, 1, 4, 9, 16]]
			])

		o(toRaw(groupByAndMapUniquely([0, 1, 2, 3, 4], v => v % 2, mapper)))
			.deepEquals([
				[0, [0, 4, 16]],
				[1, [1, 9]]
			])

		o(toRaw(groupByAndMapUniquely([0, 1, 2, 3, 3, 4, 4], v => v % 3, mapper)))
			.deepEquals([
				[0, [0, 9]],
				[1, [1, 16]],
				[2, [4]]
			])
	})

	o("difference", function () {
		const comp = (a, b) => a === b
		const diff = (a, b) => difference(a, b, comp)
		o(diff([], [])).deepEquals([])
		o(diff([], [1, 2, 3])).deepEquals([])
		o(diff([1, 2, 3], [])).deepEquals([1, 2, 3])
		o(diff([1, 2, 3], [1, 2, 3])).deepEquals([])
		o(diff([1, 2, 3], [4, 5, 6])).deepEquals([1, 2, 3])
		o(diff([1, 2, 3, 4, 5, 6], [1, 2, 3])).deepEquals([4, 5, 6])
		o(diff([1, 2, 3, 4, 5, 6], [4, 5, 6])).deepEquals([1, 2, 3])
		o(diff([1, 2, 3, 4, 5, 6], [1, 3, 5])).deepEquals([2, 4, 6])
		o(diff([1, 2, 3], [1, 2, 3, 4, 5, 6])).deepEquals([])
		o(diff([1, 2, 3], [4, 5, 6, 7, 8, 9])).deepEquals([1, 2, 3])
	})

	o.spec("symmetric difference", function() {
		o("both empty", function() {
			o(Array.from(symmetricDifference(new Set(), new Set()))).deepEquals([])
		})

		o("left empty", function() {
			o(Array.from(symmetricDifference(new Set(), new Set([1])))).deepEquals([1])
		})

		o("right empty", function() {
			o(Array.from(symmetricDifference(new Set([1]), new Set([])))).deepEquals([1])
		})

		o("only difference", function() {
			o(Array.from(symmetricDifference(new Set([1]), new Set([2])))).deepEquals([1, 2])
		})

		o("only common", function() {
			o(Array.from(symmetricDifference(new Set([1, 2]), new Set([1, 2])))).deepEquals([])
		})

		o("left has more", function() {
			o(Array.from(symmetricDifference(new Set([1, 2]), new Set([2])))).deepEquals([1])
		})

		o("right has more", function() {
			o(Array.from(symmetricDifference(new Set([1]), new Set([1, 2])))).deepEquals([2])
		})
	})
})
