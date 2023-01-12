import { MailFolderType } from "../TutanotaConstants.js"
import { FolderSystem } from "./FolderSystem.js"
import { MailFolder } from "../../entities/tutanota/TypeRefs.js"

/**
 * Returns true if given folder is the {@link MailFolderType.SPAM} or {@link MailFolderType.TRASH} folder, or a descendant of those folders.
 */
export function isSpamOrTrashFolder(system: FolderSystem, folder: MailFolder): boolean {
	return (
		folder.folderType === MailFolderType.TRASH ||
		folder.folderType === MailFolderType.SPAM ||
		system.checkFolderForAncestor(folder, system.getSystemFolderByType(MailFolderType.TRASH)._id) ||
		system.checkFolderForAncestor(folder, system.getSystemFolderByType(MailFolderType.SPAM)._id)
	)
}
