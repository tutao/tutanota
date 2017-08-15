import o from "ospec/ospec.js"
import {RestClient, MediaType} from "../../../src/api/worker/rest/RestClient"
import {ResourceError} from "../../../src/api/common/error/RestError"
import {HttpMethod} from "../../../src/api/common/EntityFunctions"


o.spec("rest client", function () {
	env.staticUrl = "http://localhost:3000"
	let rc = new RestClient()

	o.spec("integration tests", node(function () {

		let app = express()
		let server = null

		o.before(function (done) {
			server = app.listen(3000, done)
			enableDestroy(server)
		})

		o.after(function (done) {
			if (server) {
				server.destroy(function (err) {
					if (err) console.log(err)
					env.staticUrl = null
					done()
				})
			}
		})

		o("GET json", function (done, timeout) {
			timeout(200)
			let responseText = '{"msg":"Hello Client"}'
			let before = new Date().getTime()
			app.get("/get/json", (req, res) => {
				o(req.method).equals('GET')
				o(req.headers['content-type']).equals(undefined)
				o(req.headers['accept']).equals('application/json')
				//console.log("!", req.method, req.originalUrl, req.path, req.query, req.headers)

				res.send(responseText)
			})
			rc.request("/get/json", HttpMethod.GET, {}, {}, null, MediaType.Json).then(res => {
				o(res).equals(responseText)
				done()
			})
		})

		o("GET with body (converted to query parameter)", function (done, timeout) {
			timeout(200)
			let request = "{get: true}"
			app.get("/get/with-body", (req, res) => {
				o(req.method).equals('GET')
				o(req.query._body).equals(request)

				res.send()
				done()
			})
			rc.request("/get/with-body", HttpMethod.GET, {}, {}, request, MediaType.Json)
		})

		o("GET binary", function (done, timeout) {
			timeout(200)
			let response = new Buffer([1, 50, 83, 250])
			let before = new Date().getTime()
			app.get("/get/binary", (req, res) => {
				o(req.method).equals('GET')
				o(req.headers['content-type']).equals(undefined)
				o(req.headers['accept']).equals('application/octet-stream')
				//console.log("!", req.method, req.originalUrl, req.path, req.query, req.headers)

				res.send(response)
			})
			rc.request("/get/binary", HttpMethod.GET, {}, {}, null, MediaType.Binary).then(res => {
				o(res instanceof Uint8Array).equals(true)
				o(Array.from((res:any))).deepEquals(Array.from(response))
				done()
			})
		})

		o("POST json", testJson('POST'))
		o("PUT json", testJson('PUT'))
		o("DELETE json", testJson('DELETE'))
		function testJson(method) {
			return function (done, timeout) {
				timeout(200)
				let requestText = '{"msg":"Dear Server"}'
				let responseText = '{"msg":"Hello Client"}'
				let before = new Date().getTime()
				let url = "/" + method + "/json";

				app.use(bodyParser.json())

				app[method.toLowerCase()](url, (req, res) => {
					o(req.method).equals(method)
					o(req.headers['content-type']).equals('application/json')
					o(req.headers['accept']).equals('application/json')
					o(req.body).deepEquals(JSON.parse(requestText))
					//console.log("!", req.body, req.method, req.originalUrl, req.path, req.query, req.headers)

					o(req.query['_']).equals(undefined) // timestamp should be defined only for GET requests


					res.send(responseText)
				})
				rc.request(url, method, {}, {}, requestText, MediaType.Json).then(res => {
					o(res).equals(responseText)
					done()
				})
			}
		}

		o("POST binary", testBinary('POST'))
		o("PUT binary", testBinary('PUT'))
		o("DELETE binary", testBinary('DELETE'))
		function testBinary(method) {
			return function (done, timeout) {
				timeout(200)
				let request = new Buffer([8, 5, 2, 183])
				let response = new Buffer([1, 50, 83, 250])
				let before = new Date().getTime()
				let url = "/" + method + "/binary";

				app.use(bodyParser.raw())

				app[method.toLowerCase()](url, (req, res) => {
					o(req.method).equals(method)
					o(req.headers['content-type']).equals('application/octet-stream')
					o(req.headers['accept']).equals('application/octet-stream')
					o(Array.from(req.body)).deepEquals(Array.from(request))
					//console.log("!", req.method, req.originalUrl, req.path, req.query, req.headers)

					o(req.query['_']).equals(undefined) // timestamp should be defined only for GET requests

					res.send(response)
				})
				rc.request(url, method, {}, {}, new Uint8Array(request), MediaType.Binary).then(res => {
					o(res instanceof Uint8Array).equals(true)
					o(Array.from((res:any))).deepEquals(Array.from(response))
					done()
				})
			}
		}

		o("GET empty body", testEmptyBody('GET'))
		o("POST empty body", testEmptyBody('POST'))
		o("PUT empty body", testEmptyBody('PUT'))
		o("DELETE empty body", testEmptyBody('DELETE'))
		function testEmptyBody(method) {
			return function (done, timeout) {
				timeout(200)
				let before = new Date().getTime()
				let url = "/" + method + "/empty-body";

				app[method.toLowerCase()](url, (req, res) => {
					o(req.headers['content-type']).equals(undefined)
					o(req.headers['accept']).equals(undefined)
					//console.log("!", req.method, req.originalUrl, req.path, req.query, req.headers)

					res.send()
				})
				rc.request(url, method, {}, {}, null, null).then(res => {
					o(res).equals(undefined)
					done()
				})
			}
		}

		o("GET empty body error", testError('GET'))
		o("POST empty body error", testError('POST'))
		o("PUT empty body error", testError('PUT'))
		o("DELETE empty body error", testError('DELETE'))
		function testError(method) {
			return function (done, timeout) {
				timeout(200)
				let before = new Date().getTime()
				let url = "/" + method + "/error";

				app[method.toLowerCase()](url, (req, res) => {
					res.status(205).send() // every status code !== 200 is currently handled as error
				})
				rc.request(url, method, {}, {}, null, null).catch(e => {
					o(e instanceof ResourceError).equals(true)
					done()
				})
			}
		}


	}))

})