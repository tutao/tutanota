export const TsMath = Math
export type TsRegex = RegExp
export const TsObject = {
	keys(obj: any): string[] {
		return Object.keys(obj)
	},

	freeze<T>(obj: T): Readonly<T> {
		return obj
	},
}

export const console = {
	log(...msg: any): void {
		return console.log(...msg)
	},

	error(...msg: any): void {
		return console.error(...msg)
	},

	warn(...msg: any): void {
		return console.warn(...msg)
	},

	debug(...msg: any): void {
		return console.debug(...msg)
	},
}

export const TsNumber = Number
export const TsDate = Date
export const TsString = String

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
