import fs from "fs"
import path from "path"
import {app} from "electron"
import {execSync} from "child_process"
import {last} from "@tutao/tutanota-utils"
import {neverNull} from "@tutao/tutanota-utils"
import {Logger, replaceNativeLogger} from "../api/common/Logger"
import {log, rebindDesktopLog} from "./DesktopLog"
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
const oldLog = console.log
const oldError = console.error
const oldWarn = console.warn
const oldTrace = console.trace

;(console as any).log = (...args) => oldLog(`[${new Date().toISOString()}]`, ...args)

;(console as any).error = (...args) => oldError(`[${new Date().toISOString()}]`, ...args)

;(console as any).warn = (...args) => oldWarn(`[${new Date().toISOString()}]`, ...args)

;(console as any).trace = (...args) => oldTrace(`[${new Date().toISOString()}]`, ...args)

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

global.btoa = str => Buffer.from(str, "binary").toString("base64")

global.atob = b64 => Buffer.from(b64, "base64").toString("binary")

export function mp() {
    log.debug("the monkey has been patched")
}