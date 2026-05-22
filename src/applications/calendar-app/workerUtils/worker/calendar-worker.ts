import { Logger, replaceNativeLogger } from "../../../common/api/common/Logger.js"
import { CalendarWorkerImpl } from "./CalendarWorkerImpl.js"

/**
 * Receives the first message from the client and initializes the WorkerImpl to receive all future messages. Sends a response to the client on this first message.
 */
self.onmessage = function (msg) {
	const data = msg.data

	if (data.requestType === "setup") {
		self.env = data.args[0]
		replaceNativeLogger(self, new Logger())
		Promise.resolve()
			.then(async () => {
				const initialRandomizerEntropy = data.args[1]
				const browserData = data.args[2]

				if (initialRandomizerEntropy == null || browserData == null) {
					throw new Error("Invalid Worker arguments")
				}

				// @ts-ignore
				const workerImpl = new CalendarWorkerImpl(typeof self !== "undefined" ? self : null)
				await workerImpl.init(browserData)
				workerImpl.exposedInterface.entropyFacade().then((entropyFacade) => entropyFacade.addEntropy(initialRandomizerEntropy))
				self.postMessage({
					id: data.id,
					type: "response",
					value: {},
				})
			})
			.catch((e) => {
				self.postMessage({
					id: data.id,
					type: "error",
					error: JSON.stringify({
						name: "Error",
						message: e.message,
						stack: e.stack,
					}),
				})
			})
	} else {
		throw new Error("worker not yet ready. Request type: " + data.requestType)
	}
}
