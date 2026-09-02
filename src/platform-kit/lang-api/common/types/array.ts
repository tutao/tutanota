import { TsInt } from "./primitives"
import { Nullable } from "./utility"

export type TsReadonlyArray<T> = {
	length: TsInt
	find(predicate: (value: T, index: TsInt, obj: TsArray<T>) => unknown): Nullable<T>
}

export const TsReadonlyArray = {
	from<T>(...arr: Array<T>): TsReadonlyArray<T> {
		return arr as unknown as TsReadonlyArray<T>
	},
}

export type TsArray<T> = TsReadonlyArray<T> & {
	map<U>(callbackfn: (value: T, index: TsInt, array: TsArray<T>) => U): TsArray<U>
}
export const TsArray = {
	from<T>(...arr: Array<T>): TsArray<T> {
		return arr as unknown as TsArray<T>
	},
}
