import { assertNotNull, DeepEquals, downcast, isNotNull, isNull, Nullable } from "./Utils"
import { TypeChecks } from "../app-env/boot/TsTypeChecks"
import { ProgrammingError } from "@tutao/app-env"

// This file is not transpiled
/* eslint-disable  no-restricted-syntax */
/* eslint-disable local/noUnionExceptNullable */

/**
 * Integer constraint from 0 to n (using tail-recursion elimination)
 */
export type Enumerate<N extends number, Acc extends number[] = []> = Acc["length"] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc["length"]]>
/**
 * A key version must be an integer between 0 and 100.
 *
 * The constraint to < 100 is arbitrary and must be changed when we rotate keys more often.
 */
export type KeyVersion = Enumerate<100>
/** specifies a set of keys to be required, even if they're originally optional on a type.
 * requires nullable fields to be non-null, this may not be desired for all use cases.
 * Use "RequireNullable<K, T>" for cases where null is a meaningful value.
 *
 * `Require<"uid", Partial<CalendarEvent>>` */
export type Require<K extends keyof T, T> = T & { [P in K]-?: NonNullable<T[P]> }
export type DeferredObject<T> = {
	resolve: (arg0: T) => void
	reject: (arg0: Error) => void
	promise: Promise<T>
}
export type DeferredObjectWithHandler<T, U> = {
	resolve: (arg0: T) => void
	reject: (arg0: Error) => void
	promise: Promise<U>
}

export abstract class TsBrand {
	protected abstract readonly __brand: Nullable<never>
}

export type BrandedType<T, B extends TsBrand> = T & { __brand: B }

export function defer<T>(): DeferredObject<T> {
	let ret: DeferredObject<T> = {} as DeferredObject<T>
	ret.promise = new Promise((resolve, reject) => {
		ret.resolve = resolve
		ret.reject = reject
	})
	return ret
}

export function isStrictlyUndefined<T>(value: T | undefined): value is undefined {
	return value === undefined
}

export function deferWithHandler<T, U>(handler: (arg0: T) => U): DeferredObjectWithHandler<T, U> {
	const deferred = {} as DeferredObjectWithHandler<T, U>
	deferred.promise = new Promise((resolve, reject) => {
		deferred.resolve = resolve
		deferred.reject = reject
	}).then(handler)
	return deferred
}

/**
 * Return a function, which executed {@param toThrottle} only after it is not invoked for {@param timeout} ms.
 * Executes function with the last passed arguments
 * @return {Function}
 */
export function debounce<F extends (...args: any) => void>(timeout: number, toThrottle: F): F {
	let timeoutId: TimeoutID
	let toInvoke: (...args: any) => void
	return downcast((...args: any[]) => {
		if (isNotNull(timeoutId)) {
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
	let timeoutId: ReturnType<typeof setTimeout> | null = null
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
	let timeoutId: ReturnType<typeof setTimeout> | null = null
	let lastArgs: any[]

	return ((...args: any) => {
		lastArgs = args

		if (isNull(timeoutId)) {
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
 * original promise if it hasn't yet resolved. If it has, it will execute the function again and return its promise.
 */
export function singleAsync<R>(fn: () => Promise<R>): () => Promise<R> {
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

/**
 * Returns an async function that will only be executed once. Subsequent calls will return the original promise
 */
export function onceAsync<R>(fn: () => Promise<R>): () => Promise<R> {
	let promise: Promise<R> | null = null
	return async () => {
		if (promise != null) {
			return promise
		} else {
			promise = fn()
			return promise
		}
	}
}

/**
 * modified deepEquals from ospec is only needed as long as we use custom classes (TypeRef) and Date is not properly handled
 */

export function deepEqual(a: any, b: any): boolean {
	if (a === b) return true
	if (xor(a === null, b === null) || xor(a === undefined, b === undefined)) return false

	if (TypeChecks.isObject(a) && TypeChecks.isObject(b)) {
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

		if (a instanceof Uint8Array && b instanceof Uint8Array) {
			if (a.length !== b.length) return false
			for (let i = 0; i < a.length; i++) {
				if (a[i] !== b[i]) return false
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

		// See: DeepEquals interface
		if (TypeChecks.isFunction((a as DeepEquals).deepEquals) && TypeChecks.isFunction((b as DeepEquals).deepEquals)) {
			return a.deepEquals(b)
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
		if (TypeChecks.isFunction(Buffer) && a instanceof Buffer && b instanceof Buffer) {
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

function isArguments(a: any): boolean {
	if ("callee" in a) {
		for (let i in a) if (i === "callee") return false

		return true
	}
	return false
}

const hasOwn = {}.hasOwnProperty

/**
 * Factory method to allow tracing unresolved promises.
 */
export function newPromise<T>(executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void, tag?: string): Promise<T> {
	const promise = new Promise<T>((resolve, reject) => {
		executor(resolve, reject)
	})

	// only to be enabled for local debugging purposes
	// 	traceUnresolvedPromises(promise, tag)

	return promise
}

function traceUnresolvedPromises<T>(promise: Promise<T>, tag: Nullable<string> = null) {
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

/** Helper to take instead of `typeof setTimeout` which is hellish to reproduce */
export type TimeoutSetter = (fn: () => unknown, arg1: number) => ReturnType<typeof setTimeout>
