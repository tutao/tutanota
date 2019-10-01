// @flow
import o from "ospec/ospec.js"
import {_TypeModel as ContactModel, ContactTypeRef, createContact} from "../../../../src/api/entities/tutanota/Contact"
import {ContactIndexer} from "../../../../src/api/worker/search/ContactIndexer"
import {createContactAddress} from "../../../../src/api/entities/tutanota/ContactAddress"
import {createContactMailAddress} from "../../../../src/api/entities/tutanota/ContactMailAddress"
import {createContactPhoneNumber} from "../../../../src/api/entities/tutanota/ContactPhoneNumber"
import {createContactSocialId} from "../../../../src/api/entities/tutanota/ContactSocialId"
import {NotAuthorizedError, NotFoundError} from "../../../../src/api/common/error/RestError"
import {ContactListTypeRef, createContactList} from "../../../../src/api/entities/tutanota/ContactList"
import {DbTransaction, GroupDataOS} from "../../../../src/api/worker/search/DbFacade"
import type {OperationTypeEnum} from "../../../../src/api/common/TutanotaConstants"
import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../../../src/api/common/TutanotaConstants"
import {_createNewIndexUpdate, encryptIndexKeyBase64, typeRefToTypeInfo} from "../../../../src/api/worker/search/IndexUtils"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"
import {isSameId} from "../../../../src/api/common/EntityFunctions"
import {fixedIv} from "../../../../src/api/worker/crypto/CryptoUtils"
import {makeCore} from "../../TestUtils"
import {downcast} from "../../../../src/api/common/utils/Utils"


const dbMock: any = {iv: fixedIv}
const contactTypeInfo = typeRefToTypeInfo(ContactTypeRef)

o.spec("ContactIndexer test", () => {


	let suggestionFacadeMock
	o.beforeEach(function () {
		suggestionFacadeMock = ({}: any)
		suggestionFacadeMock.addSuggestions = o.spy()
		suggestionFacadeMock.store = o.spy(() => Promise.resolve())
	})


	o("createContactIndexEntries without entries", function () {
		let c = createContact()
		let contact = new ContactIndexer(makeCore(), (null: any), (null: any), suggestionFacadeMock)
		let keyToIndexEntries = contact.createContactIndexEntries(c)
		o(suggestionFacadeMock.addSuggestions.callCount).equals(1)
		o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("")
		o(keyToIndexEntries.size).equals(0)
	})

	o("createContactIndexEntries with one entry", function () {
		let c = createContact()
		c.company = "test"
		let contact = new ContactIndexer(makeCore(), (null: any), (null: any), suggestionFacadeMock)
		let keyToIndexEntries = contact.createContactIndexEntries(c)
		o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("")
		o(keyToIndexEntries.size).equals(1)

	})

	o("createContactIndexEntries", function () {
		let core = ({createIndexEntriesForAttributes: o.spy()}: any)
		const contactIndexer = new ContactIndexer(core, dbMock, (null: any), suggestionFacadeMock)

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
		o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("fn,ln,ma0,ma1")
		let args = core.createIndexEntriesForAttributes.args
		let attributeHandlers = core.createIndexEntriesForAttributes.args[2]
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

		let indexer = ({createIndexEntriesForAttributes: () => keyToIndexEntries}: any)
		let entity = ({
			load: o.spy(() => Promise.resolve(contact))
		}: any)


		const contactIndexer = new ContactIndexer(indexer, dbMock, entity, suggestionFacadeMock)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}: any)
		contactIndexer.processNewContact(event).then(result => {
			o(result).deepEquals({contact, keyToIndexEntries})
			o(contactIndexer._entity.load.args[0]).equals(ContactTypeRef)
			o(contactIndexer._entity.load.args[1]).deepEquals([event.instanceListId, event.instanceId])
			o(suggestionFacadeMock.addSuggestions.callCount).equals(1)
			o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("")
			o(suggestionFacadeMock.store.callCount).equals(1)

		}).then(done)
	})

	o("processNewContact catches NotFoundError", function (done) {
		let core = ({
			createIndexEntriesForAttributes: () => {
			}
		}: any)
		let entity = ({
			load: () => Promise.reject(new NotFoundError("blah"))
		}: any)
		const contactIndexer = new ContactIndexer(core, dbMock, entity, suggestionFacadeMock)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}: any)
		contactIndexer.processNewContact(event).then(result => {
			o(result).equals(null)
			o(suggestionFacadeMock.addSuggestions.callCount).equals(0)
		}).then(done)
	})

	o("processNewContact catches NotAuthorizedError", function (done) {
		let indexer = ({
			createIndexEntriesForAttributes: () => {
			}
		}: any)
		let entity = ({
			load: () => Promise.reject(new NotAuthorizedError("blah"))
		}: any)
		const contactIndexer = new ContactIndexer(indexer, dbMock, entity, suggestionFacadeMock)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}: any)
		contactIndexer.processNewContact(event).then(result => {
			o(result).equals(null)
			o(suggestionFacadeMock.addSuggestions.callCount).equals(0)
		}).then(done)
	})

	o("processNewContact passes other Errors", function (done) {
		let core = ({
			createIndexEntriesForAttributes: () => {
			}
		}: any)
		let entity = ({
			load: () => Promise.reject(new Error("blah"))
		}: any)
		const contactIndexer = new ContactIndexer(core, dbMock, entity, suggestionFacadeMock)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}: any)
		contactIndexer.processNewContact(event).catch(Error, e => {
			o(suggestionFacadeMock.addSuggestions.callCount).equals(0)
			done()
		})
	})

	o("indexFullContactList", function (done) {
		let groupData = {indexTimestamp: NOTHING_INDEXED_TIMESTAMP}
		let transaction: DbTransaction = downcast({
			get: (os, groupId) => {
				if (os != GroupDataOS || groupId != contactList._ownerGroup) {
					throw new Error("unexpected params " + os + " " + groupId)
				}
				return Promise.resolve(groupData)
			}
		})

		const core = makeCore({transaction}, (mocked) => {
			mocked.writeIndexUpdate = o.spy()
		})


		let userGroupId = "userGroupId"
		let contactList = createContactList()
		contactList._ownerGroup = "ownerGroupId"
		contactList.contacts = "contactListId"


		let contacts = [createContact(), createContact()]
		contacts[0]._id = [contactList.contacts, "c0"]
		contacts[0]._ownerGroup = "c0owner"
		contacts[1]._id = [contactList.contacts, "c1"]
		contacts[1]._ownerGroup = "c1owner"

		let entity = ({
			loadRoot: (type, groupId) => {
				if (type != ContactListTypeRef || groupId != userGroupId) {
					throw new Error("unexpected params " + type
						+ " " + groupId)
				}
				return Promise.resolve(contactList)
			},
			loadAll: (type, listId) => {
				if (type != ContactTypeRef || listId != contactList.contacts) {
					throw new Error("unexpected params "
						+ type + " " + listId)
				}
				return Promise.resolve(contacts)
			}
		}: any)
		const contactIndexer = new ContactIndexer(core, core.db, entity, suggestionFacadeMock)
		contactIndexer.indexFullContactList(userGroupId).then(() => {
			const [[{groupId, indexTimestamp}], indexUpdate] = core.writeIndexUpdate.args
			o(indexTimestamp).equals(FULL_INDEXED_TIMESTAMP)
			o(groupId).equals(contactList._ownerGroup)
			let expectedKeys = [
				encryptIndexKeyBase64(core.db.key, contacts[0]._id[1], fixedIv),
				encryptIndexKeyBase64(core.db.key, contacts[1]._id[1], fixedIv)
			]
			o(Array.from(indexUpdate.create.encInstanceIdToElementData.keys())).deepEquals(expectedKeys)
			o(suggestionFacadeMock.addSuggestions.callCount).equals(contacts.length)
			o(suggestionFacadeMock.store.callCount).equals(1)
		}).then(done)
	})

	o("indexFullContactList already indexed", function (done) {
		let groupData = {indexTimestamp: FULL_INDEXED_TIMESTAMP}
		let transaction: DbTransaction = downcast({
			get: (os, groupId) => {
				if (os != GroupDataOS || groupId != contactList._ownerGroup) {
					throw new Error("unexpected params " + os
						+ " " + groupId)
				}
				return Promise.resolve(groupData)
			}
		})

		const core = makeCore({transaction}, (mocked) => {
			mocked.writeIndexUpdate = o.spy()
		})

		let userGroupId = "userGroupId"
		let contactList = createContactList()
		contactList._ownerGroup = "ownerGroupId"
		contactList.contacts = "contactListId"


		let contacts = [createContact(), createContact()]
		contacts[0]._id = [contactList.contacts, "c0"]
		contacts[0]._ownerGroup = "c0owner"
		contacts[1]._id = [contactList.contacts, "c1"]
		contacts[1]._ownerGroup = "c1owner"

		let entity = ({
			loadRoot: (type, groupId) => {
				if (type != ContactListTypeRef || groupId != userGroupId) {
					throw new Error("unexpected params " + type
						+ " " + groupId)
				}
				return Promise.resolve(contactList)
			},
			loadAll: (type, listId) => {
				throw new Error("should not be invoked as contacts are already indexed")
			}
		}: any)
		const contactIndexer = new ContactIndexer(core, core.db, entity, (null: any))
		contactIndexer.indexFullContactList(userGroupId).then(() => {
			o(core.writeIndexUpdate.callCount).equals(0)
		}).then(done)
	})

	o("processEntityEvents new contact", async function () {
		const core = makeCore({}, (mocked) => {
			mocked.writeIndexUpdate = o.spy()
			mocked._processDeleted = o.spy()
		})

		let contact = createContact()
		contact._id = ["contact-list", "L-dNNLe----0"]
		let entity: any = {
			load: (type, id) => {
				if (type == ContactTypeRef && isSameId(id, contact._id)) return Promise.resolve(contact)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			}
		}
		const indexer = new ContactIndexer(core, core.db, entity, suggestionFacadeMock)

		let indexUpdate = _createNewIndexUpdate(contactTypeInfo)
		let events = [createUpdate(OperationType.CREATE, "contact-list", "L-dNNLe----0")]
		await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate)
		// nothing changed
		o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
		o(indexUpdate.move.length).equals(0)
		o(core._processDeleted.callCount).equals(0)
	})

	o("processEntityEvents update contact", function (done) {
		const core = makeCore({}, (mocked) => {
			mocked.writeIndexUpdate = o.spy()
			mocked._processDeleted = o.spy()
		})

		let contact = createContact()
		contact._id = ["contact-list", "L-dNNLe----0"]
		let entity: any = {
			load: (type, id) => {
				if (type == ContactTypeRef && isSameId(id, contact._id)) return Promise.resolve(contact)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			}
		}
		const indexer = new ContactIndexer(core, core.db, entity, suggestionFacadeMock)

		let indexUpdate = _createNewIndexUpdate(contactTypeInfo)
		let events = [createUpdate(OperationType.UPDATE, "contact-list", "L-dNNLe----0")]
		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate).then(() => {
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			o(indexUpdate.move.length).equals(0)
			o(core._processDeleted.callCount).equals(1)
			o(core._processDeleted.args).deepEquals([events[0], indexUpdate])
			done()
		})
	})

	o("processEntityEvents delete contact", function (done) {
		const core = makeCore({}, (mocked) => {
			mocked.writeIndexUpdate = o.spy()
			mocked._processDeleted = o.spy()
		})

		let contact = createContact()
		contact._id = ["contact-list", "1"]
		let entity: any = {
			load: (type, id) => {
				if (type == ContactTypeRef && isSameId(id, contact._id)) return Promise.resolve(contact)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			}
		}
		const indexer = new ContactIndexer(core, core.db, entity, suggestionFacadeMock)

		let indexUpdate = _createNewIndexUpdate(contactTypeInfo)
		let events = [createUpdate(OperationType.DELETE, "contact-list", "1")]
		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate).then(() => {
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			o(core._processDeleted.callCount).equals(1)
			o(core._processDeleted.args).deepEquals([events[0], indexUpdate])
			done()
		})
	})

})

function createUpdate(type: OperationTypeEnum, listId: Id, id: Id) {
	let update = createEntityUpdate()
	update.operation = type
	update.instanceListId = listId
	update.instanceId = id
	return update
}
