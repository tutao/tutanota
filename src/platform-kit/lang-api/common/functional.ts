import { ProgrammingError } from "./error"
import { Nullable } from "./types"

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
		throw new Error("AssertNotNull failed: " + message)
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

export function assert(assertion: boolean, message: string): void {
	if (!assertion) {
		throw new Error(`Assertion failed: ${message}`)
	}
}

export function downcast<R = any>(object: any): R {
	return object as any
}

export function ifNull<T, R>(item: Nullable<T>, orEval: () => R): Nullable<R> {
	return checkNullAnd(item, orEval, () => null)
}

export function ifNotNull<T, R>(item: Nullable<T>, whenNotNull: (_: NonNullable<T>) => R): Nullable<R> {
	return checkNotNullAnd(item, whenNotNull, () => null)
}

export function checkNullAnd<T, R>(item: Nullable<T>, whenNull: () => R, whenNotNull: (_: NonNullable<T>) => R): R {
	return isNotNull(item) ? whenNotNull(item) : whenNull()
}

export function checkNotNullAnd<T, R>(item: Nullable<T>, whenNotNull: (_: NonNullable<T>) => R, whenNull: () => R): R {
	return checkNullAnd(item, whenNull, whenNotNull)
}

export function getStringEnumValue(value: string): string {
	return value
}

export function getNumericEnumValue(value: number): number {
	return value
}
