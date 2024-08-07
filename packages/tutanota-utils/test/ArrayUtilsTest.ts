import o from "@tutao/otest"
import {
	arrayEquals,
	arrayEqualsWithPredicate,
	arrayOf,
	clear,
	concat,
	deduplicate,
	difference,
	findLastIndex,
	flatMap,
	groupBy,
	groupByAndMap,
	groupByAndMapUniquely,
	insertIntoSortedArray,
	partition,
	partitionAsync,
	splitInChunks,
	symmetricDifference,
} from "../lib/index.js"
import { compare } from "../lib/ArrayUtils.js"

type ObjectWithId = {
	v: number
	id: number
	replaced?: boolean
}
o.spec("array utils", function () {
	o("concat arrays", function () {
		o(Array.from(concat(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])))).deepEquals([1, 2, 3, 4, 5, 6])
		o(Array.from(concat(new Uint8Array([]), new Uint8Array([1])))).deepEquals([1])
		o(Array.from(concat(new Uint8Array([1]), new Uint8Array([])))).deepEquals([1])
		o(Array.from(concat(new Uint8Array(0), new Uint8Array(0)))).deepEquals([])
		o([1, 2, 3]).deepEquals(Array.from(concat(new Uint8Array([1, 2, 3]))))
		o([1, 2, 3, 4, 5, 6]).deepEquals(Array.from(concat(new Uint8Array([1, 2]), new Uint8Array([3, 4]), new Uint8Array([5, 6]))))
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
		o(
			arrayEqualsWithPredicate(
				[
					{
						value: "a",
					},
				],
				[
					{
						value: "a",
					},
				],
				predicate,
			),
		).equals(true)
		o(
			arrayEqualsWithPredicate(
				[
					{
						value: "a",
					},
				],
				[
					{
						value: "b",
					},
				],
				predicate,
			),
		).equals(false)
		o(
			arrayEqualsWithPredicate(
				[
					{
						value: "a",
					},
				],
				[],
				predicate,
			),
		).equals(false)
		o(
			arrayEqualsWithPredicate(
				[
					{
						value: "a",
					},
				],
				[
					{
						someOtherValue: "a",
					},
				],
				predicate,
			),
		).equals(false)
		o(
			arrayEqualsWithPredicate(
				[
					{
						someOtherValue: "a",
					},
				],
				[
					{
						value: "a",
					},
				],
				predicate,
			),
		).equals(false)
		o(
			arrayEqualsWithPredicate(
				[
					{
						someOtherValue: "a",
					},
				],
				[
					{
						someOtherValue: "a",
					},
				],
				predicate,
			),
		).equals(true)
		o(
			arrayEqualsWithPredicate(
				[],
				[
					{
						value: "a",
					},
				],
				predicate,
			),
		).equals(false)
	})
	o("splitInChunks", function () {
		o(splitInChunks(3, [1, 2, 3, 4, 5])).deepEquals([
			[1, 2, 3],
			[4, 5],
		])
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

		function test(
			arr: Array<ObjectWithId>,
			insert: ObjectWithId,
			expect: Array<ObjectWithId>,
			equalsFn?: (arg0: ObjectWithId, arg1: ObjectWithId) => boolean,
		) {
			insertIntoSortedArray(insert, arr, comparator, equalsFn)
			o(arr).deepEquals(expect)
		}

		o("appends in the beginning", function () {
			// Here is takes the last matching position, not the first one
			test(
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
				],
				{
					v: 1,
					id: -1,
				},
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 1,
						id: -1,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
				],
			)
		})
		o("appends in the middle", function () {
			test(
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
				],
				{
					v: 4,
					id: -1,
				},
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 4,
						id: -1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
				],
			)
		})
		o("appends in the end", function () {
			test(
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
				],
				{
					v: 10,
					id: -1,
				},
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
					{
						v: 10,
						id: -1,
					},
				],
			)
			test(
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
				],
				{
					v: 12,
					id: -1,
				},
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
					{
						v: 12,
						id: -1,
					},
				],
			)
		})
		o("works with empty array", function () {
			test(
				[],
				{
					v: 4,
					id: -1,
				},
				[
					{
						v: 4,
						id: -1,
					},
				],
			)
		})
		o("replaces in the beginning", function () {
			test(
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
				],
				{
					v: 1,
					id: 0,
					replaced: true,
				},
				[
					{
						v: 1,
						id: 0,
						replaced: true,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
				],
				same,
			)
		})
		o("replaced in the beginning even if the last is equal", function () {
			test(
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 1,
						id: 1,
					},
				],
				{
					v: 1,
					id: 0,
					replaced: true,
				},
				[
					{
						v: 1,
						id: 0,
						replaced: true,
					},
					{
						v: 1,
						id: 1,
					},
				],
				same,
			)
		})
		o("replaces in the middle", function () {
			test(
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
				],
				{
					v: 2,
					id: 1,
					replaced: true,
				},
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
						replaced: true,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
				],
				same,
			)
		})
		o("replaces in the end", function () {
			test(
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
				],
				{
					v: 10,
					id: 4,
					replaced: true,
				},
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
						replaced: true,
					},
				],
				same,
			)
			test(
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
				],
				{
					v: 12,
					id: 5,
				},
				[
					{
						v: 1,
						id: 0,
					},
					{
						v: 2,
						id: 1,
					},
					{
						v: 8,
						id: 3,
					},
					{
						v: 10,
						id: 4,
					},
					{
						v: 12,
						id: 5,
					},
				],
				same,
			)
		})
	})
	o("deduplicate", function () {
		const comp = (a, b) => a === b

		o(deduplicate([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], comp)).deepEquals([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
		o(deduplicate([1, 1, 2, 3, 4, 4, 5, 6, 7, 0, 0, 8, 6, 5, 9, 4, 9, 3, 2, 1, 2, 3, 4], comp).sort()).deepEquals([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
		const object = {
			a: 20,
		}
		o(
			deduplicate([
				null,
				1,
				null,
				2,
				3,
				0,
				0,
				"word",
				"word",
				"anotherword",
				undefined,
				undefined,
				{
					a: 10,
				},
				{
					a: 10,
				},
				object,
				object,
				{
					a: 20,
				},
			]),
		).deepEquals([
			null,
			1,
			2,
			3,
			0,
			"word",
			"anotherword",
			undefined,
			{
				a: 10,
			},
			{
				a: 10,
			},
			object,
			{
				a: 20,
			},
		])
	})
	o("flatMap", function () {
		o(flatMap([], (v) => [v])).deepEquals([])
		o(flatMap([0, 1, 2, 3], (_) => [])).deepEquals([])
		o(flatMap([0, 1, 2, 3], (v) => [v * v])).deepEquals([0, 1, 4, 9])
		o(flatMap([0, 1, 2, 3], (v) => [v, v * v])).deepEquals([0, 0, 1, 1, 2, 4, 3, 9])
		o(flatMap([0, 1, 2, 3], (v) => [[v, v * v]])).deepEquals([
			[0, 0],
			[1, 1],
			[2, 4],
			[3, 9],
		])
		o(
			flatMap(
				[
					[0, 1, 2],
					[3, 4, 5],
				],
				(v) => v,
			),
		).deepEquals([0, 1, 2, 3, 4, 5])
	})
	o("groupBy", function () {
		const toRaw = (map) => Array.from(map.entries())

		o(toRaw(groupBy([], (v) => v % 2))).deepEquals([])
		o(toRaw(groupBy([0], (v) => v % 2))).deepEquals([[0, [0]]])
		o(toRaw(groupBy([0, 1, 2, 3, 4], (_) => 1))).deepEquals([[1, [0, 1, 2, 3, 4]]])
		o(toRaw(groupBy([0, 1, 2, 3, 4], (v) => v % 2))).deepEquals([
			[0, [0, 2, 4]],
			[1, [1, 3]],
		])
		o(toRaw(groupBy([0, 1, 2, 3, 3, 4, 4], (v) => v % 3))).deepEquals([
			[0, [0, 3, 3]],
			[1, [1, 4, 4]],
			[2, [2]],
		])
	})
	o("groupByAndMap", function () {
		const toRaw = (map) => Array.from(map.entries())

		const mapper = (v) => v * v

		o(toRaw(groupByAndMap([], (v) => v % 2, mapper))).deepEquals([])
		o(toRaw(groupByAndMap([0], (v) => v % 2, mapper))).deepEquals([[0, [0]]])
		o(toRaw(groupByAndMap([0, 1, 2, 3, 4], (_) => 1, mapper))).deepEquals([[1, [0, 1, 4, 9, 16]]])
		o(toRaw(groupByAndMap([0, 1, 2, 3, 4], (v) => v % 2, mapper))).deepEquals([
			[0, [0, 4, 16]],
			[1, [1, 9]],
		])
		o(toRaw(groupByAndMap([0, 1, 2, 3, 3, 4, 4], (v) => v % 3, mapper))).deepEquals([
			[0, [0, 9, 9]],
			[1, [1, 16, 16]],
			[2, [4]],
		])
	})
	o("groupByAndMapUniquely", function () {
		const toRaw = <K, V extends Iterable<any>>(map: Map<K, V>) => Array.from(map.entries()).map(([k, v]) => [k, Array.from(v)])

		const mapper = (v) => v * v

		o(toRaw(groupByAndMapUniquely([], (v) => v % 2, mapper))).deepEquals([])
		o(toRaw(groupByAndMapUniquely([0], (v) => v % 2, mapper))).deepEquals([[0, [0]]])
		o(toRaw(groupByAndMapUniquely([0, 1, 2, 3, 4], (_) => 1, mapper))).deepEquals([[1, [0, 1, 4, 9, 16]]])
		o(toRaw(groupByAndMapUniquely([0, 1, 2, 3, 4], (v) => v % 2, mapper))).deepEquals([
			[0, [0, 4, 16]],
			[1, [1, 9]],
		])
		o(toRaw(groupByAndMapUniquely([0, 1, 2, 3, 3, 4, 4], (v) => v % 3, mapper))).deepEquals([
			[0, [0, 9]],
			[1, [1, 16]],
			[2, [4]],
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
	o.spec("clear", function () {
		o("clearing an array leaves it empty", function () {
			let a = [1, 2, 3]
			clear(a)
			o(a.length).equals(0)
			o(a).deepEquals([])
		})

		o("clearing an array makes it return undefined for all entries", function () {
			let a = ["hello", "world"]
			clear(a)
			o(a[0]).equals(undefined)
			o(a[1]).equals(undefined)

			let b = ["a", "b", "c"]
			clear(b)
			b.length = 3
			o(b[0]).equals(undefined)
			o(b[1]).equals(undefined)
			o(b[2]).equals(undefined)
		})
	})
	o.spec("symmetric difference", function () {
		o("both empty", function () {
			o(Array.from(symmetricDifference(new Set(), new Set()))).deepEquals([])
		})
		o("left empty", function () {
			o(Array.from(symmetricDifference(new Set(), new Set([1])))).deepEquals([1])
		})
		o("right empty", function () {
			o(Array.from(symmetricDifference(new Set([1]), new Set([])))).deepEquals([1])
		})
		o("only difference", function () {
			o(Array.from(symmetricDifference(new Set([1]), new Set([2])))).deepEquals([1, 2])
		})
		o("only common", function () {
			o(Array.from(symmetricDifference(new Set([1, 2]), new Set([1, 2])))).deepEquals([])
		})
		o("left has more", function () {
			o(Array.from(symmetricDifference(new Set([1, 2]), new Set([2])))).deepEquals([1])
		})
		o("right has more", function () {
			o(Array.from(symmetricDifference(new Set([1]), new Set([1, 2])))).deepEquals([2])
		})
	})

	o.spec("partitionTypeGuard", function () {
		o.test("partitionTypeGuard infers the types correctly for type guards", function () {
			const array: ReadonlyArray<number | string> = ["1", 2, "3", 4]

			function isString(item: number | string): item is string {
				return typeof item === "string"
			}

			const [strings, numbers] = partition(array, isString)
			strings satisfies Array<string>
			numbers satisfies Array<number>
			o(strings).deepEquals(["1", "3"])
			o(numbers).deepEquals([2, 4])
		})
	})

	o.spec("partitionAsync", function () {
		const test = function (c: [string, any[], (any) => boolean, [any[], any[]]]) {
			const [name, input, predicate, output] = c
			o(name, async function () {
				const result = partition(input, predicate)
				o(result).deepEquals(output)
				const resultAsync = await partitionAsync(input, (e) => Promise.resolve(predicate(e)))
				o(resultAsync).deepEquals(output)
			})
		}
		const testcases = [
			["empty array", [], () => true, [[], []]],
			[
				"numbers",
				[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7],
				(i) => i < 5,
				[
					[3, 1, 4, 1, 2, 3],
					[5, 9, 6, 5, 5, 8, 9, 7],
				],
			],
			["all left", ["a", "b", "c", "d", "e"], (e) => true, [["a", "b", "c", "d", "e"], []]],
			["all right", ["a", "b", "c", "d", "e"], (e) => false, [[], ["a", "b", "c", "d", "e"]]],
			[
				"sort types",
				[1, "", 2, "a", 3, "c", 3, 8],
				(k) => typeof k === "string",
				[
					["", "a", "c"],
					[1, 2, 3, 3, 8],
				],
			],
		]

		for (const testCase of testcases) {
			// @ts-ignore
			test(testCase)
		}

		o("rejection in partitionAsync is propagated", async function () {
			// can't use assertThrows because of circular dependency
			try {
				await partitionAsync([3, 1, 4, 1, 5, 9, 2, 6, 5, 3], (e) => (e === 9 ? Promise.reject(new Error()) : Promise.resolve(true)))
			} catch (e) {
				return
			}
			throw new Error("Did not throw!")
		})
	})

	o("arrayOf test", function () {
		o(
			arrayOf(0, () => {
				throw new Error("I shouldn'ta been called!!!")
			}),
		).deepEquals([])

		o(arrayOf(1, (idx) => idx + 1 + " one thousand")).deepEquals(["1 one thousand"])

		o(arrayOf(2, (idx) => idx + 1 + " one thousand")).deepEquals(["1 one thousand", "2 one thousand"])
	})

	o("customId comparision", function () {
		o(compare(new Uint8Array([]), new Uint8Array([]))).equals(0)

		o(compare(new Uint8Array([1]), new Uint8Array([]))).equals(1)

		o(compare(new Uint8Array([]), new Uint8Array([1]))).equals(-1)

		o(compare(new Uint8Array([1, 1]), new Uint8Array([1, 1]))).equals(0)

		o(compare(new Uint8Array([1, 1, 3]), new Uint8Array([1, 1, 2]))).equals(1)

		o(compare(new Uint8Array([1, 1, 2]), new Uint8Array([1, 1, 3]))).equals(-1)
	})
})
