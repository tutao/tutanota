import { assertNotNull, groupBy, partition } from "@tutao/tutanota-utils"
import { MailFolder } from "../../entities/tutanota/TypeRefs.js"
import { MailFolderType } from "../TutanotaConstants.js"
import { elementIdPart, getElementId, isSameId } from "../utils/EntityUtils.js"

interface IndentedFolder {
	level: number
	folder: MailFolder
}

/** Accessor for the folder trees. */
export class FolderSystem {
	readonly systemSubtrees: ReadonlyArray<FolderSubtree>
	readonly customSubtrees: ReadonlyArray<FolderSubtree>

	constructor(folders: readonly MailFolder[]) {
		const folderByParent = groupBy(folders, (folder) => (folder.parentFolder ? elementIdPart(folder.parentFolder) : null))
		const topLevelFolders = folders.filter((f) => f.parentFolder == null)

		const [systemFolders, customFolders] = partition(topLevelFolders, (f) => f.folderType !== MailFolderType.CUSTOM)

		this.systemSubtrees = systemFolders.sort(compareSystem).map((f) => this.makeSubtree(folderByParent, f, compareCustom))
		this.customSubtrees = customFolders.sort(compareCustom).map((f) => this.makeSubtree(folderByParent, f, compareCustom))
	}

	getIndentedList(excludeFolder: MailFolder | null = null): IndentedFolder[] {
		return [...this.getIndentedFolderList(this.systemSubtrees, excludeFolder), ...this.getIndentedFolderList(this.customSubtrees, excludeFolder)]
	}

	/** Search for a specific folder type. Some mailboxes might not have some system folders! */
	getSystemFolderByType(type: Omit<MailFolderType, MailFolderType.CUSTOM>): MailFolder | null {
		return this.systemSubtrees.find((f) => f.folder.folderType === type)?.folder ?? null
	}

	getFolderById(folderId: IdTuple): MailFolder | null {
		const subtree = this.getFolderByIdInSubtrees(this.systemSubtrees, folderId) ?? this.getFolderByIdInSubtrees(this.customSubtrees, folderId)
		return subtree?.folder ?? null
	}

	getFolderByMailListId(mailListId: Id): MailFolder | null {
		const subtree =
			this.getFolderByMailListIdInSubtrees(this.systemSubtrees, mailListId) ?? this.getFolderByMailListIdInSubtrees(this.customSubtrees, mailListId)
		return subtree?.folder ?? null
	}

	/**
	 * Returns the children of a parent (applies only to custom folders)
	 * if no parent is given, the top level custom folders are returned
	 */
	getCustomFoldersOfParent(parent: IdTuple | null): MailFolder[] {
		if (parent) {
			const parentFolder = this.getFolderByIdInSubtrees([...this.customSubtrees, ...this.systemSubtrees], parent)
			return parentFolder ? parentFolder.children.map((child) => child.folder) : []
		} else {
			return this.customSubtrees.map((subtree) => subtree.folder)
		}
	}

	getDescendantFoldersOfParent(parent: IdTuple): IndentedFolder[] {
		const parentFolder = this.getFolderByIdInSubtrees([...this.customSubtrees, ...this.systemSubtrees], parent)
		if (parentFolder) {
			return this.getIndentedFolderList([parentFolder]).slice(1)
		} else {
			return []
		}
	}

	/** returns all parents of the folder, including the folder itself */
	getPathToFolder(folderId: IdTuple): MailFolder[] {
		return this.getPathToFolderInSubtrees(this.systemSubtrees, folderId) ?? this.getPathToFolderInSubtrees(this.customSubtrees, folderId) ?? []
	}

	checkFolderForAncestor(folder: MailFolder, potentialAncestorId: IdTuple): boolean {
		let currentFolderPointer: MailFolder | null = folder
		while (true) {
			if (currentFolderPointer?.parentFolder == null) {
				return false
			} else if (isSameId(currentFolderPointer.parentFolder, potentialAncestorId)) {
				return true
			}
			currentFolderPointer = this.getFolderById(currentFolderPointer.parentFolder)
		}
	}

	private getIndentedFolderList(subtrees: ReadonlyArray<FolderSubtree>, excludeFolder: MailFolder | null = null, currentLevel: number = 0): IndentedFolder[] {
		const plainList: IndentedFolder[] = []
		for (const subtree of subtrees) {
			if (!excludeFolder || !isSameId(subtree.folder._id, excludeFolder._id)) {
				plainList.push({ level: currentLevel, folder: subtree.folder })
				plainList.push(...this.getIndentedFolderList(subtree.children, excludeFolder, currentLevel + 1))
			}
		}
		return plainList
	}

	private getIndentedSystemList(): IndentedFolder[] {
		return this.systemSubtrees.map((subtree) => {
			return { level: 0, folder: subtree.folder }
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

	private makeSubtree(folderByParent: Map<Id | null, readonly MailFolder[]>, parent: MailFolder, comparator: FolderComparator): FolderSubtree {
		const childrenFolders = folderByParent.get(getElementId(parent))
		if (childrenFolders) {
			const childSystems = childrenFolders
				.slice()
				.sort(comparator)
				.map((child) => this.makeSubtree(folderByParent, child, comparator))
			return { folder: parent, children: childSystems }
		} else {
			return { folder: parent, children: [] }
		}
	}
}

type FolderComparator = (folder1: MailFolder, folder2: MailFolder) => number

function compareCustom(folder1: MailFolder, folder2: MailFolder): number {
	return folder1.name.localeCompare(folder2.name)
}

type SystemMailFolderTypes = Exclude<MailFolderType, MailFolderType.CUSTOM>

const folderTypeToOrder: Record<SystemMailFolderTypes, number> = {
	[MailFolderType.INBOX]: 0,
	[MailFolderType.DRAFT]: 1,
	[MailFolderType.SENT]: 2,
	[MailFolderType.TRASH]: 4,
	[MailFolderType.ARCHIVE]: 5,
	[MailFolderType.SPAM]: 6,
}

function compareSystem(folder1: MailFolder, folder2: MailFolder): number {
	const order1 = folderTypeToOrder[folder1.folderType as SystemMailFolderTypes] ?? 7
	const order2 = folderTypeToOrder[folder2.folderType as SystemMailFolderTypes] ?? 7
	return order1 - order2
}

/**
 * an array of FolderSystems represent all folders.
 * the top folders are the toplevel folders in with their respective subfolders.
 */
export interface FolderSubtree {
	readonly folder: MailFolder
	readonly children: readonly FolderSubtree[]
}
