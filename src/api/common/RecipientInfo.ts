import {TUTANOTA_MAIL_ADDRESS_DOMAINS} from "./TutanotaConstants"
import type {Contact} from "../entities/tutanota/TypeRefs.js"

export const enum RecipientInfoType {
	UNKNOWN = "unknown",
	INTERNAL = "internal",
	EXTERNAL = "external",
}

export type RecipientInfo = {
	type: RecipientInfoType
	mailAddress: string
	// empty string if no name is available
	name: string
	// The resolved contact or a new contact instance with the given email address and name. A new contact is used to store a shared password if applicable. Null if no contact shall be resolved.
	contact: Contact | null
	// Null if resolving contact is finished
	resolveContactPromise: Promise<Contact | null> | null
}

export function isExternal(recipientInfo: RecipientInfo): boolean {
	return recipientInfo.type === RecipientInfoType.EXTERNAL
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

// We need this type because we cannot pass RecipientInfo across the worker, since they (may) contain Promises
export type RecipientDetails = {
	name: string
	mailAddress: string
	isExternal: boolean
	password: string | null
}

export function makeRecipientDetails(name: string, mailAddress: string, type: RecipientInfoType, contact: Contact | null): RecipientDetails {
	return {
		name,
		mailAddress,
		isExternal: type === RecipientInfoType.EXTERNAL,
		password: contact?.presharedPassword ?? contact?.autoTransmitPassword ?? null,
	}
}