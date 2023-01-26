//@bundleInto:common-min

import { errorToString, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { DataFile } from "./DataFile"

export const LOG_SIZE = 1000

export class Logger {
	// Circular buffer with next writable position pointed by _index
	_entries: Array<Array<any>>
	_index: number
	_dateProvider: () => Date

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
			try {
				return obj instanceof Error ? errorToString(Object.assign({ stack: null }, obj)) : JSON.stringify(obj)
			} catch (e) {
				return "[cyclic object]"
			}
		})
		const message = formattedArgs.join(",")
		return `${date.toISOString()} ${level} ${message}`
	}

	getEntries(): Array<string> {
		const newerPart = this._entries.slice(0, this._index)

		const olderPart = this._entries.slice(this._index)

		return olderPart
			.concat(newerPart)
			.filter(Boolean)
			.map(([date, level, ...rest]) => {
				return this.formatLogEntry(date, level, ...rest)
			})
	}
}

export function createLogFile(content: string, scope: string, timestamp?: number): DataFile {
	const data = stringToUtf8Uint8Array(content)
	const timestampString = timestamp ? timestamp + "_" : ""
	return {
		_type: "DataFile",
		name: timestampString + scope + "_tutanota.log",
		mimeType: "text/plain",
		data,
		size: data.byteLength,
		id: undefined,
	}
}

export function replaceNativeLogger(global: any, loggerInstance: Logger, force: boolean = false) {
	// Replace native logger only when enabled because we lose line numbers
	if (force || global.env.dist || global.debug) {
		global.logger = loggerInstance
		const globalConsole = global.console
		global.console = {
			log(...args: any[]) {
				globalConsole.log(...args)
				loggerInstance.logInfo(...args)
			},

			warn(...args: any[]) {
				globalConsole.warn(...args)
				loggerInstance.logWarn(...args)
			},

			error(...args: any[]) {
				globalConsole.error(...args)
				loggerInstance.logError(...args)
			},

			trace(...args: any[]) {
				globalConsole.trace(...args)
			},
			info(...args: any[]) {
				globalConsole.info(...args)
			},
		}
	}
}
