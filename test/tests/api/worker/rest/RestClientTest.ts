import o from "@tutao/otest"
import { isSuspensionResponse, RestClient } from "../../../../../src/api/worker/rest/RestClient.js"
import { HttpMethod, MediaType } from "../../../../../src/api/common/EntityFunctions.js"
import { ResourceError } from "../../../../../src/api/common/error/RestError.js"
import { defer, downcast, noOp } from "@tutao/tutanota-utils"
import http from "node:http"

const SERVER_TIME_IN_HEADER = "Mon, 12 Jul 2021 13:18:39 GMT"
const SERVER_TIMESTAMP = 1626095919000

o.spec("rest client", function () {
	const suspensionHandlerMock = {
		activateSuspensionIfInactive: noOp,
		isSuspended: () => false,
		deferRequest: (request) => request(),
	}
	const restClient = new RestClient(downcast(suspensionHandlerMock))
	o.spec(
		"integration tests",
		node(function () {
			let app = global.express()
			let server: http.Server | null = null
			o.before(async function () {
				const deferred = defer()
				server = app.listen(3000, deferred.resolve)
				await deferred.promise
			})
			o.after(async function () {
				if (server) {
					const deferred = defer<void>()
					server.close(function (err) {
						if (err) console.log(err)
						deferred.resolve()
					})
					await deferred.promise
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
					baseUrl: "http://localhost:3000",
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
					baseUrl: "http://localhost:3000",
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
					baseUrl: "http://localhost:3000",
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
					app.use(global.bodyParser.json())
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
						baseUrl: "http://localhost:3000",
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
					app.use(global.bodyParser.raw())
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
						baseUrl: "http://localhost:3000",
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
						baseUrl: "http://localhost:3000",
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
					await o(() => restClient.request(url, method, { baseUrl: "http://localhost:3000" })).asyncThrows(ResourceError)
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
		}),
	)
	o(
		"isSuspensionResponse",
		node(() => {
			o(isSuspensionResponse(503, "1")).equals(true)
			o(isSuspensionResponse(429, "100")).equals(true)
			o(isSuspensionResponse(0, "2")).equals(false)
			o(isSuspensionResponse(503, "0")).equals(false)
			o(isSuspensionResponse(503, null)).equals(false)
			o(isSuspensionResponse(503, null)).equals(false)
		}),
	)
})
