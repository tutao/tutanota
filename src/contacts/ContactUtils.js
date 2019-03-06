// @flow
import {lang} from "../misc/LanguageViewModel.js"
import type {ContactAddressTypeEnum, ContactPhoneNumberTypeEnum, ContactSocialTypeEnum} from "../api/common/TutanotaConstants"
import {ContactAddressType, ContactPhoneNumberType, ContactSocialType} from "../api/common/TutanotaConstants"
import {assertMainOrNode} from "../api/Env"
import {createRestriction} from "../search/SearchUtils"
import {load, loadAll, loadRoot} from "../api/main/Entity"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {ContactListTypeRef} from "../api/entities/tutanota/ContactList"
import {NotAuthorizedError, NotFoundError} from "../api/common/error/RestError"
import {logins} from "../api/main/LoginController"
import {asyncFindAndMap, neverNull} from "../api/common/utils/Utils"
import {worker} from "../api/main/WorkerClient"
import {compareOldestFirst, sortCompareByReverseId} from "../api/common/EntityFunctions"
import {locator} from "../api/main/MainLocator"
import {createBirthday} from "../api/entities/tutanota/Birthday"
import {formatDate, formatDateWithMonth, formatSortableDate} from "../misc/Formatter"
import type {TranslationKey} from "../misc/LanguageViewModel"

assertMainOrNode()

export const LazyContactListId: LazyLoaded<Id> = new LazyLoaded(() => {
	return loadRoot(ContactListTypeRef, logins.getUserController().user.userGroup.group)
		.then((contactList: ContactList) => {
			return contactList.contacts
		})
		.catch(NotFoundError, e => {
			if (!logins.getUserController().isInternalUser()) {
				return null // external users have no contact list.
			} else {
				throw e
			}
		})
})

export const ContactMailAddressTypeToLabel: {[key: ContactAddressTypeEnum]: TranslationKey} = {
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

export const ContactPhoneNumberTypeToLabel: {[key: ContactPhoneNumberTypeEnum]: TranslationKey} = {
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

export const ContactSocialTypeToLabel: {[key: ContactSocialTypeEnum]: TranslationKey} = {
	[ContactSocialType.TWITTER]: "twitter_label",
	[ContactSocialType.FACEBOOK]: "facebook_label",
	[ContactSocialType.XING]: "xing_label",
	[ContactSocialType.LINKED_IN]: "linkedin_label",
	[ContactSocialType.OTHER]: "other_label",
	[ContactSocialType.CUSTOM]: "custom_label"
}

export function getContactSocialTypeLabel(type: ContactSocialTypeEnum, custom: string) {
	if (type === ContactSocialType.CUSTOM) {
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
		if (result === 0) {
			if (c1Last && !c2Last) {
				return -1
			} else if (c2Last && !c1Last) {
				return 1
			} else {
				result = (c1Last).localeCompare(c2Last)
			}
		}
		if (result === 0) {// names are equal or no names in contact
			if (c1MailLength > 0 && c2MailLength === 0) {
				return -1
			} else if (c2MailLength > 0 && c1MailLength === 0) {
				return 1
			} else if (c1MailLength === 0 && c2MailLength === 0) {
				// see Multiselect with shift and up arrow not working properly #152 at github
				return sortCompareByReverseId(contact1, contact2)
			} else {
				result = contact1.mailAddresses[0].address.trim()
				                                  .localeCompare(contact2.mailAddresses[0].address.trim())
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

/**
 * @pre locator.search.indexState().indexingSupported
 */
export function searchForContacts(query: string, field: string, minSuggestionCount: number): Promise<Contact[]> {
	return worker.search(query, createRestriction("contact", null, null, field, null), minSuggestionCount)
	             .then(result => {
		             // load one by one because they may be in different lists when we have different lists
		             return Promise.map(result.results, idTuple => {
			             return load(ContactTypeRef, idTuple).catch(NotFoundError, e => {
				             return null
			             }).catch(NotAuthorizedError, e => {
				             return null
			             })
		             }).filter(contact => contact != null)
	             })
}

/**
 * Provides the first contact (starting with oldest contact) that contains the given email address. Uses the index search if available, otherwise loads all contacts.
 */
export function searchForContactByMailAddress(mailAddress: string): Promise<?Contact> {
	let cleanMailAddress = mailAddress.trim().toLowerCase()
	if (locator.search.indexState().indexingSupported) {
		return worker.search("\"" + cleanMailAddress + "\"",
			createRestriction("contact", null, null, "mailAddress", null), 0).then(result => {
			// the result is sorted from newest to oldest, but we want to return the oldest first like before
			result.results.sort(compareOldestFirst)
			return asyncFindAndMap(result.results, contactId => {
				return load(ContactTypeRef, contactId).then(contact => {
					// look for the exact match in the contacts
					return (contact.mailAddresses.find(a => a.address.trim().toLowerCase()
						=== cleanMailAddress)) ? contact : null
				}).catch(NotFoundError, e => {
					return null
				}).catch(NotAuthorizedError, e => {
					return null
				})
			})
		})
	} else {
		return LazyContactListId.getAsync().then(listId => loadAll(ContactTypeRef, listId)).then(contacts => {
			return contacts.find(contact => contact.mailAddresses.find(a =>
				a.address.trim().toLowerCase() === cleanMailAddress) != null)
		})
	}
}

export function getContactDisplayName(contact: Contact): string {
	if (contact.nickname) {
		return contact.nickname
	} else {
		return `${contact.firstName} ${contact.lastName}`.trim()
	}
}

export function formatBirthdayNumeric(birthday: Birthday): string {
	if (birthday.year) {
		//in chromimum Intl.DateTimeFormat is buggy for some dates with years the format subtracts a day from the date
		//example date is 15.8.1911 ->format returns 14.8.1911
		//this issue does not happen with recent years so the formatting is done with the current year then this year is changed with the original of the birthday
		let refYear = new Date()
		let bdayString = formatDate(new Date(refYear.getFullYear(), Number(neverNull(birthday).month)
			- 1, Number(neverNull(birthday).day)))
		bdayString = bdayString.replace(/\d{4}/g, String(neverNull(birthday).year))
		return bdayString
	} else {
		return lang.formats.simpleDateWithoutYear.format(new Date(Number(2011), Number(neverNull(birthday).month)
			- 1, Number(neverNull(birthday).day)))
	}
}

export function formatBirthdayWithMonthName(birthday: Birthday): string {
	if (birthday.year) {
		//todo github issue #414
		//in chromimum Intl.DateTimeFormat is buggy for some dates with years the format subtracts a day from the date
		//example date is 15.8.1911 ->format returns 14.8.1911
		//this issue does not happen with recent years so the formatting is done with the current year then this year is changed with the original of the birthday
		let refYear = new Date()
		let bdayString = formatDateWithMonth(new Date(refYear.getFullYear(), Number(neverNull(birthday).month) - 1,
			Number(neverNull(birthday).day)))
		bdayString = bdayString.replace(/\d{4}/g, String(neverNull(birthday).year))
		return bdayString
	} else {
		return lang.formats.dateWithoutYear.format(new Date(Number(2011), Number(neverNull(birthday).month) - 1,
			Number(neverNull(birthday).day)))
	}
}

/**
 * returns new birthday format from old birthday format
 * Export for testing
 */
export function oldBirthdayToBirthday(oldBirthday: Date): Birthday {
	let bDayDetails = createBirthday()
	let birthdayString = (formatSortableDate(oldBirthday)).split("-")
	bDayDetails.day = String(Number(birthdayString[2]))
	bDayDetails.month = String(Number(birthdayString[1]))
	bDayDetails.year = String(Number(birthdayString[0]))
	return bDayDetails
}

export function migrateToNewBirthday(contact: Contact) {
	if (!contact.birthday && contact.oldBirthday) {
		contact.birthday = oldBirthdayToBirthday(contact.oldBirthday)
	}
	if (contact.oldBirthday) {
		contact.oldBirthday = null
	}
}