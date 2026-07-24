export function isString(s: any): boolean {
	return typeof s === "string"
}

export function isNumber(n: any): boolean {
	return typeof n === "number"
}

export function isBoolean(b: any): boolean {
	return typeof b === "boolean"
}

export function isFunction(f: any): boolean {
	return typeof f === "function"
}

export function isObject(o: any): boolean {
	return typeof o === "object"
}

export function isUndefined(u: any): boolean {
	return typeof u === "undefined"
}

export function getTypeOf(a: any): string {
	return typeof a
}
