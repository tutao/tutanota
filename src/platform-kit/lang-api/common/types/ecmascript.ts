import { TsString } from "./primitives"

export const TsMath = {
	pow(base: number, raise: number): number {
		return Math.pow(base, raise)
	},
}

export type TsRegex = RegExp
export const TsRegex = RegExp
export type TsRecord<K extends string | number, V> = Record<K, V>
export const TsDate = Date

export const TsObject = {
	keys(obj: any): Array<TsString> {
		return Object.keys(obj)
	},

	freeze<T>(obj: T): Readonly<T> {
		return Object.freeze(obj)
	},

	/**
	 * @deprecated Cannot replicate behaviour of Object.assign in kotlin's & swift's langApi
	 */
	assign: null,
}

export const TsJson = {
	stringify<T>(obj: T): string {
		return JSON.stringify(obj)
	},

	parse<T = any>(jsonString: string): T {
		return JSON.parse(jsonString)
	},
}

function tsStructuredClone<T>(arg: T): T {
	return structuredClone(arg)
}

export { tsStructuredClone as structuredClone }
