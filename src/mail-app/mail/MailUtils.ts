import { endsWith } from "@tutao/tutanota-utils"
import { EncryptionAuthStatus, MailFolderType, MailState, SYSTEM_GROUP_MAIL_ADDRESS } from "../../common/api/common/TutanotaConstants.js"
import { FolderSystem } from "../../common/api/common/mail/FolderSystem.js"
import { Mail, MailFolder } from "../../common/api/entities/tutanota/TypeRefs.js"
import { isSubfolderOfType } from "../../common/mailFunctionality/CommonMailUtils.js"

export function isOfTypeOrSubfolderOf(system: FolderSystem, folder: MailFolder, type: MailFolderType): boolean {
	return folder.folderType === type || isSubfolderOfType(system, folder, type)
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

export function isNoReplyTeamAddress(address: string): boolean {
	return address === "no-reply@tutao.de" || address === "no-reply@tutanota.de"
}
