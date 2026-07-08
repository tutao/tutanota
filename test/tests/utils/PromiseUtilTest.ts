import o, { verify } from "@tutao/otest"
import { defer, delay, promiseFilter, promiseMap } from "../../../src/platform-kit/utils"
import { func, matchers, when } from "testdouble"
import { MicrotaskBouncer } from "../../../src/platform-kit/utils/PromiseUtils"

function mockDeferMapper() {
	const mapper = func<(el: any, idx: number) => Promise<any>>((n) => n.promise)
	when(mapper(matchers.anything(), matchers.anything())).thenDo((n) => n.promise)
	return mapper
}

o.spec("PromiseUtils", () => {
	o.spec("promiseMap Array<T>", () => {
		o.test("empty", async () => {
			o.check(await promiseMap([], async (n) => n + 1)).deepEquals([])
		})
		o.test("non-empty", async () => {
			o.check(await promiseMap([1, 2, 3], async (n) => n + 1)).deepEquals([2, 3, 4])
		})

		o.test("parallel", async () => {
			const defer1 = defer<void>()
			const defer2 = defer<void>()
			const defer3 = defer<void>()
			const mapper = mockDeferMapper()

			promiseMap([defer1, defer2, defer3], mapper, {
				concurrency: 2,
			})
			await delay(1)
			verify(mapper(matchers.anything(), matchers.anything()), { times: 2 })
			defer1.resolve()
			await delay(1)
			verify(mapper(matchers.anything(), matchers.anything()), { times: 3 })
			defer2.resolve()
			await delay(1)
			verify(mapper(matchers.anything(), matchers.anything()), { times: 3 })
			defer3.resolve()
			await delay(1)
			verify(mapper(matchers.anything(), matchers.anything()), { times: 3 })
		})

		o.test("async in order", async () => {
			const defer1 = defer()
			const defer2 = defer()
			const mapper = mockDeferMapper()
			const resultPromise = promiseMap([defer1, defer2], mapper)
			await Promise.resolve()
			verify(mapper(matchers.anything(), matchers.anything()), { times: 1 })
			defer1.resolve(1)
			await delay(1)
			verify(mapper(matchers.anything(), matchers.anything()), { times: 2 })
			defer2.resolve(2)
			await Promise.resolve()
			o.check(await resultPromise).deepEquals([1, 2])
		})
		o.test("stops on rejection", async () => {
			const defer1 = defer()
			const defer2 = defer()
			const mapper = mockDeferMapper()
			const resultPromise = promiseMap([defer1, defer2], mapper)
			await Promise.resolve()
			verify(mapper(matchers.anything(), matchers.anything()), { times: 1 })
			defer1.reject(new Error("test"))
			await o.check(() => resultPromise).asyncThrows(Error)
			verify(mapper(matchers.anything(), matchers.anything()), { times: 1 })
		})
		o.test("stops on exception", async () => {
			const mapper = func<(number: number, idx: number) => Promise<number>>()
			when(mapper(matchers.anything(), matchers.anything()), { ignoreExtraArgs: true }).thenDo(() => {
				throw new Error("test")
			})
			await o.check(() => promiseMap([1, 2], mapper)).asyncThrows(Error)
			// we would test that the mapper is called here but testdouble is not supporting that and are being very stubborn about it
			//https://github.com/testdouble/testdouble.js/issues/412
		})
	})
	o.spec("promiseFilter", () => {
		async function isEven(n) {
			return n % 2 === 0
		}

		o.test("sync", async () => {
			const arr = [1, 2, 3, 4]
			const result = await promiseFilter(arr, isEven)
			o.check(result).deepEquals([2, 4])
		})
		o.test("async", async () => {
			const arr = [1, 2, 3, 4]
			const result = await promiseFilter(arr, (n) => Promise.resolve(isEven(n)))
			o.check(result).deepEquals([2, 4])
		})
		o.test("index", async () => {
			const arr = [1, 2, 3, 4]
			const result = await promiseFilter(arr, (_, i) => Promise.resolve(isEven(i)))
			o.check(result).deepEquals([1, 3])
		})
		o.test("no concurrency", async () => {
			// One deferred per each item we want to check
			const arr = [1, 2, 3, 4]
			const deferred = [defer<boolean>(), defer<boolean>(), defer<boolean>(), defer<boolean>()]
			const mapper = func<(el: number, idx: number) => Promise<boolean>>()
			when(mapper(matchers.anything(), matchers.anything())).thenDo((_, i) => {
				// testdouble being stubborn about calling this in verification too
				if (typeof i === "number") {
					return deferred[i].promise
				}
			})
			const resultP = promiseFilter(arr, mapper)
			verify(mapper(matchers.anything(), 0), { times: 1 })
			deferred[0].resolve(true)
			await delay(1)
			verify(mapper(matchers.anything(), matchers.anything()), { times: 2 })
			deferred[1].resolve(false)
			await delay(1)
			verify(mapper(matchers.anything(), matchers.anything()), { times: 3 })
			deferred[2].resolve(false)
			await delay(1)
			verify(mapper(matchers.anything(), matchers.anything()), { times: 4 })
			deferred[3].resolve(true)
			await delay(1)
			verify(mapper(matchers.anything(), matchers.anything()), { times: 4 })
			o.check(await resultP).deepEquals([1, 4])
		})
	})

	o.spec("MicrotaskBouncer", () => {
		o.test("awaiting bounce yields to queued macro task when the time slice is over", async () => {
			let isMacrotaskProcessed = false
			setTimeout(() => {
				isMacrotaskProcessed = true
			}, 0)

			let currentDate = 0
			const microtaskBouncer = new MicrotaskBouncer(2, () => currentDate)

			await microtaskBouncer.bounce()
			await Promise.resolve()
			o.check(isMacrotaskProcessed).equals(false)

			currentDate = 1
			await microtaskBouncer.bounce()
			await Promise.resolve()
			o.check(isMacrotaskProcessed).equals(false)

			currentDate = 2
			await microtaskBouncer.bounce()
			await Promise.resolve()
			o.check(isMacrotaskProcessed).equals(false)

			currentDate = 3
			await microtaskBouncer.bounce()
			await Promise.resolve()
			o.check(isMacrotaskProcessed).equals(true)
		})

		o.test("eviction timestamp resets after yielding", async () => {
			let isFirstMacrotaskProcessed = false
			setTimeout(() => {
				isFirstMacrotaskProcessed = true
			}, 0)

			let currentDate = 0
			const microtaskBouncer = new MicrotaskBouncer(2, () => currentDate)

			await microtaskBouncer.bounce()
			await Promise.resolve()
			o.check(isFirstMacrotaskProcessed).equals(false)

			currentDate = 3
			await microtaskBouncer.bounce()
			await Promise.resolve()
			o.check(isFirstMacrotaskProcessed).equals(true)

			let isSecondMacrotaskProcessed = false
			setTimeout(() => {
				isSecondMacrotaskProcessed = true
			}, 0)

			currentDate = 4
			await microtaskBouncer.bounce()
			await Promise.resolve()
			o.check(isSecondMacrotaskProcessed).equals(false)

			currentDate = 5
			await microtaskBouncer.bounce()
			await Promise.resolve()
			o.check(isSecondMacrotaskProcessed).equals(false)

			currentDate = 6
			await microtaskBouncer.bounce()
			await Promise.resolve()
			o.check(isSecondMacrotaskProcessed).equals(false)

			currentDate = 7
			await microtaskBouncer.bounce()
			await Promise.resolve()
			o.check(isSecondMacrotaskProcessed).equals(true)
		})
	})
})
