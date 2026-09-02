export abstract class TsBrand {
	protected abstract readonly __brand: Nullable<never>
}
export type BrandedType<T, B extends TsBrand> = { __brand: B } & T

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
