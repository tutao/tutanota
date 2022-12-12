import {MailFolder} from "../../api/entities/tutanota/TypeRefs.js"
import {groupBy} from "@tutao/tutanota-utils"
import {elementIdPart, getElementId} from "../../api/common/utils/EntityUtils.js"
import {MailFolderType} from "../../api/common/TutanotaConstants.js"

/**
 * an array of FolderSystems represent all folders.
 * the top folders are the toplevel folders in with their respective subfolders.
 */
export class FolderSystem {
	constructor(
		readonly folder: MailFolder,
		readonly children: Array<FolderSystem>) {
	}

	move(folder: MailFolder, path: string, destination: string): boolean {
		return true
	}

	remove(deleteFolder: MailFolder, path: string): MailFolder | null {
		return null
	}

	insert(newFolder: MailFolder) {

	}

	getOrderedList(): MailFolder[] {
		let plainList = []
		plainList.push(this.folder)
		if (this.children.length > 0) {
			this.sort(this.children).forEach(child => {
				plainList.push(child.getOrderedList())
			})
		}
		return plainList
	}

	private sort(list: Array<FolderSystem>): FolderSystem[] {
		return list
			.sort((system1, system2) => {
				return system1.folder.name.localeCompare(system2.folder.name)
			})
	}
}

export function indentedList(systems: FolderSystem[], currentLevel: number = 0): {level: number, folder: MailFolder}[] {
	return getIndentedSystemList(systems).concat(getIndentedCustomList(systems))
}

export function getIndentedCustomList(systems: FolderSystem[], currentLevel: number = 0): {level: number, folder: MailFolder}[] {
	let plainList: {level: number, folder: MailFolder}[] = []
	const sortedSystems = getSortedCustomSystem(systems)
	for (const system of sortedSystems) {
		plainList.push({level: currentLevel, folder: system.folder})
		plainList.push(...getIndentedCustomList(system.children, currentLevel + 1))
	}
	return plainList
}

export function getIndentedSystemList(systems: FolderSystem[], currentLevel: number = 0): {level: number, folder: MailFolder}[] {
	let plainList: {level: number, folder: MailFolder}[] = []
	const sortedSystems = getSortedSystemSystem(systems)
	for (const system of sortedSystems) {
		plainList.push({level: currentLevel, folder: system.folder})
		plainList.push(...getIndentedSystemList(system.children, currentLevel + 1))
	}
	return plainList
}

export type indentedFolderList = {level: number, folder: MailFolder}[]

export function getWholeList(completeSystem: FolderSystem[]): MailFolder[] {
	let plainList = []
	for (const system of completeSystem) {
		plainList.push(system.folder)
		plainList.push(...getWholeList(system.children))
	}
	return plainList
}

export function getWholeSortedList(completeSystem: FolderSystem[]): MailFolder[] {
	return getSystemSortedList(completeSystem).concat(getCustomSortedList(completeSystem))
}

export function getCustomSortedList(completeSystem: FolderSystem[]): MailFolder[] {
	let plainList = []
	const sortedCustomSystems = getSortedCustomSystem(completeSystem)
	for (const system of sortedCustomSystems) {
		plainList.push(system.folder)
		plainList.push(...getCustomSortedList(system.children))
	}
	return plainList
}

export function getSystemSortedList(completeSystem: FolderSystem[]): MailFolder[] {
	let plainList = []
	const sortedCustomSystems = getSortedSystemSystem(completeSystem)
	for (const system of sortedCustomSystems) {
		plainList.push(system.folder)
		plainList.push(...getCustomSortedList(system.children)) // system folders only hava custom subfolders
	}
	return plainList
}

function getSortedCustomSystem(systems: FolderSystem[]): FolderSystem[] {
	return systems
		.filter(s => s.folder.folderType === MailFolderType.CUSTOM)
		.sort((system1, system2) => {
			return system1.folder.name.localeCompare(system2.folder.name)
		})
}

function getSortedSystemSystem(systems: FolderSystem[]): FolderSystem[] {
	return systems
		.filter(s => s.folder.folderType !== MailFolderType.CUSTOM)
		.sort((system1, system2) => {
			// insert the draft folder after inbox (use type number 1.5 which is after inbox)
			if (system1.folder.folderType === MailFolderType.DRAFT) {
				return 1.5 - Number(system2.folder.folderType)
			} else if (system2.folder.folderType === MailFolderType.DRAFT) {
				return Number(system1.folder.folderType) - 1.5
			}

			return Number(system1.folder.folderType) - Number(system2.folder.folderType)
		})
}

export function populateFolderSystem(folders: MailFolder[]): FolderSystem[] { //depends on how the parent on the server is set
	const mailByParent = groupBy(folders, folder => folder.parentFolder ? elementIdPart(folder.parentFolder) : null)
	const topLevelFolders = folders.filter(f => f.parentFolder == null)

	function makeSubtree(parent: MailFolder): FolderSystem {
		const childrenFolders = mailByParent.get(getElementId(parent))
		if (childrenFolders) {
			const childSystems = childrenFolders.map(makeSubtree)
			return new FolderSystem(parent, childSystems)
		} else {
			return new FolderSystem(parent, [])
		}
	}

	return topLevelFolders.map(makeSubtree)
}