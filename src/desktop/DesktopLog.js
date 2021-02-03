//@flow

import {noOp} from "../api/common/utils/Utils"
import {Mode} from "../api/common/Env"

type LogFn = (...args: any) => void
export const log: {debug: LogFn, warn: LogFn, error: LogFn} = (typeof env !== "undefined" && env.mode === Mode.Test)
	? {
		debug: noOp,
		warn: noOp,
		error: noOp,
	}
	: {
		debug: console.log.bind(console),
		warn: console.warn.bind(console),
		error: console.error.bind(console)
	}