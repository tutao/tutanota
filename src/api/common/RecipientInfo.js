// @flow
import {TUTANOTA_MAIL_ADDRESS_DOMAINS} from "./TutanotaConstants"
import type {Contact} from "../entities/tutanota/Contact"

export const RecipientInfoType = Object.freeze({
	UNKNOWN: 'unknown',
	INTERNAL: 'internal',
	EXTERNAL: 'external',
})
export type RecipientInfoTypeEnum = $Values<typeof RecipientInfoType>

export type RecipientInfo = {|
	type: RecipientInfoTypeEnum,
	mailAddress: string,
	name: string, // empty string if no name is available
	contact: ?Contact, // The resolved contact or a new contact instance with the given email address and name. A new contact is used to store a shared password if applicable. Null if no contact shall be resolved.
	resolveContactPromise: ?Promise<?Contact> // Null if resolving contact is finished
|}

export function isExternal(recipientInfo: RecipientInfo): boolean {
	return recipientInfo.type === RecipientInfoType.EXTERNAL
}

export function isExternalSecureRecipient(recipientInfo: RecipientInfo): boolean {
	return isExternal(recipientInfo) &&
		recipientInfo.contact != null && recipientInfo.contact.presharedPassword != null
		&& recipientInfo.contact.presharedPassword.trim() !== ""
}

export function isTutanotaMailAddress(mailAddress: string): boolean {
	var tutanotaDomains = TUTANOTA_MAIL_ADDRESS_DOMAINS
	for (var i = 0; i < tutanotaDomains.length; i++) {
		if (mailAddress.endsWith("@" + tutanotaDomains[i])) {
			return true
		}
	}
	return false
}