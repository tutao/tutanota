import otest from "@tutao/otest"
import * as td from "testdouble"
import { lastThrow, mapObject } from "@tutao/tutanota-utils"

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
	let attributeName = Object.getOwnPropertyNames(object).find((key) => object[key] === attributeOnObject)

	if (!attributeName) {
		attributeName = Object.getOwnPropertyNames(Object.getPrototypeOf(object)).find((key) => object[key] === attributeOnObject)
	}

	if (!attributeName) {
		throw new Error("attribute not found on object")
	}

	object[attributeName] = typeof attributeOnObject == "function" ? spy(attributeMock as (...args: Array<any>) => any) : attributeMock
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
	const invocations: any[][] = []

	// make it *non* arrow function so that it can be bound to objects
	const s = function (this: any, ...args: any[]) {
		invocations.push(args)
		return producer && producer.apply(this, args)
	}

	s.invocations = invocations
	Object.defineProperty(s, "callCount", {
		get(): number {
			return s.invocations.length
		},
	})
	Object.defineProperty(s, "args", {
		get(): any[] {
			return lastThrow(s.invocations)
		},
	})
	Object.defineProperty(s, "calls", {
		get(): any[] {
			return s.invocations
		},
	})
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
	for (const [key, value] of map.entries()) {
		obj[key] = value
	}
	return obj
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

export async function assertThrows<T extends Error>(expected: Class<T>, fn: () => Promise<unknown>): Promise<T> {
	try {
		await fn()
	} catch (e) {
		otest.check(e instanceof expected).equals(true)("AssertThrows failed: Expected a " + expected.name + " to be thrown, but got a " + e)
		return e as T
	}

	throw new Error("AssertThrows failed: Expected a " + (expected as any) + " to be thrown, but nothing was")
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

	const spiedMock: any = spy(timeoutMock)

	spiedMock.next = function () {
		scheduledFn?.()
	}

	return spiedMock
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

/** Verify using testdouble, but register as an otest assertion */
export function verify(demonstration: any, config?: td.VerificationConfig) {
	function check(demonstration) {
		try {
			td.verify(demonstration, config)
			return {
				pass: true,
				message: "Successful verification",
			}
		} catch (e) {
			return {
				pass: false,
				message: e.toString(),
			}
		}
	}

	otest(demonstration).satisfies(check)
}

export function throwsErrorWithMessage(errorClass, message): (fn) => { pass: boolean; message: string } {
	return (fn) => {
		try {
			fn()
			return { pass: false, message: "Did not throw!" }
		} catch (e) {
			const pass = e instanceof errorClass && typeof e.message === "string" && e.message.includes(message)
			return { pass, message: `Error of type ${errorClass} w/ message ${message}, instead got ${e}` }
		}
	}
}
