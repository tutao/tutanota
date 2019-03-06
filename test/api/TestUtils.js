// @flow
import o from "ospec/ospec.js"
import type {BrowserData} from "../../src/misc/ClientConstants"
import {BrowserType} from "../../src/misc/ClientConstants"
import type {Db} from "../../src/api/worker/search/SearchTypes"
import {aes256RandomKey} from "../../src/api/worker/crypto/Aes"
import {IndexerCore} from "../../src/api/worker/search/IndexerCore"
import {EventQueue} from "../../src/api/worker/search/EventQueue"
import {DbTransaction} from "../../src/api/worker/search/DbFacade"
import {fixedIv} from "../../src/api/worker/crypto/CryptoFacade"

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


export const browserDataStub: BrowserData = {browserType: BrowserType.OTHER, browserVersion: 0}

export function makeCore(args?: {
	db?: Db,
	queue?: EventQueue,
	browserData?: BrowserData,
	transaction?: DbTransaction
}, mocker?: (any) => void): IndexerCore {
	const safeArgs = args || {}
	const {transaction = (null: any)} = safeArgs
	const defaultDb = {
		key: aes256RandomKey(),
		iv: fixedIv,
		dbFacade: ({createTransaction: () => Promise.resolve(transaction)}: any),
		initialized: Promise.resolve()
	}
	const {db = defaultDb, queue = (null: any), browserData = browserDataStub} = safeArgs
	const core = new IndexerCore(db, queue, browserData)
	mocker && mock(core, mocker)
	return core
}