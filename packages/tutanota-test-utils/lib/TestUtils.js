// @flow
import o from "ospec"

/**
 * Mocks an attribute (function or object) on an object and makes sure that it can be restored to the original attribute by calling unmockAttribute() later.
 * Additionally creates a spy for the attribute if the attribute is a function.
 * @param object The object on which the attribute exists.
 * @param attributeOnObject The attribute to mock.
 * @param attributeMock The attribute mock.
 * @returns An object to be passed to unmockAttribute() in order to restore the original attribute.
 */
export function mockAttribute(object: Object, attributeOnObject: Function | Object, attributeMock: Function | Object): Object {
	if (attributeOnObject == null) throw new Error("attributeOnObject is undefined")
	let attributeName = Object.getOwnPropertyNames(object).find(key => object[key] === attributeOnObject)
	if (!attributeName) {
		attributeName = Object.getOwnPropertyNames(Object.getPrototypeOf(object))
		                      .find(key => object[key] === attributeOnObject)
	}
	if (!attributeName) {
		throw new Error("attribute not found on object")
	}
	object[attributeName] = (typeof attributeOnObject == "function") ? o.spy(attributeMock) : attributeMock
	return {
		_originalObject: object,
		_originalAttribute: attributeOnObject,
		_attributeName: attributeName
	}
}

export function unmockAttribute(mock: Object) {
	mock._originalObject[mock._attributeName] = mock._originalAttribute
}

export type Spy = ((...any) => any) & {invocations: any[]}

export function spy(producer?: (...any) => any): Spy {
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
export const mock = <T>(obj: T, mocker: any => any): T => {
	mocker(obj)
	return obj
}

export function mapToObject<K, V>(map: Map<K, V>): {[K]: V} {
	const obj: {[K]: V} = {}
	map.forEach((value, key) => {
		obj[key] = value
	})
	return obj
}

export function mapObject<K, V, R>(mapper: (V) => R, obj: {[K]: V}): {[K]: R} {
	const newObj = {}
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
			: toReplace != null && Object.getPrototypeOf(toReplace) === (Object: any).prototype // plain object
				? mapObject(replaceAllMaps, toReplace)
				: toReplace
}

/** Catch error and return either value or error */
export async function asResult<T>(p: Promise<T>): Promise<T | Error> {
	return p.catch((e) => e)
}

export async function assertThrows<T: Error>(expected: Class<T>, fn: () => Promise<mixed>): Promise<T> {
	try {
		await fn()
	} catch (e) {
		o(e instanceof expected).equals(true)("AssertThrows failed: Expected a " + (expected: any) + " to be thrown, but got a "
			+ e.constructor)
		return e
	}
	throw new Error("AssertThrows failed: Expected a " + (expected: any) + " to be thrown, but nothing was")
}


export async function assertResolvedIn(ms: number, ...promises: $ReadOnlyArray<Promise<*>>): Promise<*> {
	const allP = [delay(ms).then(() => "timeout")]
		.concat(promises.map((p, i) => p.then(() => `promise ${i} is resolved`)))
	const result = await Promise.race(allP)
	o(result).notEquals("timeout")
}

export async function assertNotResolvedIn(ms: number, ...promises: $ReadOnlyArray<Promise<*>>): Promise<*> {
	const allP = [delay(ms).then(() => "timeout")]
		.concat(promises.map((p, i) => p.then(() => `promise ${i} is resolved`)))
	const result = await Promise.race(allP)
	o(result).equals("timeout")
}

export interface TimeoutMock {
	(fn: () => mixed, time: number): TimeoutID,

	next(): void

}

export function makeTimeoutMock(): TimeoutMock {
	let timeoutId = 1
	let scheduledFn
	const timeoutMock = function (fn: () => mixed) {
		scheduledFn = fn
		timeoutId++
		return timeoutId
	}
	const spiedMock = o.spy(timeoutMock)

	spiedMock.next = function () {
		scheduledFn && scheduledFn()
	}
	return (spiedMock: any)
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}