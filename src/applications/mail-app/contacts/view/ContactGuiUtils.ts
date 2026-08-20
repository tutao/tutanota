import type { MaybeTranslation, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { Contact } from "@tutao/entities/tutanota"
import {
	ContactAddressType,
	ContactCustomDateType,
	ContactMessengerHandleType,
	ContactPhoneNumberType,
	ContactRelationshipType,
	ContactSocialType,
	ContactWebsiteType,
} from "../../../../entities/tutanota/Utils"

export const ContactMailAddressTypeToLabel: Record<ContactAddressType, TranslationKey> = {
	[ContactAddressType.PRIVATE]: "private_label",
	[ContactAddressType.WORK]: "work_label",
	[ContactAddressType.OTHER]: "other_label",
	[ContactAddressType.CUSTOM]: "custom_label",
}

export function getContactAddressTypeLabel(type: ContactAddressType, custom: string): MaybeTranslation {
	if (type === ContactAddressType.CUSTOM) {
		return lang.makeTranslation("custom", custom)
	} else {
		let key = ContactMailAddressTypeToLabel[type]
		return key
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

export function getContactPhoneNumberTypeLabel(type: ContactPhoneNumberType, custom: string): MaybeTranslation {
	if (type === ContactPhoneNumberType.CUSTOM) {
		return lang.makeTranslation("custom", custom)
	} else {
		let key = ContactPhoneNumberTypeToLabel[type]
		return key
	}
}

export const ContactSocialTypeToLabel: Record<ContactSocialType, TranslationKey> = {
	[ContactSocialType.TWITTER]: "twitter_label",
	[ContactSocialType.FACEBOOK]: "facebook_label",
	[ContactSocialType.XING]: "xing_label",
	[ContactSocialType.LINKED_IN]: "linkedin_label",
	[ContactSocialType.BLUESKY]: "bluesky_label",
	[ContactSocialType.FEDIVERSE]: "fediverse_label",
	[ContactSocialType.OTHER]: "other_label",
	[ContactSocialType.CUSTOM]: "custom_label",
}

export function getContactSocialTypeLabel(type: ContactSocialType, custom: string): MaybeTranslation {
	if (type === ContactSocialType.CUSTOM) {
		return lang.makeTranslation("custom", custom)
	} else {
		let key = ContactSocialTypeToLabel[type]
		return key
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

export function getContactRelationshipTypeToLabel(type: ContactRelationshipType, custom: string): MaybeTranslation {
	if (type === ContactRelationshipType.CUSTOM) {
		return lang.makeTranslation("custom", custom)
	} else {
		let key = ContactRelationshipTypeToLabel[type]
		return key
	}
}

export const ContactMessengerHandleTypeToLabel: Record<ContactMessengerHandleType, TranslationKey> = {
	[ContactMessengerHandleType.SIGNAL]: "signal_label",
	[ContactMessengerHandleType.WHATSAPP]: "whatsapp_label",
	[ContactMessengerHandleType.TELEGRAM]: "telegram_label",
	[ContactMessengerHandleType.DISCORD]: "discord_label",
	[ContactMessengerHandleType.MATRIX]: "matrix_label",
	[ContactMessengerHandleType.OTHER]: "other_label",
	[ContactMessengerHandleType.CUSTOM]: "custom_label",
}

export function getContactMessengerHandleTypeToLabel(type: ContactMessengerHandleType, custom: string): MaybeTranslation {
	if (type === ContactMessengerHandleType.CUSTOM) {
		return lang.makeTranslation("custom", custom)
	} else {
		let key = ContactMessengerHandleTypeToLabel[type]
		return key
	}
}

export const ContactCustomDateTypeToLabel: Record<ContactCustomDateType, TranslationKey> = {
	[ContactCustomDateType.ANNIVERSARY]: "anniversary_label",
	[ContactCustomDateType.OTHER]: "other_label",
	[ContactCustomDateType.CUSTOM]: "custom_label",
}

export function getContactCustomDateTypeToLabel(type: ContactCustomDateType, custom: string): MaybeTranslation {
	if (type === ContactCustomDateType.CUSTOM) {
		return lang.makeTranslation("custom", custom)
	} else {
		let key = ContactCustomDateTypeToLabel[type]
		return key
	}
}

export const ContactCustomWebsiteTypeToLabel: Record<ContactWebsiteType, TranslationKey> = {
	[ContactWebsiteType.PRIVATE]: "private_label",
	[ContactWebsiteType.WORK]: "work_label",
	[ContactWebsiteType.OTHER]: "other_label",
	[ContactWebsiteType.CUSTOM]: "custom_label",
}

export function getContactCustomWebsiteTypeToLabel(type: ContactWebsiteType, custom: string): MaybeTranslation {
	if (type === ContactWebsiteType.CUSTOM) {
		return lang.makeTranslation("custom", custom)
	} else {
		let key = ContactCustomWebsiteTypeToLabel[type]
		return key
	}
}

export type ContactComparator = (arg0: Contact, arg1: Contact) => number
