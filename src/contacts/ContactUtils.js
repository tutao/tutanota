// @flow
import {lang} from "../misc/LanguageViewModel.js"
import type {
	ContactAddressTypeEnum,
	ContactPhoneNumberTypeEnum,
	ContactSocialTypeEnum
} from "../api/common/TutanotaConstants"
import {ContactPhoneNumberType, ContactAddressType, ContactSocialType} from "../api/common/TutanotaConstants"
import {assertMainOrNode} from "../api/Env"
import {sortCompareByReverseId} from "../gui/base/List"

assertMainOrNode()

export const ContactMailAddressTypeToLabel: {[key: ContactAddressTypeEnum]:string} = {
	[ContactAddressType.PRIVATE]: "private_label",
	[ContactAddressType.WORK]: "work_label",
	[ContactAddressType.OTHER]: "other_label",
	[ContactAddressType.CUSTOM]: "custom_label"
}

export function getContactAddressTypeLabel(type: ContactAddressTypeEnum, custom: string) {
	if (type === ContactAddressType.CUSTOM) {
		return custom
	} else {
		return lang.get(ContactMailAddressTypeToLabel[type])
	}
}

export const ContactPhoneNumberTypeToLabel: {[key: ContactPhoneNumberTypeEnum]:string} = {
	[ContactPhoneNumberType.PRIVATE]: "private_label",
	[ContactPhoneNumberType.WORK]: "work_label",
	[ContactPhoneNumberType.MOBILE]: "mobile_label",
	[ContactPhoneNumberType.FAX]: "fax_label",
	[ContactPhoneNumberType.OTHER]: "other_label",
	[ContactPhoneNumberType.CUSTOM]: "custom_label"
}

export function getContactPhoneNumberTypeLabel(type: ContactPhoneNumberTypeEnum, custom: string) {
	if (type === ContactPhoneNumberType.CUSTOM) {
		return custom
	} else {
		return lang.get(ContactPhoneNumberTypeToLabel[type])
	}
}

export const ContactSocialTypeToLabel: {[key: ContactSocialTypeEnum]:string} = {
	[ContactSocialType.TWITTER]: "twitter_label",
	[ContactSocialType.FACEBOOK]: "facebook_label",
	[ContactSocialType.XING]: "xing_label",
	[ContactSocialType.LINKED_IN]: "linkedin_label",
	[ContactSocialType.OTHER]: "other_label",
	[ContactSocialType.CUSTOM]: "custom_label"
}

export function getContactSocialTypeLabel(type: ContactSocialTypeEnum, custom: string) {
	if (type == ContactSocialType.CUSTOM) {
		return custom
	} else {
		return lang.get(ContactSocialTypeToLabel[type])
	}
}

/**
 * Sorts by the following preferences:
 * 1. first name
 * 2. second name
 * 3. first email address
 * 4. id
 * Missing fields are sorted below existing fields
 */
export function compareContacts(contact1: Contact, contact2: Contact) {
	let c1First = contact1.firstName.trim()
	let c2First = contact2.firstName.trim()
	let c1Last = contact1.lastName.trim()
	let c2Last = contact2.lastName.trim()
	let c1MailLength = contact1.mailAddresses.length
	let c2MailLength = contact2.mailAddresses.length
	if (c1First && !c2First) {
		return -1
	} else if (c2First && !c1First) {
		return 1
	} else {
		let result = (c1First).localeCompare(c2First)
		if (result == 0) {
			if (c1Last && !c2Last) {
				return -1
			} else if (c2Last && !c1Last) {
				return 1
			} else {
				result = (c1Last).localeCompare(c2Last)
			}
		}
		if (result == 0) {// names are equal or no names in contact
			if (c1MailLength > 0 && c2MailLength == 0) {
				return -1
			} else if (c2MailLength > 0 && c1MailLength == 0) {
				return 1
			} else if (c1MailLength == 0 && c2MailLength == 0) {
				// see Multiselect with shift and up arrow not working properly #152 at github
				return sortCompareByReverseId(contact1, contact2)
			} else {
				result = contact1.mailAddresses[0].address.trim().localeCompare(contact2.mailAddresses[0].address.trim())
				if (result == 0) {
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