import o, { verify } from "@tutao/otest"
import { func, matchers, when } from "testdouble"
import { mapInCallContext, PromisableWrapper } from "../../../../../src/applications/mail-app/workerUtils/index/IndexerPromiseUtils"

function mockDeferMapper() {
	const mapper = func<(el: any, idx: number) => Promise<any>>((n) => n.promise)
	when(mapper(matchers.anything(), matchers.anything())).thenDo((n) => n.promise)
	return mapper
}

o.spec("IndexerPromiseUtils", function () {
	o.spec("mapInCallContexnt", function () {
		o("works for values", function () {
			o(mapInCallContext([1, 2, 3, 4], (v) => v + 1).value).deepEquals([2, 3, 4, 5])
		})
		o("works for promises", async function () {
			o(await mapInCallContext([1, 2, 3, 4], (v) => Promise.resolve(v + 1)).value).deepEquals([2, 3, 4, 5])
		})
		o("works for mix of promises & values", async function () {
			o(await mapInCallContext([1, 2, 3, 4], (v) => (v % 2 === 0 ? Promise.resolve(v + 1) : v + 1)).value).deepEquals([2, 3, 4, 5])
		})
	})
	o.spec("PromiseableWrapper", function () {
		o.spec("thenOrApply", function () {
			o("value + value = value", function () {
				o(new PromisableWrapper("tuta").thenOrApply((v) => v + "nota").value).equals("tutanota")
			})
			o("value + promise = promise", async function () {
				const value: any = new PromisableWrapper("tuta").thenOrApply((v) => Promise.resolve(v + "nota")).value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})
			o("promise + value = promise", async function () {
				const value: any = new PromisableWrapper(Promise.resolve("tuta")).thenOrApply((v) => v + "nota").value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})
			o("proimse + promise = promise", async function () {
				const value: any = new PromisableWrapper(Promise.resolve("tuta")).thenOrApply((v) => Promise.resolve(v + "nota")).value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})
			o("promise + wrapper = promise", async function () {
				const value: any = new PromisableWrapper(Promise.resolve("tuta")).thenOrApply((v) => new PromisableWrapper(Promise.resolve(v + "nota"))).value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})
			o("promise + promised wrapper = promise", async function () {
				const value: any = new PromisableWrapper(Promise.resolve("tuta")).thenOrApply((v) => Promise.resolve(new PromisableWrapper(v + "nota"))).value
				o(typeof value.then).equals("function")
				o(await value).equals("tutanota")
			})
		})
		o.spec("toPromise", function () {
			o("from value", async function () {
				const promise = new PromisableWrapper("tuta").toPromise()
				o(typeof promise.then).equals("function")
				o(await promise.then()).equals("tuta")
			})
			o("from promise", async function () {
				const promise = new PromisableWrapper(Promise.resolve("tuta")).toPromise()
				o(typeof promise.then).equals("function")
				o(await promise.then()).equals("tuta")
			})
		})
	})
})
