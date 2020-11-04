//@flow
import o from "ospec/ospec.js"
import {SuspensionHandler} from "../../../src/api/worker/SuspensionHandler"
import {defer, downcast} from "../../../src/api/common/utils/Utils"
import type {WorkerImpl} from "../../../src/api/worker/WorkerImpl"


const REST_TEST_PATH = "/rest/test"
const REST_OTHER_TEST_PATH = "/rest/othertest"

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
		o(deferredRequest1.isFulfilled()).equals(false)

		o(suspensionHandler.isSuspended()).equals(true)
		o(suspensionHandler._deferredRequests.length).equals(1)
		await deferredRequest1
		checkSuspensionTime(beforeTime1, 100)
		o(suspensionHandler.isSuspended()).equals(false)

		// activating again should have the exact same behaviour
		const beforeTime2 = Date.now()
		suspensionHandler.activateSuspensionIfInactive(50)
		const deferredRequest2 = suspensionHandler.deferRequest(restRequest)
		o(deferredRequest2.isFulfilled()).equals(false)

		o(suspensionHandler.isSuspended()).equals(true)
		o(suspensionHandler._deferredRequests.length).equals(1)
		await deferredRequest2
		checkSuspensionTime(beforeTime2, 50)
		o(suspensionHandler.isSuspended()).equals(false)

	}))


	o("handle defer suspension not active", node(async function () {
		const deferredRequest = suspensionHandler.deferRequest(restRequest)
		o(suspensionHandler.isSuspended()).equals(false)
		o(deferredRequest.isFulfilled()).equals(true)
	}))

	o("handle multiple suspensions", node(async function () {
		const deferred1 = defer()
		const deferred2 = defer()
		const request1 = () => {
			o(deferred2.promise.isFulfilled()).equals(false)
			deferred1.resolve()
			return deferred1.promise
		}

		const request2 = () => {
			o(deferred1.promise.isFulfilled()).equals(true)
			deferred1.resolve()
			return deferred1.promise
		}

		const beforeTime = Date.now()
		suspensionHandler.activateSuspensionIfInactive(100)
		const deferredRequest1 = suspensionHandler.deferRequest(request1)

		suspensionHandler.activateSuspensionIfInactive(50)
		const deferredRequest2 = suspensionHandler.deferRequest(request2)
		await Promise.delay(50)
		o(suspensionHandler._deferredRequests.length).equals(2)
		o(suspensionHandler.isSuspended()).equals(true)
		o(deferredRequest1.isFulfilled()).equals(false)
		o(deferredRequest2.isFulfilled()).equals(false)
		await deferredRequest2
		checkSuspensionTime(beforeTime, 100)
		o(suspensionHandler.isSuspended()).equals(false)
		o(suspensionHandler._deferredRequests.length).equals(0)
	}))

	o("deferred request throws exception", async () => {
		const callOnResolve  = o.spy()
		const shouldntGetCalled = o.spy()

		suspensionHandler.activateSuspensionIfInactive(100)
		const d1 = suspensionHandler.deferRequest(() => Promise.resolve("noice")).tap(callOnResolve)
		const d2 = suspensionHandler.deferRequest(() => { throw "oi" }).tap(shouldntGetCalled).catch(e => e) // no exception should be thrown anywhere
		const d3 = suspensionHandler.deferRequest(() => Promise.resolve("'ken oath")).tap(callOnResolve)
		const d4 = suspensionHandler.deferRequest(() => { throw "karn" }).tap(shouldntGetCalled).catch(e => e) // no exception should be thrown anywhere

		const returned1 = await d1
		const caught1 = await d2
		const returned2 = await d3
		const caught2 = await d4

		o(returned1).equals("noice")
		o(returned2).equals("'ken oath")
		o(caught1).equals("oi")
		o(caught2).equals("karn")
		o(callOnResolve.callCount).equals(2)
		o(shouldntGetCalled.callCount).equals(0)
	})

})


function checkSuspensionTime(startTime: number, expectedSuspensionTime) {
	const diff = Date.now() - startTime
	o(diff >= expectedSuspensionTime).equals(true)
	o(diff <= (expectedSuspensionTime + 10)).equals(true)
}