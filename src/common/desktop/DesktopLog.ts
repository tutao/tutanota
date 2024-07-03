import { noOp } from "@tutao/tutanota-utils"
import { Mode } from "../api/common/Env"

type LogFn = (...args: any) => void
export const log: {
	debug: LogFn
	warn: LogFn
	error: LogFn
	info: LogFn
} =
	typeof env !== "undefined" && env.mode === Mode.Test
		? {
				debug: noOp,
				warn: noOp,
				error: noOp,
				info: noOp,
		  }
		: makeLog()

export function rebindDesktopLog() {
	Object.assign(log, makeLog())
}

function makeLog() {
	return {
		debug: console.log.bind(console),
		warn: console.warn.bind(console),
		error: console.error.bind(console),
		info: console.info.bind(console),
	}
}

export function makeTaggedLogger(tag: string): typeof log {
	return {
		debug: (...args) => log.debug(tag, ...args),
		info: (...args) => log.info(tag, ...args),
		warn: (...args) => log.warn(tag, ...args),
		error: (...args) => log.error(tag, ...args),
	}
}
