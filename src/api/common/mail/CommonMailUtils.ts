import { MailFolderType } from "../TutanotaConstants.js"
import { FolderSystem } from "./FolderSystem.js"
import { MailFolder } from "../../entities/tutanota/TypeRefs.js"
import { assertNotNull } from "@tutao/tutanota-utils"

/**
 * Returns true if given folder is the {@link MailFolderType.SPAM} or {@link MailFolderType.TRASH} folder, or a descendant of those folders.
 */
export function isSpamOrTrashFolder(system: FolderSystem, folder: MailFolder): boolean {
	// not using isOfTypeOrSubfolderOf because checking the type first is cheaper
	return (
		folder.folderType === MailFolderType.TRASH ||
		folder.folderType === MailFolderType.SPAM ||
		isSubfolderOfType(system, folder, MailFolderType.TRASH) ||
		isSubfolderOfType(system, folder, MailFolderType.SPAM)
	)
}

export function isOfTypeOrSubfolderOf(system: FolderSystem, folder: MailFolder, type: MailFolderType): boolean {
	return folder.folderType === type || isSubfolderOfType(system, folder, type)
}

export function isSubfolderOfType(system: FolderSystem, folder: MailFolder, type: MailFolderType): boolean {
	const systemFolder = system.getSystemFolderByType(type)
	return systemFolder != null && system.checkFolderForAncestor(folder, systemFolder._id)
}

/**
 * Gets a system folder of the specified type and unwraps it.
 * Some system folders don't exist in some cases, e.g. spam or archive for external mailboxes!
 *
 * Use with caution.
 */
export function assertSystemFolderOfType(system: FolderSystem, type: Omit<MailFolderType, MailFolderType.CUSTOM>): MailFolder {
	return assertNotNull(system.getSystemFolderByType(type), "System folder of type does not exist!")
}
