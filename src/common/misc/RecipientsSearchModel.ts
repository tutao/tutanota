import { PartialRecipient, Recipient } from "../api/common/recipients/Recipient.js"
import { RecipientsModel, ResolveMode } from "../api/main/RecipientsModel.js"
import { ContactListInfo, ContactModel } from "../contactsFunctionality/ContactModel.js"
import { isMailAddress } from "./FormatValidator.js"
import { ofClass } from "@tutao/tutanota-utils"
import { DbError } from "../api/common/error/DbError.js"
import { locator } from "../api/main/CommonLocator.js"
import { ContactListEntryTypeRef, ContactTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { LoginIncompleteError } from "../api/common/error/LoginIncompleteError.js"
import { findRecipientWithAddress } from "../api/common/utils/CommonCalendarUtils.js"
import { EntityClient } from "../api/common/EntityClient.js"
import { ContactSuggestion } from "../native/common/generatedipc/ContactSuggestion.js"

const MaxNativeSuggestions = 10

export type RecipientSearchResultItem = { type: "recipient"; value: Recipient } | { type: "contactlist"; value: ContactListInfo }
export type RecipientSearchResultFilter = (item: RecipientSearchResultItem) => boolean

export class RecipientsSearchModel {
	private searchResults: Array<RecipientSearchResultItem> = []
	private loading: Promise<void> | null = null

	private currentQuery = ""
	private previousQuery = ""
	private filter: RecipientSearchResultFilter | null = null

	constructor(
		private readonly recipientsModel: RecipientsModel,
		private readonly contactModel: ContactModel,
		private readonly suggestionsProvider: ((query: String) => Promise<readonly ContactSuggestion[]>) | null,
		private readonly entityClient: EntityClient,
	) {}

	results(): ReadonlyArray<RecipientSearchResultItem> {
		return this.searchResults
	}

	isLoading(): boolean {
		return this.loading != null
	}

	clear() {
		this.searchResults = []
		this.loading = null
		this.currentQuery = ""
		this.previousQuery = ""
	}

	async search(value: string): Promise<void> {
		const query = value.trim()

		this.currentQuery = query

		if (this.loading != null) {
		} else if (query.length > 0 && !(this.previousQuery.length > 0 && query.indexOf(this.previousQuery) === 0 && this.searchResults.length === 0)) {
			const [newContactListSuggestions, newContactSuggestions] = await Promise.all([
				this.findContactLists(query.toLowerCase()),
				this.findContacts(query.toLowerCase()),
			])
			if (query === this.currentQuery) {
				this.searchResults = [
					...newContactListSuggestions.map((value) => ({ type: "contactlist", value } satisfies RecipientSearchResultItem)),
					...newContactSuggestions.map((value) => ({ type: "recipient", value } satisfies RecipientSearchResultItem)),
				].filter(this.filter ?? ((_) => true))
				this.previousQuery = query
			}
			this.loading = null
		} else if (query.length === 0 && query !== this.previousQuery) {
			this.searchResults = []
			this.previousQuery = query
		}

		await this.loading
	}

	async resolveContactList(contactList: ContactListInfo): Promise<Array<Recipient>> {
		const entries = await this.entityClient.loadAll(ContactListEntryTypeRef, contactList.groupRoot.entries)
		return entries.map((entry) => {
			// it's okay to be lazy sometimes
			// all the places anyway resolve the recipients when they need to
			return this.recipientsModel.resolve({ address: entry.emailAddress }, ResolveMode.Lazy)
		})
	}

	setFilter(filter: RecipientSearchResultFilter | null) {
		this.filter = filter
	}

	private async findContacts(query: string): Promise<Array<Recipient>> {
		if (isMailAddress(query, false)) {
			return []
		}

		// ensure match word order for email addresses mainly
		const contacts = await this.contactModel
			.searchForContacts(`"${query}"`, "recipient", 10)
			.catch(
				ofClass(DbError, async () => {
					const listId = await this.contactModel.getContactListId()
					if (listId) {
						return locator.entityClient.loadAll(ContactTypeRef, listId)
					} else {
						return []
					}
				}),
			)
			.catch(ofClass(LoginIncompleteError, () => []))

		let suggestedRecipients: Array<Recipient> = []
		for (const contact of contacts) {
			const name = `${contact.firstName} ${contact.lastName}`.trim()

			const filter =
				name.toLowerCase().indexOf(query) !== -1
					? (address: string) => isMailAddress(address.trim(), false)
					: (address: string) => isMailAddress(address.trim(), false) && address.toLowerCase().indexOf(query) !== -1

			const recipientsOfContact = contact.mailAddresses
				.map(({ address }) => address)
				.filter(filter)
				.map((address) => this.recipientsModel.resolve({ name, address, contact }, ResolveMode.Lazy))

			suggestedRecipients = suggestedRecipients.concat(recipientsOfContact)
		}

		const additionalSuggestions = await this.findAdditionalSuggestions(query)

		const contactSuggestions = additionalSuggestions
			.filter((contact) => isMailAddress(contact.address, false) && !findRecipientWithAddress(suggestedRecipients, contact.address))
			.slice(0, MaxNativeSuggestions)
			.map((recipient) => this.recipientsModel.resolve(recipient, ResolveMode.Lazy))

		suggestedRecipients.push(...contactSuggestions)

		return suggestedRecipients.sort((suggestion1, suggestion2) => suggestion1.name.localeCompare(suggestion2.name))
	}

	private async findAdditionalSuggestions(text: string): Promise<Array<PartialRecipient>> {
		if (!this.suggestionsProvider) {
			return []
		}
		const recipients = await this.suggestionsProvider(text)
		return recipients.map(({ name, mailAddress }) => ({ name, address: mailAddress }))
	}

	private async findContactLists(text: string): Promise<ContactListInfo[]> {
		return this.contactModel.searchForContactLists(text)
	}
}
