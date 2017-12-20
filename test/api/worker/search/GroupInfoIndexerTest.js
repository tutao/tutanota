// @flow
import o from "ospec/ospec.js"
import {
	createGroupInfo,
	_TypeModel as GroupInfoModel,
	GroupInfoTypeRef
} from "../../../../src/api/entities/sys/GroupInfo"
import {NotFoundError} from "../../../../src/api/common/error/RestError"
import type {Db, IndexUpdate} from "../../../../src/api/worker/search/SearchTypes"
import {GroupDataOS} from "../../../../src/api/worker/search/DbFacade"
import type {OperationTypeEnum} from "../../../../src/api/common/TutanotaConstants"
import {
	NOTHING_INDEXED_TIMESTAMP,
	FULL_INDEXED_TIMESTAMP,
	OperationType
} from "../../../../src/api/common/TutanotaConstants"
import {IndexerCore} from "../../../../src/api/worker/search/IndexerCore"
import {encryptIndexKeyBase64, _createNewIndexUpdate} from "../../../../src/api/worker/search/IndexUtils"
import {aes256RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {GroupInfoIndexer} from "../../../../src/api/worker/search/GroupInfoIndexer"
import {createMailAddressAlias} from "../../../../src/api/entities/sys/MailAddressAlias"
import {createUser} from "../../../../src/api/entities/sys/User"
import {createCustomer, CustomerTypeRef} from "../../../../src/api/entities/sys/Customer"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"
import {isSameId} from "../../../../src/api/common/EntityFunctions"

o.spec("GroupInfoIndexer test", () => {

	let suggestionFacadeMock
	o.beforeEach(function () {
		suggestionFacadeMock = ({}:any)
		suggestionFacadeMock.addSuggestions = o.spy()
		suggestionFacadeMock.store = o.spy(() => Promise.resolve())
	})


	o("createGroupInfoIndexEntries without entries", function () {
		let g = createGroupInfo()
		let indexer = new GroupInfoIndexer(new IndexerCore((null:any), (null:any)), (null:any), (null:any), suggestionFacadeMock)
		let keyToIndexEntries = indexer.createGroupInfoIndexEntries(g)
		o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("")
		o(keyToIndexEntries.size).equals(0)
	})

	o("createGroupInfoIndexEntries with one entry", function () {
		let g = createGroupInfo()
		g.name = "test"
		let indexer = new GroupInfoIndexer(new IndexerCore((null:any), (null:any)), (null:any), (null:any), suggestionFacadeMock)
		let keyToIndexEntries = indexer.createGroupInfoIndexEntries(g)
		o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("test")
		o(keyToIndexEntries.size).equals(1)
	})

	o("createGroupInfoIndexEntries", function () {
		let core = ({createIndexEntriesForAttributes: o.spy()}:any)
		let indexer = new GroupInfoIndexer(core, (null:any), (null:any), suggestionFacadeMock)

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

		o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("n,ma,ma0,ma1")

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
		const indexer = new GroupInfoIndexer(core, (null:any), entity, suggestionFacadeMock)
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
		const indexer = new GroupInfoIndexer(core, (null:any), entity, suggestionFacadeMock)
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
		const indexer = new GroupInfoIndexer(core, (null:any), entity, suggestionFacadeMock)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}:any)
		indexer.processNewGroupInfo(event).catch(Error, e => {
			done()
		})
	})

	o("indexAllUserAndTeamGroupInfosForAdmin", function (done) {
		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => transaction}}:any)
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()

		let userGroupId = "userGroupId"
		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].admin = true
		user.customer = "customer-id"

		let customer = createCustomer()
		customer.customerGroup = "customerGroupId"
		customer.userGroups = "userGroupsId"
		customer.teamGroups = "teamGroupsId"

		let userGroupInfo = createGroupInfo()
		userGroupInfo._id = [customer.userGroups, "ug"]

		let teamGroupInfo = createGroupInfo()
		teamGroupInfo._id = [customer.teamGroups, "tg"]

		let entity = ({
			load: (type, customerId) => {
				o(type).deepEquals(CustomerTypeRef)
				o(customerId).equals(user.customer)
				return Promise.resolve(customer)
			},
			loadAll: (type, listId) => {
				o(type).equals(GroupInfoTypeRef)
				if (listId == customer.userGroups) {
					return Promise.resolve([userGroupInfo])
				} else if (listId == customer.teamGroups) {
					return Promise.resolve([teamGroupInfo])
				}
				return Promise.reject("Wrong unexpected listId")
			}
		}:any)

		let groupData = {indexTimestamp: NOTHING_INDEXED_TIMESTAMP}
		let transaction = {
			get: (os, groupId) => {
				o(os).equals(GroupDataOS)
				o(groupId).equals(customer.customerGroup)
				return Promise.resolve(groupData)
			}
		}

		const indexer = new GroupInfoIndexer(core, db, entity, suggestionFacadeMock)
		indexer.indexAllUserAndTeamGroupInfosForAdmin(user).then(() => {
			o(core.writeIndexUpdate.callCount).equals(1)
			let indexUpdate: IndexUpdate = core.writeIndexUpdate.args[0]
			o(indexUpdate.indexTimestamp).equals(FULL_INDEXED_TIMESTAMP)
			o(indexUpdate.groupId).equals(customer.customerGroup)

			let expectedKeys = [encryptIndexKeyBase64(db.key, userGroupInfo._id[1]), encryptIndexKeyBase64(db.key, teamGroupInfo._id[1])]
			o(Array.from(indexUpdate.create.encInstanceIdToElementData.keys())).deepEquals(expectedKeys)
			o(suggestionFacadeMock.addSuggestions.callCount).equals(2)
		}).then(done)
	})

	o("indexAllUserAndTeamGroupInfosForAdmin not an admin", function (done) {
		let db: Db = ({key: aes256RandomKey(), dbFacade: {}}:any)
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()

		let userGroupId = "userGroupId"
		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].admin = false
		user.customer = "customer-id"


		const indexer = new GroupInfoIndexer(core, db, (null:any), suggestionFacadeMock)
		indexer.indexAllUserAndTeamGroupInfosForAdmin(user).then(() => {
			o(core.writeIndexUpdate.callCount).equals(0)
		}).then(done)
	})

	o("indexAllUserAndTeamGroupInfosForAdmin already indexed", function (done) {
		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => transaction}}:any)
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()

		let userGroupId = "userGroupId"
		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].admin = true
		user.customer = "customer-id"

		let customer = createCustomer()
		customer.customerGroup = "customerGroupId"
		customer.userGroups = "userGroupsId"
		customer.teamGroups = "teamGroupsId"

		let entity = ({
			load: (type, customerId) => {
				o(type).deepEquals(CustomerTypeRef)
				o(customerId).equals(user.customer)
				return Promise.resolve(customer)
			},
		}:any)

		let groupData = {indexTimestamp: FULL_INDEXED_TIMESTAMP}
		let transaction = {
			get: (os, groupId) => {
				o(os).equals(GroupDataOS)
				o(groupId).equals(customer.customerGroup)
				return Promise.resolve(groupData)
			}
		}

		const indexer = new GroupInfoIndexer(core, db, entity, suggestionFacadeMock)
		indexer.indexAllUserAndTeamGroupInfosForAdmin(user).then(() => {
			o(core.writeIndexUpdate.callCount).equals(0)
		}).then(done)
	})

	o("processEntityEvents do nothing if user is not an admin", function (done) {
		let db: any = {key: aes256RandomKey()}
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()

		const indexer = new GroupInfoIndexer(core, db, (null:any), suggestionFacadeMock)

		let indexUpdate = _createNewIndexUpdate("group-id")
		let events = [createUpdate(OperationType.CREATE, "groupInfo-list", "1"), createUpdate(OperationType.UPDATE, "groupInfo-list", "2"), createUpdate(OperationType.DELETE, "groupInfo-list", "3")]
		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].admin = false

		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, user).then(() => {
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			o(core._processDeleted.callCount).equals(0)
			o(suggestionFacadeMock.addSuggestions.callCount).equals(0)
			done()
		})
	})

	o("processEntityEvents new groupInfo", function (done) {
		let db: any = {key: aes256RandomKey()}
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()

		let groupInfo = createGroupInfo()
		groupInfo._id = ["groupInfo-list", "1"]
		let entity: any = {
			load: (type, id) => {
				if (type == GroupInfoTypeRef && isSameId(id, groupInfo._id)) return Promise.resolve(groupInfo)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			}
		}
		const indexer = new GroupInfoIndexer(core, db, entity, suggestionFacadeMock)

		let indexUpdate = _createNewIndexUpdate("group-id")
		let events = [createUpdate(OperationType.CREATE, "groupInfo-list", "1")]
		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].admin = true

		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, user).then(() => {
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			o(indexUpdate.move.length).equals(0)
			o(core._processDeleted.callCount).equals(0)
			done()
		})
	})

	o("processEntityEvents update groupInfo", function (done) {
		let db: any = {key: aes256RandomKey()}
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()

		let groupInfo = createGroupInfo()
		groupInfo._id = ["groupInfo-list", "1"]
		let entity: any = {
			load: (type, id) => {
				if (type == GroupInfoTypeRef && isSameId(id, groupInfo._id)) return Promise.resolve(groupInfo)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			}
		}
		const indexer = new GroupInfoIndexer(core, db, entity, suggestionFacadeMock)

		let indexUpdate = _createNewIndexUpdate("group-id")
		let events = [createUpdate(OperationType.UPDATE, "groupInfo-list", "1")]
		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].admin = true

		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, user).then(() => {
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			o(indexUpdate.move.length).equals(0)
			o(core._processDeleted.callCount).equals(1)
			o(core._processDeleted.args).deepEquals([events[0], indexUpdate])
			o(suggestionFacadeMock.addSuggestions.callCount).equals(1)
			o(suggestionFacadeMock.addSuggestions.callCount).equals(1)
			done()
		})
	})

	o("processEntityEvents delete groupInfo", function (done) {
		let db: any = {key: aes256RandomKey()}
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()

		let groupInfo = createGroupInfo()
		groupInfo._id = ["groupInfo-list", "1"]
		let entity: any = {
			load: (type, id) => {
				if (type == GroupInfoTypeRef && isSameId(id, groupInfo._id)) return Promise.resolve(groupInfo)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			}
		}
		const indexer = new GroupInfoIndexer(core, db, entity, suggestionFacadeMock)

		let indexUpdate = _createNewIndexUpdate("group-id")
		let events = [createUpdate(OperationType.DELETE, "groupInfo-list", "1")]
		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].admin = true

		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, user).then(() => {
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