import o from "ospec"
import {ContactTypeRef, createContact} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import {ContactIndexer} from "../../../../src/api/worker/search/ContactIndexer"
import {createContactAddress} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import {createContactMailAddress} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import {createContactPhoneNumber} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import {createContactSocialId} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import {NotAuthorizedError, NotFoundError} from "../../../../src/api/common/error/RestError"
import {ContactListTypeRef, createContactList} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import {DbTransaction} from "../../../../src/api/worker/search/DbFacade"
import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../../../src/api/common/TutanotaConstants"
import {_createNewIndexUpdate, encryptIndexKeyBase64, typeRefToTypeInfo} from "../../../../src/api/worker/search/IndexUtils"
import type {EntityUpdate} from "../../../../src/api/entities/sys/TypeRefs.js"
import {createEntityUpdate} from "../../../../src/api/entities/sys/TypeRefs.js"
import {makeCore} from "../../TestUtils"
import {downcast} from "@tutao/tutanota-utils"
import {isSameId} from "../../../../src/api/common/utils/EntityUtils";
import {GroupDataOS} from "../../../../src/api/worker/search/Indexer"
import {fixedIv} from "@tutao/tutanota-crypto"
import {resolveTypeReference} from "../../../../src/api/common/EntityFunctions"


const dbMock: any = {iv: fixedIv}
const contactTypeInfo = typeRefToTypeInfo(ContactTypeRef)

o.spec("ContactIndexer test", () => {


	let suggestionFacadeMock
	o.beforeEach(function () {
		suggestionFacadeMock = ({} as any)
		suggestionFacadeMock.addSuggestions = o.spy()
		suggestionFacadeMock.store = o.spy(() => Promise.resolve())
	})


	o("createContactIndexEntries without entries", function () {
		let c = createContact()
		let contact = new ContactIndexer(makeCore(), (null as any), (null as any), suggestionFacadeMock)
		let keyToIndexEntries = contact.createContactIndexEntries(c)
		o(suggestionFacadeMock.addSuggestions.callCount).equals(1)
		o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("")
		o(keyToIndexEntries.size).equals(0)
	})

	o("createContactIndexEntries with one entry", function () {
		let c = createContact()
		c.company = "test"
		let contact = new ContactIndexer(makeCore(), (null as any), (null as any), suggestionFacadeMock)
		let keyToIndexEntries = contact.createContactIndexEntries(c)
		o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("")
		o(keyToIndexEntries.size).equals(1)

	})

	o("createContactIndexEntries", async function () {
		let core = ({createIndexEntriesForAttributes: o.spy()} as any)
		const contactIndexer = new ContactIndexer(core, dbMock, (null as any), suggestionFacadeMock)

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
		let attributeHandlers = core.createIndexEntriesForAttributes.args[1]
		o(args[0]).equals(c)
		let attributes = attributeHandlers.map(h => {
			return {attribute: h.attribute.id, value: h.value()}
		})
		const ContactModel = await resolveTypeReference(ContactTypeRef)
		o(attributes).deepEquals([
			{attribute: ContactModel.values["firstName"].id, value: "FN"},
			{attribute: ContactModel.values["lastName"].id, value: "LN"},
			{attribute: ContactModel.values["nickname"].id, value: "NN"},
			{attribute: ContactModel.values["role"].id, value: "R"},
			{attribute: ContactModel.values["title"].id, value: "T"},
			{attribute: ContactModel.values["comment"].id, value: "C"},
			{attribute: ContactModel.values["company"].id, value: "co"},
			{attribute: ContactModel.associations["addresses"].id, value: "A0,A1"},
			{attribute: ContactModel.associations["mailAddresses"].id, value: "MA0,MA1"},
			{attribute: ContactModel.associations["phoneNumbers"].id, value: "PN0,PN1"},
			{attribute: ContactModel.associations["socialIds"].id, value: ""},
		])
	})


	o("processNewContact", async function () {
		let contact = createContact()
		let keyToIndexEntries = new Map()

		let indexer = ({createIndexEntriesForAttributes: () => keyToIndexEntries} as any)
		let entity = ({
			load: o.spy(() => Promise.resolve(contact))
		} as any)


		const contactIndexer = new ContactIndexer(indexer, dbMock, entity, suggestionFacadeMock)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"} as any)
		const result = await contactIndexer.processNewContact(event)
		// @ts-ignore
		o(result).deepEquals({contact, keyToIndexEntries})
		// @ts-ignore
		o(contactIndexer._entity.load.args[0]).equals(ContactTypeRef)
		// @ts-ignore
		o(contactIndexer._entity.load.args[1]).deepEquals([event.instanceListId, event.instanceId])
		o(suggestionFacadeMock.addSuggestions.callCount).equals(1)
		o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("")
		o(suggestionFacadeMock.store.callCount).equals(1)

	})

	o("processNewContact catches NotFoundError", function () {
		let core = ({
			createIndexEntriesForAttributes: () => {
			}
		} as any)
		let entity = ({
			load: () => Promise.reject(new NotFoundError("blah"))
		} as any)
		const contactIndexer = new ContactIndexer(core, dbMock, entity, suggestionFacadeMock)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"} as any)
		return contactIndexer.processNewContact(event).then(result => {
			o(result).equals(null)
			o(suggestionFacadeMock.addSuggestions.callCount).equals(0)
		})
	})

	o("processNewContact catches NotAuthorizedError", function () {
		let indexer = ({
			createIndexEntriesForAttributes: () => {
			}
		} as any)
		let entity = ({
			load: () => Promise.reject(new NotAuthorizedError("blah"))
		} as any)
		const contactIndexer = new ContactIndexer(indexer, dbMock, entity, suggestionFacadeMock)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"} as any)
		return contactIndexer.processNewContact(event).then(result => {
			o(result).equals(null)
			o(suggestionFacadeMock.addSuggestions.callCount).equals(0)
		})
	})

	o("processNewContact passes other Errors", function () {
		let core = ({
			createIndexEntriesForAttributes: () => {
			}
		} as any)
		let entity = ({
			load: () => Promise.reject(new Error("blah"))
		} as any)
		const contactIndexer = new ContactIndexer(core, dbMock, entity, suggestionFacadeMock)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"} as any)
		return contactIndexer.processNewContact(event).catch(e => {
			o(suggestionFacadeMock.addSuggestions.callCount).equals(0)
		})
	})

	o("indexFullContactList", function () {
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
		} as any)
		const contactIndexer = new ContactIndexer(core, core.db, entity, suggestionFacadeMock)
		return contactIndexer.indexFullContactList(userGroupId).then(() => {
			// @ts-ignore
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
		})
	})

	o("indexFullContactList already indexed", function () {
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
		} as any)
		const contactIndexer = new ContactIndexer(core, core.db, entity, (null as any))
		return contactIndexer.indexFullContactList(userGroupId).then(() => {
			// @ts-ignore
			o(core.writeIndexUpdate.callCount).equals(0)
		})
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
		// @ts-ignore
		o(core._processDeleted.callCount).equals(0)
	})

	o("processEntityEvents update contact", function () {
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
		return indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate).then(() => {
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			o(indexUpdate.move.length).equals(0)
			// @ts-ignore
			o(core._processDeleted.callCount).equals(1)
			// @ts-ignore
			o(core._processDeleted.args).deepEquals([events[0], indexUpdate])
		})
	})

	o("processEntityEvents delete contact", function () {
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
		return indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate).then(() => {
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			// @ts-ignore
			o(core._processDeleted.callCount).equals(1)
			// @ts-ignore
			o(core._processDeleted.args).deepEquals([events[0], indexUpdate])
		})
	})

})

function createUpdate(type: OperationType, listId: Id, id: Id) {
	let update = createEntityUpdate()
	update.operation = type
	update.instanceListId = listId
	update.instanceId = id
	return update
}
