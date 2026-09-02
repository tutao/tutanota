import { TsArray } from "./array"
import { TsInt, TsString } from "./primitives"

export const TsMath = {
	pow(base: TsInt, raise: TsInt): TsInt {
		return Math.pow(base, raise)
	},
}

export type TsRegex = RegExp
export const TsRegex = RegExp
export type TsRecord<K extends string | number, V> = Record<K, V>
export const TsDate = Date

export const TsObject = {
	keys(obj: any): TsArray<TsString> {
		return TsArray.from(...Object.keys(obj))
	},

	freeze<T>(obj: T): Readonly<T> {
		return Object.freeze(obj)
	},

	/**
	 * @deprecated Cannot replicate behaviour of Object.assign in kotlin's & swift's langApi
	 */
	assign: null,
}
