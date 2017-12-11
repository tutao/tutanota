// @flow
import o from "ospec/ospec.js"
import {createContact, ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {
	createGroupInfo,
	_TypeModel as GroupInfoModel,
	GroupInfoTypeRef
} from "../../../../src/api/entities/sys/GroupInfo"
import {ContactIndexer} from "../../../../src/api/worker/search/ContactIndexer"
import {NotFoundError} from "../../../../src/api/common/error/RestError"
import {createContactList, ContactListTypeRef} from "../../../../src/api/entities/tutanota/ContactList"
import type {Db, IndexUpdate} from "../../../../src/api/worker/search/SearchTypes"
import {GroupDataOS} from "../../../../src/api/worker/search/DbFacade"
import {NOTHING_INDEXED_TIMESTAMP, FULL_INDEXED_TIMESTAMP} from "../../../../src/api/common/TutanotaConstants"
import {IndexerCore} from "../../../../src/api/worker/search/IndexerCore"
import {encryptIndexKey} from "../../../../src/api/worker/search/IndexUtils"
import {aes256RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {uint8ArrayToBase64} from "../../../../src/api/common/utils/Encoding"
import {GroupInfoIndexer} from "../../../../src/api/worker/search/GroupInfoIndexer"
import {createMailAddressAlias} from "../../../../src/api/entities/sys/MailAddressAlias"

o.spec("GroupInfoIndexer test", () => {
	o("createGroupInfoIndexEntries without entries", function () {
		let g = createGroupInfo()
		let indexer = new GroupInfoIndexer(new IndexerCore((null:any)), (null:any), (null:any))
		let keyToIndexEntries = indexer.createGroupInfoIndexEntries(g)
		o(keyToIndexEntries.size).equals(0)
	})

	o("createGroupInfoIndexEntries with one entry", function () {
		let g = createGroupInfo()
		g.name = "test"
		let indexer = new GroupInfoIndexer(new IndexerCore((null:any)), (null:any), (null:any))
		let keyToIndexEntries = indexer.createGroupInfoIndexEntries(g)
		o(keyToIndexEntries.size).equals(1)
	})

	o("createGroupInfoIndexEntries", function () {
		let core = ({createIndexEntriesForAttributes: o.spy()}:any)
		let indexer = new GroupInfoIndexer(core, (null:any), (null:any))

		let mailAddressAliases = [createMailAddressAlias(), createMailAddressAlias()]
		mailAddressAliases[0].mailAddress = "MA0"
		mailAddressAliases[1].mailAddress = "MA1"

		let g = createGroupInfo()
		g.name = "N"
		g.mailAddress = "MA"
		g.mailAddressAliases = mailAddressAliases
		g.created = new Date()
		g.deleted = undefined

		indexer.createGroupInfoIndexEntries(g)

		let args = core.createIndexEntriesForAttributes.args
		let attributeHandlers = core.createIndexEntriesForAttributes.args[2]
		o(args[0]).equals(GroupInfoModel)
		o(args[1]).equals(g)
		let attributes = attributeHandlers.map(h => {
			return {attribute: h.attribute.name, value: h.value()}
		})
		o(JSON.stringify(attributes)).deepEquals(JSON.stringify([
			{attribute: "name", value: "N"},
			{attribute: "mailAddress", value: "MA"},
			{attribute: "mailAddressAliases", value: "MA0,MA1"},
		]))
	})


	o("processNewGroupInfo", function (done) {
		let groupInfo = createGroupInfo()
		let keyToIndexEntries = new Map()

		let core = ({createIndexEntriesForAttributes: () => keyToIndexEntries}:any)
		let entity = ({
			load: o.spy(() => Promise.resolve(groupInfo))
		}:any)
		const indexer = new GroupInfoIndexer(core, (null:any), entity)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}:any)
		indexer.processNewGroupInfo(event).then(result => {
			o(result).deepEquals({groupInfo, keyToIndexEntries})
			o(indexer._entity.load.args[0]).equals(GroupInfoTypeRef)
			o(indexer._entity.load.args[1]).deepEquals([event.instanceListId, event.instanceId])
		}).then(done)
	})

	o("processNewGroupInfo catches NotFoundError", function (done) {
		let core = ({
			createIndexEntriesForAttributes: () => {
			}
		}:any)
		let entity = ({
			load: () => Promise.reject(new NotFoundError("blah"))
		}:any)
		const indexer = new GroupInfoIndexer(core, (null:any), entity)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}:any)
		indexer.processNewGroupInfo(event).then(result => {
			o(result).equals(null)
		}).then(done)
	})

	o("processNewGroupInfo passes other Errors", function (done) {
		let core = ({
			createIndexEntriesForAttributes: () => {
			}
		}:any)
		let entity = ({
			load: () => Promise.reject(new Error("blah"))
		}:any)
		const indexer = new GroupInfoIndexer(core, (null:any), entity)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}:any)
		indexer.processNewGroupInfo(event).catch(Error, e => {
			done()
		})
	})

	// TODO

	o("indexAllUserAndTeamGroupInfosForAdmin", function (done) {
		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => transaction}}:any)
		let core: any = new IndexerCore(db)
		core.writeIndexUpdate = o.spy()

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
		const contactIndexer = new ContactIndexer(core, db, entity)
		contactIndexer.indexFullContactList(userGroupId).then(() => {
			let indexUpdate: IndexUpdate = core.writeIndexUpdate.args[0]
			o(indexUpdate.indexTimestamp).equals(FULL_INDEXED_TIMESTAMP)
			let expectedKeys = [uint8ArrayToBase64(encryptIndexKey(db.key, contacts[0]._id[1])), uint8ArrayToBase64(encryptIndexKey(db.key, contacts[1]._id[1]))]
			o(Array.from(indexUpdate.create.encInstanceIdToElementData.keys())).deepEquals(expectedKeys)
		}).then(done)
	})

	o("indexAllUserAndTeamGroupInfosForAdmin already indexed", function (done) {
		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => transaction}}:any)
		let core: any = new IndexerCore(db)
		core.writeIndexUpdate = o.spy()

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
		const contactIndexer = new ContactIndexer(core, db, entity)
		contactIndexer.indexFullContactList(userGroupId).then(() => {
			o(core.writeIndexUpdate.callCount).equals(0)
		}).then(done)
	})

})
