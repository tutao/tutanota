import o from "ospec"
import type { WorkerClient } from "../../../../src/api/main/WorkerClient.js"
import { CryptoError } from "../../../../src/api/common/error/CryptoError.js"
import { NotAuthenticatedError } from "../../../../src/api/common/error/RestError.js"
import { Request } from "../../../../src/api/common/MessageDispatcher.js"
import { ProgrammingError } from "../../../../src/api/common/error/ProgrammingError.js"
import { locator } from "../../../../src/api/main/MainLocator.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { SessionType } from "../../../../src/api/common/SessionType.js"

o.spec(
	"WorkerTest request / response",
	node(function () {
		let worker: WorkerClient
		o.before(async function () {
			o.timeout(2000)
			locator.init()
			worker = locator.worker
			await worker.initialized
		})
		o("echo", async function () {
			const response = await worker._postRequest(
				new Request("testEcho", [
					{
						msg: "huhu",
					},
				]),
			)
			o(response.msg).equals(">>> huhu")
		})
		o("login", async function () {
			o.timeout(5000)
			await locator.logins.createSession("map-free@tutanota.de", "map", SessionType.Login)
		})
		o("programming error handling", async function () {
			const e = await assertThrows(ProgrammingError, () =>
				worker._postRequest(
					new Request("testError", [
						{
							errorType: "ProgrammingError",
						},
					]),
				),
			)
			o(e?.name).equals("ProgrammingError")
			o(e?.message).equals("wtf: ProgrammingError")
		})
		o("crypto error handling", async function () {
			const e = await assertThrows(CryptoError, () =>
				worker._postRequest(
					new Request("testError", [
						{
							errorType: "CryptoError",
						},
					]),
				),
			)
			o(e?.name).equals("CryptoError")
			o(e?.message).equals("wtf: CryptoError")
		})
		o("rest error handling", async function () {
			const e = await assertThrows(NotAuthenticatedError, () =>
				worker._postRequest(
					new Request("testError", [
						{
							errorType: "NotAuthenticatedError",
						},
					]),
				),
			)
			o(e?.name).equals("NotAuthenticatedError")
			o(e?.message).equals("wtf: NotAuthenticatedError")
		})
	}),
)
