import type {Contact} from "../../api/entities/tutanota/TypeRefs.js"
import {ContactTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {createRestriction} from "../../search/model/SearchUtils"
import {flat, groupBy, LazyLoaded, ofClass, promiseMap} from "@tutao/tutanota-utils"
import {NotAuthorizedError, NotFoundError} from "../../api/common/error/RestError"
import {DbError} from "../../api/common/error/DbError"
import {EntityClient} from "../../api/common/EntityClient"
import type {LoginController} from "../../api/main/LoginController"
import type {ContactList} from "../../api/entities/tutanota/TypeRefs.js"
import {ContactListTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {compareOldestFirst, elementIdPart, listIdPart} from "../../api/common/utils/EntityUtils"
import type {SearchFacade} from "../../api/worker/search/SearchFacade"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

export interface ContactModel {
	/**
	 * Provides the first contact (starting with oldest contact) that contains the given email address. Uses the index search if available, otherwise loads all contacts.
	 */
	searchForContact(mailAddress: string): Promise<Contact | null>

	/** Id of the contact list. Is null for external users. */
	contactListId(): Promise<Id | null>

	searchForContacts(query: string, field: string, minSuggestionCount: number): Promise<Contact[]>
}

export class ContactModelImpl implements ContactModel {
	_entityClient: EntityClient
	_searchFacade: SearchFacade
	_contactListId: LazyLoaded<Id | null>

	constructor(searchFacade: SearchFacade, entityClient: EntityClient, loginController: LoginController) {
		this._searchFacade = searchFacade
		this._entityClient = entityClient
		this._contactListId = lazyContactListId(loginController, this._entityClient)
	}

	contactListId(): Promise<Id | null> {
		return this._contactListId.getAsync()
	}

	async searchForContact(mailAddress: string): Promise<Contact | null> {
		const cleanMailAddress = mailAddress.trim().toLowerCase()
		let result

		try {
			result = await this._searchFacade
							   .search(
								   '"' + cleanMailAddress + '"',
								   createRestriction(
									   "contact",
									   null,
									   null,
									   "mailAddress",
									   null
								   ),
								   0
							   )
		} catch (e) {
			// If IndexedDB is not supported or isn't working for some reason we load contacts from the server and
			// search manually.
			if (e instanceof DbError) {
				const listId = await this.contactListId()

				if (listId) {
					const contacts = await this._entityClient.loadAll(ContactTypeRef, listId)
					return contacts.find(
						contact => contact.mailAddresses.some(
							a => a.address.trim().toLowerCase() === cleanMailAddress)
					) ?? null
				} else {
					return null
				}
			} else {
				throw e
			}
		}
		// the result is sorted from newest to oldest, but we want to return the oldest first like before
		result.results.sort(compareOldestFirst)

		for (const contactId of result.results) {
			try {
				const contact = await this._entityClient
										  .load(ContactTypeRef, contactId)
				if (contact.mailAddresses.some(a => a.address.trim().toLowerCase() === cleanMailAddress)) {
					return contact
				}
			} catch (e) {
				if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
					continue
				} else {
					throw e
				}
			}
		}
		return null
	}

	/**
	 * @pre locator.search.indexState().indexingSupported
	 */
	async searchForContacts(query: string, field: string, minSuggestionCount: number): Promise<Contact[]> {
		const result = await this._searchFacade.search(query, createRestriction("contact", null, null, field, null), minSuggestionCount)
		const resultsByListId = groupBy(result.results, listIdPart)
		const loadedContacts = await promiseMap(
			resultsByListId,
			([listId, idTuples]) => {
				// we try to load all contacts from the same list in one request
				return this._entityClient.loadMultiple(ContactTypeRef, listId, idTuples.map(elementIdPart)).catch(
					ofClass(NotAuthorizedError, e => {
						console.log("tried to access contact without authorization", e)
						return []
					}),
				)
			},
			{
				concurrency: 3,
			},
		)
		return flat(loadedContacts)
	}
}

export function lazyContactListId(logins: LoginController, entityClient: EntityClient): LazyLoaded<Id | null> {
	return new LazyLoaded(() => {
		return entityClient
			.loadRoot(ContactListTypeRef, logins.getUserController().user.userGroup.group)
			.then((contactList: ContactList) => {
				return contactList.contacts
			})
			.catch(
				ofClass(NotFoundError, e => {
					if (!logins.getUserController().isInternalUser()) {
						return null // external users have no contact list.
					} else {
						throw e
					}
				}),
			)
	})
}