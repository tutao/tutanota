//@flow
import type {Contact} from "../../api/entities/tutanota/Contact"
import {ContactTypeRef} from "../../api/entities/tutanota/Contact"
import {createRestriction} from "../../search/model/SearchUtils"
import {asyncFindAndMap} from "@tutao/tutanota-utils"
import {NotAuthorizedError, NotFoundError} from "../../api/common/error/RestError"
import {DbError} from "../../api/common/error/DbError"
import {EntityClient} from "../../api/common/EntityClient"
import {LazyLoaded} from "@tutao/tutanota-utils"
import type {LoginController} from "../../api/main/LoginController"
import type {ContactList} from "../../api/entities/tutanota/ContactList"
import {ContactListTypeRef} from "../../api/entities/tutanota/ContactList"
import {compareOldestFirst, elementIdPart, listIdPart} from "../../api/common/utils/EntityUtils";
import {flat, groupBy} from "@tutao/tutanota-utils"
import {ofClass, promiseMap} from "@tutao/tutanota-utils"
import type {SearchFacade} from "../../api/worker/search/SearchFacade"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

export interface ContactModel {
	/**
	 * Provides the first contact (starting with oldest contact) that contains the given email address. Uses the index search if available, otherwise loads all contacts.
	 */
	searchForContact(mailAddress: string): Promise<?Contact>;

	/** Id of the contact list. Is null for external users. */
	contactListId(): Promise<?Id>;

	searchForContacts(query: string, field: string, minSuggestionCount: number): Promise<Contact[]>;
}

export class ContactModelImpl implements ContactModel {
	_entityClient: EntityClient
	_searchFacade: SearchFacade
	_contactListId: LazyLoaded<?Id>;

	constructor(searchFacade: SearchFacade, entityClient: EntityClient, loginController: LoginController) {
		this._searchFacade = searchFacade
		this._entityClient = entityClient
		this._contactListId = lazyContactListId(loginController, this._entityClient)
	}

	contactListId(): Promise<?Id> {
		return this._contactListId.getAsync();
	}

	searchForContact(mailAddress: string): Promise<?Contact> {
		const cleanMailAddress = mailAddress.trim().toLowerCase()
		return this._searchFacade.search("\"" + cleanMailAddress + "\"", createRestriction("contact", null, null, "mailAddress", null), 0)
		           .then(result => {
			           // the result is sorted from newest to oldest, but we want to return the oldest first like before
			           result.results.sort(compareOldestFirst)
			           return asyncFindAndMap(result.results, contactId => {
				           return this._entityClient.load(ContactTypeRef, contactId)
				                      .then(contact => {
					                      // look for the exact match in the contacts
					                      return (contact.mailAddresses.find(a => a.address.trim().toLowerCase() === cleanMailAddress))
						                      ? contact
						                      : null
				                      })
				                      .catch(ofClass(NotFoundError, () => null))
				                      .catch(ofClass(NotAuthorizedError, () => null))
			           })
		           })
		           .catch(ofClass(DbError, async () => {
			           const listId = await this.contactListId()
			           if (listId) {
				           const contacts = await this._entityClient.loadAll(ContactTypeRef, listId)
				           return contacts.find(contact =>
					           contact.mailAddresses.some(a => a.address.trim().toLowerCase() === cleanMailAddress)
				           )
			           }
		           }))
	}

	/**
	 * @pre locator.search.indexState().indexingSupported
	 */
	async searchForContacts(query: string, field: string, minSuggestionCount: number): Promise<Contact[]> {
		const result = await this._searchFacade.search(query, createRestriction("contact", null, null, field, null), minSuggestionCount)
		const resultsByListId = groupBy(result.results, listIdPart)
		const loadedContacts = await promiseMap(resultsByListId, ([listId, idTuples]) => {
			// we try to load all contacts from the same list in one request
			return this._entityClient.loadMultipleEntities(ContactTypeRef, listId, idTuples.map(elementIdPart))
			           .catch(ofClass(NotAuthorizedError, e => {
				           console.log("tried to access contact without authorization", e)
				           return []
			           }))
		}, {concurrency: 3})
		return flat(loadedContacts)
	}
}

export function lazyContactListId(logins: LoginController, entityClient: EntityClient): LazyLoaded<?Id> {
	return new LazyLoaded(() => {
		return (entityClient)
			.loadRoot(ContactListTypeRef, logins.getUserController().user.userGroup.group)
			.then((contactList: ContactList) => {
				return contactList.contacts
			})
			.catch(ofClass(NotFoundError, e => {
				if (!logins.getUserController().isInternalUser()) {
					return null // external users have no contact list.
				} else {
					throw e
				}
			}))
	})
}