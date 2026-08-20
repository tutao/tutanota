import { Contact, ContactCustomDate, ContactRelationship, ContactSocialId } from "../../../entities/tutanota/TypeRefs"
import { downcast } from "../../../platform-kit/utils"
import { ContactCustomDateType, ContactRelationshipType, ContactSocialType } from "../../../entities/tutanota/Utils"
import { EntityIdEncoding, sortCompareByReverseId } from "@tutao/meta"

export const getContactSocialType = (contactSocialId: ContactSocialId): ContactSocialType => downcast(contactSocialId.type)
export const getCustomDateType = (customDate: ContactCustomDate): ContactCustomDateType => downcast(customDate.type)
export const getRelationshipType = (relationship: ContactRelationship): ContactRelationshipType => downcast(relationship.type)

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
				return sortCompareByReverseId(contact1, contact2, EntityIdEncoding.Base64Ext)
			} else {
				result = contact1.mailAddresses[0].address.trim().localeCompare(contact2.mailAddresses[0].address.trim())

				if (result === 0) {
					// see Multiselect with shift and up arrow not working properly #152 at github
					return sortCompareByReverseId(contact1, contact2, EntityIdEncoding.Base64Ext)
				} else {
					return result
				}
			}
		} else {
			return result
		}
	}
}
