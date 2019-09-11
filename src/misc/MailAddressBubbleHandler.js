//@flow
import type {BubbleHandler} from "../gui/base/BubbleTextField"
import {Bubble} from "../gui/base/BubbleTextField"
import {isMailAddress} from "./FormatValidator"
import {LazyContactListId, searchForContacts} from "../contacts/ContactUtils"
import {DbError} from "../api/common/error/DbError"
import {loadAll} from "../api/main/Entity"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {Mode} from "../api/Env"
import {findRecipients} from "../native/ContactApp"
import {stringToNameAndMailAddress} from "./Formatter"
import {ContactSuggestion, ContactSuggestionHeight} from "./ContactSuggestion"


type BubbleFactory = {
	createBubble(name: ?string, mailAddress: string, contact: ?Contact): Bubble<RecipientInfo>
}

export class MailAddressBubbleHandler implements BubbleHandler<RecipientInfo, ContactSuggestion> {
	suggestionHeight: number;
	_bubbleFactory: BubbleFactory;

	constructor(bubbleFactory: BubbleFactory) {
		this._bubbleFactory = bubbleFactory
		this.suggestionHeight = ContactSuggestionHeight
	}

	getSuggestions(text: string): Promise<ContactSuggestion[]> {
		let query = text.trim().toLowerCase()
		if (isMailAddress(query, false)) {
			return Promise.resolve([])
		}

		// ensure match word order for email addresses mainly
		let contactsPromise = searchForContacts("\"" + query + "\"", "recipient", 10).catch(DbError, () => {
			return LazyContactListId.getAsync().then(listId => loadAll(ContactTypeRef, listId))
		})

		return contactsPromise
			.map(contact => {
				let name = `${contact.firstName} ${contact.lastName}`.trim()
				let mailAddresses = []
				if (name.toLowerCase().indexOf(query) !== -1) {
					mailAddresses = contact.mailAddresses.filter(ma => isMailAddress(ma.address.trim(), false))
				} else {
					mailAddresses = contact.mailAddresses.filter(ma => {
						return isMailAddress(ma.address.trim(), false) && ma.address.toLowerCase().indexOf(query) !== -1
					})
				}
				return mailAddresses.map(ma => new ContactSuggestion(name, ma.address.trim(), contact))
			})
			.reduce((a, b) => a.concat(b), [])
			.then(suggestions => {
				if (env.mode === Mode.App) {
					return findRecipients(query, 10, suggestions).then(() => suggestions)
				} else {
					return suggestions
				}
			})
			.then(suggestions => {
				return suggestions.sort((suggestion1, suggestion2) =>
					suggestion1.name.localeCompare(suggestion2.name))
			})
	}

	createBubbleFromSuggestion(suggestion: ContactSuggestion): Bubble<RecipientInfo> {
		return this._bubbleFactory.createBubble(suggestion.name, suggestion.mailAddress, suggestion.contact)
	}

	createBubblesFromText(text: string): Bubble<RecipientInfo>[] {
		let separator = (text.indexOf(";") !== -1) ? ";" : ","
		let textParts = text.split(separator)
		let bubbles = []

		for (let part of textParts) {
			part = part.trim()
			if (part.length !== 0) {
				let bubble = this.getBubbleFromText(part)
				if (!bubble) {
					return [] // if one recipient is invalid, we do not return any valid ones because all invalid text would be deleted otherwise
				} else {
					bubbles.push(bubble)
				}
			}
		}
		return bubbles
	}

	bubbleDeleted(bubble: Bubble<RecipientInfo>): void {
	}

	/**
	 * Retrieves a RecipientInfo instance from a text. The text may be a contact name, contact mail address or other mail address.
	 * @param text The text to create a RecipientInfo from.
	 * @return The recipient info or null if the text is not valid data.
	 */
	getBubbleFromText(text: string): ?Bubble<RecipientInfo> {
		text = text.trim()
		if (text === "") return null
		const nameAndMailAddress = stringToNameAndMailAddress(text)
		if (nameAndMailAddress) {
			let name = (nameAndMailAddress.name) ? nameAndMailAddress.name : null // name will be resolved with contact
			return this._bubbleFactory.createBubble(name, nameAndMailAddress.mailAddress, null)
		} else {
			return null
		}
	}
}
