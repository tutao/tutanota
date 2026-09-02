import { ProgrammingError } from "./error"

export function neverNull<T>(object: T): NonNullable<T> {
	if (isNull(object)) {
		console.trace(`Called neverNull with a null value`)
	}
	return downcast<NonNullable<T>>(object)
}

/**
 * returns its argument if it is not null, throws otherwise.
 * @param value the value to check
 * @param message optional error message
 */
export function assertNotNull<T>(value: T | null, message: string = "null"): NonNullable<T> {
	if (value == null) {
		throw new ProgrammingError("AssertNotNull failed: " + message)
	}

	return value
}

export function assertNotNaN(number: number, message: string = "Found NaN when valid number is expected"): number {
	if (isNaN(number)) {
		throw new ProgrammingError(message)
	}
	return number
}

/**
 * throws if the value is not null.
 * @param value the value to check
 * @param message optional error message
 */
export function assertNull<T>(value: T | null, message: string = "not null"): void {
	if (isNotNull(value)) {
		throw new Error("AssertNull failed : " + message)
	}
}

/**
 * assertion function that only returns if the argument is non-null
 * (acts as a type guard)
 * @param value the value to check
 * @param message optional error message
 */
export function assertNonNull<T>(value: T | null, message: string = "null"): asserts value is T {
	if (isNull(value)) {
		throw new Error("AssertNonNull failed: " + message)
	}
}

export function isNotNull<T>(t: T | null): t is NonNullable<T> {
	return t != null
}

export function isNull<T>(t: T | null | undefined): t is null | undefined {
	return t === null || t === undefined
}

export function assert(assertion: boolean, message: string): asserts assertion {
	if (!assertion) {
		throw new Error(`Assertion failed: ${message}`)
	}
}

export function downcast<R = any>(object: any): R {
	return object as any
}
