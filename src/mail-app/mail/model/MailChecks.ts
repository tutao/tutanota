//@bundleInto:common

import { Mail, MailSet } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { MailModel } from "./MailModel.js"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem.js"
import { MailSetKind, SystemFolderType } from "../../../common/api/common/TutanotaConstants.js"

export function isSubfolderOfType(system: FolderSystem, folder: MailSet, type: SystemFolderType): boolean {
	const systemFolder = system.getSystemFolderByType(type)
	return systemFolder != null && system.checkFolderForAncestor(folder, systemFolder._id)
}

export function isDraft(mail: Mail): boolean {
	return mail.mailDetailsDraft != null
}

export async function isMailInSpamOrTrash(mail: Mail, mailModel: MailModel): Promise<boolean> {
	const folders = await mailModel.getMailboxFoldersForMail(mail)
	const mailFolder = folders?.getFolderByMail(mail)
	if (folders && mailFolder) {
		return isSpamOrTrashFolder(folders, mailFolder)
	} else {
		return false
	}
}

export async function isMailInSpam(mail: Mail, mailModel: MailModel): Promise<boolean> {
	const folders = await mailModel.getMailboxFoldersForMail(mail)
	const mailFolder = folders?.getFolderByMail(mail)
	if (folders && mailFolder) {
		return isSpamFolder(folders, mailFolder)
	} else {
		return false
	}
}

export function isSpamFolder(system: FolderSystem, folder: MailSet): boolean {
	return folder.folderType === MailSetKind.SPAM || isSubfolderOfType(system, folder, MailSetKind.SPAM)
}

/**
 * Returns true if given folder is the {@link MailFolderType.SPAM} or {@link MailFolderType.TRASH} folder, or a descendant of those mailSets.
 */
export function isSpamOrTrashFolder(system: FolderSystem, folder: MailSet): boolean {
	// not using isOfTypeOrSubfolderOf because checking the type first is cheaper
	return (
		folder.folderType === MailSetKind.TRASH ||
		folder.folderType === MailSetKind.SPAM ||
		isSubfolderOfType(system, folder, MailSetKind.TRASH) ||
		isSubfolderOfType(system, folder, MailSetKind.SPAM)
	)
}

export function isOfTypeOrSubfolderOf(system: FolderSystem, folder: MailSet, type: SystemFolderType): boolean {
	return folder.folderType === type || isSubfolderOfType(system, folder, type)
}
