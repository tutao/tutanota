import o from "@tutao/otest"
import { SuspensionHandler } from "../../../../src/common/api/worker/SuspensionHandler.js"
import { deferWithHandler, downcast } from "@tutao/tutanota-utils"
import type { SystemTimeout } from "../../../../src/common/api/common/utils/Scheduler.js"
import { InfoMessageHandler } from "../../../../src/common/gui/InfoMessageHandler.js"
import { matchers, object } from "testdouble"
import { spy, verify } from "@tutao/tutanota-test-utils"

o.spec("SuspensionHandler test", () => {
	let suspensionHandler
	let systemTimeout
	let messageHandlerMock: InfoMessageHandler
	o.beforeEach(() => {
		messageHandlerMock = object()
		let timeoutFn = () => {}

		systemTimeout = {
			setTimeout: spy((fn) => {
				timeoutFn = fn
			}),
			clearTimeout: spy(),
			finish: () => timeoutFn(),
		}
		suspensionHandler = new SuspensionHandler(messageHandlerMock, downcast<SystemTimeout>(systemTimeout))
	})
	o.spec("activating suspension", function () {
		o(
			"should prepare callback when not suspended",
			node(async function () {
				suspensionHandler._isSuspended = false
				suspensionHandler.activateSuspensionIfInactive(100)
				o(systemTimeout.setTimeout.args[0]).notEquals(null)
				o(systemTimeout.setTimeout.args[1]).equals(100 * 1000)
				o(suspensionHandler.isSuspended()).equals(true)
			}),
		)
		o(
			"should be a no op when suspended",
			node(async function () {
				suspensionHandler._isSuspended = true
				suspensionHandler._hasSentInfoMessage = false
				suspensionHandler.activateSuspensionIfInactive(100)
				o(systemTimeout.setTimeout.callCount).equals(0)
				o(suspensionHandler.isSuspended()).equals(true)
				verify(messageHandlerMock.onInfoMessage(matchers.anything()), { times: 0 })
			}),
		)
		o(
			"should go to not suspended state when suspension is complete",
			node(async function () {
				suspensionHandler._isSuspended = false
				suspensionHandler.activateSuspensionIfInactive(100)
				systemTimeout.finish()
				o(suspensionHandler.isSuspended()).equals(false)
			}),
		)
		o(
			"should send suspend notification",
			node(async function () {
				suspensionHandler._isSuspended = false
				suspensionHandler._hasSentInfoMessage = false
				suspensionHandler.activateSuspensionIfInactive(100)
				verify(messageHandlerMock.onInfoMessage(matchers.anything()), { times: 1 })
			}),
		)
		o(
			"should not send suspend notification",
			node(async function () {
				suspensionHandler._isSuspended = false
				suspensionHandler._hasSentInfoMessage = true
				suspensionHandler.activateSuspensionIfInactive(100)
				verify(messageHandlerMock.onInfoMessage(matchers.anything()), { times: 0 })
			}),
		)
	})
	o.spec("defer request", function () {
		o(
			"should not defer request when not suspended",
			node(async function () {
				suspensionHandler._isSuspended = false
				const request = spy(() => Promise.resolve("ok"))
				const returnValue = await suspensionHandler.deferRequest(request)
				o(request.callCount).equals(1)
				o(returnValue).equals("ok")
			}),
		)
		o(
			"should defer request when suspended",
			node(async function () {
				suspensionHandler._isSuspended = true
				const request = spy(() => Promise.resolve("ok"))
				const returnedPromise = suspensionHandler.deferRequest(request)

				suspensionHandler._deferredRequests[0].resolve()

				const returnValue = await returnedPromise
				o(request.callCount).equals(1)
				o(returnValue).equals("ok")
			}),
		)
	})
	o.spec(
		"suspension complete handler",
		node(function () {
			o("should execute suspended requests in order and reset", async function () {
				const results: string[] = []
				const request1 = spy(async () => {
					results.push("ok!")
				})
				const deferral1 = deferWithHandler(request1)
				const request2 = spy(async () => {
					results.push("wow!")
				})
				const deferral2 = deferWithHandler(request2)

				suspensionHandler._deferredRequests.push(deferral1)

				suspensionHandler._deferredRequests.push(deferral2)

				await suspensionHandler._onSuspensionComplete()
				o(results).deepEquals(["ok!", "wow!"])("Requests were executed in order")
				o(suspensionHandler._deferredRequests.length).equals(0)("Requests have been reset")
			})
			o(
				"should ignore rejecting requests and keep going",
				node(async function () {
					const requestThatRejects = spy(() => Promise.reject("oh no!"))
					const requestThatResolves = spy(() => Promise.resolve("ok!"))
					const deferralThatRejects = deferWithHandler(requestThatRejects)
					const deferralThatResolves = deferWithHandler(requestThatResolves)

					suspensionHandler._deferredRequests.push(deferralThatRejects)

					suspensionHandler._deferredRequests.push(deferralThatResolves)

					// No exception was thrown, and following request were completed
					await suspensionHandler._onSuspensionComplete()
					o(requestThatRejects.callCount).equals(1)
					o(requestThatResolves.callCount).equals(1)
				}),
			)
		}),
	)
})
