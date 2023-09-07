import o from "@tutao/otest"
import { setEquals } from "../lib/index.js"
import { setMap } from "../lib/CollectionUtils.js"

type ObjectWithId = {
	v: number
	id: number
	replaced?: boolean
}
o.spec("CollectionUtils", function () {
	o("setEquals", function () {
		o(setEquals(new Set(["a", "b"]), new Set(["a", "b"]))).equals(true)
		o(setEquals(new Set(["b", "a"]), new Set(["a", "b"]))).equals(true)
		o(setEquals(new Set([]), new Set([]))).equals(true)
		o(setEquals(new Set([1, 2]), new Set([2, 1]))).equals(true)

		o(setEquals(new Set(["a"]), new Set([]))).equals(false)
		o(setEquals(new Set([]), new Set(["a"]))).equals(false)
		o(setEquals(new Set(["a"]), new Set(["a", "b"]))).equals(false)
		o(setEquals(new Set(["a", "c"]), new Set(["a", "b"]))).equals(false)
		o(setEquals(new Set([1]), new Set([1, 2]))).equals(false)
	})

	o("setMap", function () {
		let mapper = (i: number) => i + 1

		o(setMap(new Set([]), mapper)).deepEquals(new Set([]))
		o(setMap(new Set([1, 2, 3]), mapper)).deepEquals(new Set([2, 3, 4]))
	})
})
