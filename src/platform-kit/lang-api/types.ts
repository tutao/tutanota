export const TsMath = Math
export type TsRegex = RegExp

export abstract class TsBrand {
	protected abstract readonly __brand: Nullable<never>
}

export type BrandedType<T, B extends TsBrand> = { __brand: B } & T

export type TsArray<T> = {
	find(predicate: (value: T, index: TsNumber, obj: T[]) => unknown, thisArg?: any): Nullable<T>
	map<U>(callbackfn: (value: T, index: TsNumber, array: T[]) => U, thisArg?: any): TsArray<U>
}
export const TsArray = Array

export const TsObject = {
	keys(obj: any): TsArray<TsString> {
		return Object.keys(obj)
	},

	freeze<T>(obj: T): Readonly<T> {
		return obj
	},
}

export const TsNumber = {
	parseInt(str: TsString): TsNumber {
		return Number.parseInt(str as string)
	},

	parseFloat(str: TsString): TsNumber {
		return Number.parseFloat(str as string)
	},

	isNaN(num: number): boolean {
		return Number.isNaN(num)
	},

	fromInt(int: number): TsNumber {
		return int as TsNumber
	},

	fromFloat(float: number): TsNumber {
		return float as TsNumber
	},
}

export class TsNumberBrand extends TsBrand {
	protected __brand: Nullable<never> = null
}

export class TsDoubleBrand extends TsBrand {
	protected __brand: Nullable<never> = null
}

export type TsNumber = BrandedType<number, TsNumberBrand>
export type TsDouble = BrandedType<number, TsDoubleBrand>
export const TsDate = Date
export const TsString = String
export type TsString = {
	length: TsNumber
	replace(f: TsRegex, r: TsString): TsString
	match(m: TsRegex): Nullable<RegExpMatchArray>
	indexOf(s: TsString, position?: TsNumber): TsNumber
	substring(start: TsNumber, end?: TsNumber): TsString
	charAt(pos: TsNumber): TsString
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

	static isNaN(number: number): boolean {
		return isNaN(number)
	}
}
