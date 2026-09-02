export const TsMath = Math
export type TsRegex = RegExp
export const TsRegex = RegExp

export abstract class TsBrand {
	protected abstract readonly __brand: Nullable<never>
}

export type BrandedType<T, B extends TsBrand> = { __brand: B } & T

export type TsArray<T> = Array<T>

// mutating array
export const TsArray = {
	from<T>(...arr: Array<T>): TsArray<T> {
		return arr as unknown as TsArray<T>
	},
}
// read-only array
export type TsList<T> = TsArray<T>
export const TsList = TsArray

export const TsObject = {
	keys(obj: any): TsArray<TsString> {
		const keys = Object.keys(obj).map((k) => TsString.fromString(k))
		return TsArray.from(...keys)
	},

	freeze<T>(obj: T): Readonly<T> {
		return obj
	},
}

export type TsRecord<K extends string | number, V> = Record<K, V>

export class TsIntBrand extends TsBrand {
	protected __brand: Nullable<never> = null
}
export type TsInt = BrandedType<number, TsIntBrand>
export const TsInt = {
	parseInt(str: TsString): TsInt {
		return Number.parseInt(str.asString()) as TsInt
	},

	isNaN(num: TsInt | number): boolean {
		return Number.isNaN(num)
	},
}

export class TsDoubleBrand extends TsBrand {
	protected __brand: Nullable<never> = null
}

export type TsDouble = BrandedType<number, TsDoubleBrand>

export const TsDouble = Number
export function tsDouble(num: number): TsDouble {
	return num as TsDouble
}

export const TsDate = Date
export const TsString = {
	fromString(str: string): TsString {
		return str as unknown as TsString
	},
}

export type TsString = {
	length: TsInt
	replace(f: TsRegex, r: TsString | string): TsString
	match(m: TsRegex): Nullable<RegExpMatchArray>
	indexOf(s: TsString | string, position?: TsInt | number): TsInt
	substring(start: TsInt | number, end?: TsInt | number): string
	charAt(pos: TsInt | number): TsString

	// FIXME:
	// extend string prototype so that this function actually exists during runtime
	// Fixme:
	// this should not be used outside of lang-api package itself
	asString(): string
}

export type Nullable<T> = T | null

export class TypeChecks {
	public static isString(s: any): s is string {
		return typeof s === "string"
	}

	public static isNumber(n: any): n is number {
		return typeof n === "number"
	}

	public static isBoolean(b: any): b is boolean {
		return typeof b === "boolean"
	}

	public static isFunction(f: any): boolean {
		return typeof f === "function"
	}

	public static isObject(o: any): boolean {
		return typeof o === "object"
	}

	public static hasProperty(propertyName: string, parentObj: any = globalThis): boolean {
		return typeof parentObj[propertyName] !== "undefined"
	}

	public static getTypeOf(a: any): string {
		return typeof a
	}
}
