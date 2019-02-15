//@flow
import {NotAuthorizedError, NotFoundError} from "../../common/error/RestError"
import {_TypeModel as ContactModel, ContactTypeRef} from "../../entities/tutanota/Contact"
import {EntityWorker} from "../EntityWorker"
import type {Db, GroupData, IndexUpdate, SearchIndexEntry} from "./SearchTypes"
import {_createNewIndexUpdate} from "./IndexUtils"
import {neverNull} from "../../common/utils/Utils"
import {GroupDataOS, MetaDataOS} from "./DbFacade"
import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../common/TutanotaConstants"
import {ContactListTypeRef} from "../../entities/tutanota/ContactList"
import {IndexerCore} from "./IndexerCore"
import {SuggestionFacade} from "./SuggestionFacade"
import {tokenize} from "./Tokenizer"

export class ContactIndexer {
	_core: IndexerCore;
	_db: Db;
	_entity: EntityWorker;
	suggestionFacade: SuggestionFacade<Contact>;

	constructor(core: IndexerCore, db: Db, entity: EntityWorker, suggestionFacade: SuggestionFacade<Contact>) {
		this._core = core
		this._db = db
		this._entity = entity
		this.suggestionFacade = suggestionFacade
	}


	createContactIndexEntries(contact: Contact): Map<string, SearchIndexEntry[]> {
		let keyToIndexEntries = this._core.createIndexEntriesForAttributes(ContactModel, contact, [
			{
				attribute: ContactModel.values["firstName"],
				value: () => contact.firstName
			}, {
				attribute: ContactModel.values["lastName"],
				value: () => contact.lastName,
			}, {
				attribute: ContactModel.values["nickname"],
				value: () => contact.nickname || "",
			}, {
				attribute: ContactModel.values["role"],
				value: () => contact.role,
			}, {
				attribute: ContactModel.values["title"],
				value: () => contact.title || "",
			}, {
				attribute: ContactModel.values["comment"],
				value: () => contact.comment,
			}, {
				attribute: ContactModel.values["company"],
				value: () => contact.company,
			}, {
				attribute: ContactModel.associations["addresses"],
				value: () => contact.addresses.map((a) => a.address).join(","),
			}, {
				attribute: ContactModel.associations["mailAddresses"],
				value: () => contact.mailAddresses.map(cma => cma.address).join(","),
			}, {
				attribute: ContactModel.associations["phoneNumbers"],
				value: () => contact.phoneNumbers.map(pn => pn.number).join(","),
			}, {
				attribute: ContactModel.associations["socialIds"],
				value: () => contact.socialIds.map(s => s.socialId).join(","),
			}
		])
		this.suggestionFacade.addSuggestions(this._getSuggestionWords(contact))
		return keyToIndexEntries
	}

	_getSuggestionWords(contact: Contact): string[] {
		return tokenize(contact.firstName + " " + contact.lastName + " " + contact.mailAddresses.map(ma => ma.address)
		                                                                          .join(" "))
	}

	processNewContact(event: EntityUpdate): Promise<?{contact: Contact, keyToIndexEntries: Map<string, SearchIndexEntry[]>}> {
		return this._entity.load(ContactTypeRef, [event.instanceListId, event.instanceId]).then(contact => {
			let keyToIndexEntries = this.createContactIndexEntries(contact)
			return this.suggestionFacade.store().then(() => {
				return {contact, keyToIndexEntries}
			})
		}).catch(NotFoundError, () => {
			console.log("tried to index non existing contact")
			return null
		}).catch(NotAuthorizedError, () => {
			console.log("tried to index contact without permission")
			return null
		})
	}

	/**
	 * Indexes the contact list if it is not yet indexed.
	 */
	indexFullContactList(userGroupId: Id): Promise<void> {
		return this._entity.loadRoot(ContactListTypeRef, userGroupId).then((contactList: ContactList) => {
			return this._db.dbFacade.createTransaction(true, [MetaDataOS, GroupDataOS]).then(t => {
				let groupId = neverNull(contactList._ownerGroup)
				let indexUpdate = _createNewIndexUpdate(groupId)
				return t.get(GroupDataOS, groupId).then((groupData: ?GroupData) => {
					if (groupData && groupData.indexTimestamp === NOTHING_INDEXED_TIMESTAMP) {
						return this._entity.loadAll(ContactTypeRef, contactList.contacts).then(contacts => {
							contacts.forEach((contact) => {
								let keyToIndexEntries = this.createContactIndexEntries(contact)
								this._core.encryptSearchIndexEntries(contact._id, neverNull(contact._ownerGroup), keyToIndexEntries, ContactModel, indexUpdate)
							})
							indexUpdate.indexTimestamp = FULL_INDEXED_TIMESTAMP
							return Promise.all([
								this._core.writeIndexUpdate(indexUpdate), this.suggestionFacade.store()
							])
						})
					}
				})
			})
		}).catch(NotFoundError, e => {
			// external users have no contact list.
			return Promise.resolve()
		})
	}

	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id, indexUpdate: IndexUpdate): Promise<void> {
		return Promise.each(events, (event, index) => {
			if (event.operation === OperationType.CREATE) {
				return this.processNewContact(event).then(result => {
					if (result) {
						this._core.encryptSearchIndexEntries(result.contact._id, neverNull(result.contact._ownerGroup), result.keyToIndexEntries, ContactModel,
							indexUpdate)
					}
				})
			} else if (event.operation === OperationType.UPDATE) {
				return Promise.all([
					this._core._processDeleted(event, indexUpdate),
					this.processNewContact(event).then(result => {
						if (result) {
							this._core.encryptSearchIndexEntries(result.contact._id, neverNull(result.contact._ownerGroup), result.keyToIndexEntries,
								ContactModel, indexUpdate)
						}
					})
				])
			} else if (event.operation === OperationType.DELETE) {
				return this._core._processDeleted(event, indexUpdate)
			}
		}).return()
	}
}