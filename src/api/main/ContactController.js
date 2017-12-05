// @flow
import {assertMainOrNode} from "../Env"
import {ContactTypeRef} from "../entities/tutanota/Contact"
import {loadAll, loadRoot, load} from "./Entity"
import {ContactListTypeRef} from "../entities/tutanota/ContactList"
import {neverNull} from "../common/utils/Utils"
import {isSameTypeRef, isSameId} from "../common/EntityFunctions"
import type {OperationTypeEnum} from "../common/TutanotaConstants"
import {OperationType} from "../common/TutanotaConstants"
import {findAndRemove} from "../common/utils/ArrayUtils"
import {LazyLoaded} from "../common/utils/LazyLoaded"
import {logins} from "./LoginController"
import {NotFoundError} from "../common/error/RestError"
import type {EntityEventController} from "./EntityEventController"

assertMainOrNode()

export class ContactController {

	lazyContacts: LazyLoaded<Contact[]>;
	lazyContactListId: LazyLoaded<Id>;

	constructor(entityEvent: EntityEventController) {
		this.lazyContacts = new LazyLoaded(() => {
			return this.lazyContactListId.getAsync().then(contactListId => {
				if (contactListId != null) {
					return loadAll(ContactTypeRef, contactListId)
				} else {
					return []
				}
			})
		}, [])
		this.lazyContactListId = new LazyLoaded(() => {
			return loadRoot(ContactListTypeRef, logins.getUserController().user.userGroup.group).then((contactList: ContactList) => {
				return contactList.contacts
			}).catch(NotFoundError, e => {
				if (!logins.getUserController().isInternalUser()) {
					return null // external users have no contact list.
				} else {
					throw e
				}
			})
		})
		entityEvent.addListener((typeRef, listId, elementId, operation) => this.entityEventReceived(typeRef, listId, elementId, operation))
	}

	getFilteredDuplicateContacts(): Contact[] {
		let mailAddresses = []
		// we can call getLoaded() here because we have a default empty array
		return this.lazyContacts.getLoaded().filter(c => {
			let addresses = c.mailAddresses.map(ma => ma.address.trim().toLowerCase()).filter(a => a.length > 0)
			let duplicate = addresses.find(a => mailAddresses.indexOf(a) !== -1) != null
			if (duplicate || addresses.length === 0) {
				return false
			} else {
				mailAddresses.push(...addresses)
				return true
			}
		})
	}

	findContactByMailAddress(mailAddress: string): ?Contact {
		return this.getFilteredDuplicateContacts().find(c => c.mailAddresses.find(ma => ma.address.trim().toLowerCase() === mailAddress.trim().toLowerCase()) != null)
	}

	entityEventReceived(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum) {
		if (isSameTypeRef(typeRef, ContactTypeRef) && this.lazyContacts.isLoaded()) {
			if (isSameId(neverNull(listId), this.lazyContactListId.getLoaded())) {
				if (operation == OperationType.CREATE) {
					load(ContactTypeRef, [neverNull(listId), elementId]).then(contact => {
						this.lazyContacts.getLoaded().push(contact)
					})
				} else if (operation == OperationType.UPDATE) {
					load(ContactTypeRef, [neverNull(listId), elementId]).then(contact => {
						findAndRemove(this.lazyContacts.getLoaded(), c => isSameId(c._id[1], elementId))
						this.lazyContacts.getLoaded().push(contact)
					})
				} else if (operation == OperationType.DELETE) {
					findAndRemove(this.lazyContacts.getLoaded(), c => isSameId(c._id[1], elementId))
				}
			}
		}
	}
}