// @flow
import type {ContactComparisonResultEnum, IndifferentContactComparisonResultEnum} from "../api/common/TutanotaConstants"
import {ContactComparisonResult, IndifferentContactComparisonResult} from "../api/common/TutanotaConstants"
import {neverNull} from "../api/common/utils/Utils"
import {oldBirthdayToBirthday, migrateToNewBirthday} from "./ContactUtils"

/**
 * returns all contacts that are deletable because another contact exists that is exactly the same, and all contacts that look similar and therfore may be merged.
 * contacts are never returned in both "mergable" and "deletable"
 * contact similarity is checked transitively, i.e. if a similar to b and b similar to c, then a similar to c
 */
export function getMergeableContacts(inputContacts: Contact[]): {mergeable:Contact[][], deletable: Contact[]} {
	let mergableContacts = []
	let duplicateContacts = []
	let contacts = inputContacts.slice()

	let firstContactIndex = 0
	while (firstContactIndex < contacts.length - 1) {
		let currentMergableContacts = []
		let firstContact = contacts[firstContactIndex]
		currentMergableContacts.push(firstContact)
		let secondContactIndex = firstContactIndex + 1
		// run through all contacts after the first and compare them with the first (+ all others already in the currentMergableArray)
		while (secondContactIndex < contacts.length) {
			let secondContact = contacts[secondContactIndex]
			if (firstContact._id[1] != secondContact._id[1]) { // should not happen, just to be safe
				let overallResult = ContactComparisonResult.Unique
				// compare the current second contact with all in the currentMergableArray to find out if the overall comparison result is equal, similar or unique
				for (let i = 0; i < currentMergableContacts.length; i++) {
					let result = _compareContactsForMerge(currentMergableContacts[i], secondContact)
					if (result == ContactComparisonResult.Equal) {
						overallResult = ContactComparisonResult.Equal
						break // equal is always the final result
					} else if (result == ContactComparisonResult.Similar) {
						overallResult = ContactComparisonResult.Similar
						// continue checking the other contacts in currentMergableContacts to see if there is an equal one
					} else {
						// the contacts are unique, so we do not have to check the others
						break
					}
				}
				if (overallResult == ContactComparisonResult.Equal) {
					duplicateContacts.push(secondContact)
					contacts.splice(secondContactIndex, 1)
				} else if (overallResult == ContactComparisonResult.Similar) {
					currentMergableContacts.push(secondContact)
					contacts.splice(secondContactIndex, 1)
				} else {
					secondContactIndex++
				}
			}
		}
		if (currentMergableContacts.length > 1) {
			mergableContacts.push(currentMergableContacts)
		}
		firstContactIndex++
	}

	return {mergeable: mergableContacts, deletable: duplicateContacts}
}

/**
 * merges two contacts (eliminatedContact is merged into keptContact). outside this function keptContact must be updated on the server and eliminatedContact must be deleted
 */
export function mergeContacts(keptContact: Contact, eliminatedContact: Contact): void {
	keptContact.firstName = _getMergedNameField(keptContact.firstName, eliminatedContact.firstName)
	keptContact.lastName = _getMergedNameField(keptContact.lastName, eliminatedContact.lastName)
	keptContact.title = neverNull(_getMergedOtherField(keptContact.title, eliminatedContact.title, ", "))
	keptContact.comment = neverNull(_getMergedOtherField(keptContact.comment, eliminatedContact.comment, "\n\n"))
	keptContact.company = neverNull(_getMergedOtherField(keptContact.company, eliminatedContact.company, ", "))
	keptContact.nickname = _getMergedOtherField(keptContact.nickname, eliminatedContact.nickname, ", ")
	keptContact.role = neverNull(_getMergedOtherField(keptContact.role, eliminatedContact.role, ", "))
	let birthdays = _getMergedBirthdays(keptContact.oldBirthday, eliminatedContact.oldBirthday, keptContact.birthday, eliminatedContact.birthday)
	keptContact.oldBirthday = birthdays.oldBDay
	keptContact.birthday = birthdays.newBDay
	keptContact.mailAddresses = _getMergedEmailAddresses(keptContact.mailAddresses, eliminatedContact.mailAddresses)
	keptContact.phoneNumbers = _getMergedPhoneNumbers(keptContact.phoneNumbers, eliminatedContact.phoneNumbers)
	keptContact.socialIds = _getMergedSocialIds(keptContact.socialIds, eliminatedContact.socialIds)
	keptContact.addresses = _getMergedAddresses(keptContact.addresses, eliminatedContact.addresses)
	keptContact.presharedPassword = neverNull(_getMergedOtherField(keptContact.presharedPassword, eliminatedContact.presharedPassword, "")) // the passwords are never different and not null
}

/**
 * Result is unique if preshared passwords are not equal and are not empty.
 * Result is equal if all fields are equal or empty (types are ignored).
 * Result is similar if one of:
 * 1. name result is equal or similar and birthday result is similar or oneEmpty or equal or bothEmpty
 * 2. name result (bothEmpty or oneEmpty) and mail or phone result is similar or equal and birthday result is similar or oneEmpty or equal or bothEmpty
 * Otherwise the result is unique
 * Export for testing
 */
export function _compareContactsForMerge(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	let nameResult = _compareFullName(contact1, contact2)
	let mailResult = _compareMailAddresses(contact1.mailAddresses, contact2.mailAddresses)
	let phoneResult = _comparePhoneNumbers(contact1.phoneNumbers, contact2.phoneNumbers)
	let birthdayResult = _compareBirthdays(contact1, contact2)
	let residualContactFieldsEqual = _areResidualContactFieldsEqual(contact1, contact2)

	if ((birthdayResult != ContactComparisonResult.Unique) && (!contact1.presharedPassword || !contact2.presharedPassword || (contact1.presharedPassword == contact2.presharedPassword))) {
		if ((nameResult == ContactComparisonResult.Equal || nameResult == IndifferentContactComparisonResult.BothEmpty) && (mailResult == ContactComparisonResult.Equal || mailResult == IndifferentContactComparisonResult.BothEmpty) && (phoneResult == ContactComparisonResult.Equal || phoneResult == IndifferentContactComparisonResult.BothEmpty) && residualContactFieldsEqual) {
			if (birthdayResult == IndifferentContactComparisonResult.BothEmpty || birthdayResult == ContactComparisonResult.Equal) {
				return ContactComparisonResult.Equal
			} else {
				return ContactComparisonResult.Similar
			}
		} else if (nameResult == ContactComparisonResult.Equal || nameResult == ContactComparisonResult.Similar) {
			return ContactComparisonResult.Similar
		} else if ((nameResult == IndifferentContactComparisonResult.BothEmpty || nameResult == IndifferentContactComparisonResult.OneEmpty) && (mailResult == ContactComparisonResult.Similar || phoneResult == ContactComparisonResult.Similar || mailResult == ContactComparisonResult.Equal || phoneResult == ContactComparisonResult.Equal)) {
			return ContactComparisonResult.Similar
		} else {
			return ContactComparisonResult.Unique
		}
	} else {
		return ContactComparisonResult.Unique
	}
}

/**
 * Names are equal if the last names are available and equal and first names are equal or first names are available and equal and last names are equal.
 * Names are similar if the last names are available and equal and at least one first name is empty or like equal but case insensitive.
 * Returns null if the contacts names are not comparable, i.e. one of the contacts first and last names are empty.
 * Export for testing
 */
export function _compareFullName(contact1: Contact, contact2: Contact): ContactComparisonResultEnum | IndifferentContactComparisonResultEnum {
	if (contact1.firstName == contact2.firstName && contact1.lastName == contact2.lastName && (contact1.lastName || contact1.firstName)) {
		return ContactComparisonResult.Equal
	} else if ((!contact1.firstName && !contact1.lastName) && (!contact2.firstName && !contact2.lastName)) {
		return IndifferentContactComparisonResult.BothEmpty
	} else if ((!contact1.firstName && !contact1.lastName) || (!contact2.firstName && !contact2.lastName)) {
		return IndifferentContactComparisonResult.OneEmpty
	} else if (contact1.firstName.toLowerCase() == contact2.firstName.toLowerCase() && contact1.lastName.toLowerCase() == contact2.lastName.toLowerCase() && contact1.lastName) {
		return ContactComparisonResult.Similar
	} else if (((!contact1.firstName || !contact2.firstName) && (contact1.lastName.toLowerCase() == contact2.lastName.toLowerCase())) && contact1.lastName) {
		return ContactComparisonResult.Similar
	} else {
		return ContactComparisonResult.Unique
	}
}

/**
 * Provides name1 if it is not empty, otherwise name2
 * Export for testing
 */
export function _getMergedNameField(name1: string, name2: string) {
	if (name1) {
		return name1
	} else {
		return name2
	}
}

/**
 * If the mail addresses (type is ignored) are all equal (order in array is ignored), the addresses are equal.
 * If at least one mail address is equal and all others are unique, the result is similar. If the mail addresses are equal (only case insensitive), then the result is also similar.
 * If one mail address list is empty, the result is oneEmpty because the mail addresses are not comparable.
 * If both are empty the result is both empty because the mail addresses are not comparable.
 * Otherwise the result is unique.
 * Export for testing
 */
export function _compareMailAddresses(contact1MailAddresses: ContactMailAddress[], contact2MailAddresses: ContactMailAddress[]): ContactComparisonResultEnum | IndifferentContactComparisonResultEnum {
	return _compareValues(contact1MailAddresses.map(m => m.address), contact2MailAddresses.map(m => m.address))
}

/**
 * Export for testing
 */
export function _getMergedEmailAddresses(mailAddresses1: ContactMailAddress[], mailAddresses2: ContactMailAddress[]): ContactMailAddress[] {
	let filteredMailAddresses2 = mailAddresses2.filter(ma2 => {
		return !mailAddresses1.find(ma1 => ma1.address.toLowerCase() == ma2.address.toLowerCase())
	})
	return mailAddresses1.concat(filteredMailAddresses2)
}

/**
 * Export for testing
 */
export function _comparePhoneNumbers(contact1PhoneNumbers: ContactPhoneNumber[], contact2PhoneNumbers: ContactPhoneNumber[]): ContactComparisonResultEnum | IndifferentContactComparisonResultEnum {
	return _compareValues(contact1PhoneNumbers.map(m => m.number), contact2PhoneNumbers.map(m => m.number))
}

/**
 * Export for testing
 */
export function _getMergedPhoneNumbers(phoneNumbers1: ContactPhoneNumber[], phoneNumbers2: ContactPhoneNumber[]): ContactPhoneNumber[] {
	let filteredNumbers2 = phoneNumbers2.filter(ma2 => {
		return !phoneNumbers1.find(ma1 => ma1.number == ma2.number)
	})
	return phoneNumbers1.concat(filteredNumbers2)
}

/**
 * used for clarifying of the unique and equal cases in compareContacts
 * Export for testing
 * returns similar only if socialids ore addresses are similar. Return of similar is basicaly not needed
 */
export function _areResidualContactFieldsEqual(contact1: Contact, contact2: Contact): boolean {
	return _isEqualOtherField(contact1.comment, contact2.comment) &&
		_isEqualOtherField(contact1.company, contact2.company) &&
		_isEqualOtherField(contact1.nickname, contact2.nickname) &&
		_isEqualOtherField(contact1.role, contact2.role) &&
		_isEqualOtherField(contact1.title, contact2.title) &&
		_isEqualOtherField(contact1.presharedPassword, contact2.presharedPassword) &&
		_areSocialIdsEqual(contact1.socialIds, contact2.socialIds) &&
		_areAddressesEqual(contact1.addresses, contact2.addresses)
}

function _areSocialIdsEqual(contact1SocialIds: ContactSocialId[], contact2SocialIds: ContactSocialId[]): boolean {
	let result = _compareValues(contact1SocialIds.map(m => m.socialId), contact2SocialIds.map(m => m.socialId))
	return result == IndifferentContactComparisonResult.BothEmpty || result == ContactComparisonResult.Equal
}

/**
 * Export for testing
 */
export function _getMergedSocialIds(socialIds1: ContactSocialId[], socialIds2: ContactSocialId[]): ContactSocialId[] {
	let filteredSocialIds2 = socialIds2.filter(ma2 => {
		return !socialIds1.find(ma1 => ma1.socialId == ma2.socialId)
	})
	return socialIds1.concat(filteredSocialIds2)
}

function _areAddressesEqual(contact1Addresses: ContactAddress[], contact2Addresses: ContactAddress[]): boolean {
	let result = _compareValues(contact1Addresses.map(m => m.address), contact2Addresses.map(m => m.address))
	return result == IndifferentContactComparisonResult.BothEmpty || result == ContactComparisonResult.Equal
}

/**
 * Export for testing
 */
export function _getMergedAddresses(addresses1: ContactAddress[], addresses2: ContactAddress[]): ContactAddress[] {
	let filteredAddresses2 = addresses2.filter(ma2 => {
		return !addresses1.find(ma1 => ma1.address == ma2.address)
	})
	return addresses1.concat(filteredAddresses2)
}
/**
 * Export for testing
 */
export function _compareBirthdays(contact1: Contact, contact2: Contact): ContactComparisonResultEnum | IndifferentContactComparisonResultEnum {
	migrateToNewBirthday(contact1)
	migrateToNewBirthday(contact2)
	if (contact1.birthday && contact2.birthday) {
		if (contact1.birthday.day == contact2.birthday.day && contact1.birthday.month == contact2.birthday.month) {
			if (contact1.birthday.year == contact2.birthday.year) {
				return ContactComparisonResult.Equal
			} else if (contact1.birthday.year && contact2.birthday.year && contact1.birthday.year != contact2.birthday.year) {
				return ContactComparisonResult.Unique
			} else {
				return ContactComparisonResult.Similar
			}
		} else {
			return ContactComparisonResult.Unique
		}
	} else if ((contact1.birthday && !contact2.birthday) || (!contact1.birthday && contact2.birthday)) {
		return IndifferentContactComparisonResult.OneEmpty
	} else {
		return IndifferentContactComparisonResult.BothEmpty
	}
}

function _compareValues(values1: string[], values2: string[]): ContactComparisonResultEnum | IndifferentContactComparisonResultEnum {
	if (values1.length == 0 && values2.length == 0) {
		return IndifferentContactComparisonResult.BothEmpty
	} else if (values1.length == 0 || values2.length == 0) {
		return IndifferentContactComparisonResult.OneEmpty
	}
	let equalAddresses = values2.filter(c2 => values1.find(c1 => c1.trim() == c2.trim()))
	if (values1.length == values2.length && values1.length == equalAddresses.length) {
		return ContactComparisonResult.Equal
	}
	let equalAddressesInsensitive = values2.filter(c2 => values1.find(c1 => c1.trim().toLowerCase() == c2.trim().toLowerCase()))
	if (equalAddressesInsensitive.length > 0) {
		return ContactComparisonResult.Similar
	}
	return ContactComparisonResult.Unique
}

/**
 * Returns equal if both values are equal and unique otherwise
 */
function _isEqualOtherField(otherAttribute1: ?string, otherAttribute2: ?string): boolean {
	// regard null as ""
	if (otherAttribute1 == null) {
		otherAttribute1 = ""
	}
	if (otherAttribute2 == null) {
		otherAttribute2 = ""
	}
	return (otherAttribute1 == otherAttribute2)
}

/**
 * Provides the value that exists or both separated by the given separator if both have some content
 * Export for testing
 */
export function _getMergedOtherField(otherAttribute1: ?string, otherAttribute2: ?string, separator: string): ?string {
	if (otherAttribute1 == otherAttribute2) {
		return otherAttribute2
	} else if (otherAttribute1 && otherAttribute2) {
		return (otherAttribute1 + separator + otherAttribute2)
	} else if (!otherAttribute1 && otherAttribute2) {
		return otherAttribute2
	} else {
		return otherAttribute1
	}
}


/**
 * Export for testing
 */
export function birthdayToOldBirthday(newBirthday: Birthday): Date {
	return new Date(Number(newBirthday.year), Number(newBirthday.month) - 1, Number(newBirthday.day))
}

/**
 * Export for testing
 */
export function _getMergedBirthdays(oldBirthday1: ?Date, oldBirthday2: ?Date, newBirthday1: ?Birthday, newBirthday2: ?Birthday): {oldBDay:?Date, newBDay:?Birthday} {
	if (newBirthday1 && newBirthday2) {
		if (newBirthday1.year) {
			return {oldBDay: null, newBDay: newBirthday1}
		} else if (newBirthday2.year) {
			return {oldBDay: null, newBDay: newBirthday2}
		} else {
			return {oldBDay: null, newBDay: newBirthday1}
		}
	} else if (newBirthday1) {
		return {oldBDay: null, newBDay: newBirthday1}
	} else if (newBirthday2) {
		return {oldBDay: null, newBDay: newBirthday2}
	} else if (oldBirthday1) {
		return {oldBDay: null, newBDay: oldBirthdayToBirthday(oldBirthday1)}
	} else if (oldBirthday2) {
		return {oldBDay: null, newBDay: oldBirthdayToBirthday(oldBirthday2)}
	} else {
		return {oldBDay: null, newBDay: null}
	}
}
