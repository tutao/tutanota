import o, { assertThrows } from "@tutao/otest"
import type { WorkerClient } from "../../../../src/applications/common/api/main/WorkerClient.js"
import * as restError from "../../../../src/platform-kits/rest-client/error"
import { Request } from "../../../../src/app-kits/native-bridge/shared/MessageTypes.js"
import { ProgrammingError } from "../../../../src/platform-kits/app-env"
import { initCommonLocator, locator } from "../../../../src/applications/common/api/main/CommonLocator.js"
import { SessionType } from "../../../../src/platform-kits/app-env/SessionType.js"
import { CryptoError } from "../../../../src/platform-kits/crypto/error"
import { mailLocator } from "../../../../src/applications/mail-app/mailLocator.js"

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
			const e = await assertThrows(restError.NotAuthenticatedError, () =>
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
