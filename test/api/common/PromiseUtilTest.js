//@flow

import o from "ospec/ospec.js"
import {mapInCallContext, PromisableWrapper as PromiseableWrapper} from "../../../src/api/common/utils/PromiseUtils"


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

	o.spec("PromieableWrapper", function () {
		o.spec("thenOrApply", function () {
			o("value + value = value", function () {
				o(new PromiseableWrapper("tuta").thenOrApply((v) => v + "nota").value).equals("tutanota")
			})

			o("value + promise = promise", async function () {
				const value = new PromiseableWrapper("tuta").thenOrApply((v) => Promise.resolve(v + "nota")).value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})

			o("promise + value = promise", async function () {
				const value = new PromiseableWrapper(Promise.resolve("tuta")).thenOrApply((v) => v + "nota").value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})

			o("proimse + promise = promise", async function () {
				const value = new PromiseableWrapper(Promise.resolve("tuta")).thenOrApply((v) => Promise.resolve(v + "nota")).value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})

			o("promise + wrapper = promise", async function () {
				const value = new PromiseableWrapper(Promise.resolve("tuta"))
					.thenOrApply((v) => new PromiseableWrapper(Promise.resolve(v + "nota"))).value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})

			o("promise + promised wrapper = promise", async function () {
				const value = new PromiseableWrapper(Promise.resolve("tuta"))
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

})
