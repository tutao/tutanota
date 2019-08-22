//@flow

import {stringToUtf8Uint8Array} from "./utils/Encoding"
import {errorToString} from "./utils/Utils"

export const LOG_SIZE = 1000

export class Logger {
	// Circular buffer with next writable position pointed by _index
	_entries: Array<Array<any>>;
	_index: number
	_dateProvider: () => Date;

	constructor(dateProvider: () => Date = () => new Date()) {
		this._entries = new Array(LOG_SIZE)
		this._index = 0
		this._dateProvider = dateProvider
	}


	logInfo(...args: Array<any>) {
		this.log("I", args)
	}

	logError(...args: Array<any>) {
		this.log("E", args)
	}

	logWarn(...args: Array<any>) {
		this.log("W", args)
	}

	log(level: string, args: Array<any>) {
		const entry = [this._dateProvider(), level]
		entry.push(...args)
		this._entries[this._index] = entry
		this._index++
		if (this._index === LOG_SIZE) {
			this._index = 0
		}
	}

	formatLogEntry(date: Date, level: string, ...rest: Array<any>): string {
		const formattedArgs = rest.map((obj) => {
			return (obj instanceof Error ? errorToString(obj) : JSON.stringify(obj))
		})
		const message = formattedArgs.join(",")
		return `${date.toISOString()} ${level} ${message}`
	}

	getEntries(): Array<string> {
		const newerPart = this._entries.slice(0, this._index)
		const olderPart = this._entries.slice(this._index)
		return olderPart.concat(newerPart).filter(Boolean).map(([date, level, ...rest]) => {
			return this.formatLogEntry(date, level, ...rest)
		})
	}

}

export function createLogFile(timestamp: number, entries: Array<string>, scope: string): DataFile {
	const content = entries.join("\n")
	const data = stringToUtf8Uint8Array(content)
	return {
		_type: 'DataFile',
		name: timestamp + "_" + scope + "_tutanota.log",
		mimeType: "text/plain",
		data,
		size: data.byteLength,
		id: null
	}
}

export function replaceNativeLogger(global: any, loggerInstance: Logger, force: boolean = false) {
	// Replace native logger only when enabled because we lose line numbers
	if (force || global.env.dist || global.debug) {
		global.logger = loggerInstance
		const globalConsole = global.console
		global.console = {
			log(...args) {
				globalConsole.log(...args)
				loggerInstance.logInfo(...args)
			},

			warn(...args) {
				globalConsole.warn(...args)
				loggerInstance.logWarn(...args)
			},

			error(...args) {
				globalConsole.error(...args)
				loggerInstance.logError(...args)
			}
		}
	}
}
