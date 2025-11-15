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
 * Integer constraint from 0 to n (using tail-recursion elimination)
 */
type Enumerate<N extends number, Acc extends number[] = []> = Acc["length"] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc["length"]]>

/**
 * A key version must be an integer between 0 and 100.
 *
 * The constraint to < 100 is arbitrary and must be changed when we rotate keys more often.
 */
export type KeyVersion = Enumerate<100>

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
 * throws if the value is not null.
 * @param value the value to check
 * @param message optional error message
 */
export function assertNull<T>(value: T | null | undefined, message: string = "not null") {
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
			if (timeoutId) clearTimeout(timeoutId)
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
export function throttle<F extends (...args: any) => void>(periodMs: number, toThrottle: F): F {
	let timeoutId: ReturnType<typeof setTimeout> | null | undefined
	let lastArgs: any[]

	return ((...args: any) => {
		lastArgs = args

		if (timeoutId == null) {
			if (timeoutId) clearTimeout(timeoutId)
			timeoutId = setTimeout(() => {
				try {
					toThrottle.apply(null, lastArgs)
				} finally {
					timeoutId = null
				}
			}, periodMs)
		}
	}) as F
}

/**
 * Returns a throttled function. On the first call it is called immediately. For subsequent calls if the next call
 * happens after {@param periodMs} it is invoked immediately. For subsequent calls it will schedule the function to
 * run after {@param periodMs} after the last run of {@param toThrottle}. Only one invocation is scheduled, with the
 * latest arguments.
 *
 * 1--2-34
 * 1---2---4
 *
 * In this case, the first invocation happens immediately. 2 happens shortly before the interval expires
 * so it is run at the end of the interval. Within the next interval, both 3 and 4 are called so at the end of the
 * interval only 4 is called.
 */
export function throttleStart<F extends (...args: any[]) => Promise<any>>(periodMs: number, toThrottle: F): F {
	let lastArgs: any[] | null = null
	let scheduledTimeout: TimeoutID | null = null
	let scheduledDefer: DeferredObject<ReturnType<F>> | null = null
	return ((...args: any[]) => {
		if (scheduledTimeout == null) {
			const result = toThrottle(...args)
			scheduledDefer = defer<ReturnType<F>>()
			scheduledTimeout = setTimeout(() => {
				scheduledTimeout = null
				if (lastArgs != null) {
					toThrottle(...args).then(
						(result) => scheduledDefer?.resolve(result),
						(error) => scheduledDefer?.reject(error),
					)
				}
			}, periodMs)
			return result
		} else {
			lastArgs = args
			return assertNotNull(scheduledDefer).promise
		}
	}) as F
}

/**
 * Returns an async function that will only be executed once until it has settled. Subsequent calls will return the
 * original promise if it hasn't yet resolved.
 *
 * If the function throws before it can be awaited, it will not be caught.
 */
export function singleAsync<T, R>(fn: () => Promise<R>): () => Promise<R> {
	let promise: Promise<R> | null = null
	return async () => {
		if (promise != null) {
			return promise
		} else {
			promise = fn().finally(() => (promise = null))
			return promise
		}
	}
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

		// for (let .. in ..) doesn't work with maps
		if (a instanceof Map && b instanceof Map) {
			for (const key of a.keys()) {
				if (!b.has(key) || !deepEqual(a.get(key), b.get(key))) return false
			}

			for (const key of b.keys()) {
				if (!a.has(key)) return false
			}

			return true
		}

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
	return typeof maybe === "function" ? (maybe as () => T)() : maybe
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

/**
 * Factory method to allow tracing unresolved promises.
 */
export function newPromise<T>(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void, tag?: string) {
	const promise = new Promise(executor)

	// only to be enabled for local debugging purposes
	// traceUnresolvedPromises(promise, tag)

	return promise
}

function traceUnresolvedPromises<T>(promise: Promise<T>, tag?: string) {
	let pending = true
	promise.then(
		() => (pending = false),
		() => (pending = false),
	)
	// beware: tracing stacks might change timings in a way that you are not able to trace down deadlocks anymore
	// const stack = new Error().stack
	const stack = ""
	setTimeout(() => {
		if (pending) {
			console.trace(">>> Programming error: Promise not done after 60s", tag, stack)
		}
	}, 60000)
}

export function isSessionStorageAvailable(): boolean {
	try {
		return typeof sessionStorage !== "undefined"
	} catch (e) {
		return false
	}
}

export function isLatinChar(char: string): boolean {
	return char.charCodeAt(0) <= 0x7f
}
