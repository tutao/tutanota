import { Logger, replaceNativeLogger } from "../../../common/api/common/Logger.js"
import { ConfigurationDatabase } from "../../../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { MessageDispatcher } from "../../../../app-kit/native-bridge/shared/MessageDispatcher"
import { BookingFacade } from "../../../common/api/worker/facades/lazy/BookingFacade"
import { RestClient } from "@tutao/rest-client"
import { EnvProvider, ProgrammingError } from "@tutao/app-env"
import { locator } from "./WorkerLocator"
import { CryptoFacade } from "../../../../platform-kit/base/base-crypto/CryptoFacade"
import { CalendarFacade } from "../../../common/api/worker/facades/lazy/CalendarFacade"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { ShareFacade } from "../../../../platform-kit/base/facades/lazy/ShareFacade"

EnvProvider.assertWorkerOrNode()
self.onmessage = function (msg) {
	console.log("Received message: ", msg)

	const data = msg.data
	if (data.requestType === "setup") {
		replaceNativeLogger(self, new Logger())
		Promise.resolve().then(async () => {})

		console.log(
			ConfigurationDatabase.name,
			MessageDispatcher.name,
			BookingFacade.name,
			RestClient.name,
			EnvProvider.name,
			ProgrammingError.name,
			locator,
			CryptoFacade.name,
			ConfigurationDatabase.name,
			CalendarFacade.name,
			MailFacade.name,
			ShareFacade.name,
		)
	}
}
