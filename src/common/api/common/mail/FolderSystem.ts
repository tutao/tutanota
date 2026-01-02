import { groupBy } from "@tutao/tutanota-utils"
import { Mail, MailSet } from "../../entities/tutanota/TypeRefs.js"
import { isTopLevelMailSet, isVisibleSystemMailSet, MailSetKind, SystemFolderType } from "../TutanotaConstants.js"
import { elementIdPart, getElementId, isSameId } from "../utils/EntityUtils.js"

export interface IndentedFolder {
	level: number
	folder: MailSet
}

/** Accessor for the folder trees. */
export class FolderSystem {
	readonly systemSubtrees: ReadonlyArray<FolderSubtree>
	readonly customSubtrees: ReadonlyArray<FolderSubtree>
	readonly importedMailSet: Readonly<MailSet | null>

	constructor(mailSets: readonly MailSet[]) {
		const mailsetByParent = groupBy(mailSets, (mailSet) => (mailSet.parentFolder ? elementIdPart(mailSet.parentFolder) : null))
		const systemMailSets: MailSet[] = []
		const topLevelCustomFolders: MailSet[] = []

		for (const mailSet of mailSets) {
			if (isVisibleSystemMailSet(mailSet)) {
				systemMailSets.push(mailSet)
			} else if (mailSet.folderType === MailSetKind.CUSTOM && isTopLevelMailSet(mailSet)) {
				topLevelCustomFolders.push(mailSet)
			}
		}

		this.importedMailSet = mailSets.find((f) => f.folderType === MailSetKind.IMPORTED) || null
		this.systemSubtrees = systemMailSets.sort(compareSystem).map((f) => this.makeSubtree(mailsetByParent, f, compareCustom))
		this.customSubtrees = topLevelCustomFolders.sort(compareCustom).map((f) => this.makeSubtree(mailsetByParent, f, compareCustom))
	}

	getIndentedList(excludeFolder: MailSet | null = null): IndentedFolder[] {
		return [...this.getIndentedFolderList(this.systemSubtrees, excludeFolder), ...this.getIndentedFolderList(this.customSubtrees, excludeFolder)]
	}

	/** Search for a specific folder type. Some mailboxes might not have some system mailSets! */
	getSystemFolderByType(type: SystemFolderType): MailSet | null {
		return this.systemSubtrees.find((f) => f.folder.folderType === type)?.folder ?? null
	}

	getFolderById(folderId: Id): MailSet | null {
		const subtree = this.getFolderByIdInSubtrees(this.systemSubtrees, folderId) ?? this.getFolderByIdInSubtrees(this.customSubtrees, folderId)
		return subtree?.folder ?? null
	}

	getFolderByMail(mail: Mail): MailSet | null {
		const sets = mail.sets
		for (const setId of sets) {
			const folder = this.getFolderById(elementIdPart(setId))
			if (folder != null) {
				return folder
			}
		}
		return null
	}

	/**
	 * Returns the children of a parent (applies only to custom mailSets)
	 * if no parent is given, the top level custom mailSets are returned
	 */
	getCustomFoldersOfParent(parent: IdTuple | null): MailSet[] {
		if (parent) {
			const parentFolder = this.getFolderByIdInSubtrees([...this.customSubtrees, ...this.systemSubtrees], elementIdPart(parent))
			return parentFolder ? parentFolder.children.map((child) => child.folder) : []
		} else {
			return this.customSubtrees.map((subtree) => subtree.folder)
		}
	}

	getDescendantFoldersOfParent(parent: IdTuple): IndentedFolder[] {
		const parentFolder = this.getFolderByIdInSubtrees([...this.customSubtrees, ...this.systemSubtrees], elementIdPart(parent))
		if (parentFolder) {
			return this.getIndentedFolderList([parentFolder]).slice(1)
		} else {
			return []
		}
	}

	/** returns all parents of the folder, including the folder itself */
	getPathToFolder(folderId: IdTuple): MailSet[] {
		return this.getPathToFolderInSubtrees(this.systemSubtrees, folderId) ?? this.getPathToFolderInSubtrees(this.customSubtrees, folderId) ?? []
	}

	checkFolderForAncestor(folder: MailSet, potentialAncestorId: IdTuple): boolean {
		let currentFolderPointer: MailSet | null = folder
		while (true) {
			if (currentFolderPointer?.parentFolder == null) {
				return false
			} else if (isSameId(currentFolderPointer.parentFolder, potentialAncestorId)) {
				return true
			}
			currentFolderPointer = this.getFolderById(elementIdPart(currentFolderPointer.parentFolder))
		}
	}

	private getIndentedFolderList(subtrees: ReadonlyArray<FolderSubtree>, excludeFolder: MailSet | null = null, currentLevel: number = 0): IndentedFolder[] {
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

	private getFolderByIdInSubtrees(systems: ReadonlyArray<FolderSubtree>, folderId: Id): FolderSubtree | null {
		return this.getFolderBy(systems, (system) => isSameId(getElementId(system.folder), folderId))
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

	private getPathToFolderInSubtrees(systems: readonly FolderSubtree[], folderId: IdTuple): MailSet[] | null {
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

	private makeSubtree(folderByParent: Map<Id | null, readonly MailSet[]>, parent: MailSet, comparator: FolderComparator): FolderSubtree {
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

type FolderComparator = (folder1: MailSet, folder2: MailSet) => number

function compareCustom(folder1: MailSet, folder2: MailSet): number {
	return folder1.name.localeCompare(folder2.name)
}

type SystemMailFolderTypes =
	| MailSetKind.INBOX
	| MailSetKind.SENT
	| MailSetKind.TRASH
	| MailSetKind.ARCHIVE
	| MailSetKind.SPAM
	| MailSetKind.DRAFT
	| MailSetKind.SEND_LATER
type VisibleSystemMailSetTypes = SystemMailFolderTypes

const folderTypeToOrder: Record<VisibleSystemMailSetTypes, number> = {
	[MailSetKind.INBOX]: 0,
	[MailSetKind.DRAFT]: 1,
	[MailSetKind.SEND_LATER]: 2,
	[MailSetKind.SENT]: 3,
	[MailSetKind.TRASH]: 4,
	[MailSetKind.ARCHIVE]: 5,
	[MailSetKind.SPAM]: 6,
}

function compareSystem(folder1: MailSet, folder2: MailSet): number {
	const order1 = folderTypeToOrder[folder1.folderType as VisibleSystemMailSetTypes] ?? 7
	const order2 = folderTypeToOrder[folder2.folderType as VisibleSystemMailSetTypes] ?? 7
	return order1 - order2
}

/**
 * an array of FolderSystems represent all mailSets.
 * the top mailSets are the toplevel mailSets in with their respective subfolders.
 */
export interface FolderSubtree {
	readonly folder: MailSet
	readonly children: readonly FolderSubtree[]
}
