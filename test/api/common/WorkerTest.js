// @flow
import o from "ospec/ospec.js"
import {worker} from "../../../src/api/main/WorkerClient"
import {CryptoError} from "../../../src/api/common/error/CryptoError"
import {NotAuthenticatedError} from "../../../src/api/common/error/RestError"
import {Request} from "../../../src/api/common/WorkerProtocol"
import {ProgrammingError} from "../../../src/api/common/error/ProgrammingError"

o.spec("WorkerTest request / response", node(function () {

	o.before((done, timeout) => {
		timeout(2000)
		worker.initialized.then(done)
	})


	o("echo", function (done) {
		worker._postRequest(new Request('testEcho', [{msg: "huhu"}])).then(response => {
			o(response.msg).equals(">>> huhu")
		}).finally(done)
	})

	o("login", function (done, timeout) {
		timeout(5000)
		worker.createSession("map-free@tutanota.de", "map", "Linux Firefox", false)
			.finally(done)
	})

	o("programming error handling", function (done) {
		worker._postRequest(new Request('testError', [{errorType: 'ProgrammingError'}])).catch(ProgrammingError, e => {
			o(e.name).equals("ProgrammingError")
			o(e.message).equals("wtf: ProgrammingError")
		}).finally(done)
	})

	o("crypto error handling", function (done) {
		worker._postRequest(new Request('testError', [{errorType: 'CryptoError'}])).catch(CryptoError, e => {
			o(e.name).equals("CryptoError")
			o(e.message).equals("wtf: CryptoError")
		}).finally(done)
	})

	o("rest error handling", function (done) {
		worker._postRequest(new Request('testError', [{errorType: 'NotAuthenticatedError'}])).catch(NotAuthenticatedError, e => {
			o(e.name).equals("NotAuthenticatedError")
			o(e.message).equals("wtf: NotAuthenticatedError")
		}).finally(done)
	})
}))


