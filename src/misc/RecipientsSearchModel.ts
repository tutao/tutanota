import {PartialRecipient, Recipient} from "../api/common/recipients/Recipient.js";
import {RecipientsModel, ResolveMode} from "../api/main/RecipientsModel.js";
import {ContactModel} from "../contacts/model/ContactModel.js";
import {isMailAddress} from "./FormatValidator.js";
import {ofClass} from "@tutao/tutanota-utils";
import {DbError} from "../api/common/error/DbError.js";
import {locator} from "../api/main/MainLocator.js";
import {ContactTypeRef} from "../api/entities/tutanota/TypeRefs.js";
import {isApp, Mode} from "../api/common/Env.js";
import {PermissionError} from "../api/common/error/PermissionError.js";
import {LoginIncompleteError} from "../api/common/error/LoginIncompleteError.js"
import {SystemFacade} from "../native/common/generatedipc/SystemFacade.js"

const MaxNativeSuggestions = 10

export class RecipientsSearchModel {

	private searchResults: Array<Recipient> = []
	private _selectedIdx: number = 0
	private loading: Promise<void> | null = null

	private currentQuery = ""
	private previousQuery = ""

	constructor(
		private readonly recipientsModel: RecipientsModel,
		private readonly contactModel: ContactModel,
		private readonly systemFacade: SystemFacade | null,
	) {
	}

	results(): ReadonlyArray<Recipient> {
		return this.searchResults
	}

	isLoading(): boolean {
		return this.loading != null
	}

	clear() {
		this.searchResults = []
		this._selectedIdx = 0
		this.loading = null
		this.currentQuery = ""
		this.previousQuery = ""
	}

	async search(value: string): Promise<void> {
		const query = value.trim()

		this.currentQuery = query

		if (this.loading != null) {
		} else if (query.length > 0 && !(this.previousQuery.length > 0 && query.indexOf(this.previousQuery) === 0 && this.searchResults.length === 0)) {
			this.loading = this.findContacts(query.toLowerCase()).then(async newSuggestions => {
				this.loading = null

				// Only update search result if search query has not been changed during search and update in all other cases
				if (query === this.currentQuery) {
					this.searchResults = newSuggestions
					this.previousQuery = query
				}
			})
		} else if (query.length === 0 && query !== this.previousQuery) {
			this.searchResults = []
			this.previousQuery = query
		}

		await this.loading
	}

	private async findContacts(query: string): Promise<Array<Recipient>> {

		if (isMailAddress(query, false)) {
			return []
		}

		// ensure match word order for email addresses mainly
		const contacts = await this.contactModel.searchForContacts(`"${query}"`, "recipient", 10).catch(
			ofClass(DbError, async () => {
				const listId = await this.contactModel.contactListId()
				if (listId) {
					return locator.entityClient.loadAll(ContactTypeRef, listId)
				} else {
					return []
				}
			}),
		).catch(ofClass(LoginIncompleteError, () => []))

		let suggestions = [] as Array<Recipient>
		for (const contact of contacts) {
			const name = `${contact.firstName} ${contact.lastName}`.trim()

			const filter = name.toLowerCase().indexOf(query) !== -1
				? (address: string) => isMailAddress(address.trim(), false)
				: (address: string) => isMailAddress(address.trim(), false) && address.toLowerCase().indexOf(query) !== -1

			const recipientsOfContact = contact.mailAddresses
											   .map(({address}) => address)
											   .filter(filter)
											   .map(address => this.recipientsModel.resolve({name, address, contact}, ResolveMode.Eager))

			suggestions = suggestions.concat(recipientsOfContact)
		}

		if (env.mode === Mode.App) {
			const nativeContacts = await this.findNativeContacts(query)

			const contactSuggestions = nativeContacts
				.filter(contact => isMailAddress(contact.address, false) && !suggestions.some(s => s.address === contact.address))
				.slice(0, MaxNativeSuggestions)
				.map(recipient => this.recipientsModel.resolve(recipient, ResolveMode.Lazy))

			suggestions.push(...contactSuggestions)
		}

		return suggestions.sort((suggestion1, suggestion2) => suggestion1.name.localeCompare(suggestion2.name))
	}

	private async findNativeContacts(text: string): Promise<Array<PartialRecipient>> {
		if (!this.systemFacade) {
			return []
		}
		const recipients = await this.systemFacade.findSuggestions(text).catch(ofClass(PermissionError, () => []))
		return recipients.map(({name, mailAddress}) => ({name, address: mailAddress}))
	}
}

export async function getRecipientsSearchModel(): Promise<RecipientsSearchModel> {
	const {locator} = await import("../api/main/MainLocator.js")
	const {recipientsModel, contactModel} = locator
	const systemFacade = isApp() ? locator.systemFacade : null
	return new RecipientsSearchModel(recipientsModel, contactModel, systemFacade)
}