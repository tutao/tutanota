//@flow
import type {BubbleHandler} from "../gui/base/BubbleTextField"
import {Bubble} from "../gui/base/BubbleTextField"
import {isMailAddress} from "./FormatValidator"
import {DbError} from "../api/common/error/DbError"
import {loadAll} from "../api/main/Entity"
import type {Contact} from "../api/entities/tutanota/Contact"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {Mode} from "../api/common/Env"
import {stringToNameAndMailAddress} from "./Formatter"
import {ContactSuggestion, ContactSuggestionHeight} from "./ContactSuggestion"
import type {RecipientInfo} from "../api/common/RecipientInfo"
import type {ContactModel} from "../contacts/model/ContactModel"

export type RecipientInfoBubble = Bubble<RecipientInfo>

export interface RecipientInfoBubbleFactory {
	// Create a Recipient Info Bubble or none if invalid (ie. mailaddress already exists)
	createBubble(name: ?string, mailAddress: string, contact: ?Contact): Bubble<RecipientInfo>,

	// If the bubbleFactory also has to deal with state, then it probably wants to know when a bubble is deleted from the text field
	bubbleDeleted?: Bubble<RecipientInfo> => void
}

export class RecipientInfoBubbleHandler implements BubbleHandler<RecipientInfo, ContactSuggestion> {

	suggestionHeight: number;
	_bubbleFactory: RecipientInfoBubbleFactory;
	_contactModel: ContactModel

	constructor(bubbleFactory: RecipientInfoBubbleFactory, contactModel: ContactModel) {
		this._bubbleFactory = bubbleFactory
		this._contactModel = contactModel
		this.suggestionHeight = ContactSuggestionHeight
	}

	async getSuggestions(text: string): Promise<ContactSuggestion[]> {
		let query = text.trim().toLowerCase()
		if (isMailAddress(query, false)) {
			return Promise.resolve([])
		}

		// ensure match word order for email addresses mainly
		let contacts: Array<Contact> = await this._contactModel.searchForContacts("\"" + query + "\"", "recipient", 10)
		                                         .catch(DbError, () => {
			                                         return this._contactModel.contactListId().then(listId => loadAll(ContactTypeRef, listId))
		                                         })

		const suggestions = contacts
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

		if (env.mode === Mode.App) {
			await import("../native/main/ContactApp")
				.then(({findRecipients}) => findRecipients(query, 10, suggestions))
		}

		return suggestions.sort((suggestion1, suggestion2) =>
			suggestion1.name.localeCompare(suggestion2.name))
	}

	createBubbleFromSuggestion(suggestion: ContactSuggestion): ?Bubble<RecipientInfo> {
		return this._bubbleFactory.createBubble(suggestion.name, suggestion.mailAddress, suggestion.contact)
	}

	createBubblesFromText(text: string): Bubble<RecipientInfo>[] {
		let separator = (text.indexOf(";") !== -1) ? ";" : ","
		let textParts = text.split(separator)
		let bubbles = []

		for (let part of textParts) {
			part = part.trim()
			if (part.length !== 0) {
				let bubble = this._getBubbleFromText(part)
				if (!bubble) {
					// if text is copy pasted in then we may have already generated some bubbles, in which case the factory may or may not
					// need to know that we will be discarding them all (in the case of MailEditorRecipientField, it does need to know so it can delete any created recipients)
					bubbles.forEach(b => this.bubbleDeleted(b))
					return [] // if one recipient is invalid, we do not return any valid ones because all invalid text would be deleted otherwise
				} else {
					bubbles.push(bubble)
				}
			}
		}
		return bubbles
	}

	bubbleDeleted(bubble: Bubble<RecipientInfo>): void {
		this._bubbleFactory.bubbleDeleted && this._bubbleFactory.bubbleDeleted(bubble)
	}

	/**
	 * Retrieves a RecipientInfo instance from a text. The text may be a contact name, contact mail address or other mail address.
	 * @param text The text to create a RecipientInfo from.
	 * @return The recipient info or null if the text is not valid data.
	 */
	_getBubbleFromText(text: string): ?Bubble<RecipientInfo> {
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
