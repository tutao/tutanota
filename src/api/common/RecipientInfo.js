// @flow
import {TUTANOTA_MAIL_ADDRESS_DOMAINS} from "./TutanotaConstants"
import {endsWith} from "./utils/StringUtils"


export const recipientInfoType = {
	unknown: 'unknown',
	internal: 'internal',
	external: 'external'
}

export function isExternal(recipientInfo: RecipientInfo): boolean {
	return recipientInfo.type === recipientInfoType.external
}

export function isExternalSecureRecipient(recipientInfo: RecipientInfo): boolean {
	return isExternal(recipientInfo) &&
		recipientInfo.contact != null && recipientInfo.contact.presharedPassword != null
		&& recipientInfo.contact.presharedPassword.trim() != ""
}

export function isExternalRecipientWithoutPassphrase(recipientInfo: RecipientInfo, password: string): boolean {
	return isExternal(recipientInfo) && (password.trim() === "")
}

export function isTutanotaMailAddress(mailAddress: string): boolean {
	var tutanotaDomains = TUTANOTA_MAIL_ADDRESS_DOMAINS
	for (var i = 0; i < tutanotaDomains.length; i++) {
		if (endsWith(mailAddress, "@" + tutanotaDomains[i])) {
			return true
		}
	}
	return false
}