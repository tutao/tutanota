import o from "@tutao/otest"
import type { WorkerClient } from "../../../../src/common/api/main/WorkerClient.js"
import { NotAuthenticatedError } from "../../../../src/common/api/common/error/RestError.js"
import { Request } from "../../../../src/common/api/common/threading/MessageDispatcher.js"
import { ProgrammingError } from "../../../../src/common/api/common/error/ProgrammingError.js"
import { initCommonLocator, locator } from "../../../../src/common/api/main/CommonLocator.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { SessionType } from "../../../../src/common/api/common/SessionType.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { mailLocator } from "../../../../src/mail-app/mailLocator.js"

o.spec(
	"WorkerTest request / response",
	node(function () {
		let worker: WorkerClient
		o.before(async function () {
			await mailLocator.init()
			initCommonLocator(mailLocator)

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
			o.timeout(2000)
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
			o.timeout(2000)
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
			o.timeout(2000)
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
