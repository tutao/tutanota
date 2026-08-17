export const TsMath = Math
export type TsRegex = RegExp

export type TsArray<T> = {
	find(predicate: (value: T, index: TsNumber, obj: T[]) => unknown, thisArg?: any): Nullable<T>
	map<U>(callbackfn: (value: T, index: TsNumber, array: T[]) => U, thisArg?: any): TsArray<U>
}

export const TsObject = {
	keys(obj: any): TsArray<TsString> {
		return Object.keys(obj)
	},

	freeze<T>(obj: T): Readonly<T> {
		return obj
	},
}

export const TsNumber = Number
export type TsNumber = number
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
