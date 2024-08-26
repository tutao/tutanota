import {
	ContactAddressType,
	ContactCustomDateType,
	ContactMessengerHandleType,
	ContactPhoneNumberType,
	ContactRelationshipType,
	ContactSocialType,
	ContactWebsiteType,
} from "../../../common/api/common/TutanotaConstants"
import type { TranslationKey } from "../../../common/misc/LanguageViewModel"
import { lang } from "../../../common/misc/LanguageViewModel"
import type { Contact } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { sortCompareByReverseId } from "../../../common/api/common/utils/EntityUtils"
import { locator } from "../../../common/api/main/CommonLocator"
import { PermissionType } from "../../../common/native/common/generatedipc/PermissionType"
import { NativeContactsSyncManager } from "../model/NativeContactsSyncManager"
import { Dialog } from "../../../common/gui/base/Dialog"
import { isIOSApp, isTest } from "../../../common/api/common/Env"
import { assert } from "@tutao/tutanota-utils"

export const ContactMailAddressTypeToLabel: Record<ContactAddressType, TranslationKey> = {
	[ContactAddressType.PRIVATE]: "private_label",
	[ContactAddressType.WORK]: "work_label",
	[ContactAddressType.OTHER]: "other_label",
	[ContactAddressType.CUSTOM]: "custom_label",
}

export function getContactAddressTypeLabel(type: ContactAddressType, custom: string): string {
	if (type === ContactAddressType.CUSTOM) {
		return custom
	} else {
		return lang.get(ContactMailAddressTypeToLabel[type])
	}
}

export const ContactPhoneNumberTypeToLabel: Record<ContactPhoneNumberType, TranslationKey> = {
	[ContactPhoneNumberType.PRIVATE]: "private_label",
	[ContactPhoneNumberType.WORK]: "work_label",
	[ContactPhoneNumberType.MOBILE]: "mobile_label",
	[ContactPhoneNumberType.FAX]: "fax_label",
	[ContactPhoneNumberType.OTHER]: "other_label",
	[ContactPhoneNumberType.CUSTOM]: "custom_label",
}

export function getContactPhoneNumberTypeLabel(type: ContactPhoneNumberType, custom: string): string {
	if (type === ContactPhoneNumberType.CUSTOM) {
		return custom
	} else {
		return lang.get(ContactPhoneNumberTypeToLabel[type])
	}
}

export const ContactSocialTypeToLabel: Record<ContactSocialType, TranslationKey> = {
	[ContactSocialType.TWITTER]: "twitter_label",
	[ContactSocialType.FACEBOOK]: "facebook_label",
	[ContactSocialType.XING]: "xing_label",
	[ContactSocialType.LINKED_IN]: "linkedin_label",
	[ContactSocialType.OTHER]: "other_label",
	[ContactSocialType.CUSTOM]: "custom_label",
}

export function getContactSocialTypeLabel(type: ContactSocialType, custom: string): string {
	if (type === ContactSocialType.CUSTOM) {
		return custom
	} else {
		return lang.get(ContactSocialTypeToLabel[type])
	}
}

export const ContactRelationshipTypeToLabel: Record<ContactRelationshipType, TranslationKey> = {
	[ContactRelationshipType.PARENT]: "parent_label",
	[ContactRelationshipType.BROTHER]: "brother_label",
	[ContactRelationshipType.SISTER]: "sister_label",
	[ContactRelationshipType.CHILD]: "child_label",
	[ContactRelationshipType.FRIEND]: "friend_label",
	[ContactRelationshipType.RELATIVE]: "relative_label",
	[ContactRelationshipType.SPOUSE]: "spouse_label",
	[ContactRelationshipType.PARTNER]: "partner_label",
	[ContactRelationshipType.ASSISTANT]: "assistant_label",
	[ContactRelationshipType.MANAGER]: "manager_label",
	[ContactRelationshipType.OTHER]: "other_label",
	[ContactRelationshipType.CUSTOM]: "custom_label",
}

export function getContactRelationshipTypeToLabel(type: ContactRelationshipType, custom: string): string {
	if (type === ContactRelationshipType.CUSTOM) {
		return custom
	} else {
		return lang.get(ContactRelationshipTypeToLabel[type])
	}
}

export const ContactMessengerHandleTypeToLabel: Record<ContactMessengerHandleType, TranslationKey> = {
	[ContactMessengerHandleType.SIGNAL]: "signal_label",
	[ContactMessengerHandleType.WHATSAPP]: "whatsapp_label",
	[ContactMessengerHandleType.TELEGRAM]: "telegram_label",
	[ContactMessengerHandleType.DISCORD]: "discord_label",
	[ContactMessengerHandleType.OTHER]: "other_label",
	[ContactMessengerHandleType.CUSTOM]: "custom_label",
}

export function getContactMessengerHandleTypeToLabel(type: ContactMessengerHandleType, custom: string): string {
	if (type === ContactMessengerHandleType.CUSTOM) {
		return custom
	} else {
		return lang.get(ContactMessengerHandleTypeToLabel[type])
	}
}

export const ContactCustomDateTypeToLabel: Record<ContactCustomDateType, TranslationKey> = {
	[ContactCustomDateType.ANNIVERSARY]: "anniversary_label",
	[ContactCustomDateType.OTHER]: "other_label",
	[ContactCustomDateType.CUSTOM]: "custom_label",
}

export function getContactCustomDateTypeToLabel(type: ContactCustomDateType, custom: string): string {
	if (type === ContactCustomDateType.CUSTOM) {
		return custom
	} else {
		return lang.get(ContactCustomDateTypeToLabel[type])
	}
}

export const ContactCustomWebsiteTypeToLabel: Record<ContactWebsiteType, TranslationKey> = {
	[ContactWebsiteType.PRIVATE]: "private_label",
	[ContactWebsiteType.WORK]: "work_label",
	[ContactWebsiteType.OTHER]: "other_label",
	[ContactWebsiteType.CUSTOM]: "custom_label",
}

export function getContactCustomWebsiteTypeToLabel(type: ContactWebsiteType, custom: string): string {
	if (type === ContactWebsiteType.CUSTOM) {
		return custom
	} else {
		return lang.get(ContactCustomWebsiteTypeToLabel[type])
	}
}

export type ContactComparator = (arg0: Contact, arg1: Contact) => number

/**
 * Sorts by the following preferences:
 * 1. first name
 * 2. second name
 * 3. first email address
 * 4. id
 * Missing fields are sorted below existing fields
 */
export function compareContacts(contact1: Contact, contact2: Contact, sortByFirstName: boolean = true): number {
	let c1First = contact1.firstName.trim()
	let c2First = contact2.firstName.trim()
	let c1Last = contact1.lastName.trim()
	let c2Last = contact2.lastName.trim()
	let c1MailLength = contact1.mailAddresses.length
	let c2MailLength = contact2.mailAddresses.length
	let [c1Primary, c1Secondary] = sortByFirstName ? [c1First, c1Last] : [c1Last, c1First]
	let [c2Primary, c2Secondary] = sortByFirstName ? [c2First, c2Last] : [c2Last, c2First]

	// If the contact doesn't have either the first or the last name, use company as the first name. We cannot just make a string out of it
	// and compare it because we would lose priority of first name over last name and set name over unset name.
	if (!c1Primary && !c1Secondary) {
		c1Primary = contact1.company
	}

	if (!c2Primary && !c2Secondary) {
		c2Primary = contact2.company
	}

	if (c1Primary && !c2Primary) {
		return -1
	} else if (c2Primary && !c1Primary) {
		return 1
	} else {
		let result = c1Primary.localeCompare(c2Primary)

		if (result === 0) {
			if (c1Secondary && !c2Secondary) {
				return -1
			} else if (c2Secondary && !c1Secondary) {
				return 1
			} else {
				result = c1Secondary.localeCompare(c2Secondary)
			}
		}

		if (result === 0) {
			// names are equal or no names in contact
			if (c1MailLength > 0 && c2MailLength === 0) {
				return -1
			} else if (c2MailLength > 0 && c1MailLength === 0) {
				return 1
			} else if (c1MailLength === 0 && c2MailLength === 0) {
				// see Multiselect with shift and up arrow not working properly #152 at github
				return sortCompareByReverseId(contact1, contact2)
			} else {
				result = contact1.mailAddresses[0].address.trim().localeCompare(contact2.mailAddresses[0].address.trim())

				if (result === 0) {
					// see Multiselect with shift and up arrow not working properly #152 at github
					return sortCompareByReverseId(contact1, contact2)
				} else {
					return result
				}
			}
		} else {
			return result
		}
	}
}
