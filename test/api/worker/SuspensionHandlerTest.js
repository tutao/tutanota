//@flow
import o from "ospec"
import {SuspensionHandler} from "../../../src/api/worker/SuspensionHandler"
import {downcast} from "../../../src/api/common/utils/Utils"
import type {WorkerImpl} from "../../../src/api/worker/WorkerImpl"
import {delay} from "../../../src/api/common/utils/PromiseUtils"
import {assertNotResolvedIn, assertResolvedIn} from "../TestUtils"

o.spec("SuspensionHandler test", () => {

	let suspensionHandler
	let workerMock: WorkerImpl


	let restRequest;

	o.beforeEach(() => {
		workerMock = downcast({
			infoMessage: (args) => {}
		})

		restRequest = () => Promise.resolve()
		suspensionHandler = new SuspensionHandler(workerMock, 1)
	})


	o("activate suspension", node(async function () {
		o(suspensionHandler.isSuspended()).equals(false)

		const beforeTime1 = Date.now()
		suspensionHandler.activateSuspensionIfInactive(100)
		const deferredRequest1 = suspensionHandler.deferRequest(restRequest)

		await assertNotResolvedIn(10, deferredRequest1)

		o(suspensionHandler.isSuspended()).equals(true)
		o(suspensionHandler._deferredRequests.length).equals(1)
		await deferredRequest1
		checkSuspensionTime(beforeTime1, 100)
		o(suspensionHandler.isSuspended()).equals(false)

		// activating again should have the exact same behaviour
		const beforeTime2 = Date.now()
		suspensionHandler.activateSuspensionIfInactive(50)
		const deferredRequest2 = suspensionHandler.deferRequest(restRequest)

		await assertNotResolvedIn(10, deferredRequest2)

		o(suspensionHandler.isSuspended()).equals(true)
		o(suspensionHandler._deferredRequests.length).equals(1)
		await deferredRequest2
		checkSuspensionTime(beforeTime2, 50)
		o(suspensionHandler.isSuspended()).equals(false)

	}))


	o("handle defer suspension not active", node(async function () {
		const deferredRequest = suspensionHandler.deferRequest(restRequest)
		o(suspensionHandler.isSuspended()).equals(false)
		await assertResolvedIn(10, deferredRequest)
	}))

	o("handle multiple suspensions", node(async function () {
		let firstCalled = false
		let secondCalled = false
		const request1 = () => {
			firstCalled = true
			o(secondCalled).equals(false)("Second request was resolved before the first one")
			return Promise.resolve()
		}

		const request2 = () => {
			secondCalled = true
			o(firstCalled).equals(true)("First request was not resolved before the second one")
			return Promise.resolve()
		}

		const beforeTime = Date.now()
		suspensionHandler.activateSuspensionIfInactive(100)
		const deferredRequest1 = suspensionHandler.deferRequest(request1)

		suspensionHandler.activateSuspensionIfInactive(50)
		const deferredRequest2 = suspensionHandler.deferRequest(request2)
		await delay(50)
		o(suspensionHandler._deferredRequests.length).equals(2)
		o(suspensionHandler.isSuspended()).equals(true)
		await assertNotResolvedIn(10, deferredRequest1, deferredRequest2)
		await deferredRequest2
		checkSuspensionTime(beforeTime, 100)
		o(suspensionHandler.isSuspended()).equals(false)
		o(suspensionHandler._deferredRequests.length).equals(0)
	}))

	o("deferred request throws exception", async () => {
		suspensionHandler.activateSuspensionIfInactive(100)
		const d1 = suspensionHandler.deferRequest(() => Promise.resolve("noice"))
		const d2 = suspensionHandler.deferRequest(() => { throw "oi" }).catch(e => ({exception: e})) // no exception should be thrown anywhere
		const d3 = suspensionHandler.deferRequest(() => Promise.resolve("'ken oath"))
		const d4 = suspensionHandler.deferRequest(() => { throw "karn" }).catch(e => ({exception: e})) // no exception should be thrown anywhere

		const returned1 = await d1
		const caught1 = await d2
		const returned2 = await d3
		const caught2 = await d4

		o(returned1).equals("noice")
		o(returned2).equals("'ken oath")
		o(caught1).deepEquals({exception: "oi"})
		o(caught2).deepEquals({exception: "karn"})
	})

})


function checkSuspensionTime(startTime: number, expectedSuspensionTime) {
	const diff = Date.now() - startTime
	o(diff >= expectedSuspensionTime).equals(true)
	o(diff <= (expectedSuspensionTime + 10)).equals(true)
}