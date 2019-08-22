//@flow
import type {Contact} from "../api/entities/tutanota/Contact"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import type {WorkerClient} from "../api/main/WorkerClient"
import {createRestriction} from "../search/SearchUtils"
import {compareOldestFirst} from "../api/common/EntityFunctions"
import {asyncFindAndMap} from "../api/common/utils/Utils"
import {load, loadAll} from "../api/main/Entity"
import {NotAuthorizedError, NotFoundError} from "../api/common/error/RestError"
import {DbError} from "../api/common/error/DbError"
import {LazyContactListId} from "./ContactUtils"
import {assertMainOrNode} from "../api/Env"

assertMainOrNode()

export interface ContactModel {
	searchForContact(mailAddress: string): Promise<?Contact>
}

export class ContactModelImpl implements ContactModel {
	_worker: WorkerClient;

	constructor(worker: WorkerClient) {
		this._worker = worker
	}

	searchForContact(mailAddress: string): Promise<?Contact> {
		const cleanMailAddress = mailAddress.trim().toLowerCase()
		return this._worker.search("\"" + cleanMailAddress + "\"", createRestriction("contact", null, null, "mailAddress", null), 0)
		           .then(result => {
			           // the result is sorted from newest to oldest, but we want to return the oldest first like before
			           result.results.sort(compareOldestFirst)
			           return asyncFindAndMap(result.results, contactId => {
				           return load(ContactTypeRef, contactId)
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
			           LazyContactListId.getAsync()
			                            .then(listId => loadAll(ContactTypeRef, listId))
			                            .then(contacts => {
				                            return contacts.find(contact => contact.mailAddresses.find(a =>
					                            a.address.trim().toLowerCase() === cleanMailAddress) != null)
			                            }))
	}
}