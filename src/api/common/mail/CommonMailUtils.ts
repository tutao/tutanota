import { MailAuthenticationStatus, MailFolderType, MailState, TUTANOTA_MAIL_ADDRESS_DOMAINS } from "../TutanotaConstants.js"
import { FolderSystem } from "./FolderSystem.js"
import { Mail, MailFolder } from "../../entities/tutanota/TypeRefs.js"
import { assertNotNull, endsWith } from "@tutao/tutanota-utils"

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

export interface MailAddressAndName {
	name: string
	address: string
}

/**
 * NOTE: DOES NOT VERIFY IF THE MESSAGE IS AUTHENTIC - DO NOT USE THIS OUTSIDE OF THIS FILE OR FOR TESTING
 * @VisibleForTesting
 */
export function isTutanotaTeamAddress(address: string): boolean {
	return endsWith(address, "@tutao.de") || address === "no-reply@tutanota.de"
}

export function isTutanotaTeamMail(mail: Mail): boolean {
	return mail.confidential && mail.state === MailState.RECEIVED && isTutanotaTeamAddress(getDisplayedSender(mail).address)
}

export function isExcludedMailAddress(mailAddress: string): boolean {
	return mailAddress === "no-reply@tutao.de" || mailAddress === "no-reply@tutanota.de"
}

/**
 * Some internal messages come from system@tutanota.de which were sent on behalf of another internal e-mail address (e.g. automated messages from sales.tutao.de)
 */
export function getDisplayedSender(mail: Mail): MailAddressAndName {
	const realSender = mail.sender
	const replyTos = mail.replyTos
	if (
		mail.state === MailState.RECEIVED &&
		mail.authStatus === MailAuthenticationStatus.AUTHENTICATED &&
		realSender.address === "system@tutanota.de" &&
		replyTos.length === 1 &&
		isTutanotaTeamAddress(replyTos[0].address)
	) {
		return { address: replyTos[0].address, name: replyTos[0].name }
	}
	return { address: realSender.address, name: realSender.name }
}

export function isTutanotaMailAddress(mailAddress: string): boolean {
	return TUTANOTA_MAIL_ADDRESS_DOMAINS.some((tutaDomain) => mailAddress.endsWith("@" + tutaDomain))
}
