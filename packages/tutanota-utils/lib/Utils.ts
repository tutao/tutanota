import { TypeRef } from "./TypeRef.js"

export interface ErrorInfo {
	readonly name: string | null
	readonly message: string | null
	readonly stack?: string | null
}

export type lazy<T> = () => T
export type lazyAsync<T> = () => Promise<T>
export type Thunk = () => unknown

/**
 * A group key and its version.
 */
export type Versioned<T> = {
	object: T
	version: number
}

/**
 * Create a versioned object with version 0
 */
export function freshVersioned<T>(object: T): Versioned<T> {
	return { object, version: 0 }
}

/** specifies a set of keys to be required, even if they're originally optional on a type.
 * requires nullable fields to be non-null, this may not be desired for all use cases.
 * Use "RequireNullable<K, T>" for cases where null is a meaningful value.
 *
 * `Require<"uid", Partial<CalendarEvent>>` */
export type Require<K extends keyof T, T> = T & { [P in K]-?: NonNullable<T[P]> }

export type DeferredObject<T> = {
	resolve: (arg0: T | PromiseLike<T>) => void
	reject: (arg0: Error) => void
	promise: Promise<T>
}
export type DeferredObjectWithHandler<T, U> = {
	resolve: (arg0: T) => void
	reject: (arg0: Error) => void
	promise: Promise<U>
}

export function defer<T>(): DeferredObject<T> {
	let ret: DeferredObject<T> = {} as DeferredObject<T>
	ret.promise = new Promise((resolve, reject) => {
		ret.resolve = resolve
		ret.reject = reject
	})
	return ret
}

export function deferWithHandler<T, U>(handler: (arg0: T) => U): DeferredObjectWithHandler<T, U> {
	const deferred = {} as DeferredObjectWithHandler<T, U>
	deferred.promise = new Promise((resolve, reject) => {
		deferred.resolve = resolve
		deferred.reject = reject
	}).then(handler)
	return deferred
}

export async function asyncFind<T>(
	array: ReadonlyArray<T>,
	finder: (item: T, index: number, arrayLength: number) => Promise<boolean>,
): Promise<T | null | undefined> {
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
): Promise<R | null | undefined> {
	for (let i = 0; i < array.length; i++) {
		const item = array[i]
		const mapped = await finder(item, i, array.length)

		if (mapped) {
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
export function assertNotNull<T>(value: T | null | undefined, message: string = "null"): T {
	if (value == null) {
		throw new Error("AssertNotNull failed : " + message)
	}

	return value
}

/**
 * assertion function that only returns if the argument is non-null
 * (acts as a type guard)
 * @param value the value to check
 * @param message optional error message
 */
export function assertNonNull<T>(value: T | null | undefined, message: string = "null"): asserts value is T {
	if (value == null) {
		throw new Error("AssertNonNull failed: " + message)
	}
}

export function isNotNull<T>(t: T | null | undefined): t is T {
	return t != null
}

export function assert(assertion: MaybeLazy<boolean>, message: string) {
	if (!resolveMaybeLazy(assertion)) {
		throw new Error(`Assertion failed: ${message}`)
	}
}

export function downcast<R = any>(object: any): R {
	return object as any
}

export function clone<T>(instance: T): T {
	if (instance instanceof Uint8Array) {
		return downcast<T>(instance.slice())
	} else if (instance instanceof Array) {
		return downcast<T>(instance.map((i) => clone(i)))
	} else if (instance instanceof Date) {
		return new Date(instance.getTime()) as any
	} else if (instance instanceof TypeRef) {
		return instance
	} else if (instance instanceof Object) {
		// Can only pass null or Object, cannot pass undefined
		const copy = Object.create(Object.getPrototypeOf(instance) || null)
		Object.assign(copy, instance)

		for (let key of Object.keys(copy)) {
			copy[key] = clone(copy[key])
		}

		return copy as any
	} else {
		return instance
	}
}

/**
 * Function which accepts another function. On first invocation
 * of this resulting function result will be remembered and returned
 * on consequent invocations.
 */
export function lazyMemoized<T>(source: () => T): lazy<T> {
	// Using separate variable for tracking because value can be undefined and we want to the function call only once
	let cached = false
	let value: T
	return () => {
		if (cached) {
			return value
		} else {
			cached = true
			return (value = source())
		}
	}
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
 * Returns a cached version of {@param fn}.
 * Cached function checks that argument is the same (with ===) and if it is then it returns the cached result.
 * If the cached argument has changed then {@param fn} will be called with new argument and result will be cached again.
 * Only remembers the last argument.
 */
export function memoized<T, R>(fn: (arg0: T) => R): (arg0: T) => R {
	let lastArg: T
	let lastResult: R
	let didCache = false
	return (arg) => {
		if (!didCache || arg !== lastArg) {
			lastArg = arg
			didCache = true
			lastResult = fn(arg)
		}

		return lastResult
	}
}

/**
 * Like {@link memoized} but the argument is passed in via {@param argumentProvider}.
 * Useful for the cases where we want to keep only one field around e.g. for lazy getters
 */
export function memoizedWithHiddenArgument<T, R>(argumentProvider: () => T, computationFunction: (arg: T) => R): () => R {
	const memoizedComputation = memoized(computationFunction)
	return () => memoizedComputation(argumentProvider())
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

/**
 * Return a function, which executed {@param toThrottle} only after it is not invoked for {@param timeout} ms.
 * Executes function with the last passed arguments
 * @return {Function}
 */
export function debounce<F extends (...args: any) => void>(timeout: number, toThrottle: F): F {
	let timeoutId: TimeoutID
	let toInvoke: (...args: any) => void
	return downcast((...args: any[]) => {
		if (timeoutId) {
			clearTimeout(timeoutId)
		}

		toInvoke = toThrottle.bind(null, ...args)
		timeoutId = setTimeout(toInvoke, timeout)
	})
}

/**
 * Returns a debounced function. When invoked for the first time, will just invoke
 * {@param toThrottle}. On subsequent invocations it will either invoke it right away
 * (if {@param timeout} has passed) or will schedule it to be run after {@param timeout}.
 * So the first and the last invocations in a series of invocations always take place
 * but ones in the middle (which happen too often) are discarded.
 */
export function debounceStart<F extends (...args: any) => void>(timeout: number, toThrottle: F): F {
	let timeoutId: ReturnType<typeof setTimeout> | null | undefined
	let lastInvoked = 0
	return downcast((...args: any) => {
		if (Date.now() - lastInvoked < timeout) {
			timeoutId && clearTimeout(timeoutId)
			timeoutId = setTimeout(() => {
				timeoutId = null
				toThrottle.apply(null, args)
			}, timeout)
		} else {
			toThrottle.apply(null, args)
		}

		lastInvoked = Date.now()
	})
}

/**
 * Returns a throttled function. When invoked for the first time will schedule {@param toThrottle}
 * to be called after {@param periodMs}. On subsequent invocations before {@param periodMs} amount of
 * time passes it will replace the arguments for the scheduled call (without rescheduling). After
 * {@param period} amount of time passes it will finally call {@param toThrottle} with the arguments
 * of the last call. New calls after that will behave like described in the beginning.
 *
 * This makes sure that the function is called not more often but also at most after {@param periodMs}
 * amount of time. Unlike {@link debounce}, it will get called after {@param periodMs} even if it
 * is being called repeatedly.
 */
export function throttle<F extends (...args: any[]) => void>(periodMs: number, toThrottle: F): F {
	let lastArgs: any[] | null = null
	return ((...args: any[]) => {
		if (lastArgs) {
			return
		} else {
			setTimeout(() => {
				try {
					toThrottle.apply(null, args)
				} finally {
					lastArgs = null
				}
			}, periodMs)
		}
	}) as F
}

export function randomIntFromInterval(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

export function errorToString(error: ErrorInfo): string {
	let errorString = error.name ? error.name : "?"

	if (error.message) {
		errorString += `\n Error message: ${error.message}`
	}

	if (error.stack) {
		// the error id is included in the stacktrace
		errorString += `\nStacktrace: \n${error.stack}`
	}

	return errorString
}

/**
 * Like {@link Object.entries} but preserves the type of the key and value
 */
export function objectEntries<A extends string | symbol, B>(object: Record<A, B>): Array<[A, B]> {
	return downcast(Object.entries(object))
}

/**
 * modified deepEquals from ospec is only needed as long as we use custom classes (TypeRef) and Date is not properly handled
 */
export function deepEqual(a: any, b: any): boolean {
	if (a === b) return true
	if (xor(a === null, b === null) || xor(a === undefined, b === undefined)) return false

	if (typeof a === "object" && typeof b === "object") {
		const aIsArgs = isArguments(a),
			bIsArgs = isArguments(b)

		if (a.length === b.length && ((a instanceof Array && b instanceof Array) || (aIsArgs && bIsArgs))) {
			const aKeys = Object.getOwnPropertyNames(a),
				bKeys = Object.getOwnPropertyNames(b)
			if (aKeys.length !== bKeys.length) return false

			for (let i = 0; i < aKeys.length; i++) {
				if (!hasOwn.call(b, aKeys[i]) || !deepEqual(a[aKeys[i]], b[aKeys[i]])) return false
			}

			return true
		}

		if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()

		if (a instanceof Object && b instanceof Object && !aIsArgs && !bIsArgs) {
			for (let i in a) {
				if (!(i in b) || !deepEqual(a[i], b[i])) return false
			}

			for (let i in b) {
				if (!(i in a)) return false
			}

			return true
		}

		// @ts-ignore: we would need to include all @types/node for this to work or import it explicitly. Should probably be rewritten for all typed arrays.
		if (typeof Buffer === "function" && a instanceof Buffer && b instanceof Buffer) {
			for (let i = 0; i < a.length; i++) {
				if (a[i] !== b[i]) return false
			}

			return true
		}

		if (a.valueOf() === b.valueOf()) return true
	}

	return false
}

function xor(a: boolean, b: boolean): boolean {
	const aBool = !!a
	const bBool = !!b
	return (aBool && !bBool) || (bBool && !aBool)
}

function isArguments(a: any) {
	if ("callee" in a) {
		for (let i in a) if (i === "callee") return false

		return true
	}
}

const hasOwn = {}.hasOwnProperty

/**
 * returns an array of top-level properties that are in both objA and objB, but differ in value
 * does not handle functions or circular references
 * treats undefined and null as equal
 */
export function getChangedProps(objA: any, objB: any): Array<string> {
	if (objA == null || objB == null || objA === objB) return []
	return Object.keys(objA)
		.filter((k) => Object.keys(objB).includes(k))
		.filter((k) => ![null, undefined].includes(objA[k]) || ![null, undefined].includes(objB[k]))
		.filter((k) => !deepEqual(objA[k], objB[k]))
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

export type MaybeLazy<T> = T | lazy<T>

export function resolveMaybeLazy<T>(maybe: MaybeLazy<T>): T {
	return typeof maybe === "function" ? (maybe as Function)() : maybe
}

export function getAsLazy<T>(maybe: MaybeLazy<T>): lazy<T> {
	return typeof maybe === "function" ? downcast(maybe) : () => maybe
}

export function mapLazily<T, U>(maybe: MaybeLazy<T>, mapping: (arg0: T) => U): lazy<U> {
	return () => mapping(resolveMaybeLazy(maybe))
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
export function mapNullable<T, U>(val: T | null | undefined, action: (arg0: T) => U | null | undefined): U | null {
	if (val != null) {
		const result = action(val)

		if (result != null) {
			return result
		}
	}

	return null
}

/** Helper to take instead of `typeof setTimeout` which is hellish to reproduce */
export type TimeoutSetter = (fn: () => unknown, arg1: number) => ReturnType<typeof setTimeout>

export function mapObject<K extends string | number | symbol, V, R>(mapper: (arg0: V) => R, obj: Record<K, V>): Record<K, R> {
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
