// @flow
import type {GroupTypeEnum, OperationTypeEnum} from "../TutanotaConstants"
import {GroupType} from "../TutanotaConstants"
import {TypeRef} from "../EntityFunctions"
import type {EntityUpdateData} from "../../main/EventController"

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
		const copy = Object.create(instance.__proto__ || null)
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
export function debounce<A: any>(timeout: number, toThrottle: (...args: A) => void): (...A) => void {
	let timeoutId
	let toInvoke: (...args: A) => void;
	return (...args: A) => {
		if (timeoutId) {
			clearTimeout(timeoutId)
		}
		toInvoke = toThrottle.bind(null, ...args)
		timeoutId = setTimeout(toInvoke, timeout)
	}
}

/**
 * Returns a debounced function. When invoked for the first time, will just invoke
 * {@param toThrottle}. On subsequent invocations it will either invoke it right away
 * (if {@param timeout} has passed) or will schedule it to be run after {@param timeout}.
 * So the first and the last invocations in a series of invocations always take place
 * but ones in the middle (which happen too often) are discarded.}
 */
export function debounceStart<A: any>(timeout: number, toThrottle: (...args: A) => void): (...A) => void {
	let timeoutId
	let lastInvoked = 0
	return (...args: A) => {
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
	}
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
}


export function getMailBodyText(body: MailBody): string {
	return body.compressedText || body.text || ""
}

export function getMailHeaders(headers: MailHeaders): string {
	return headers.compressedHeaders || headers.headers || ""
}
