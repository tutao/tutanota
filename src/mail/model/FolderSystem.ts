import {MailFolder} from "../../api/entities/tutanota/TypeRefs.js"
import {assertNotNull, groupBy} from "@tutao/tutanota-utils"
import {elementIdPart, getElementId, isSameId} from "../../api/common/utils/EntityUtils.js"
import {MailFolderType} from "../../api/common/TutanotaConstants.js"

interface IndentedFolder {
	level: number,
	folder: MailFolder
}

/** Accessor for the folder trees. */
export class FolderSystem {
	readonly systemSubtrees: ReadonlyArray<FolderSubtree>
	readonly customSubtrees: ReadonlyArray<FolderSubtree>

	constructor(folders: readonly MailFolder[]) {
		const mailByParent = groupBy(folders, folder => folder.parentFolder ? elementIdPart(folder.parentFolder) : null)
		const topLevelFolders = folders.filter(f => f.parentFolder == null)

		function makeSubtree(parent: MailFolder): FolderSubtree {
			const childrenFolders = mailByParent.get(getElementId(parent))
			if (childrenFolders) {
				const childSystems = childrenFolders.map(makeSubtree)
				return {folder: parent, children: childSystems}
			} else {
				return {folder: parent, children: []}
			}
		}

		this.systemSubtrees = this.getSortedSystemSystem(topLevelFolders.map(makeSubtree))
		this.customSubtrees = this.getSortedCustomSystem(topLevelFolders.map(makeSubtree))
	}

	getIndentedList(): IndentedFolder[] {
		return [...this.getIndentedSystemList(), ...this.getIndentedCustomList(this.customSubtrees)]
	}

	getSystemFolderByType(type: Omit<MailFolderType, MailFolderType.CUSTOM>): MailFolder {
		return assertNotNull(this.systemSubtrees.find((f) => f.folder.folderType === type)).folder
	}

	getFolderById(folderId: IdTuple): MailFolder | null {
		const subtree = this.getFolderByIdInSubtrees(this.systemSubtrees, folderId) ?? this.getFolderByIdInSubtrees(this.customSubtrees, folderId)
		return subtree?.folder ?? null
	}

	getFolderByMailListId(mailListId: Id): MailFolder | null {
		const subtree = this.getFolderByMailListIdInSubtrees(this.systemSubtrees, mailListId)
			?? this.getFolderByMailListIdInSubtrees(this.customSubtrees, mailListId)
		return subtree?.folder ?? null
	}

	/**
	 * Returns the children of a parent (applies only to custom folders)
	 * if no parent is given, the top level custom folders are returned
	 */
	getCustomFoldersWithParent(parent: IdTuple | null): MailFolder[] {
		if (parent) {
			const parentFolder = this.getFolderByIdInSubtrees(this.customSubtrees, parent)
			return parentFolder ? parentFolder.children.map(child => child.folder) : []
		} else {
			return this.customSubtrees.map(subtree => subtree.folder)
		}
	}

	/** returns all parents of the folder, including the folder itself */
	getPathToFolder(folderId: IdTuple): MailFolder[] {
		return this.getPathToFolderInSubtrees(this.systemSubtrees, folderId) ?? this.getPathToFolderInSubtrees(this.customSubtrees, folderId) ?? []
	}

	private getIndentedCustomList(subtrees: ReadonlyArray<FolderSubtree>, currentLevel: number = 0): IndentedFolder[] {
		const plainList: IndentedFolder[] = []
		for (const subtree of subtrees) {
			plainList.push({level: currentLevel, folder: subtree.folder})
			plainList.push(...this.getIndentedCustomList(subtree.children, currentLevel + 1))
		}
		return plainList
	}

	private getIndentedSystemList(): IndentedFolder[] {
		return this.systemSubtrees.map((subtree) => {
			return {level: 0, folder: subtree.folder}
		})
	}

	private getSortedCustomSystem(systems: FolderSubtree[]): FolderSubtree[] {
		return systems
			.filter(s => s.folder.folderType === MailFolderType.CUSTOM)
			.sort((system1, system2) => {
				return system1.folder.name.localeCompare(system2.folder.name)
			})
	}

	private getSortedSystemSystem(systems: FolderSubtree[]): FolderSubtree[] {
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


	private getFolderByIdInSubtrees(systems: ReadonlyArray<FolderSubtree>, folderId: IdTuple): FolderSubtree | null {
		return this.getFolderBy(systems, (system) => isSameId(system.folder._id, folderId))
	}

	private getFolderByMailListIdInSubtrees(systems: ReadonlyArray<FolderSubtree>, mailListId: Id): FolderSubtree | null {
		return this.getFolderBy(systems, (subtree) => isSameId(subtree.folder.mails, mailListId))
	}

	private getFolderBy(systems: ReadonlyArray<FolderSubtree>, predicate: (subtree: FolderSubtree) => boolean): FolderSubtree | null {
		const topLevel = systems.find(predicate)
		if (topLevel) {
			return topLevel
		} else {
			for (const topLevelSystem of systems) {
				const found = this.getFolderBy(topLevelSystem.children, predicate)
				if (found) {
					return found
				}
			}
		}
		return null
	}

	private getPathToFolderInSubtrees(systems: readonly FolderSubtree[], folderId: IdTuple): MailFolder[] | null {
		for (const system of systems) {
			if (isSameId(system.folder._id, folderId)) {
				return [system.folder]
			}
			const subpath = this.getPathToFolderInSubtrees(system.children, folderId)
			if (subpath) {
				return [system.folder].concat(...subpath)
			}
		}
		return null
	}
}

/**
 * an array of FolderSystems represent all folders.
 * the top folders are the toplevel folders in with their respective subfolders.
 */
export interface FolderSubtree {
	readonly folder: MailFolder,
	readonly children: readonly FolderSubtree[],
}