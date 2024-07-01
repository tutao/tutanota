import o from "@tutao/otest"
import { LOG_SIZE, Logger } from "../../../../../src/common/api/common/Logger.js"
import { lastThrow } from "@tutao/tutanota-utils"
o.spec("Loger test", function () {
	let dateProvider
	let log
	o.beforeEach(function () {
		let dateCounter = 0

		dateProvider = () => new Date(dateCounter++)

		log = new Logger(dateProvider)
	})
	o("log warn info error", function () {
		o(log.getEntries()).deepEquals([])
		log.logInfo("info")
		log.logWarn("warn")
		log.logError("error")
		o(log.getEntries()).deepEquals([
			log.formatLogEntry(new Date(0), "I", "info"),
			log.formatLogEntry(new Date(1), "W", "warn"),
			log.formatLogEntry(new Date(2), "E", "error"),
		])
	})
	o("log lots of entries", function () {
		for (let i = 0; i < LOG_SIZE + 2; i++) {
			log.logInfo("info " + i)
		}

		o(log.getEntries().length).equals(LOG_SIZE)
		o(log.getEntries()[0]).equals(log.formatLogEntry(new Date(2), "I", "info " + 2))
		o(lastThrow(log.getEntries())).equals(log.formatLogEntry(new Date(1001), "I", "info " + 1001))
	})
})
