/// This file will not be transpiled, so it's ok to ignore transpile-related eslint
/* eslint-disable  no-restricted-syntax */

export class TypeChecks {
	public static isString(s: any): boolean {
		return typeof s === "string"
	}
	public static isNumber(n: any): boolean {
		return typeof n === "number"
	}

	public static isBoolean(b: any): boolean {
		return typeof b === "boolean"
	}

	public static isFunction(f: any): boolean {
		return typeof f === "function"
	}

	public static isObject(o: any): boolean {
		return typeof o === "object"
	}

	public static hasProperty(propertyName: string, parentObj: any = globalThis): boolean {
		return typeof parentObj[propertyName] === "undefined"
	}

	public static getTypeOf(a: any): string {
		return typeof a
	}
}
