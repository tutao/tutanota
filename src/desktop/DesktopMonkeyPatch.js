// @flow
import chalk from "chalk"
import {execSync} from 'child_process'
import {last} from '../../src/api/common/utils/ArrayUtils'
import {neverNull} from "../api/common/utils/Utils"
import {Logger, replaceNativeLogger} from "../api/common/Logger"

const logger = new Logger()
replaceNativeLogger(global, logger, true)

global.env = {rootPathPrefix: "../../", adminTypes: []}
global.System = {'import': (...args) => Promise.resolve(require(...args))}

const oldLog = console.log
const oldError = console.error
const oldWarn = console.warn

;(console: any).log = (...args) => oldLog(chalk.blue(`[${new Date().toISOString()}]`), ...args)
;(console: any).error = (...args) => oldError(chalk.red.bold(`[${new Date().toISOString()}]`), ...args)
;(console: any).warn = (...args) => oldWarn(chalk.yellow(`[${new Date().toISOString()}]`), ...args)

if (process.platform === "win32") {
	try {
		const stdout = execSync('reg query "HKCU\\Control Panel\\Desktop" /v PreferredUILanguages', {encoding: 'utf8'})
		const parts = stdout.split(' ')
		if (parts.length > 0) {
			const locale = neverNull(last(parts)).trim()
			console.log("detected locale", locale)
			process.env.LC_ALL = locale
		}
	} catch (e) {
		console.log("failed to detect locale")
	}
}

global.btoa = str => Buffer.from(str, 'binary').toString('base64')
global.atob = b64 => Buffer.from(b64, 'base64').toString('binary')

export function mp() {
	console.log("the monkey has been patched")
}
