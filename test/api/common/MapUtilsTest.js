// @flow
import o from "ospec/ospec.js"
import {mergeMaps} from "../../../src/api/common/utils/MapUtils"

o.spec("map utils", function () {

	o("merge maps", function () {
		let m1: Map<string,number> = new Map([["a", 1], ["b", 2], ["c", 3]])
		let m2: Map<string,number> = new Map([["a", 10], ["b", 20], ["d", 40]])
		let m3: Map<string,number> = new Map([["a", 100], ["e", 500]])
		let merged: Map<string,number[]> = mergeMaps([m1, m2, m3])
		o(merged.size).equals(5)
		o(merged.get("a")).deepEquals([1, 10, 100])
		o(merged.get("b")).deepEquals([2, 20])
		o(merged.get("c")).deepEquals([3])
		o(merged.get("d")).deepEquals([40])
		o(merged.get("e")).deepEquals([500])

		let merged2: Map<string,number[]> = mergeMaps([m3, m2])
		o(merged2.size).equals(4)
		o(merged2.get("a")).deepEquals([100, 10])
		o(merged2.get("b")).deepEquals([20])
		o(merged2.get("d")).deepEquals([40])
		o(merged2.get("e")).deepEquals([500])
	})

})
