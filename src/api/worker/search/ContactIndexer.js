//@flow
import {NotFoundError, NotAuthorizedError} from "../../common/error/RestError"
import {ContactTypeRef, _TypeModel as ContactModel} from "../../entities/tutanota/Contact"
import {EntityWorker} from "../EntityWorker"
import type {SearchIndexEntry, Db, GroupData} from "./SearchTypes"
import {_createNewIndexUpdate} from "./SearchTypes"
import {neverNull} from "../../common/utils/Utils"
import {GroupDataOS, MetaDataOS} from "./DbFacade"
import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP} from "../../common/TutanotaConstants"
import {ContactListTypeRef} from "../../entities/tutanota/ContactList"
import {IndexerCore} from "./IndexerCore"

export class ContactIndexer {
	_core: IndexerCore;
	_db: Db;
	_entity: EntityWorker;

	constructor(core: IndexerCore, db: Db, entity: EntityWorker) {
		this._core = core
		this._db = db
		this._entity = entity
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
				value: () => contact.nickname,
			}, {
				attribute: ContactModel.values["role"],
				value: () => contact.role,
			}, {
				attribute: ContactModel.values["title"],
				value: () => contact.title,
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
			}])
		return keyToIndexEntries
	}

	processNewContact(event: EntityUpdate): Promise<?{contact: Contact, keyToIndexEntries: Map<string, SearchIndexEntry[]>}> {
		return this._entity.load(ContactTypeRef, [event.instanceListId, event.instanceId]).then(contact => {
			return {contact, keyToIndexEntries: this.createContactIndexEntries(contact)}
		}).catch(NotFoundError, () => {
			console.log("tried to index non existing contact")
			return null
		}).catch(NotAuthorizedError, () => {
			console.log("tried to index contact without permission")
			return null
		})
	}

	indexFullContactList(userGroupId: Id): Promise<void> {
		return this._entity.loadRoot(ContactListTypeRef, userGroupId).then((contactList: ContactList) => {
			let t = this._db.dbFacade.createTransaction(true, [MetaDataOS, GroupDataOS])
			let groupId = neverNull(contactList._ownerGroup)
			let indexUpdate = _createNewIndexUpdate(groupId)
			return t.get(GroupDataOS, groupId).then((groupData: GroupData) => {
				if (groupData.indexTimestamp == NOTHING_INDEXED_TIMESTAMP) {
					return this._entity.loadAll(ContactTypeRef, contactList.contacts).then(contacts => {
						contacts.forEach((contact) => {
							let keyToIndexEntries = this.createContactIndexEntries(contact)
							this._core.encryptSearchIndexEntries(contact._id, neverNull(contact._ownerGroup), keyToIndexEntries, indexUpdate)
						})
						indexUpdate.indexTimestamp = FULL_INDEXED_TIMESTAMP
						return this._core.writeIndexUpdate(indexUpdate)
					})
				}
			})
		}).catch(NotFoundError, e => {
			// external users have no contact list.
			return Promise.resolve()
		})
	}
}