import o from "@tutao/otest"
import { LazyLoaded } from "../lib/LazyLoaded.js"
import { assertThrows } from "@tutao/tutanota-test-utils"

o.spec("LazyLoaded", function () {
	o.test("default value", async function () {
		const ll = new LazyLoaded<number>(() => Promise.resolve(1), 3)
		o.check(ll.isLoaded()).equals(false)
		o.check(ll.getSync()).equals(3)
		const v = await ll.getAsync()
		o.check(v).equals(1)
		o.check(ll.getSync()).equals(1)
	})

	o.test("reset and reload", async function () {
		let ret = 0
		const ll = new LazyLoaded<number>(() => Promise.resolve(ret++), -1)
		o.check(ll.getSync()).equals(-1)
		const v = await ll.getAsync()
		o.check(v).equals(0)
		o.check(ll.isLoaded()).equals(true)
		ll.reset()
		o.check(ll.isLoaded()).equals(false)
		o.check(ll.getSync()).equals(null)
		const v2 = await ll.getAsync()
		o.check(v2).equals(1)
	})

	o.test("multiple getAsync", async function () {
		let ret = 0
		const ll = new LazyLoaded<number>(() => Promise.resolve(ret++))
		const arr = await Promise.all([ll.getAsync(), ll.getAsync(), ll.getAsync()])

		o.check(arr).deepEquals([0, 0, 0])
	})

	o.test("don't cache errors", async function () {
		let ret = 0
		const ll = new LazyLoaded<number>(() => (ret % 2 === 1 ? Promise.resolve(ret++) : Promise.reject((ret++, new Error("fail")))))
		await assertThrows(Error, async () => await ll.getAsync())
		o.check(ret).equals(1)
		const one = await ll.getAsync()
		o.check(one).equals(1)
	})

	o.test("newLoaded is already loaded", async () => {
		const expected = "here is my value"
		const lazy = LazyLoaded.newLoaded(expected)
		o.check(lazy.isLoaded()).equals(true)
		o.check(lazy.getSync()).equals(expected)
		o.check(await lazy.getAsync()).equals(expected)
	})
})
