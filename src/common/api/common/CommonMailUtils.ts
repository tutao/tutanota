import type { FolderSystem } from "./mail/FolderSystem.js"
import { Body, Mail, MailFolder } from "../entities/tutanota/TypeRefs.js"
import { MailFolderType } from "./TutanotaConstants.js"

export function isSubfolderOfType(system: FolderSystem, folder: MailFolder, type: MailFolderType): boolean {
	const systemFolder = system.getSystemFolderByType(type)
	return systemFolder != null && system.checkFolderForAncestor(folder, systemFolder._id)
}

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

export function isDraft(mail: Mail): boolean {
	return mail.mailDetailsDraft != null
}

export interface MailAddressAndName {
	name: string
	address: string
}

export function getDisplayedSender(mail: Mail): MailAddressAndName {
	const realSender = mail.sender
	return { address: realSender.address, name: realSender.name }
}

export function getMailBodyText(body: Body): string {
	return body.compressedText ?? body.text ?? ""
}
