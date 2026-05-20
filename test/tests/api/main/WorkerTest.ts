import o, { assertThrows } from "@tutao/otest"
import { WorkerClient } from "../../../../src/applications/common/api/main/WorkerClient"
import { mailLocator } from "../../../../src/applications/mail-app/mailLocator"
import { initCommonLocator, locator } from "../../../../src/applications/common/api/main/CommonLocator"
import { ProgrammingError, SessionType } from "../../../../src/platform-kit/app-env"
import { CryptoError } from "../../../../src/platform-kit/crypto/error"
import { NotAuthenticatedError } from "../../../../src/platform-kit/rest-client/error"
import { Request } from "../../../../src/app-kit/native-bridge/shared/MessageTypes"
import { initClientModels } from "../../../../src/applications/common/api/common/ClientModelInfoInitializer"
import { AppNameEnum } from "../../../../src/platform-kit/meta"
import { baseModelInfo, baseTypeModels } from "@tutao/entities/base"
import { sysModelInfo, sysTypeModels } from "@tutao/entities/sys"
import { tutanotaModelInfo, tutanotaTypeModels } from "@tutao/entities/tutanota"
import { driveModelInfo, driveTypeModels } from "@tutao/entities/drive"
import { storageModelInfo, storageTypeModels } from "@tutao/entities/storage"
import { monitorModelInfo, monitorTypeModels } from "@tutao/entities/monitor"
import { usageModelInfo, usageTypeModels } from "@tutao/entities/usage"
import { accountingModelInfo, accountingTypeModels } from "@tutao/entities/accounting"

o.spec(
	"WorkerTest request / response",
	node(function () {
		let worker: WorkerClient
		o.before(async function () {
			const apps = [
				{ app: AppNameEnum.Base, clientModel: baseTypeModels, modelInfo: baseModelInfo },
				{ app: "sys", clientModel: sysTypeModels, modelInfo: sysModelInfo },
				{ app: "tutanota", clientModel: tutanotaTypeModels, modelInfo: tutanotaModelInfo },
				{ app: "drive", clientModel: driveTypeModels, modelInfo: driveModelInfo },
				{ app: "storage", clientModel: storageTypeModels, modelInfo: storageModelInfo },
				{ app: "monitor", clientModel: monitorTypeModels, modelInfo: monitorModelInfo },
				{ app: "usage", clientModel: usageTypeModels, modelInfo: usageModelInfo },
				{ app: "accounting", clientModel: accountingTypeModels, modelInfo: accountingModelInfo },
			]
			await mailLocator.init(initClientModels(apps))
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
