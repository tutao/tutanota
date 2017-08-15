// @flow
import o from "ospec/ospec.js"
import {concat, arrayEquals} from "../../../src/api/common/utils/ArrayUtils"

o.spec("array utils", function () {

	o("concat arrays", function () {
		o([1, 2, 3, 4, 5, 6]).deepEquals(Array.from(concat(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]))))
		o([1]).deepEquals(Array.from(concat(new Uint8Array([]), new Uint8Array([1]))))
		o([1]).deepEquals(Array.from(concat(new Uint8Array([1]), new Uint8Array([]))))
		o([]).deepEquals(Array.from(concat(new Uint8Array(0), new Uint8Array(0))))
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

})
