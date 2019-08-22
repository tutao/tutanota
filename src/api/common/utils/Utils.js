// @flow
import type {GroupTypeEnum, OperationTypeEnum} from "../TutanotaConstants"
import {GroupType} from "../TutanotaConstants"
import {TypeRef} from "../EntityFunctions"
import type {EntityUpdateData} from "../../main/EventController"
import type {GroupInfo} from "../../entities/sys/GroupInfo"
import type {User} from "../../entities/sys/User"
import type {GroupMembership} from "../../entities/sys/GroupMembership"
import type {CustomerInfo} from "../../entities/sys/CustomerInfo"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import type {MailBody} from "../../entities/tutanota/MailBody"
import type {MailHeaders} from "../../entities/tutanota/MailHeaders"
import type {DomainInfo} from "../../entities/sys/DomainInfo"

export type DeferredObject<T> = {
	resolve: (T) => void,
	reject: (Error) => void,
	promise: Promise<T>,
}

export function defer<T>(): DeferredObject<T> {
	let ret = {}
	ret.promise = new Promise((resolve, reject) => {
		ret.resolve = resolve
		ret.reject = reject
	})
	return ret
}

export function asyncFind<T>(array: T[], finder: (item: T, index: number, arrayLength: number) => Promise<boolean>): Promise<?T> {
	return Promise.reduce(array, (foundItem, item, index, length) => {
		if (foundItem) {
			// the item has been found already, so skip all remaining items in the array
			return foundItem
		} else {
			return finder(item, index, length).then(found => {
				return (found) ? item : null
			})
		}
	}, null)
}

export function asyncFindAndMap<T, R>(array: T[], finder: (item: T, index: number, arrayLength: number) => Promise<?R>): Promise<?R> {
	return Promise.reduce(array, (result, item, index, length) => {
		if (result) {
			// the item has been found already, so skip all remaining items in the array
			return result
		} else {
			return finder(item, index, length).then(currentResult => {
				return (currentResult) ? currentResult : null
			})
		}
	}, null)
}

/**
 * Calls an executor function for slices of nbrOfElementsInGroup items of the given array until the executor function returns false.
 */
export function executeInGroups<T>(array: T[], nbrOfElementsInGroup: number, executor: (items: T[]) => Promise<boolean>): Promise<void> {
	if (array.length > 0) {
		let nextSlice = Math.min(array.length, nbrOfElementsInGroup)
		return executor(array.slice(0, nextSlice)).then(doContinue => {
			if (doContinue) {
				return executeInGroups(array.slice(nextSlice), nbrOfElementsInGroup, executor)
			}
		})
	} else {
		return Promise.resolve()
	}
}

export function neverNull<T>(object: ?T): T {
	return (object: any)
}

export function assertNotNull<T>(object: ?T): T {
	if (object == null) {
		throw new Error("Assertion failed: null")
	}
	return object
}

export function downcast<R>(object: *): R {
	return (object: any)
}

export function clone<T>(instance: T): T {
	if (instance instanceof Uint8Array) {
		return instance.slice()
	} else if (instance instanceof Array) {
		return instance.map(i => clone(i))
	} else if (instance instanceof Date) {
		return (new Date(instance.getTime()): any)
	} else if (instance instanceof TypeRef) {
		return instance
	} else if (instance instanceof Object) {
		// Can only pass null or Object, cannot pass undefined
		const copy = Object.create(Object.getPrototypeOf(instance) || null)
		Object.assign(copy, instance)
		for (let key of Object.keys(copy)) {
			copy[key] = clone(copy[key])
		}
		return (copy: any)
	} else {
		return instance
	}
}

/**
 * Imports a module using System.import and sets up the depencency map (needed for hmr)
 * => Hot reloading is currently not capable of tracking dynamic imports => We add the metadata for the dynamic import manually
 * @see https://github.com/alexisvincent/systemjs-hot-reloader/issues/129
 * @param importer The name of the importing module
 * @param moduleName The module to import
 * @returns resolves to the imported module
 */
export function asyncImport(importer: string, moduleName: string): Promise<*> {
	return System.import(moduleName)
	             .then(module => {
		             if (System.loads) {
			             if (!System.loads[System.resolveSync(importer)].depMap[moduleName]) {
				             System.loads[System.resolveSync(importer)].deps.push(moduleName)
				             System.loads[System.resolveSync(importer)].depMap[moduleName] = System.resolveSync(moduleName)
			             }
		             }
		             return module
	             })
}

export function getEnabledMailAddressesForGroupInfo(groupInfo: GroupInfo): string[] {
	let aliases = groupInfo.mailAddressAliases.filter(alias => alias.enabled).map(alias => alias.mailAddress)
	if (groupInfo.mailAddress) aliases.unshift(groupInfo.mailAddress)
	return aliases
}

/**
 * Provides the memberships of the user with the given type. In case of area groups all groups are returned.
 */
export function getUserGroupMemberships(user: User, groupType: GroupTypeEnum): GroupMembership[] {
	if (groupType === GroupType.User) {
		return [user.userGroup]
	} else {
		return user.memberships.filter(m => m.groupType === groupType)
	}
}

/**
 * Provides the name if available, otherwise the email address if available, otherwise an empty string.
 */
export function getGroupInfoDisplayName(groupInfo: GroupInfo): string {
	if (groupInfo.name) {
		return groupInfo.name
	} else if (groupInfo.mailAddress) {
		return groupInfo.mailAddress
	} else {
		return ""
	}
}

export function compareGroupInfos(a: GroupInfo, b: GroupInfo): number {
	return getGroupInfoDisplayName(a).localeCompare(getGroupInfoDisplayName(b))
}

export function getWhitelabelDomain(customerInfo: CustomerInfo, domainName: ?string): ?DomainInfo {
	return customerInfo.domainInfos.find(info => info.whitelabelConfig != null && (domainName == null || info.domain === domainName))
}

export function getCustomMailDomains(customerInfo: CustomerInfo): Array<DomainInfo> {
	return customerInfo.domainInfos.filter(di => di.whitelabelConfig == null)
}

/**
 * Function which accepts another function. On first invocation
 * of this resulting function result will be remembered and returned
 * on consequent invocations.
 */
export function lazyMemoized<T>(source: () => T): () => T {
	// Using separate variable for tracking because value can be undefined and we want to the function call only once
	let cached = false
	let value
	return () => {
		if (cached) {
			return value
		} else {
			cached = true
			return value = source()
		}
	}
}

export function memoized<T, R>(fn: (T) => R): (T) => R {
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
 * Function which returns what was passed into it
 */
export function identity<T>(t: T): T {
	return t
}

/**
 * Function which does nothing.
 */
export function noOp() {}

export function containsEventOfType(events: $ReadOnlyArray<EntityUpdateData>, type: OperationTypeEnum, elementId: Id): boolean {
	return events.find(event => event.operation === type && event.instanceId === elementId) != null
}

export function getEventOfType(events: $ReadOnlyArray<EntityUpdate>, type: OperationTypeEnum, elementId: Id): ?EntityUpdate {
	return events.find(event => event.operation === type && event.instanceId === elementId)
}

/**
 * Return a function, which executed {@param toThrottle} only after it is not invoked for {@param timeout} ms.
 * Executes function with the last passed arguments
 * @return {Function}
 */
export function debounce<F: (...args: any) => void>(timeout: number, toThrottle: F): F {
	let timeoutId
	let toInvoke: (...args: any) => void;
	return downcast((...args) => {
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
 * but ones in the middle (which happen too often) are discarded.}
 */
export function debounceStart<F: (...args: any) => void>(timeout: number, toThrottle: F): F {
	let timeoutId: ?TimeoutID
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

export function randomIntFromInterval(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export class ProgressMonitor {
	totalWork: number
	workCompleted: number
	updater: (percentageCompleted: number) => mixed

	constructor(totalWork: number, updater: (percentageCompleted: number) => mixed) {
		this.updater = updater
		this.totalWork = totalWork
		this.workCompleted = 0
	}

	workDone(amount: number) {
		this.workCompleted += amount
		const result = Math.round(100 * (this.workCompleted) / this.totalWork)
		this.updater(Math.min(100, result))
	}

	completed() {
		this.workCompleted = this.totalWork
		this.updater(100)
	}
}


export function getMailBodyText(body: MailBody): string {
	return body.compressedText || body.text || ""
}

export function getMailHeaders(headers: MailHeaders): string {
	return headers.compressedHeaders || headers.headers || ""
}


export function errorToString(error: Error): string {
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
export function objectEntries<A: (string | Symbol), B>(object: {[A]: B}): Array<[A, B]> {
	return downcast(Object.entries(object))
}

/**
 * modified deepEquals from ospec is only needed as long as we use custom classes (TypeRef) and Date is not properly handled
 */
export function deepEqual(a: any, b: any): boolean {
	if (a === b) return true
	if (xor(a === null, b === null) || xor(a === undefined, b === undefined)) return false
	if (typeof a === "object" && typeof b === "object") {
		const aIsArgs = isArguments(a), bIsArgs = isArguments(b)
		if (a.length === b.length && (a instanceof Array && b instanceof Array || aIsArgs && bIsArgs)) {
			const aKeys = Object.getOwnPropertyNames(a), bKeys = Object.getOwnPropertyNames(b)
			if (aKeys.length !== bKeys.length) return false
			for (let i = 0; i < aKeys.length; i++) {
				if (!hasOwn.call(b, aKeys[i]) || !deepEqual(a[aKeys[i]], b[aKeys[i]])) return false
			}
			return true
		}
		if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
		if (a instanceof Object && b instanceof Object && !aIsArgs && !bIsArgs) {
			for (let i in a) {
				if ((!(i in b)) || !deepEqual(a[i], b[i])) return false
			}
			for (let i in b) {
				if (!(i in a)) return false
			}
			return true
		}
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

function xor(a, b): boolean {
	const aBool = !!a
	const bBool = !!b
	return (aBool && !bBool) || (bBool && !aBool)
}

function isArguments(a) {
	if ("callee" in a) {
		for (let i in a) if (i === "callee") return false
		return true
	}
}

const hasOwn = ({}).hasOwnProperty

/**
 * returns an array of top-level properties that are in both objA and objB, but differ in value
 * does not handle functions or circular references
 * treats undefined and null as equal
 */
export function getChangedProps(objA: any, objB: any): Array<string> {
	if (objA == null || objB == null || objA === objB) return []
	return Object.keys(objA)
	             .filter(k => Object.keys(objB).includes(k))
	             .filter(k => ![null, undefined].includes(objA[k]) || ![null, undefined].includes(objB[k]))
	             .filter(k => !deepEqual(objA[k], objB[k]))
}

/**
 * Disallow set, delete and clear on Map.
 * Important: It is *not* a deep freeze.
 * @param myMap
 * @return {unknown}
 */
export function freezeMap<K, V>(myMap: Map<K, V>): Map<K, V> {
	function mapSet(key) {
		throw new Error('Can\'t add property ' + key + ', map is not extensible')
	}

	function mapDelete(key) {
		throw new Error('Can\'t delete property ' + key + ', map is frozen')
	}

	function mapClear() {
		throw new Error('Can\'t clear map, map is frozen')
	}

	const anyMap = downcast(myMap)
	anyMap.set = mapSet
	anyMap.delete = mapDelete
	anyMap.clear = mapClear

	Object.freeze(anyMap)

	return anyMap
}

export function addressDomain(senderAddress: string): string {
	return senderAddress.slice(senderAddress.lastIndexOf("@") + 1)
}