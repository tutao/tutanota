//@flow
import o from "ospec"
import {isSuspensionResponse, RestClient} from "../../../src/api/worker/rest/RestClient"
import {HttpMethod, MediaType} from "../../../src/api/common/EntityFunctions"
import {ResourceError} from "../../../src/api/common/error/RestError"
import {downcast} from "@tutao/tutanota-utils"

const SERVER_TIME_IN_HEADER = "Mon, 12 Jul 2021 13:18:39 GMT"
const SERVER_TIMESTAMP = 1626095919000

o.spec("rest client", function () {
	env.staticUrl = "http://localhost:3000"

	const suspensionHandlerMock = {
		activateSuspensionIfInactive: o.spy(),
		isSuspended: o.spy(() => false),
		deferRequest: o.spy(request => request())
	}

	const restClient = new RestClient(downcast(suspensionHandlerMock))

	o.spec("integration tests", node(function () {

		let app = global.express()
		let server = null

		o.before(function (done) {
			server = app.listen(3000, done)
		})

		o.after(function (done) {
			if (server) {
				server.close(function (err) {
					if (err) console.log(err)
					env.staticUrl = null
					done()
				})
			}
		})

		o("GET json", async function () {
			o.timeout(400)
			let responseText = '{"msg":"Hello Client"}'
			app.get("/get/json", (req, res) => {
				o(req.method).equals('GET')
				o(req.headers['content-type']).equals(undefined)
				o(req.headers['accept']).equals('application/json')

				res.send(responseText)
			})
			const res = await restClient.request("/get/json", HttpMethod.GET, {}, {}, null, MediaType.Json)
			o(res).equals(responseText)
		})

		o("GET with body (converted to query parameter)", function (done) {
			o.timeout(200)
			let request = "{get: true}"
			app.get("/get/with-body", (req, res) => {
				o(req.method).equals('GET')
				o(req.query._body).equals(request)

				res.send()
				done()
			})
			restClient.request("/get/with-body", HttpMethod.GET, {}, {}, request, MediaType.Json)
		})

		o("GET binary", function (done) {
			o.timeout(200)
			let response = new Buffer([1, 50, 83, 250])
			let before = new Date().getTime()
			app.get("/get/binary", (req, res) => {
				o(req.method).equals('GET')
				o(req.headers['content-type']).equals(undefined)
				o(req.headers['accept']).equals('application/octet-stream')

				res.send(response)
			})
			restClient.request("/get/binary", HttpMethod.GET, {}, {}, null, MediaType.Binary).then(res => {
				o(res instanceof Uint8Array).equals(true)
				o(Array.from((res: any))).deepEquals(Array.from(response))
				done()
			})
		})

		o("POST json", testJson('POST'))
		o("PUT json", testJson('PUT'))
		o("DELETE json", testJson('DELETE'))

		function testJson(method) {
			return function (done) {
				o.timeout(200)
				let requestText = '{"msg":"Dear Server"}'
				let responseText = '{"msg":"Hello Client"}'
				let url = "/" + method + "/json";

				app.use(global.bodyParser.json())

				app[method.toLowerCase()](url, (req, res) => {
					o(req.method).equals(method)
					o(req.headers['content-type']).equals('application/json')
					o(req.headers['accept']).equals('application/json')
					o(req.body).deepEquals(JSON.parse(requestText))
					//console.log("!", req.body, req.method, req.originalUrl, req.path, req.query, req.headers)

					o(req.query['_']).equals(undefined) // timestamp should be defined only for GET requests


					res.send(responseText)
				})
				restClient.request(url, method, {}, {}, requestText, MediaType.Json).then(res => {
					o(res).equals(responseText)
					done()
				})
			}
		}

		o("POST binary", testBinary('POST'))
		o("PUT binary", testBinary('PUT'))
		o("DELETE binary", testBinary('DELETE'))

		function testBinary(method) {
			return function (done) {
				o.timeout(200)
				let request = new Buffer([8, 5, 2, 183])
				let response = new Buffer([1, 50, 83, 250])
				let url = "/" + method + "/binary";

				app.use(global.bodyParser.raw())

				app[method.toLowerCase()](url, (req, res) => {
					o(req.method).equals(method)
					o(req.headers['content-type']).equals('application/octet-stream')
					o(req.headers['accept']).equals('application/octet-stream')
					o(Array.from(req.body)).deepEquals(Array.from(request))

					o(req.query['_']).equals(undefined) // timestamp should be defined only for GET requests

					res.send(response)
				})
				restClient.request(url, method, {}, {}, new Uint8Array(request), MediaType.Binary).then(res => {
					o(res instanceof Uint8Array).equals(true)
					o(Array.from((res: any))).deepEquals(Array.from(response))
					done()
				})
			}
		}

		o("GET empty body", testEmptyBody('GET'))
		o("POST empty body", testEmptyBody('POST'))
		o("PUT empty body", testEmptyBody('PUT'))
		o("DELETE empty body", testEmptyBody('DELETE'))

		function testEmptyBody(method) {
			return function () {
				o.timeout(200)
				return new Promise(resolve => {
					let url = "/" + method + "/empty-body";

					app[method.toLowerCase()](url, (req, res) => {
						o(req.headers['content-type']).equals(undefined)
						o(req.headers['accept']).equals(undefined)
						res.set("Date", SERVER_TIME_IN_HEADER)
						res.send()
					})
					restClient.request(url, method, {}, {}, null, null).then(res => {
						o(res).equals(undefined)
						resolve()
					})
				})
			}
		}

		o("GET empty body error", testError('GET'))
		o("POST empty body error", testError('POST'))
		o("PUT empty body error", testError('PUT'))
		o("DELETE empty body error", testError('DELETE'))

		function testError(method) {
			return function () {
				return new Promise((resolve, reject) => {
					let url = "/" + method + "/error";

					app[method.toLowerCase()](url, (req, res) => {
						res.set("Date", SERVER_TIME_IN_HEADER)
						res.status(205).send() // every status code !== 200 is currently handled as error
					})
					restClient.request(url, method, {}, {}, null, null)
					          .then(reject)
					          .catch(e => {
						          o(e instanceof ResourceError).equals(true)
						          resolve()
					          })
				})
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
	}))

	o("isSuspensionResponse", node(() => {
		o(isSuspensionResponse(503, "1")).equals(true)
		o(isSuspensionResponse(429, "100")).equals(true)
		o(isSuspensionResponse(0, "2")).equals(false)
		o(isSuspensionResponse(503, "0")).equals(false)
		o(isSuspensionResponse(503, null)).equals(false)
		o(isSuspensionResponse(503, undefined)).equals(false)
	}))
})