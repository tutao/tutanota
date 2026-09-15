import o from "@tutao/otest"
import { set_equals, set_map } from "../../../src/platform-kit/utils"

type ObjectWithId = {
	v: number
	id: number
	replaced?: boolean
}
o.spec("CollectionUtils", function () {
	o("setEquals", function () {
		o(set_equals(new Set(["a", "b"]), new Set(["a", "b"]))).equals(true)
		o(set_equals(new Set(["b", "a"]), new Set(["a", "b"]))).equals(true)
		o(set_equals(new Set([]), new Set([]))).equals(true)
		o(set_equals(new Set([1, 2]), new Set([2, 1]))).equals(true)

		o(set_equals(new Set(["a"]), new Set([]))).equals(false)
		o(set_equals(new Set([]), new Set(["a"]))).equals(false)
		o(set_equals(new Set(["a"]), new Set(["a", "b"]))).equals(false)
		o(set_equals(new Set(["a", "c"]), new Set(["a", "b"]))).equals(false)
		o(set_equals(new Set([1]), new Set([1, 2]))).equals(false)
	})

	o("setMap", function () {
		let mapper = (i: number) => i + 1

		o(set_map(new Set([]), mapper)).deepEquals(new Set([]))
		o(set_map(new Set([1, 2, 3]), mapper)).deepEquals(new Set([2, 3, 4]))
	})
})
