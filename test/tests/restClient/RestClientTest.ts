import o from "@tutao/otest"
import { HttpMethod, MediaType, RestClient, RestClientMiddleware, restError, restSuspension } from "@tutao/rest-client"
import { defer, noOp } from "@tutao/utils"
import http from "node:http"
import express from "express"
import bodyParser from "body-parser"
import type { AddressInfo } from "node:net"
import { matchers, object, reset, verify } from "testdouble"
import { domainConfigStub } from "../TestUtils"
import { ClientPlatform } from "../../../src/common/misc/ClientDetector"
import { APPLICATION_TYPES_HASH_HEADER } from "@tutao/app-env"
import { ServerModelInfo } from "@tutao/typerefs"
import { baseServices } from "@tutao/typerefs"
import { UpdateAppTypesHashMiddleware } from "../../../src/common/api/common/UpdateTypesHashMiddleware"
import { getServiceRestPath } from "../../../src/common/api/worker/rest/ServiceExecutor"

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
			restClient = new RestClient(suspensionHandlerMock as SuspensionHandler, domainConfigStub, String(ClientPlatform.UNKNOWN))
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
				body: request,
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
					body: requestText,
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
					body: new Uint8Array(request),
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
					o(req.headers["accept"]).equals(undefined)
					res.set("Date", SERVER_TIME_IN_HEADER)
					res.send()
				})
				const res = await restClient.request(url, method, {
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
				await o(() => restClient.request(url, method, { baseUrl })).asyncThrows(restError.ResourceError)
			}
		}

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

			const applicationTypesServiceRestPath = getServiceRestPath(baseServices.ApplicationTypesService)

			app.get(applicationTypesServiceRestPath, (req, res) => {
				o(req.method).equals("GET")
				o(req.headers["content-type"]).equals(undefined)
				o(req.headers["accept"]).equals("application/json")
				res.setHeader("Access-Control-Expose-Headers", APPLICATION_TYPES_HASH_HEADER)
				res.send(responseText)
			})

			const res = await restClient.request(applicationTypesServiceRestPath, HttpMethod.GET, {
				responseType: MediaType.Json,
				baseUrl,
			})
			o(res).equals(responseText)
		})

		o("middlewares are invoked", async () => {
			const middlewareOne = new CountingMiddleWare()
			const middlewareTwo = new CountingMiddleWare()
			restClient = new RestClient(suspensionHandlerMock as SuspensionHandler, domainConfigStub, String(ClientPlatform.UNKNOWN))
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

	async interceptResponse(sentRequest: XMLHttpRequest, method: HttpMethod): Promise<void> {
		this.counter += 1
	}
}
