import type {Class} from "global"
import o from "ospec"

/**
 * Mocks an attribute (function or object) on an object and makes sure that it can be restored to the original attribute by calling unmockAttribute() later.
 * Additionally creates a spy for the attribute if the attribute is a function.
 * @param object The object on which the attribute exists.
 * @param attributeOnObject The attribute to mock.
 * @param attributeMock The attribute mock.
 * @returns An object to be passed to unmockAttribute() in order to restore the original attribute.
 */
export function mockAttribute(
		object: Record<string, any>,
		attributeOnObject: ((...args: Array<any>) => any) | Record<string, any>,
		attributeMock: ((...args: Array<any>) => any) | Record<string, any>,
): Record<string, any> {
	if (attributeOnObject == null) throw new Error("attributeOnObject is undefined")
	let attributeName = Object.getOwnPropertyNames(object).find(key => object[key] === attributeOnObject)

	if (!attributeName) {
		attributeName = Object.getOwnPropertyNames(Object.getPrototypeOf(object)).find(
				key => object[key] === attributeOnObject,
		)
	}

	if (!attributeName) {
		throw new Error("attribute not found on object")
	}

	object[attributeName] = typeof attributeOnObject == "function" ? o.spy(attributeMock as (...args: Array<any>) => any) : attributeMock
	return {
		_originalObject: object,
		_originalAttribute: attributeOnObject,
		_attributeName: attributeName,
	}
}

export function unmockAttribute(mock: Record<string, any>) {
	mock._originalObject[mock._attributeName] = mock._originalAttribute
}

export type Spy = ((...args: any) => any) & {
	invocations: any[]
}

export function spy(producer?: (...args: any) => any): Spy {
	const invocations = []

	const s = (...args: any[]) => {
		invocations.push(args)
		return producer && producer(...args)
	}

	s.invocations = invocations
	return s
}

/**
 * Create partial mock, i.e. allows mocking attributes or functions on actual instances
 * @param obj The base mock object on which mocker may overwrite attributes or functions
 * @param mocker This function receives obj and can overwrite attributes or functions.
 * @returns {T}
 */
export const mock = <T>(obj: T, mocker: (arg0: any) => any): T => {
	mocker(obj)
	return obj
}

export function mapToObject<K extends string | number | symbol, V>(map: Map<K, V>): Record<K, V> {
	const obj = {} as Record<K, V>
	map.forEach((value, key) => {
		obj[key] = value
	})
	return obj
}

export function mapObject<K extends string | number | symbol, V, R>(mapper: (arg0: V) => R, obj: Record<K, V>): Record<K, R> {
	const newObj = {} as Record<K, R>

	for (let key of Object.keys(obj)) {
		newObj[key] = mapper(obj[key])
	}

	return newObj
}

export function replaceAllMaps(toReplace: any): any {
	return toReplace instanceof Map
			? replaceAllMaps(mapToObject(toReplace))
			: toReplace instanceof Array
					? toReplace.map(replaceAllMaps)
					: toReplace != null && Object.getPrototypeOf(toReplace) === (Object as any).prototype // plain object
							? mapObject(replaceAllMaps, toReplace)
							: toReplace
}

/** Catch error and return either value or error */
export async function asResult<T>(p: Promise<T>): Promise<T | Error> {
	return p.catch(e => e)
}

export async function assertThrows<T extends Error>(expected: Class<T>, fn: () => Promise<unknown>): Promise<T> {
	try {
		await fn()
	} catch (e) {
		o(e instanceof expected).equals(true)(
				"AssertThrows failed: Expected a " + (expected as any) + " to be thrown, but got a " + e.constructor,
		)
		return e as T
	}

	throw new Error("AssertThrows failed: Expected a " + (expected as any) + " to be thrown, but nothing was")
}

export async function assertResolvedIn(ms: number, ...promises: ReadonlyArray<Promise<any>>): Promise<any> {
	const allP = [delay(ms).then(() => "timeout")].concat(
			promises.map((p, i) => p.then(() => `promise ${i} is resolved`)),
	)
	const result = await Promise.race(allP)
	o(result).notEquals("timeout")
}

export async function assertNotResolvedIn(ms: number, ...promises: ReadonlyArray<Promise<any>>): Promise<any> {
	const allP = [delay(ms).then(() => "timeout")].concat(
			promises.map((p, i) => p.then(() => `promise ${i} is resolved`)),
	)
	const result = await Promise.race(allP)
	o(result).equals("timeout")
}

export interface TimeoutMock {
	(fn: () => unknown, time: number): ReturnType<typeof setTimeout>

	next(): void
}

export function makeTimeoutMock(): TimeoutMock {
	let timeoutId = 1
	let scheduledFn

	const timeoutMock = function (fn: () => unknown) {
		scheduledFn = fn
		timeoutId++
		return timeoutId
	}

	const spiedMock = o.spy(timeoutMock) as unknown as TimeoutMock

	spiedMock.next = function () {
		scheduledFn && scheduledFn()
	}

	return spiedMock
}

function delay(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms)
	})
}