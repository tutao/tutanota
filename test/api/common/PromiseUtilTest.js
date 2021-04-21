//@flow

import o from "ospec"
import {mapInCallContext, PromisableWrapper as PromiseableWrapper, promiseMap} from "../../../src/api/common/utils/PromiseUtils"
import {defer} from "../../../src/api/common/utils/Utils"
import {assertThrows} from "../TestUtils"


o.spec("PromiseUtils", function () {
	o.spec("mapInCallContexnt", function () {
		o("works for values", function () {
			o(mapInCallContext([1, 2, 3, 4], (v) => v + 1).value)
				.deepEquals([2, 3, 4, 5])
		})

		o("works for promises", async function () {
			o(await mapInCallContext([1, 2, 3, 4], (v) => Promise.resolve(v + 1)).value)
				.deepEquals([2, 3, 4, 5])
		})

		o("works for mix of promises & values", async function () {
			o(await mapInCallContext([1, 2, 3, 4], (v) => v % 2 === 0 ? Promise.resolve(v + 1) : v + 1).value)
				.deepEquals([2, 3, 4, 5])
		})
	})

	o.spec("PromiseableWrapper", function () {
		o.spec("thenOrApply", function () {
			o("value + value = value", function () {
				o(new PromiseableWrapper("tuta").thenOrApply((v) => v + "nota").value).equals("tutanota")
			})

			o("value + promise = promise", async function () {
				const value: any = new PromiseableWrapper("tuta").thenOrApply((v) => Promise.resolve(v + "nota")).value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})

			o("promise + value = promise", async function () {
				const value: any = new PromiseableWrapper(Promise.resolve("tuta")).thenOrApply((v) => v + "nota").value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})

			o("proimse + promise = promise", async function () {
				const value: any = new PromiseableWrapper(Promise.resolve("tuta")).thenOrApply((v) => Promise.resolve(v + "nota")).value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})

			o("promise + wrapper = promise", async function () {
				const value: any = new PromiseableWrapper(Promise.resolve("tuta"))
					.thenOrApply((v) => new PromiseableWrapper(Promise.resolve(v + "nota"))).value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})

			o("promise + promised wrapper = promise", async function () {
				const value: any = new PromiseableWrapper(Promise.resolve("tuta"))
					.thenOrApply((v) => Promise.resolve(new PromiseableWrapper(v + "nota"))).value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})
		})

		o.spec("toPromise", function () {
			o("from value", async function () {
				const promise = new PromiseableWrapper("tuta").toPromise()
				o(typeof promise.then).equals("function")
				o(await promise.then()).equals("tuta")
			})

			o("from promise", async function () {
				const promise = new PromiseableWrapper(Promise.resolve("tuta")).toPromise()
				o(typeof promise.then).equals("function")
				o(await promise.then()).equals("tuta")
			})
		})
	})

	o.spec("promiseMap Array<T>", function () {
		o("empty", async function () {
			o(await promiseMap([], (n) => n + 1)).deepEquals([])
		})

		o("non-empty", async function () {
			o(await promiseMap([1, 2, 3], (n) => n + 1)).deepEquals([2, 3, 4])
		})

		o("async in order", async function () {
			const defer1 = defer()
			const defer2 = defer()
			const mapper = o.spy((n) => n.promise)
			const resultPromise = promiseMap([defer1, defer2], mapper)

			await Promise.resolve()
			o(mapper.callCount).equals(1)
			defer1.resolve(1)
			await Promise.resolve()
			o(mapper.callCount).equals(2)
			defer2.resolve(2)
			await Promise.resolve()
			o(await resultPromise).deepEquals([1, 2])
		})

		o("stops on rejection", async function () {
			const defer1 = defer()
			const defer2 = defer()
			const mapper = o.spy((n) => n.promise)
			const resultPromise = promiseMap([defer1, defer2], mapper)
			await Promise.resolve()
			o(mapper.callCount).equals(1)
			defer1.reject(new Error("test"))
			await assertThrows(() => resultPromise)
			o(mapper.callCount).equals(1)
		})

		o("stops on exception", async function () {
			const mapper = o.spy(() => {
				throw new Error("test")
			})
			await assertThrows(() => promiseMap([1, 2], mapper))
			o(mapper.callCount).equals(1)
		})
	})

	o.spec("promiseMap Promise<Array<T>>", function () {
		o("empty", async function () {
			o(await promiseMap(Promise.resolve([]), (n) => n + 1)).deepEquals([])
		})

		o("non-empty", async function () {
			o(await promiseMap(Promise.resolve([1, 2, 3]), (n) => n + 1)).deepEquals([2, 3, 4])
		})

		o("async in order", async function () {
			const defer1 = defer()
			const defer2 = defer()
			const mapper = o.spy((n) => n.promise)
			const resultPromise = promiseMap(Promise.resolve([defer1, defer2]), mapper)

			await Promise.resolve()
			o(mapper.callCount).equals(1)
			defer1.resolve(1)
			await Promise.resolve()
			o(mapper.callCount).equals(2)
			defer2.resolve(2)
			await Promise.resolve()
			o(await resultPromise).deepEquals([1, 2])
		})

		o("stops on rejection", async function () {
			const defer1 = defer()
			const defer2 = defer()
			const mapper = o.spy((n) => n.promise)
			const resultPromise = promiseMap(Promise.resolve([defer1, defer2]), mapper)
			await Promise.resolve()
			o(mapper.callCount).equals(1)
			defer1.reject(new Error("test"))
			await assertThrows(() => resultPromise)
			o(mapper.callCount).equals(1)
		})

		o("stops on exception", async function () {
			const mapper = o.spy(() => {
				throw new Error("test")
			})
			await assertThrows(() => promiseMap(Promise.resolve([1, 2]), mapper))
			o(mapper.callCount).equals(1)
		})
	})
})
