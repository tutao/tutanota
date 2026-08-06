import { ProgrammingError } from "@tutao/app-env"
import { TypeChecks } from "../app-env/boot/TsTypeChecks"
import { KeyVersion } from "./TsUtils"

export type lazy<T> = () => T
export type lazyAsync<T> = () => Promise<T>
export type Thunk = () => unknown

export function isKeyVersion(version: number): version is KeyVersion {
	// we do not check the upper boundary (100) because this is just a limitation of the type system not a real one
	return Number.isInteger(version) && version >= 0
}

/**
 * A group key and its version.
 */
export type Versioned<T> = {
	object: T
	version: KeyVersion
}

/**
 * Create a versioned object with version 0
 */
export function freshVersioned<T>(object: T): Versioned<T> {
	return { object, version: 0 }
}

export async function asyncFind<T>(array: ReadonlyArray<T>, finder: (item: T, index: number, arrayLength: number) => Promise<boolean>): Promise<T | null> {
	for (let i = 0; i < array.length; i++) {
		const item = array[i]

		if (await finder(item, i, array.length)) {
			return item
		}
	}

	return null
}

export async function asyncFindAndMap<T, R>(
	array: ReadonlyArray<T>,
	finder: (item: T, index: number, arrayLength: number) => Promise<R | null>,
): Promise<R | null> {
	for (let i = 0; i < array.length; i++) {
		const item = array[i]
		const mapped = await finder(item, i, array.length)
		if (isNotNull(mapped)) {
			return mapped
		}
	}

	return null
}

/**
 * Calls an executor function for slices of nbrOfElementsInGroup items of the given array until the executor function returns false.
 */
export function executeInGroups<T>(array: T[], nbrOfElementsInGroup: number, executor: (items: T[]) => Promise<boolean>): Promise<void> {
	if (array.length > 0) {
		let nextSlice = Math.min(array.length, nbrOfElementsInGroup)
		return executor(array.slice(0, nextSlice)).then((doContinue) => {
			if (doContinue) {
				return executeInGroups(array.slice(nextSlice), nbrOfElementsInGroup, executor)
			}
		})
	} else {
		return Promise.resolve()
	}
}

export function neverNull<T>(object: T): NonNullable<T> {
	return object as any
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
export function assertNull<T>(value: T | null, message: string = "not null") {
	if (value != null) {
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
	if (value == null) {
		throw new Error("AssertNonNull failed: " + message)
	}
}

export function isNotNull<T>(t: T | null): t is NonNullable<T> {
	return t != null
}

export function isNull<T>(t: T | null): t is null {
	return (
		t === null ||
		// eslint-disable-next-line no-restricted-syntax
		t === undefined
	)
}

export function assert(assertion: boolean, message: string) {
	if (!assertion) {
		throw new Error(`Assertion failed: ${message}`)
	}
}

export function downcast<R = any>(object: any): R {
	return object as any
}

export type Callback<T> = (arg: T) => void

/**
 * accept a function taking exactly one argument and returning nothing and return a version of it
 * that will call the original function on the first call and ignore any further calls.
 * @param fn a function taking one argument and returning nothing
 */
export function makeSingleUse<T>(fn: Callback<T>): Callback<T> {
	let called = false
	return (arg) => {
		if (!called) {
			called = true
			fn(arg)
		}
	}
}

/**
 * Function which returns what was passed into it
 */
export function identity<T>(t: T): T {
	return t
}

/**
 * Function which does nothing.
 */
export function noOp() {}

export function randomIntFromInterval(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

export interface DeepEquals {
	deepEquals(other: this): boolean
}

/**
 * Disallow set, delete and clear on Map.
 * Important: It is *not* a deep freeze.
 * @param myMap
 * @return {unknown}
 */
export function freezeMap<K, V>(myMap: ReadonlyMap<K, V>): ReadonlyMap<K, V> {
	function mapSet(key: K, value: V): Map<K, V> {
		throw new Error("Can't add property " + key + ", map is not extensible")
	}

	function mapDelete(key: K): boolean {
		throw new Error("Can't delete property " + key + ", map is frozen")
	}

	function mapClear() {
		throw new Error("Can't clear map, map is frozen")
	}

	const anyMap = downcast<Map<K, V>>(myMap)
	anyMap.set = mapSet
	anyMap.delete = mapDelete
	anyMap.clear = mapClear
	Object.freeze(anyMap)
	return anyMap
}

export function addressDomain(senderAddress: string): string {
	return senderAddress.slice(senderAddress.lastIndexOf("@") + 1)
}

/**
 * Ignores the fact that Object.keys returns also not owned properties.
 */
export function typedKeys<K extends string, V>(obj: Record<K, V>): Array<K> {
	return downcast(Object.keys(obj))
}

/**
 * Ignores the fact that Object.keys returns also not owned properties.
 */
export function typedEntries<K extends string, V>(obj: Record<K, V>): Array<[K, V]> {
	return downcast(Object.entries(obj))
}

/**
 * Ignores the fact that Object.keys returns also not owned properties.
 */
export function typedValues<K extends string, V>(obj: Record<K, V>): Array<V> {
	return downcast(Object.values(obj))
}

/**
 * Stricter version of parseInt() from MDN. parseInt() allows some arbitrary characters at the end of the string.
 * Returns NaN in case there's anything non-number in the string.
 */
export function filterInt(value: string): number {
	if (/^\d+$/.test(value)) {
		return parseInt(value, 10)
	} else {
		return NaN
	}
}

interface Positioned {
	x: number
	y: number
}

interface Sized {
	top: number
	left: number
	bottom: number
	right: number
}

export function insideRect(point: Positioned, rect: Sized): boolean {
	return point.x >= rect.left && point.x < rect.right && point.y >= rect.top && point.y < rect.bottom
}

/**
 * If val is non null, returns the result of val passed to action, else null
 */
export function mapNullable<T, U>(val: T | null, action: (arg0: NonNullable<T>) => U | null): U | null {
	if (val != null) {
		const result = action(val)

		if (result != null) {
			return result
		}
	}

	return null
}
/** Helper to take instead of `typeof setTimeout` which is hellish to reproduce */
// eslint-disable-next-line no-restricted-syntax
export type TimeoutSetter = (fn: () => unknown, arg1: number) => ReturnType<typeof setTimeout>

export function mapObject<K extends string, V, R>(mapper: (arg0: V) => R, obj: Record<K, V>): Record<K, R> {
	const newObj = {} as Record<K, R>

	for (const key of Object.keys(obj)) {
		const typedKey = key as K
		newObj[typedKey] = mapper(obj[typedKey])
	}

	return newObj
}

/**
 * Run jobs with defined max parallelism.
 */
export class BoundedExecutor {
	private runningJobsCount: number = 0
	private currentJob: Promise<unknown> = Promise.resolve()

	constructor(private readonly maxParallelJobs: number) {}

	async run<T>(job: () => Promise<T>): Promise<T> {
		while (this.runningJobsCount === this.maxParallelJobs) {
			await this.currentJob
		}
		this.runningJobsCount++

		try {
			const jobResult = job()
			this.currentJob = jobResult.catch(noOp)
			return await jobResult
		} finally {
			this.runningJobsCount--
		}
	}
}

export function assertValidURL(url: string) {
	try {
		return new URL(url)
	} catch (e) {
		return false
	}
}

/**
 * Excessive resizing of an observed element can result in one or more resize events being deferred to the next render cycle.
 * When this happens, the browser sends a `ResizeObserver loop completed with undelivered notifications` error.
 * To avoid this, we handle resize events in a `requestAnimationFrame` making sure to cancel any pending requests
 */
export function createResizeObserver(cb: ResizeObserverCallback): ResizeObserver {
	let afRequestId: number | null = null

	return new ResizeObserver((entries, observer) => {
		if (afRequestId != null) {
			cancelAnimationFrame(afRequestId)
		}
		afRequestId = requestAnimationFrame(() => {
			cb(entries, observer)
		})
	})
}

export type Nullable<T> = T | null

export function isSessionStorageAvailable(): boolean {
	try {
		return !TypeChecks.hasProperty("sessionStorage")
	} catch (e) {
		return false
	}
}

export function isAsciiChar(char: string): boolean {
	return char.charCodeAt(0) <= 0x7f
}
