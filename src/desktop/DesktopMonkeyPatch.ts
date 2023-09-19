import fs from "node:fs"
import path from "node:path"
import { app } from "electron"
import { execSync } from "node:child_process"
import { last, neverNull } from "@tutao/tutanota-utils"
import { Logger, replaceNativeLogger } from "../api/common/Logger"
import { log, rebindDesktopLog } from "./DesktopLog"

const logger = new Logger()
replaceNativeLogger(global, logger, true)
// we need to bind to a new logger
rebindDesktopLog()
process.on("exit", () => {
	const logDir = path.join(app.getPath("userData"), "logs")
	const logFilePath = path.join(logDir, "tutanota_desktop.log")
	const oldLogFilePath = path.join(logDir, "tutanota_desktop_old.log")
	const entries = logger.getEntries()
	fs.mkdirSync(logDir, {
		recursive: true,
	})

	try {
		fs.renameSync(logFilePath, oldLogFilePath)
	} catch (e) {
		// If the old log was not found, ignore it
		if (e.code !== "ENOENT") {
			console.error("could not rename old log file: ", e.message)
		}
	}

	try {
		fs.writeFileSync(logFilePath, entries.join("\n"))
	} catch (e) {
		console.error("could not write log file: ", e.message)
	}
})

const oldInfo = console.info
const oldLog = console.log
const oldError = console.error
const oldWarn = console.warn
const oldTrace = console.trace

;(console as any).info = (...args: any[]) => oldInfo(`[${new Date().toISOString()}]`, ...args)
;(console as any).log = (...args: any[]) => oldLog(`[${new Date().toISOString()}]`, ...args)
;(console as any).error = (...args: any[]) => oldError(`[${new Date().toISOString()}]`, ...args)
;(console as any).warn = (...args: any[]) => oldWarn(`[${new Date().toISOString()}]`, ...args)
;(console as any).trace = (...args: any[]) => oldTrace(`[${new Date().toISOString()}]`, ...args)

if (process.platform === "win32") {
	try {
		const stdout = execSync('reg query "HKCU\\Control Panel\\Desktop" /v PreferredUILanguages', {
			encoding: "utf8",
		})
		const parts = stdout.split(" ")

		if (parts.length > 0) {
			const locale = neverNull(last(parts)).trim()
			log.debug("detected locale", locale)
			process.env.LC_ALL = locale
		}
	} catch (e) {
		log.debug("failed to detect locale")
	}
}

global.btoa = (str) => Buffer.from(str, "binary").toString("base64")

global.atob = (b64) => Buffer.from(b64, "base64").toString("binary")

/** this file is only imported for its side effects, which some IDEs do not like.
 * having this available keeps the imports around. */
export function mp() {
	log.debug("the monkey has been patched pid:", process.pid)
}
