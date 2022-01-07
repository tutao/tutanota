import {NotAuthorizedError, NotFoundError} from "../../common/error/RestError"
import type {Contact} from "../../entities/tutanota/Contact"
import {_TypeModel as ContactModel, ContactTypeRef} from "../../entities/tutanota/Contact"
import type {Db, GroupData, IndexUpdate, SearchIndexEntry} from "./SearchTypes"
import {_createNewIndexUpdate, typeRefToTypeInfo} from "./IndexUtils"
import {neverNull, noOp, ofClass, promiseMap} from "@tutao/tutanota-utils"
import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../common/TutanotaConstants"
import type {ContactList} from "../../entities/tutanota/ContactList"
import {ContactListTypeRef} from "../../entities/tutanota/ContactList"
import {IndexerCore} from "./IndexerCore"
import {SuggestionFacade} from "./SuggestionFacade"
import {tokenize} from "./Tokenizer"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import {EntityClient} from "../../common/EntityClient"
import {GroupDataOS, MetaDataOS} from "./Indexer"

export class ContactIndexer {
	_core: IndexerCore
	_db: Db
	_entity: EntityClient
	suggestionFacade: SuggestionFacade<Contact>

	constructor(core: IndexerCore, db: Db, entity: EntityClient, suggestionFacade: SuggestionFacade<Contact>) {
		this._core = core
		this._db = db
		this._entity = entity
		this.suggestionFacade = suggestionFacade
	}

	createContactIndexEntries(contact: Contact): Map<string, SearchIndexEntry[]> {
		let keyToIndexEntries = this._core.createIndexEntriesForAttributes(ContactModel, contact, [
			{
				attribute: ContactModel.values["firstName"],
				value: () => contact.firstName,
			},
			{
				attribute: ContactModel.values["lastName"],
				value: () => contact.lastName,
			},
			{
				attribute: ContactModel.values["nickname"],
				value: () => contact.nickname || "",
			},
			{
				attribute: ContactModel.values["role"],
				value: () => contact.role,
			},
			{
				attribute: ContactModel.values["title"],
				value: () => contact.title || "",
			},
			{
				attribute: ContactModel.values["comment"],
				value: () => contact.comment,
			},
			{
				attribute: ContactModel.values["company"],
				value: () => contact.company,
			},
			{
				attribute: ContactModel.associations["addresses"],
				value: () => contact.addresses.map(a => a.address).join(","),
			},
			{
				attribute: ContactModel.associations["mailAddresses"],
				value: () => contact.mailAddresses.map(cma => cma.address).join(","),
			},
			{
				attribute: ContactModel.associations["phoneNumbers"],
				value: () => contact.phoneNumbers.map(pn => pn.number).join(","),
			},
			{
				attribute: ContactModel.associations["socialIds"],
				value: () => contact.socialIds.map(s => s.socialId).join(","),
			},
		])

		this.suggestionFacade.addSuggestions(this._getSuggestionWords(contact))
		return keyToIndexEntries
	}

	_getSuggestionWords(contact: Contact): string[] {
		return tokenize(contact.firstName + " " + contact.lastName + " " + contact.mailAddresses.map(ma => ma.address).join(" "))
	}

	processNewContact(
		event: EntityUpdate,
	): Promise<| {
		contact: Contact
		keyToIndexEntries: Map<string, SearchIndexEntry[]>
	}
		| null
		| undefined> {
		return this._entity
				   .load(ContactTypeRef, [event.instanceListId, event.instanceId])
				   .then(contact => {
					   let keyToIndexEntries = this.createContactIndexEntries(contact)
					   return this.suggestionFacade.store().then(() => {
						   return {
							   contact,
							   keyToIndexEntries,
						   }
					   })
				   })
				   .catch(
					   ofClass(NotFoundError, () => {
						   console.log("tried to index non existing contact")
						   return null
					   }),
				   )
				   .catch(
					   ofClass(NotAuthorizedError, () => {
						   console.log("tried to index contact without permission")
						   return null
					   }),
				   )
	}

	/**
	 * Indexes the contact list if it is not yet indexed.
	 */
	indexFullContactList(userGroupId: Id): Promise<any> {
		return this._entity
				   .loadRoot(ContactListTypeRef, userGroupId)
				   .then((contactList: ContactList) => {
					   return this._db.dbFacade.createTransaction(true, [MetaDataOS, GroupDataOS]).then(t => {
						   let groupId = neverNull(contactList._ownerGroup)

						   let indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(ContactTypeRef))

						   return t.get(GroupDataOS, groupId).then((groupData: GroupData | null) => {
							   if (groupData && groupData.indexTimestamp === NOTHING_INDEXED_TIMESTAMP) {
								   return this._entity.loadAll(ContactTypeRef, contactList.contacts).then(contacts => {
									   contacts.forEach(contact => {
										   let keyToIndexEntries = this.createContactIndexEntries(contact)

										   this._core.encryptSearchIndexEntries(contact._id, neverNull(contact._ownerGroup), keyToIndexEntries, indexUpdate)
									   })
									   return Promise.all([
										   this._core.writeIndexUpdate(
											   [
												   {
													   groupId,
													   indexTimestamp: FULL_INDEXED_TIMESTAMP,
												   },
											   ],
											   indexUpdate,
										   ),
										   this.suggestionFacade.store(),
									   ])
								   })
							   }
						   })
					   })
				   })
				   .catch(
					   ofClass(NotFoundError, e => {
						   // external users have no contact list.
						   return Promise.resolve()
					   }),
				   )
	}

	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id, indexUpdate: IndexUpdate): Promise<void> {
		return promiseMap(events, async event => {
			if (event.operation === OperationType.CREATE) {
				await this.processNewContact(event).then(result => {
					if (result) {
						this._core.encryptSearchIndexEntries(result.contact._id, neverNull(result.contact._ownerGroup), result.keyToIndexEntries, indexUpdate)
					}
				})
			} else if (event.operation === OperationType.UPDATE) {
				await Promise.all([
					this._core._processDeleted(event, indexUpdate),
					this.processNewContact(event).then(result => {
						if (result) {
							this._core.encryptSearchIndexEntries(
								result.contact._id,
								neverNull(result.contact._ownerGroup),
								result.keyToIndexEntries,
								indexUpdate,
							)
						}
					}),
				])
			} else if (event.operation === OperationType.DELETE) {
				await this._core._processDeleted(event, indexUpdate)
			}
		}).then(noOp)
	}
}