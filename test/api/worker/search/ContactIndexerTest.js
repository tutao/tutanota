// @flow
import o from "ospec/ospec.js"
import {createContact, _TypeModel as ContactModel, ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {Indexer} from "../../../../src/api/worker/search/Indexer"
import {ContactIndexer} from "../../../../src/api/worker/search/ContactIndexer"
import {createContactAddress} from "../../../../src/api/entities/tutanota/ContactAddress"
import {createContactMailAddress} from "../../../../src/api/entities/tutanota/ContactMailAddress"
import {createContactPhoneNumber} from "../../../../src/api/entities/tutanota/ContactPhoneNumber"
import {createContactSocialId} from "../../../../src/api/entities/tutanota/ContactSocialId"
import {NotFoundError, NotAuthorizedError} from "../../../../src/api/common/error/RestError"
import {createContactList, ContactListTypeRef} from "../../../../src/api/entities/tutanota/ContactList"
import type {Db, AttributeHandler, IndexUpdate, SearchIndexEntry} from "../../../../src/api/worker/search/SearchTypes"
import {GroupDataOS} from "../../../../src/api/worker/search/DbFacade"
import {NOTHING_INDEXED_TIMESTAMP, FULL_INDEXED_TIMESTAMP} from "../../../../src/api/common/TutanotaConstants"

o.spec("ContactIndexer test", () => {
	o("createContactIndexEntries without entries", function () {
		let c = createContact()
		const indexer = new Indexer(({}:any), ({}:any))
		let keyToIndexEntries = indexer._contactIndexer.createContactIndexEntries(c)
		o(keyToIndexEntries.size).equals(0)
	})

	o("createContactIndexEntries with one entry", function () {
		let c = createContact()
		c.company = "test"
		const indexer = new Indexer(({}:any), ({}:any))
		let keyToIndexEntries = indexer._contactIndexer.createContactIndexEntries(c)
		o(keyToIndexEntries.size).equals(1)
	})

	o("createContactIndexEntries", function () {
		let indexer = ({createIndexEntriesForAttributes: o.spy()}:any)
		const contactIndexer = new ContactIndexer(indexer, (null:any), (null:any))

		let addresses = [createContactAddress(), createContactAddress()]
		addresses[0].address = "A0"
		addresses[1].address = "A1"

		let mailAddresses = [createContactMailAddress(), createContactMailAddress()]
		mailAddresses[0].address = "MA0"
		mailAddresses[1].address = "MA1"

		let phoneNumbers = [createContactPhoneNumber(), createContactPhoneNumber()]
		phoneNumbers[0].number = "PN0"
		phoneNumbers[1].number = "PN1"


		let socialIds = [createContactSocialId(), createContactSocialId()]
		socialIds[0].socialId = "S0"
		socialIds[1].socialId = "S1"

		let c = createContact()
		c.firstName = "FN"
		c.lastName = "LN"
		c.nickname = "NN"
		c.role = "R"
		c.title = "T"
		c.comment = "C"
		c.company = "co"
		c.addresses = addresses
		c.mailAddresses = mailAddresses
		c.phoneNumbers = phoneNumbers
		c.socialIds = []

		contactIndexer.createContactIndexEntries(c)

		let args = indexer.createIndexEntriesForAttributes.args
		let attributeHandlers = indexer.createIndexEntriesForAttributes.args[2]
		o(args[0]).equals(ContactModel)
		o(args[1]).equals(c)
		let attributes = attributeHandlers.map(h => {
			return {attribute: h.attribute.name, value: h.value()}
		})
		o(attributes).deepEquals([
			{attribute: "firstName", value: "FN"},
			{attribute: "lastName", value: "LN"},
			{attribute: "nickname", value: "NN"},
			{attribute: "role", value: "R"},
			{attribute: "title", value: "T"},
			{attribute: "comment", value: "C"},
			{attribute: "company", value: "co"},
			{attribute: "addresses", value: "A0,A1"},
			{attribute: "mailAddresses", value: "MA0,MA1"},
			{attribute: "phoneNumbers", value: "PN0,PN1"},
			{attribute: "socialIds", value: ""},
		])
	})


	o("processNewContact", function (done) {
		let contact = createContact()
		let keyToIndexEntries = new Map()

		let indexer = ({createIndexEntriesForAttributes: () => keyToIndexEntries}:any)
		let entity = ({
			load: o.spy(() => Promise.resolve(contact))
		}:any)
		const contactIndexer = new ContactIndexer(indexer, (null:any), entity)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}:any)
		contactIndexer.processNewContact(event).then(result => {
			o(result).deepEquals({contact, keyToIndexEntries})
			o(contactIndexer._entity.load.args[0]).equals(ContactTypeRef)
			o(contactIndexer._entity.load.args[1]).deepEquals([event.instanceListId, event.instanceId])
		}).then(done)
	})

	o("processNewContact catches NotFoundError", function (done) {
		let indexer = ({
			createIndexEntriesForAttributes: () => {
			}
		}:any)
		let entity = ({
			load: () => Promise.reject(new NotFoundError("blah"))
		}:any)
		const contactIndexer = new ContactIndexer(indexer, (null:any), entity)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}:any)
		contactIndexer.processNewContact(event).then(result => {
			o(result).equals(null)
		}).then(done)
	})

	o("processNewContact catches NotAuthorizedError", function (done) {
		let indexer = ({
			createIndexEntriesForAttributes: () => {
			}
		}:any)
		let entity = ({
			load: () => Promise.reject(new NotAuthorizedError("blah"))
		}:any)
		const contactIndexer = new ContactIndexer(indexer, (null:any), entity)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}:any)
		contactIndexer.processNewContact(event).then(result => {
			o(result).equals(null)
		}).then(done)
	})

	o("processNewContact passes other Errors", function (done) {
		let indexer = ({
			createIndexEntriesForAttributes: () => {
			}
		}:any)
		let entity = ({
			load: () => Promise.reject(new Error("blah"))
		}:any)
		const contactIndexer = new ContactIndexer(indexer, (null:any), entity)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}:any)
		contactIndexer.processNewContact(event).catch(Error, e => {
			done()
		})
	})

	o("indexFullContactList", function (done) {
		let indexedContacts = []
		let encryptedSearchIndexEntryContacts = []
		let expectedIndexUpdate = null
		let indexer = ({
			encryptSearchIndexEntries: (id: IdTuple, ownerGroup: Id, keyToIndexEntries: Map<string, SearchIndexEntry[]>, indexUpdate: IndexUpdate) => {
				if (contacts.indexOf(keyToIndexEntries) == -1 || encryptedSearchIndexEntryContacts.indexOf(keyToIndexEntries) != -1) {
					throw new Error("unexpected encryptSearchIndexEntries invocation")
				}
				o(id).equals(((keyToIndexEntries:any):Contact)._id)
				if (expectedIndexUpdate != null) {
					o(indexUpdate).equals(expectedIndexUpdate)
				}
				expectedIndexUpdate = indexUpdate
			},
			_writeIndexUpdate: o.spy(),
			createIndexEntriesForAttributes: (model: TypeModel, instance: Object, attributes: AttributeHandler[]) => {
				indexedContacts.push(instance)
				return instance // we pass through the contact instance to simplify testing (is a keyToIndexEntries map in reality)
			}
		}:any)
		let userGroupId = "userGroupId"
		let contactList = createContactList()
		contactList._ownerGroup = "ownerGroupId"
		contactList.contacts = "contactListId"

		let groupData = {indexTimestamp: NOTHING_INDEXED_TIMESTAMP}
		let transaction = {
			get: (os, groupId) => {
				if (os != GroupDataOS || groupId != contactList._ownerGroup) throw new Error("unexpected params " + os + " " + groupId)
				return Promise.resolve(groupData)
			}
		}
		let db: Db = ({dbFacade: {createTransaction: () => transaction}}:any)

		let contacts = [createContact(), createContact()]
		contacts[0]._id = [contactList.contacts, "c0"]
		contacts[0]._ownerGroup = "c0owner"
		contacts[1]._id = [contactList.contacts, "c1"]
		contacts[1]._ownerGroup = "c1owner"

		let entity = ({
			loadRoot: (type, groupId) => {
				if (type != ContactListTypeRef || groupId != userGroupId) throw new Error("unexpected params " + type + " " + groupId)
				return Promise.resolve(contactList)
			},
			loadAll: (type, listId) => {
				if (type != ContactTypeRef || listId != contactList.contacts) throw new Error("unexpected params " + type + " " + listId)
				return Promise.resolve(contacts)
			}
		}:any)
		const contactIndexer = new ContactIndexer(indexer, db, entity)
		contactIndexer.indexFullContactList(userGroupId).then(() => {
			let indexUpdate = indexer._writeIndexUpdate.args[0]
			o(indexUpdate.indexTimestamp = FULL_INDEXED_TIMESTAMP)
			o(indexUpdate).equals(expectedIndexUpdate)
		}).then(done)
	})

	o("indexFullContactList already indexed", function (done) {
		let expectedIndexUpdate = null
		let indexer = ({
			encryptSearchIndexEntries: (id: IdTuple, ownerGroup: Id, keyToIndexEntries: Map<string, SearchIndexEntry[]>, indexUpdate: IndexUpdate) => {
				throw new Error("should not be invoked as contacts are already indexed")
			},
			_writeIndexUpdate: o.spy(),
			createIndexEntriesForAttributes: (model: TypeModel, instance: Object, attributes: AttributeHandler[]) => {
				throw new Error("should not be invoked as contacts are already indexed")
			}
		}:any)
		let userGroupId = "userGroupId"
		let contactList = createContactList()
		contactList._ownerGroup = "ownerGroupId"
		contactList.contacts = "contactListId"

		let groupData = {indexTimestamp: FULL_INDEXED_TIMESTAMP}
		let transaction = {
			get: (os, groupId) => {
				if (os != GroupDataOS || groupId != contactList._ownerGroup) throw new Error("unexpected params " + os + " " + groupId)
				return Promise.resolve(groupData)
			}
		}
		let db: Db = ({dbFacade: {createTransaction: () => transaction}}:any)

		let contacts = [createContact(), createContact()]
		contacts[0]._id = [contactList.contacts, "c0"]
		contacts[0]._ownerGroup = "c0owner"
		contacts[1]._id = [contactList.contacts, "c1"]
		contacts[1]._ownerGroup = "c1owner"

		let entity = ({
			loadRoot: (type, groupId) => {
				if (type != ContactListTypeRef || groupId != userGroupId) throw new Error("unexpected params " + type + " " + groupId)
				return Promise.resolve(contactList)
			},
			loadAll: (type, listId) => {
				throw new Error("should not be invoked as contacts are already indexed")
			}
		}:any)
		const contactIndexer = new ContactIndexer(indexer, db, entity)
		contactIndexer.indexFullContactList(userGroupId).then(() => {
			o(indexer._writeIndexUpdate.callCount).equals(0)
		}).then(done)
	})

})
