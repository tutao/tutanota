import { EncryptionAuthStatus, MailFolderType, MailState, SYSTEM_GROUP_MAIL_ADDRESS, TUTANOTA_MAIL_ADDRESS_DOMAINS } from "../TutanotaConstants.js"
import { FolderSystem } from "./FolderSystem.js"
import { Mail, Body, MailFolder } from "../../entities/tutanota/TypeRefs.js"
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

function hasValidEncryptionAuthForTeamOrSystemMail({ encryptionAuthStatus }: Mail): boolean {
	switch (encryptionAuthStatus) {
		// emails before tuta-crypt had no encryptionAuthStatus
		case null:
		case undefined:
		case EncryptionAuthStatus.RSA_NO_AUTHENTICATION:
		case EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED:
		case EncryptionAuthStatus.TUTACRYPT_SENDER: // should only be set for sent NOT received mails
			return true
		case EncryptionAuthStatus.AES_NO_AUTHENTICATION:
		case EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED:
		// we have to be able to handle future cases, to be safe we say that they are not valid encryptionAuth
		default:
			return false
	}
}

/**
 * Is this a tutao team member email or a system notification
 */
export function isTutanotaTeamMail(mail: Mail): boolean {
	const { confidential, sender, state } = mail
	return (
		confidential &&
		state === MailState.RECEIVED &&
		hasValidEncryptionAuthForTeamOrSystemMail(mail) &&
		(sender.address === SYSTEM_GROUP_MAIL_ADDRESS || isTutanotaTeamAddress(sender.address))
	)
}

/**
 * Is this a system notification?
 */
export function isSystemNotification(mail: Mail): boolean {
	const { confidential, sender, state } = mail
	return (
		state === MailState.RECEIVED &&
		confidential &&
		hasValidEncryptionAuthForTeamOrSystemMail(mail) &&
		(sender.address === SYSTEM_GROUP_MAIL_ADDRESS ||
			// New emails will have sender set to system and will only have replyTo set to no-reply
			// but we should keep displaying old emails correctly.
			isNoReplyTeamAddress(sender.address))
	)
}

export function isDraft(mail: Mail): boolean {
	return mail.mailDetailsDraft != null
}

export function getMailBodyText(body: Body): string {
	return body.compressedText ?? body.text ?? ""
}

export function isNoReplyTeamAddress(address: string): boolean {
	return address === "no-reply@tutao.de" || address === "no-reply@tutanota.de"
}

export function getDisplayedSender(mail: Mail): MailAddressAndName {
	const realSender = mail.sender
	return { address: realSender.address, name: realSender.name }
}

export function isTutanotaMailAddress(mailAddress: string): boolean {
	return TUTANOTA_MAIL_ADDRESS_DOMAINS.some((tutaDomain) => mailAddress.endsWith("@" + tutaDomain))
}
