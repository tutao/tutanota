import o from "@tutao/otest"
import { RestClient, restError, restSuspension } from "../../../src/platform-kit/rest-client"
import {
	HttpMethod,
	InterceptedResponse,
	MediaType,
	ProgressListener,
	RestBinaryBody,
	RestClientMiddleware,
	RestTextBody,
	SuspensionBehavior,
} from "../../../src/platform-kit/rest-client/types"
import { CancelledError } from "../../../src/platform-kit/app-env/CancelledError"
import { defer, noOp } from "../../../src/platform-kit/utils"
import http from "node:http"
import express from "express"
import bodyParser from "body-parser"
import type { AddressInfo } from "node:net"
import { matchers, object, reset, verify } from "testdouble"
import { domainConfigStub } from "../TestUtils"
import { ClientPlatform } from "../../../src/platform-kit/app-env/boot/ClientDetector"
import { APPLICATION_TYPES_HASH_HEADER, ServerModelInfo, UpdateAppTypesHashMiddleware } from "../../../src/platform-kit/instance-pipeline"
import { DEFAULT_REST_CLIENT_OPTIONS } from "../../../src/platform-kit/instance-pipeline/RestClientOptions"
import { ApplicationTypesService_GET } from "@tutao/entities/base"
import { HttpClientJavascript, HttpResponse } from "../../../src/platform-kit/rest-client/HttpClientJavascript"
import { HttpClient } from "../../../src/platform-kit/rest-client/HttpClient"

type SuspensionHandler = restSuspension.SuspensionHandler

// only runs in node, it spins up a local server and connects to it

const SERVER_TIME_IN_HEADER = "Mon, 12 Jul 2021 13:18:39 GMT"
const SERVER_TIMESTAMP = 1626095919000
const { anything } = matchers

o.spec("RestClientTest", function () {
	const suspensionHandlerMock: Partial<SuspensionHandler> = {
		activateSuspensionIfInactive: noOp,
		isSuspended: () => false,
		deferRequest: (request) => request(),
	}
	const serverModelInfoMock: ServerModelInfo = object()
	let restClient: RestClient
	o.spec("integration tests", function () {
		let app = express()
		let server: http.Server
		let port: number
		let baseUrl: string

		o.before(async function () {
			server = await new Promise((resolve) => {
				const s = app.listen(0, () => resolve(s))
			})
			port = (server.address() as AddressInfo)!.port
			baseUrl = `http://localhost:${port}`
		})

		o.beforeEach(() => {
			restClient = new RestClient(
				suspensionHandlerMock as SuspensionHandler,
				domainConfigStub,
				String(ClientPlatform.UNKNOWN),
				new HttpClientJavascript(),
			)
		})

		o.after(async function () {
			const s = server
			if (s) {
				await new Promise<void>((resolve) =>
					s.close(function (err) {
						if (err) console.log(err)
						resolve()
					}),
				)
			}
		})
		o("GET json", async function () {
			o.timeout(400)
			let responseText = '{"msg":"Hello Client"}'
			app.get("/get/json", (req, res) => {
				o(req.method).equals("GET")
				o(req.headers["content-type"]).equals(undefined)
				o(req.headers["accept"]).equals("application/json")
				res.send(responseText)
			})
			const res = await restClient.request("/get/json", HttpMethod.GET, {
				...DEFAULT_REST_CLIENT_OPTIONS,
				responseType: MediaType.Json,
				baseUrl,
			})
			o(res).equals(responseText)
		})
		o("GET with body (converted to query parameter)", async function () {
			o.timeout(200)
			let request = "{get: true}"
			const deferred = defer<void>()
			app.get("/get/with-body", (req, res) => {
				o(req.method).equals("GET")
				o(req.query._body).equals(request)
				res.send()
				deferred.resolve()
			})
			restClient.request("/get/with-body", HttpMethod.GET, {
				...DEFAULT_REST_CLIENT_OPTIONS,
				body: new RestTextBody(request),
				responseType: MediaType.Json,
				baseUrl,
			})
			await deferred.promise
		})
		o("GET binary", async function () {
			o.timeout(200)
			let response = new Buffer([1, 50, 83, 250])
			app.get("/get/binary", (req, res) => {
				o(req.method).equals("GET")
				o(req.headers["content-type"]).equals(undefined)
				o(req.headers["accept"]).equals("application/octet-stream")
				res.send(response)
			})
			const res = await restClient.request("/get/binary", HttpMethod.GET, {
				...DEFAULT_REST_CLIENT_OPTIONS,
				queryParams: {},
				responseType: MediaType.Binary,
				baseUrl,
			})
			o(res instanceof Uint8Array).equals(true)
			o(Array.from(res as any)).deepEquals(Array.from(response))
		})
		o("POST json", testJson("POST"))
		o("PUT json", testJson("PUT"))
		o("DELETE json", testJson("DELETE"))

		function testJson(method) {
			return async function () {
				o.timeout(200)
				let requestText = '{"msg":"Dear Server"}'
				let responseText = '{"msg":"Hello Client"}'
				let url = "/" + method + "/json"
				app.use(bodyParser.json())
				app[method.toLowerCase()](url, (req, res) => {
					o(req.method).equals(method)
					o(req.headers["content-type"]).equals("application/json")
					o(req.headers["accept"]).equals("application/json")
					o(req.body).deepEquals(JSON.parse(requestText))
					//console.log("!", req.body, req.method, req.originalUrl, req.path, req.query, req.headers)
					o(req.query["_"]).equals(undefined) // timestamp should be defined only for GET requests

					res.send(responseText)
				})
				const res = await restClient.request(url, method, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					body: new RestTextBody(requestText),
					responseType: MediaType.Json,
					baseUrl,
				})
				o(res).equals(responseText)
			}
		}

		o("POST binary", testBinary("POST"))
		o("PUT binary", testBinary("PUT"))
		o("DELETE binary", testBinary("DELETE"))

		function testBinary(method) {
			return async function () {
				o.timeout(200)
				let request = new Buffer([8, 5, 2, 183])
				let response = new Buffer([1, 50, 83, 250])
				let url = "/" + method + "/binary"
				app.use(bodyParser.raw())
				app[method.toLowerCase()](url, (req, res) => {
					o(req.method).equals(method)
					o(req.headers["content-type"]).equals("application/octet-stream")
					o(req.headers["accept"]).equals("application/octet-stream")
					o(Array.from(req.body)).deepEquals(Array.from(request))
					o(req.query["_"]).equals(undefined) // timestamp should be defined only for GET requests

					res.send(response)
				})
				const res = await restClient.request(url, method, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					body: new RestBinaryBody(new Uint8Array(request)),
					responseType: MediaType.Binary,
					baseUrl,
				})
				o(res instanceof Uint8Array).equals(true)
				o(Array.from(res as any)).deepEquals(Array.from(response))
			}
		}

		o.test("GET empty body", testEmptyBody("GET"))
		o.test("POST empty body", testEmptyBody("POST"))
		o.test("PUT empty body", testEmptyBody("PUT"))
		o.test("DELETE empty body", testEmptyBody("DELETE"))

		function testEmptyBody(method) {
			return async function () {
				o.timeout(200)
				let url = "/" + method + "/empty-body"
				app[method.toLowerCase()](url, (req, res) => {
					o(req.headers["content-type"]).equals(undefined)
					// unlike XHR, fetch() always sends an Accept header ("*/*") so we set it explicitly
					o(req.headers["accept"]).equals("application/json")
					res.set("Date", SERVER_TIME_IN_HEADER)
					res.send()
				})
				const res = await restClient.request(url, method, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					baseUrl,
				})
				o(res).equals(null)
			}
		}

		o("GET empty body error", testError("GET"))
		o("POST empty body error", testError("POST"))
		o("PUT empty body error", testError("PUT"))
		o("DELETE empty body error", testError("DELETE"))

		function testError(method) {
			return async function () {
				let url = "/" + method + "/error"
				app[method.toLowerCase()](url, (req, res) => {
					res.set("Date", SERVER_TIME_IN_HEADER)
					res.status(205).send() // every status code !== 200 is currently handled as error
				})
				await o(() => restClient.request(url, method, { ...DEFAULT_REST_CLIENT_OPTIONS, baseUrl })).asyncThrows(restError.ResourceError)
			}
		}

		o("a connection failure (not just a non-200 status) is translated into a ConnectionError", async function () {
			o.timeout(400)
			app.get("/get/connection-reset", (req, res) => {
				// simulate a network-level failure (as opposed to a normal HTTP error response) by
				// killing the socket before a response can be written
				req.socket.destroy()
			})

			await o(() =>
				restClient.request("/get/connection-reset", HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					baseUrl,
				}),
			).asyncThrows(restError.ConnectionError)
		})

		o("aborting the request via the abortSignal rejects with a CancelledError", async function () {
			o.timeout(400)
			app.get("/get/never-responds", (req, res) => {
				// intentionally never respond; the test aborts the request before any response arrives
			})

			const controller = new AbortController()
			const promise = restClient.request("/get/never-responds", HttpMethod.GET, {
				...DEFAULT_REST_CLIENT_OPTIONS,
				baseUrl,
				abortSignal: controller.signal,
			})
			controller.abort()

			await o(() => promise).asyncThrows(CancelledError)
		})

		o("get time successful request", async () => {
			const test = testEmptyBody("GET")
			await test()
			const timestamp = restClient.getServerTimestampMs()
			// Adjust for possible variance in date times
			o(Math.abs(timestamp - SERVER_TIMESTAMP) < 10).equals(true)("Timestamp on the server was too different")
		})
		o("get time error request", async () => {
			const test = testError("GET")
			await test()
			const timestamp = restClient.getServerTimestampMs()
			// Adjust for possible variance in date times
			o(Math.abs(timestamp - SERVER_TIMESTAMP) < 10).equals(true)("Timestamp on the server was too different")
		})

		o("verify setCurrentHash is called when the applicationTypesHash is set in the response header", async () => {
			reset()
			o.timeout(400)

			const updateTypesHashMiddleware = new UpdateAppTypesHashMiddleware(serverModelInfoMock)
			restClient.addMiddleware(updateTypesHashMiddleware)

			let responseText = '{"msg":"Hello Client"}'

			app.get("/get/json1", (req, res) => {
				o(req.method).equals("GET")
				o(req.headers["content-type"]).equals(undefined)
				o(req.headers["accept"]).equals("application/json")
				res.setHeader("Access-Control-Expose-Headers", APPLICATION_TYPES_HASH_HEADER)
				res.setHeader(APPLICATION_TYPES_HASH_HEADER, "newApplicationTypesHash")
				res.send(responseText)
			})
			const res = await restClient.request("/get/json1", HttpMethod.GET, {
				...DEFAULT_REST_CLIENT_OPTIONS,
				responseType: MediaType.Json,
				baseUrl,
			})
			verify(serverModelInfoMock.setCurrentHash("newApplicationTypesHash"), { times: 1 })
			o(res).equals(responseText)
		})

		o("verify setCurrentHash is NOT called when the applicationTypesHash is not set in the response, throws instead", async () => {
			reset()
			o.timeout(400)
			const updateTypesHashMiddleware = new UpdateAppTypesHashMiddleware(serverModelInfoMock)
			restClient.addMiddleware(updateTypesHashMiddleware)
			let responseText = '{"msg":"Hello Client"}'

			app.get("/get/json3", (req, res) => {
				o(req.method).equals("GET")
				o(req.headers["content-type"]).equals(undefined)
				o(req.headers["accept"]).equals("application/json")
				res.setHeader("Access-Control-Expose-Headers", APPLICATION_TYPES_HASH_HEADER)
				res.send(responseText)
			})

			try {
				const response = await restClient.request("/get/json3", HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					responseType: MediaType.Json,
					baseUrl,
				})
			} catch (e) {
				const expectedErrorMessage = `Empty value for ${APPLICATION_TYPES_HASH_HEADER} header in response`
				//Error should contain the message
				o(e.indexOf(expectedErrorMessage)).notEquals(-1)
			}

			verify(serverModelInfoMock.setCurrentHash(anything()), { times: 0 })
		})

		o("verify setCurrentHash is NOT  for ApplicationTypesService and does not throw", async () => {
			reset()
			o.timeout(400)
			const updateTypesHashMiddleware = new UpdateAppTypesHashMiddleware(serverModelInfoMock)
			restClient.addMiddleware(updateTypesHashMiddleware)
			let responseText = '{"msg":"Hello Client"}'

			const applicationTypesServiceRestPath = ApplicationTypesService_GET.serviceRestPath

			app.get(applicationTypesServiceRestPath, (req, res) => {
				o(req.method).equals("GET")
				o(req.headers["content-type"]).equals(undefined)
				o(req.headers["accept"]).equals("application/json")
				res.setHeader("Access-Control-Expose-Headers", APPLICATION_TYPES_HASH_HEADER)
				res.send(responseText)
			})

			const res = await restClient.request(applicationTypesServiceRestPath, HttpMethod.GET, {
				...DEFAULT_REST_CLIENT_OPTIONS,
				responseType: MediaType.Json,
				baseUrl,
			})
			o(res).equals(responseText)
		})

		o("download progress listener is invoked for a download, not the upload progress listener", async function () {
			o.timeout(400)
			let response = Buffer.alloc(1024 * 64, 7)
			app.get("/get/binary-with-progress", (req, res) => {
				res.send(response)
			})

			const downloadUpdates: Array<{ percent: number; bytes: number }> = []
			const uploadUpdates: Array<{ percent: number; bytes: number }> = []
			const res = await restClient.request("/get/binary-with-progress", HttpMethod.GET, {
				...DEFAULT_REST_CLIENT_OPTIONS,
				queryParams: {},
				responseType: MediaType.Binary,
				baseUrl,
				downloadProgressListener: {
					update(percent, bytes) {
						downloadUpdates.push({ percent, bytes })
					},
				},
				uploadProgressListener: {
					update(percent, bytes) {
						uploadUpdates.push({ percent, bytes })
					},
				},
			})

			o(Array.from(res as any)).deepEquals(Array.from(response))
			o(downloadUpdates.length > 0).equals(true)("expected the download progress listener to be called at least once")
			o(uploadUpdates.length).equals(0)("upload progress listener must not be called for a download")
		})

		o("a suspension response activates suspension and the request is retried through the suspension handler", async function () {
			o.timeout(400)
			let requestCount = 0
			app.get("/get/suspend-then-succeed", (req, res) => {
				requestCount++
				if (requestCount === 1) {
					res.set("Retry-After", "1")
					res.status(503).send()
				} else {
					res.send('{"msg":"ok after suspension"}')
				}
			})

			const activateSuspensionCalls: Array<{ seconds: number; url: string }> = []
			restClient = new RestClient(
				{
					...suspensionHandlerMock,
					activateSuspensionIfInactive: (seconds: number, url: URL) => {
						activateSuspensionCalls.push({ seconds, url: url.toString() })
					},
				} as SuspensionHandler,
				domainConfigStub,
				String(ClientPlatform.UNKNOWN),
				new HttpClientJavascript(),
			)

			const res = await restClient.request("/get/suspend-then-succeed", HttpMethod.GET, {
				...DEFAULT_REST_CLIENT_OPTIONS,
				responseType: MediaType.Json,
				baseUrl,
			})

			o(res).equals('{"msg":"ok after suspension"}')
			o(requestCount).equals(2)("expected the suspension handler to have caused a retry")
			o(activateSuspensionCalls.length).equals(1)
			o(activateSuspensionCalls[0]?.seconds).equals(1)
		})

		o("a suspension response throws a SuspensionError (with the retry time in ms) when suspensionBehavior is Throw", async function () {
			o.timeout(400)
			app.get("/get/suspend-throw", (req, res) => {
				res.set("Retry-After", "42")
				res.status(503).send()
			})

			let thrown: unknown = null
			try {
				await restClient.request("/get/suspend-throw", HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					baseUrl,
					suspensionBehavior: SuspensionBehavior.Throw,
				})
			} catch (e) {
				thrown = e
			}

			o(thrown instanceof restError.SuspensionError).equals(true)
			o((thrown as restError.SuspensionError)?.data).equals("42000")
		})

		o("middlewares are invoked", async () => {
			const middlewareOne = new CountingMiddleWare()
			const middlewareTwo = new CountingMiddleWare()
			restClient = new RestClient(
				suspensionHandlerMock as SuspensionHandler,
				domainConfigStub,
				String(ClientPlatform.UNKNOWN),
				new HttpClientJavascript(),
			)
				.addMiddleware(middlewareOne)
				.addMiddleware(middlewareTwo)
			await testEmptyBody("GET")()

			o(middlewareOne.counter).equals(1)
			o(middlewareTwo.counter).equals(1)

			await testError("POST")()
			o(middlewareOne.counter).equals(2)
			o(middlewareTwo.counter).equals(2)
		})
	})
	o.spec("HttpClient wiring", function () {
		o("passes upload and download progress listeners to the HttpClient in the correct argument positions", async function () {
			const httpClient = new RecordingHttpClient()
			const client = new RestClient(suspensionHandlerMock as SuspensionHandler, domainConfigStub, String(ClientPlatform.UNKNOWN), httpClient)

			const uploadProgressListener: ProgressListener = { update: noOp }
			const downloadProgressListener: ProgressListener = { update: noOp }

			await client.request("/some/path", HttpMethod.PUT, {
				...DEFAULT_REST_CLIENT_OPTIONS,
				uploadProgressListener,
				downloadProgressListener,
				baseUrl: "http://localhost",
			})

			o(httpClient.lastArgs).notEquals(null)
			const [, , , , , , , , actualUploadProgressListener, actualDownloadProgressListener] = httpClient.lastArgs!
			o(actualUploadProgressListener).equals(uploadProgressListener)
			o(actualDownloadProgressListener).equals(downloadProgressListener)
		})
	})

	o("isSuspensionResponse", () => {
		o(restSuspension.isSuspensionResponse(503, "1")).equals(true)
		o(restSuspension.isSuspensionResponse(429, "100")).equals(true)
		o(restSuspension.isSuspensionResponse(0, "2")).equals(false)
		o(restSuspension.isSuspensionResponse(503, "0")).equals(false)
		o(restSuspension.isSuspensionResponse(503, null)).equals(false)
		o(restSuspension.isSuspensionResponse(503, null)).equals(false)
	})
})

class CountingMiddleWare implements RestClientMiddleware {
	constructor(public counter = 0) {}

	async interceptResponse(sentResponse: InterceptedResponse, method: HttpMethod): Promise<void> {
		this.counter += 1
	}
}

/** Records the exact arguments it was called with so tests can assert on their order/identity. */
class RecordingHttpClient implements HttpClient {
	public lastArgs: Parameters<HttpClient["request"]> | null = null

	async request(...args: Parameters<HttpClient["request"]>): Promise<HttpResponse> {
		this.lastArgs = args
		return new HttpResponse(200, "OK", null, new Map())
	}
}
