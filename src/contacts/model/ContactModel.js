//@flow
import type {Contact} from "../../api/entities/tutanota/Contact"
import {ContactTypeRef} from "../../api/entities/tutanota/Contact"
import type {WorkerClient} from "../../api/main/WorkerClient"
import {createRestriction} from "../../search/model/SearchUtils"
import {asyncFindAndMap} from "../../api/common/utils/Utils"
import {NotAuthorizedError, NotFoundError} from "../../api/common/error/RestError"
import {DbError} from "../../api/common/error/DbError"
import {assertMainOrNode} from "../../api/common/Env"
import {EntityClient} from "../../api/common/EntityClient"
import {LazyLoaded} from "../../api/common/utils/LazyLoaded"
import type {LoginController} from "../../api/main/LoginController"
import type {ContactList} from "../../api/entities/tutanota/ContactList"
import {ContactListTypeRef} from "../../api/entities/tutanota/ContactList"
import {compareOldestFirst} from "../../api/common/utils/EntityUtils";

assertMainOrNode()

export interface ContactModel {
	searchForContact(mailAddress: string): Promise<?Contact>;

	contactListId(): Promise<Id>;

	searchForContacts(query: string, field: string, minSuggestionCount: number): Promise<Contact[]>;

	searchForContactByMailAddress(mailAddress: string): Promise<?Contact>;
}

export class ContactModelImpl implements ContactModel {
	_worker: WorkerClient;
	_entityClient: EntityClient
	_contactListId: LazyLoaded<Id>;

	constructor(worker: WorkerClient, entityClient: EntityClient, loginController: LoginController) {
		this._worker = worker
		this._entityClient = entityClient
		this._contactListId = lazyContactListId(loginController, this._entityClient)
	}

	contactListId(): Promise<Id> {
		return this._contactListId.getAsync();
	}

	searchForContact(mailAddress: string): Promise<?Contact> {
		const cleanMailAddress = mailAddress.trim().toLowerCase()
		return this._worker.search("\"" + cleanMailAddress + "\"", createRestriction("contact", null, null, "mailAddress", null), 0)
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
				                      .catch(NotFoundError, () => null)
				                      .catch(NotAuthorizedError, () => null)
			           })
		           })
		           .catch(DbError, () =>
			           this.contactListId()
			               .then(listId => this._entityClient.loadAll(ContactTypeRef, listId))
			               .then(contacts => {
				               return contacts.find(contact => contact.mailAddresses.find(a =>
					               a.address.trim().toLowerCase() === cleanMailAddress) != null)
			               }))
	}

	/**
	 * @pre locator.search.indexState().indexingSupported
	 */
	searchForContacts(query: string, field: string, minSuggestionCount: number): Promise<Contact[]> {
		return this._worker.search(query, createRestriction("contact", null, null, field, null), minSuggestionCount)
		             .then(result => {
			             // load one by one because they may be in different lists when we have different lists
			             return Promise.map(result.results, idTuple => {
				             return this._entityClient.load(ContactTypeRef, idTuple).catch(NotFoundError, e => {
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
	searchForContactByMailAddress(mailAddress: string): Promise<?Contact> {
		let cleanMailAddress = mailAddress.trim().toLowerCase()
		return this._worker.search("\"" + cleanMailAddress + "\"",
			createRestriction("contact", null, null, "mailAddress", null), 0).then(result => {
			// the result is sorted from newest to oldest, but we want to return the oldest first like before
			result.results.sort(compareOldestFirst)
			return asyncFindAndMap(result.results, contactId => {
				return this._entityClient.load(ContactTypeRef, contactId).then(contact => {
					// look for the exact match in the contacts
					return (contact.mailAddresses.find(a => a.address.trim().toLowerCase()
						=== cleanMailAddress)) ? contact : null
				}).catch(NotFoundError, e => {
					return null
				}).catch(NotAuthorizedError, e => {
					return null
				})
			})
		}).catch(DbError, () => {
			return this.contactListId().then(listId => this._entityClient.loadAll(ContactTypeRef, listId)).then(contacts => {
				return contacts.find(contact => contact.mailAddresses.find(a =>
					a.address.trim().toLowerCase() === cleanMailAddress) != null)
			})
		})
	}
}

export function lazyContactListId(logins: LoginController, entityClient: EntityClient): LazyLoaded<Id> {
	return new LazyLoaded(() => {
		return (entityClient)
			.loadRoot(ContactListTypeRef, logins.getUserController().user.userGroup.group)
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
}