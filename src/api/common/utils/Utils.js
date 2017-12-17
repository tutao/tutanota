// @flow
import type {GroupTypeEnum} from "../TutanotaConstants"
import {GroupType} from "../TutanotaConstants"

export function defer() {
	var resolve, reject;
	var promise = new Promise(function () {
		resolve = arguments[0];
		reject = arguments[1];
	})
	return ({
		resolve,
		reject,
		promise
	}:any)
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

export function neverNull<T>(object: ?T): T {
	return (object:any)
}

export function string(object: any): string {
	return (object:string)
}

export function clone<T>(instance: T): T {
	if (instance instanceof Uint8Array) {
		return instance.slice()
	} else if (instance instanceof Array) {
		return instance.map(i => clone(i))
	} else if (instance instanceof Date) {
		return (new Date(instance.getTime()):any)
	} else if (instance instanceof Object) {
		let copy = {}
		Object.assign(copy, instance)
		for (let key of Object.keys(copy)) {
			copy[key] = clone(copy[key])
		}
		return (copy:any)
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
	if (groupType == GroupType.User) {
		return [user.userGroup]
	} else {
		return user.memberships.filter(m => m.groupType == groupType)
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