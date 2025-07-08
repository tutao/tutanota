import o from "@tutao/otest"
import { mergeMaps, takeFromMap } from "../lib/MapUtils.js"

o.spec("map utils", function () {
	o.test("merge maps", function () {
		let m1: Map<string, number> = new Map([
			["a", 1],
			["b", 2],
			["c", 3],
		])
		let m2: Map<string, number> = new Map([
			["a", 10],
			["b", 20],
			["d", 40],
		])
		let m3: Map<string, number> = new Map([
			["a", 100],
			["e", 500],
		])
		let merged: Map<string, number[]> = mergeMaps([m1, m2, m3])
		o.check(merged.size).equals(5)
		o.check(merged.get("a")!).deepEquals([1, 10, 100])
		o.check(merged.get("b")!).deepEquals([2, 20])
		o.check(merged.get("c")!).deepEquals([3])
		o.check(merged.get("d")!).deepEquals([40])
		o.check(merged.get("e")!).deepEquals([500])
		let merged2: Map<string, number[]> = mergeMaps([m3, m2])
		o.check(merged2.size).equals(4)
		o.check(merged2.get("a")!).deepEquals([100, 10])
		o.check(merged2.get("b")!).deepEquals([20])
		o.check(merged2.get("d")!).deepEquals([40])
		o.check(merged2.get("e")!).deepEquals([500])
	})

	o.spec("takeFromMap", () => {
		let someMap: Map<string, any>
		o.beforeEach(() => {
			someMap = new Map()
		})

		o.test("value is present", () => {
			someMap.set("my key", 1234)
			o.check(takeFromMap(someMap, "my key")).deepEquals({
				item: 1234,
				wasPresent: true,
			})
		})

		o.test("value is not present", () => {
			// nothing is in the map
			o.check(takeFromMap(someMap, "my key")).deepEquals({
				item: undefined,
				wasPresent: false,
			})
		})

		o.test("value is present but undefined", () => {
			someMap.set("my key", undefined)
			o.check(takeFromMap(someMap, "my key")).deepEquals({
				item: undefined,
				wasPresent: true,
			})
		})
	})
})
