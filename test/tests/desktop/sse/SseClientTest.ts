import o, { verify } from "@tutao/otest"
import { SseClient } from "../../../../src/applications/common/desktop/sse/SseClient.js"
import type { SseConnectOptions, SseDelay, SseEventHandler } from "../../../../src/applications/common/desktop/sse/SseClient.js"
import type { ClientRequestOptions, DesktopNetworkClient } from "../../../../src/applications/common/desktop/net/DesktopNetworkClient.js"
import { matchers, object, when } from "testdouble"
import http from "node:http"
import { assertNotNull, defer, getFirstOrThrow } from "../../../../src/platform-kit/utils"
import { SchedulerMock } from "../../TestUtils.js"
import * as restError from "../../../../src/platform-kit/rest-client/error"
import { CONNECTION_TIMEOUT_MS } from "../../../../src/applications/common/desktop/net/HappyEyeballsConnector.js"
import { DesktopSseDelay } from "../../../../src/applications/common/desktop/sse/reconnectDelay.js"

o.spec("SseClient", function () {
	const defaultOptions: SseConnectOptions = Object.freeze({
		url: new URL("http://example.com"),
		headers: { header: "headerValue" },
	})

	let sseClient: SseClient
	let net: NetStub
	let delay: SseDelay
	let scheduler: SchedulerMock
	let listener: SseEventHandler

	o.beforeEach(() => {
		net = new NetStub()
		delay = object()
		listener = object()
		scheduler = new SchedulerMock()
		when(delay.connectionFailureDelay(matchers.anything())).thenReturn(10)
		when(delay.connectionLostDelay()).thenReturn(CONNECTION_TIMEOUT_MS)

		sseClient = new SseClient(net as unknown as DesktopNetworkClient, delay, scheduler)

		sseClient.setEventListener(listener)
	})

	o.test("connect passes options to net correctly", async () => {
		await sseClient.connect(defaultOptions)
		const request = await net.waitForRequest()
		o(request.url).deepEquals(defaultOptions.url)
		o(request.opts).deepEquals({
			headers: {
				"Content-Type": "application/json",
				Connection: "Keep-Alive",
				"Keep-Alive": "header",
				Accept: "text/event-stream",
				header: "headerValue",
			},
			method: "GET",
		})
	})

	o.spec("messages", () => {
		o.test("heartbeat does not trigger listener", async () => {
			const response = new ResponseStub()

			await sseClient.connect(defaultOptions)

			const request = await net.waitForRequest()
			await request.sendResponse(response)
			response.sendData("\n\n")

			verify(listener.onNewMessage(matchers.anything()), { times: 0 })
		})

		o.test("data message triggers listener", async () => {
			const response = new ResponseStub()

			await sseClient.connect(defaultOptions)

			const request = await net.waitForRequest()
			await request.sendResponse(response)
			response.sendData("data: test\n")

			verify(listener.onNewMessage("data: test"))
		})

		o.test("multiple data chunks trigger listener", async () => {
			const response = new ResponseStub()

			await sseClient.connect(defaultOptions)

			const request = await net.waitForRequest()
			await request.sendResponse(response)
			response.sendData("data: test1\n")
			response.sendData("data: test2\n")

			verify(listener.onNewMessage("data: test1"))
			verify(listener.onNewMessage("data: test2"))
		})

		o.test("on notAuthenticated it notifies listener", async () => {
			const response = new ResponseStub()
			response.statusCode = restError.NotAuthenticatedError.CODE
			await sseClient.connect(defaultOptions)

			const request = await net.waitForRequest()
			await request.sendResponse(response)
			verify(listener.onNotAuthenticated())
		})

		o.test("on notAuthorized it notifies listener", async () => {
			const response = new ResponseStub()
			response.statusCode = restError.NotAuthorizedError.CODE
			await sseClient.connect(defaultOptions)

			const request = await net.waitForRequest()
			await request.sendResponse(response)
			verify(listener.onNotAuthenticated())
		})
	})

	o.spec("reconnect", () => {
		o.test("reconnects if response is closed", async () => {
			const response = new ResponseStub()
			when(delay.connectionLostDelay()).thenReturn(10)

			await sseClient.connect(defaultOptions)

			const request = await net.waitForRequest()
			await request.sendResponse(response)

			net.prepareForAnotherRequest()
			response.close()
			o(net.requests.length).equals(1)("Only one request is done so far, the other one is delayed")
			scheduler.getThunkAfter(10)()

			await net.waitForRequest()
		})

		o.test("reconnects if response errors out", async () => {
			const response = new ResponseStub()

			await sseClient.connect(defaultOptions)

			const request = await net.waitForRequest()
			await request.sendResponse(response)
			when(delay.connectionLostDelay()).thenReturn(10)

			net.prepareForAnotherRequest()
			response.sendError(new Error("test"))
			o(net.requests.length).equals(1)("Only one request is done so far, the other one is delayed")
			scheduler.getThunkAfter(10)()

			await net.waitForRequest()
		})
	})

	o.spec("failing to connect", () => {
		o.test("on failing to connect the first time it reschedules with attempts=1", async () => {
			when(delay.connectionFailureDelay(1)).thenReturn(1)
			await sseClient.connect(defaultOptions)

			const request = await net.waitForRequest()
			net.prepareForAnotherRequest()
			await request.sendError(new Error("error1"))
			scheduler.getThunkAfter(1)()
			await net.waitForRequest()
		})

		o.test("on failing to connect the second time it reschedules with attempts=2", async () => {
			when(delay.connectionFailureDelay(1)).thenReturn(1)
			when(delay.connectionFailureDelay(2)).thenReturn(2)
			await sseClient.connect(defaultOptions)

			const request1 = await net.waitForRequest()
			net.prepareForAnotherRequest()
			await request1.sendError(new Error("error1"))
			scheduler.getThunkAfter(1)()

			const request2 = await net.waitForRequest()
			net.prepareForAnotherRequest()
			await request2.sendError(new Error("error2"))
			scheduler.getThunkAfter(2)()
			await net.waitForRequest()
		})

		o.test("waits for the failure delay after the establishment deadline", async () => {
			await sseClient.connect(defaultOptions)

			const request = await net.waitForRequest()
			net.prepareForAnotherRequest()
			const establishmentTimeoutThunk = scheduler.getThunkAfter(CONNECTION_TIMEOUT_MS)
			establishmentTimeoutThunk()

			o(request.state).equals("destroyed")
			o(net.requests.length).equals(1)
			scheduler.getThunkAfter(10)()
			await net.waitForRequest()
		})

		o.test("schedules the full failure delay after a slow failure", async () => {
			when(delay.connectionFailureDelay(1)).thenReturn(5_000)
			await sseClient.connect(defaultOptions)

			const request = await net.waitForRequest()
			await request.sendError(new Error("error"))

			o(scheduler.scheduledAfter.has(5_000)).equals(true)
			o(scheduler.scheduledAt.size).equals(0)
			verify(delay.connectionFailureDelay(1), { times: 1 })
		})

		o.test("reconnects if the request closes before receiving a response", async () => {
			await sseClient.connect(defaultOptions)

			const request = await net.waitForRequest()
			net.prepareForAnotherRequest()
			request.close()

			o(net.requests.length).equals(1)
			scheduler.getThunkAfter(10)()
			await net.waitForRequest()
		})

		o.test("schedules only one retry for duplicate request failure events", async () => {
			await sseClient.connect(defaultOptions)

			const request = await net.waitForRequest()
			await request.sendError(new Error("error"))
			request.close()

			verify(delay.connectionFailureDelay(1), { times: 1 })
			o(scheduler.alarmId).equals(2)
		})

		o.test("destroys a response from a stale request", async () => {
			await sseClient.connect(defaultOptions)

			const firstRequest = await net.waitForRequest()
			await firstRequest.sendError(new Error("error"))
			net.prepareForAnotherRequest()
			scheduler.getThunkAfter(10)()
			await net.waitForRequest()

			const staleResponse = new ResponseStub()
			await firstRequest.sendResponse(staleResponse)
			o(staleResponse.state).equals("destroyed")
		})

		o.test("cancels the establishment deadline after receiving a response", async () => {
			await sseClient.connect(defaultOptions)
			const establishmentTimeout = assertNotNull(scheduler.scheduledAfter.get(CONNECTION_TIMEOUT_MS)).id
			const establishmentTimeoutThunk = scheduler.getThunkAfter(CONNECTION_TIMEOUT_MS)

			const request = await net.waitForRequest()
			await request.sendResponse(new ResponseStub())
			establishmentTimeoutThunk()

			o(scheduler.cancelledAt.has(establishmentTimeout)).equals(true)
			o(request.state).equals("created")
		})
	})

	o.spec("heartbeat", () => {
		o.test("when heartbeat is received before the heartbeat interval the connection is kept open", async () => {
			sseClient.setReadTimeout(15)

			await sseClient.connect(defaultOptions)
			const request = await net.waitForRequest()
			const response = new ResponseStub()
			await request.sendResponse(response)
			response.sendData("\n\n")
			await getFirstOrThrow(scheduler.getAllPeriodThunks())()
			o(request.state).equals("created")
		})

		o.test("when heartbeat is not received before the heartbeat interval the connection is closed and another one open", async () => {
			sseClient.setReadTimeout(15)

			await sseClient.connect(defaultOptions)
			const request = await net.waitForRequest()
			const response = new ResponseStub()
			await request.sendResponse(response)

			net.prepareForAnotherRequest()

			await getFirstOrThrow(scheduler.getAllPeriodThunks())()
			o(request.state).equals("destroyed")
			await net.waitForRequest()
		})

		o.test("heartbeat is rescheduled when setReadTimeout is called", async () => {
			sseClient.setReadTimeout(15)
			sseClient.setReadTimeout(25)
			o(scheduler.cancelledPeriodic.size).equals(1)("one periodic timeout canceled")
			o(scheduler.getAllPeriodThunks().length).equals(2)("rescheduled heartbeat thunk")
		})
	})

	o.spec("external state switching", () => {
		o.test("should connect eventually connect if connect() is called while disconnecting", async () => {
			await sseClient.connect(defaultOptions)
			const request = await net.waitForRequest()
			// Call disconnect, it will call destroy on the request but we will not close the connection right away
			request.doNotClose()
			// do not wait for it
			sseClient.disconnect()
			await request.waitForDestroy()
			// to actually finish close and allow another request
			request.eventListeners.get("close")?.()

			net.prepareForAnotherRequest()
			await sseClient.connect(defaultOptions)
			await net.waitForRequest()
		})

		o.test("should cancel timeouts if disconnect is called while waiting to reconnect", async () => {
			await sseClient.connect(defaultOptions)
			const request = await net.waitForRequest()
			await request.sendError(new Error("test"))

			await sseClient.disconnect()
			o(scheduler.cancelledAt.size).equals(2)
		})

		o.test("should disconnect and use new options if connect() is called while connected", async () => {
			await sseClient.connect(defaultOptions)
			const response = new ResponseStub()
			const request = await net.waitForRequest()
			await request.sendResponse(response)

			net.prepareForAnotherRequest()

			const newOptions = Object.freeze({
				url: new URL("https://another.com"),
				headers: { anotherHeader: "anotherValue" },
			})
			await sseClient.connect(newOptions)
			o(request.state).equals("destroyed")
			const newRequest = await net.waitForRequest()
			o(newRequest.url).deepEquals(newOptions.url)
			o(newRequest.opts).deepEquals({
				headers: {
					"Content-Type": "application/json",
					Connection: "Keep-Alive",
					"Keep-Alive": "header",
					Accept: "text/event-stream",
					anotherHeader: "anotherValue",
				},
				method: "GET",
			})
		})
	})
})

o.spec("DesktopSseDelay", () => {
	o.test("uses crypto-compatible equal-jitter bounds with 20, 40, 80 and 120 second ceilings", () => {
		const requestedBounds: Array<[number, number]> = []
		const minimumDelay = new DesktopSseDelay((minimum, maximum) => {
			requestedBounds.push([minimum, maximum])
			return minimum
		})
		const maximumDelay = new DesktopSseDelay((_minimum, maximum) => maximum - 1)

		o(minimumDelay.connectionLostDelay()).equals(10_000)
		o(maximumDelay.connectionLostDelay()).equals(20_000)
		o(minimumDelay.connectionFailureDelay(1)).equals(10_000)
		o(maximumDelay.connectionFailureDelay(1)).equals(20_000)
		o(minimumDelay.connectionFailureDelay(2)).equals(20_000)
		o(maximumDelay.connectionFailureDelay(2)).equals(40_000)
		o(minimumDelay.connectionFailureDelay(3)).equals(40_000)
		o(maximumDelay.connectionFailureDelay(3)).equals(80_000)
		o(minimumDelay.connectionFailureDelay(4)).equals(60_000)
		o(maximumDelay.connectionFailureDelay(4)).equals(120_000)
		o(minimumDelay.connectionFailureDelay(10)).equals(60_000)
		o(maximumDelay.connectionFailureDelay(10)).equals(120_000)
		o(requestedBounds).deepEquals([
			[10_000, 20_001],
			[10_000, 20_001],
			[20_000, 40_001],
			[40_000, 80_001],
			[60_000, 120_001],
			[60_000, 120_001],
		])
	})
})

class NetStub implements Partial<DesktopNetworkClient> {
	private requestDefer = defer<RequestStub>()
	requests: RequestStub[] = []

	request(url: URL, opts: ClientRequestOptions): http.ClientRequest {
		const requestMock = new RequestStub(url, opts)
		this.requests.push(requestMock)
		this.requestDefer.resolve(requestMock)
		return requestMock as unknown as http.ClientRequest
	}

	waitForRequest(): Promise<RequestStub> {
		return this.requestDefer.promise
	}

	prepareForAnotherRequest() {
		this.requestDefer = defer()
	}
}

class RequestStub implements Partial<http.ClientRequest> {
	state: "created" | "destroyed" = "created"
	eventListeners = new Map<string, (...args: any[]) => unknown>()
	destroyedDefer = defer<void>()
	preventClose = false

	constructor(
		readonly url: URL,
		readonly opts: ClientRequestOptions,
	) {}

	on(event, listener) {
		this.eventListeners.set(event, listener)
		return this as unknown as http.ClientRequest
	}

	once(event, listener) {
		this.eventListeners.set(event, listener)
		return this as unknown as http.ClientRequest
	}

	async sendResponse(response: ResponseStub) {
		await assertNotNull(this.eventListeners.get("response"))(response)
	}

	async sendError(error: Error) {
		await this.eventListeners.get("error")!(error)
	}

	close() {
		this.eventListeners.get("close")?.()
	}

	waitForDestroy() {
		return this.destroyedDefer.promise
	}

	destroy() {
		this.state = "destroyed"
		if (!this.preventClose) {
			this.eventListeners.get("close")?.()
		}

		this.destroyedDefer.resolve()
		return this as unknown as http.ClientRequest
	}

	end() {
		return this as unknown as http.ClientRequest
	}

	doNotClose() {
		this.preventClose = true
	}
}

class ResponseStub implements Partial<http.IncomingMessage> {
	statusCode: number = 200
	state: "created" | "destroyed" = "created"
	eventListeners = new Map<string, (...args: any[]) => unknown>()

	on(event, listener) {
		this.eventListeners.set(event, listener)
		return this as unknown as http.IncomingMessage
	}

	setEncoding() {
		return this as unknown as http.IncomingMessage
	}

	sendData(data: string) {
		assertNotNull(this.eventListeners.get("data"))(data)
	}

	close() {
		this.eventListeners.get("close")?.()
	}

	sendError(e: Error) {
		this.eventListeners.get("error")?.()
	}

	destroy() {
		this.state = "destroyed"
		return this as unknown as http.IncomingMessage
	}
}
