//@bundleInto:common

import { Mail, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { MailModel } from "./MailModel.js"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem.js"
import { MailSetKind, MailState, SystemFolderType } from "../../../common/api/common/TutanotaConstants.js"

export function isSubfolderOfType(system: FolderSystem, folder: MailFolder, type: SystemFolderType): boolean {
	const systemFolder = system.getSystemFolderByType(type)
	return systemFolder != null && system.checkFolderForAncestor(folder, systemFolder._id)
}

export function isDraft(mail: Mail): boolean {
	return mail.state === MailState.DRAFT
}

export function isMailScheduled(mail: Mail): boolean {
	return mail.sendAt != null
}

/**
 * Draft mails that are scheduled to be sent are not editable
 */
export function isEditableDraft(mail: Mail): boolean {
	return isDraft(mail) && !isMailScheduled(mail)
}

/**
 * Scheduled mails cannot be moved
 */
export function isMailMovable(mail: Mail): boolean {
	return !isMailScheduled(mail)
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

export function isSpamFolder(system: FolderSystem, folder: MailFolder): boolean {
	return folder.folderType === MailSetKind.SPAM || isSubfolderOfType(system, folder, MailSetKind.SPAM)
}

/**
 * Returns true if given folder is the {@link MailFolderType.SPAM} or {@link MailFolderType.TRASH} folder, or a descendant of those folders.
 */
export function isSpamOrTrashFolder(system: FolderSystem, folder: MailFolder): boolean {
	// not using isOfTypeOrSubfolderOf because checking the type first is cheaper
	return (
		folder.folderType === MailSetKind.TRASH ||
		folder.folderType === MailSetKind.SPAM ||
		isSubfolderOfType(system, folder, MailSetKind.TRASH) ||
		isSubfolderOfType(system, folder, MailSetKind.SPAM)
	)
}

export function isOfTypeOrSubfolderOf(system: FolderSystem, folder: MailFolder, type: SystemFolderType): boolean {
	return folder.folderType === type || isSubfolderOfType(system, folder, type)
}
