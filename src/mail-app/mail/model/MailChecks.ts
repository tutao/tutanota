//@bundleInto:common

import { Mail, MailSet } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { MailModel } from "./MailModel.js"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem.js"
import { isFolderReadOnly, MailSetKind, MailState, SystemFolderType } from "../../../common/api/common/TutanotaConstants.js"

export function isSubfolderOfType(system: FolderSystem, folder: MailSet, type: SystemFolderType): boolean {
	const systemFolder = system.getSystemFolderByType(type)
	return systemFolder != null && system.checkFolderForAncestor(folder, systemFolder._id)
}

/**
 * A mail is considered a draft as long as its mail details haven't yet been stored as a blob.
 *
 * Draft mails that are queued to be sent have a state of SENDING _before_ mail details is stored as a blob, so it's
 * possible for a mail to have `state === SENDING` and `mailDetailsDraft != null`.
 * Mail details is only stored as a blob once the send can no longer be undone.
 */
export function isDraft(mail: Mail): boolean {
	return mail.mailDetailsDraft != null
}

/**
 * Returns true for draft mails that are queued to be sent
 */
export function isDraftSending(mail: Mail): boolean {
	return isDraft(mail) && mail.state === MailState.SENDING
}

export function isMailScheduled(mail: Mail): boolean {
	return mail.sendAt != null
}

/**
 * Draft mails that are scheduled or queued to be sent are not editable
 */
export function isEditableDraft(mail: Mail): boolean {
	return isDraft(mail) && !isDraftSending(mail) && !isMailScheduled(mail)
}

/**
 * Mails that are scheduled or queued to be sent cannot be moved
 */
export function isMailMovable(mail: Mail, mailModel: MailModel): boolean {
	if (isDraftSending(mail)) {
		return false
	}

	const folder = mailModel.getMailFolderForMail(mail)
	return folder != null && !isFolderReadOnly(folder)
}

/**
 * Delete mail service ignores mails in the sending state
 */
export function isMailDeletable(mail: Mail): boolean {
	return mail.state !== MailState.SENDING
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
