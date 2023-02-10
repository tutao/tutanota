import o from "ospec"
import type { EntityUpdate } from "../../../../../src/api/entities/sys/TypeRefs.js"
import {
	createCustomer,
	createEntityUpdate,
	createGroupInfo,
	createGroupMembership,
	createMailAddressAlias,
	createUser,
	CustomerTypeRef,
	GroupInfoTypeRef,
} from "../../../../../src/api/entities/sys/TypeRefs.js"
import { NotFoundError } from "../../../../../src/api/common/error/RestError.js"
import type { Db } from "../../../../../src/api/worker/search/SearchTypes.js"
import { FULL_INDEXED_TIMESTAMP, GroupType, NOTHING_INDEXED_TIMESTAMP, OperationType } from "../../../../../src/api/common/TutanotaConstants.js"
import { IndexerCore } from "../../../../../src/api/worker/search/IndexerCore.js"
import { _createNewIndexUpdate, encryptIndexKeyBase64, typeRefToTypeInfo } from "../../../../../src/api/worker/search/IndexUtils.js"
import { GroupInfoIndexer } from "../../../../../src/api/worker/search/GroupInfoIndexer.js"
import { browserDataStub } from "../../../TestUtils.js"
import { isSameId } from "../../../../../src/api/common/utils/EntityUtils.js"
import { aes256RandomKey, fixedIv } from "@tutao/tutanota-crypto"
import { resolveTypeReference } from "../../../../../src/api/common/EntityFunctions.js"
import { GroupDataOS } from "../../../../../src/api/worker/search/IndexTables.js"

const dbMock: any = {
	iv: fixedIv,
}
const groupTypeInfo = typeRefToTypeInfo(GroupInfoTypeRef)
o.spec("GroupInfoIndexer test", function () {
	let suggestionFacadeMock
	o.beforeEach(function () {
		suggestionFacadeMock = {} as any
		suggestionFacadeMock.addSuggestions = o.spy()
		suggestionFacadeMock.store = o.spy(() => Promise.resolve())
	})
	o("createGroupInfoIndexEntries without entries", function () {
		let g = createGroupInfo()
		let indexer = new GroupInfoIndexer(new IndexerCore(dbMock, null as any, browserDataStub), null as any, null as any, suggestionFacadeMock)
		let keyToIndexEntries = indexer.createGroupInfoIndexEntries(g)
		o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("")
		o(keyToIndexEntries.size).equals(0)
	})
	o("createGroupInfoIndexEntries with one entry", function () {
		let g = createGroupInfo()
		g.name = "test"
		let indexer = new GroupInfoIndexer(new IndexerCore(dbMock, null as any, browserDataStub), null as any, null as any, suggestionFacadeMock)
		let keyToIndexEntries = indexer.createGroupInfoIndexEntries(g)
		o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("test")
		o(keyToIndexEntries.size).equals(1)
	})
	o("createGroupInfoIndexEntries", async function () {
		let core = {
			createIndexEntriesForAttributes: o.spy(),
		} as any
		let indexer = new GroupInfoIndexer(core, dbMock, null as any, suggestionFacadeMock)
		let mailAddressAliases = [createMailAddressAlias(), createMailAddressAlias()]
		mailAddressAliases[0].mailAddress = "MA0"
		mailAddressAliases[1].mailAddress = "MA1"
		let g = createGroupInfo()
		g.name = "N"
		g.mailAddress = "MA"
		g.mailAddressAliases = mailAddressAliases
		g.created = new Date()
		g.deleted = null
		indexer.createGroupInfoIndexEntries(g)
		o(suggestionFacadeMock.addSuggestions.args[0].join(",")).equals("n,ma,ma0,ma1")
		let args = core.createIndexEntriesForAttributes.args
		let attributeHandlers = core.createIndexEntriesForAttributes.args[1]
		o(args[0]).equals(g)
		let attributes = attributeHandlers.map((h) => {
			return {
				attribute: h.attribute.id,
				value: h.value(),
			}
		})
		const GroupInfoModel = await resolveTypeReference(GroupInfoTypeRef)
		o(JSON.stringify(attributes)).equals(
			JSON.stringify([
				{
					attribute: GroupInfoModel.values["name"].id,
					value: "N",
				},
				{
					attribute: GroupInfoModel.values["mailAddress"].id,
					value: "MA",
				},
				{
					attribute: GroupInfoModel.associations["mailAddressAliases"].id,
					value: "MA0,MA1",
				},
			]),
		)
	})
	o("processNewGroupInfo", function () {
		let groupInfo = createGroupInfo()
		let keyToIndexEntries = new Map()
		let core = {
			createIndexEntriesForAttributes: () => keyToIndexEntries,
		} as any
		let entity = {
			load: o.spy(() => Promise.resolve(groupInfo)),
		} as any
		const indexer = new GroupInfoIndexer(core, dbMock, entity, suggestionFacadeMock)
		let event: EntityUpdate = {
			instanceListId: "lid",
			instanceId: "eid",
		} as any
		return indexer.processNewGroupInfo(event).then((result) => {
			o(result!).deepEquals({
				groupInfo,
				keyToIndexEntries,
			})
			// @ts-ignore
			o(indexer._entity.load.args[0]).equals(GroupInfoTypeRef)
			// @ts-ignore
			o(indexer._entity.load.args[1]).deepEquals([event.instanceListId, event.instanceId])
		})
	})
	o("processNewGroupInfo catches NotFoundError", function () {
		let core = {
			createIndexEntriesForAttributes: () => {},
		} as any
		let entity = {
			load: () => Promise.reject(new NotFoundError("blah")),
		} as any
		const indexer = new GroupInfoIndexer(core, dbMock, entity, suggestionFacadeMock)
		let event: EntityUpdate = {
			instanceListId: "lid",
			instanceId: "eid",
		} as any
		return indexer.processNewGroupInfo(event).then((result) => {
			o(result).equals(null)
		})
	})
	o("processNewGroupInfo passes other Errors", function (done) {
		let core = {
			createIndexEntriesForAttributes: () => {},
		} as any
		let entity = {
			load: () => Promise.reject(new Error("blah")),
		} as any
		const indexer = new GroupInfoIndexer(core, dbMock, entity, suggestionFacadeMock)
		let event: EntityUpdate = {
			instanceListId: "lid",
			instanceId: "eid",
		} as any
		indexer.processNewGroupInfo(event).catch((e) => {
			done()
		})
	})
	o("indexAllUserAndTeamGroupInfosForAdmin", function () {
		let db: Db = {
			key: aes256RandomKey(),
			dbFacade: {
				createTransaction: () => Promise.resolve(transaction),
			},
			iv: fixedIv,
		} as any
		let core: any = new IndexerCore(
			db,
			{
				queueEvents: false,
			} as any,
			browserDataStub,
		)
		core.writeIndexUpdate = o.spy()
		let userGroupId = "userGroupId"
		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].groupType = GroupType.Admin
		user.customer = "customer-id"
		let customer = createCustomer()
		customer.customerGroup = "customerGroupId"
		customer.userGroups = "userGroupsId"
		customer.teamGroups = "teamGroupsId"
		let userGroupInfo = createGroupInfo()
		userGroupInfo._id = [customer.userGroups, "ug"]
		let teamGroupInfo = createGroupInfo()
		teamGroupInfo._id = [customer.teamGroups, "tg"]
		let entity = {
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
			},
		} as any
		let groupData = {
			indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
		}
		let transaction = {
			get: (os, groupId) => {
				o(os).equals(GroupDataOS)
				o(groupId).equals(customer.customerGroup)
				return Promise.resolve(groupData)
			},
		}
		const indexer = new GroupInfoIndexer(core, db, entity, suggestionFacadeMock)
		return indexer.indexAllUserAndTeamGroupInfosForAdmin(user).then(() => {
			o(core.writeIndexUpdate.callCount).equals(1)
			const [[{ groupId, indexTimestamp }], indexUpdate] = core.writeIndexUpdate.args
			o(indexTimestamp).equals(FULL_INDEXED_TIMESTAMP)
			o(groupId).equals(customer.customerGroup)
			let expectedKeys = [encryptIndexKeyBase64(db.key, userGroupInfo._id[1], fixedIv), encryptIndexKeyBase64(db.key, teamGroupInfo._id[1], fixedIv)]
			o(Array.from(indexUpdate.create.encInstanceIdToElementData.keys())).deepEquals(expectedKeys)
			o(suggestionFacadeMock.addSuggestions.callCount).equals(2)
		})
	})
	o("indexAllUserAndTeamGroupInfosForAdmin not an admin", function () {
		let db: Db = {
			key: aes256RandomKey(),
			dbFacade: {},
			iv: fixedIv,
		} as any
		let core: any = new IndexerCore(
			db,
			{
				queueEvents: false,
			} as any,
			browserDataStub,
		)
		core.writeIndexUpdate = o.spy()
		let userGroupId = "userGroupId"
		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].groupType = GroupType.User
		user.customer = "customer-id"
		const indexer = new GroupInfoIndexer(core, db, null as any, suggestionFacadeMock)
		return indexer.indexAllUserAndTeamGroupInfosForAdmin(user).then(() => {
			o(core.writeIndexUpdate.callCount).equals(0)
		})
	})
	o("indexAllUserAndTeamGroupInfosForAdmin already indexed", function () {
		let db: Db = {
			key: aes256RandomKey(),
			dbFacade: {
				createTransaction: () => Promise.resolve(transaction),
			},
			iv: fixedIv,
		} as any
		let core: any = new IndexerCore(
			db,
			{
				queueEvents: false,
			} as any,
			browserDataStub,
		)
		core.writeIndexUpdate = o.spy()
		let userGroupId = "userGroupId"
		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].groupType = GroupType.Admin
		user.customer = "customer-id"
		let customer = createCustomer()
		customer.customerGroup = "customerGroupId"
		customer.userGroups = "userGroupsId"
		customer.teamGroups = "teamGroupsId"
		let entity = {
			load: (type, customerId) => {
				o(type).deepEquals(CustomerTypeRef)
				o(customerId).equals(user.customer)
				return Promise.resolve(customer)
			},
		} as any
		let groupData = {
			indexTimestamp: FULL_INDEXED_TIMESTAMP,
		}
		let transaction = {
			get: (os, groupId) => {
				o(os).equals(GroupDataOS)
				o(groupId).equals(customer.customerGroup)
				return Promise.resolve(groupData)
			},
		}
		const indexer = new GroupInfoIndexer(core, db, entity, suggestionFacadeMock)
		return indexer.indexAllUserAndTeamGroupInfosForAdmin(user).then(() => {
			o(core.writeIndexUpdate.callCount).equals(0)
		})
	})
	o("processEntityEvents do nothing if user is not an admin", function (done) {
		let db: any = {
			key: aes256RandomKey(),
			iv: fixedIv,
		}
		let core: any = new IndexerCore(
			db,
			{
				queueEvents: false,
			} as any,
			browserDataStub,
		)
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()
		const indexer = new GroupInfoIndexer(core, db, null as any, suggestionFacadeMock)

		let indexUpdate = _createNewIndexUpdate(groupTypeInfo)

		let events = [
			createUpdate(OperationType.CREATE, "groupInfo-list", "1"),
			createUpdate(OperationType.UPDATE, "groupInfo-list", "2"),
			createUpdate(OperationType.DELETE, "groupInfo-list", "3"),
		]
		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].groupType = GroupType.User
		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, user).then(() => {
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			o(core._processDeleted.callCount).equals(0)
			o(suggestionFacadeMock.addSuggestions.callCount).equals(0)
			done()
		})
	})
	o("processEntityEvents new groupInfo", async function () {
		let db: any = {
			key: aes256RandomKey(),
			iv: fixedIv,
		}
		let core: any = new IndexerCore(
			db,
			{
				queueEvents: false,
			} as any,
			browserDataStub,
		)
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()
		let groupInfo = createGroupInfo()
		groupInfo._id = ["groupInfo-list", "L-dNNLe----0"]
		let entity: any = {
			load: (type, id) => {
				if (type == GroupInfoTypeRef && isSameId(id, groupInfo._id)) return Promise.resolve(groupInfo)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			},
		}
		const indexer = new GroupInfoIndexer(core, db, entity, suggestionFacadeMock)

		let indexUpdate = _createNewIndexUpdate(groupTypeInfo)

		let events = [createUpdate(OperationType.CREATE, "groupInfo-list", "L-dNNLe----0")]
		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].groupType = GroupType.Admin
		await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, user)
		// nothing changed
		o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
		o(indexUpdate.move.length).equals(0)
		o(core._processDeleted.callCount).equals(0)
	})
	o("processEntityEvents update groupInfo", async function () {
		let db: any = {
			key: aes256RandomKey(),
			iv: fixedIv,
		}
		let core: any = new IndexerCore(
			db,
			{
				queueEvents: false,
			} as any,
			browserDataStub,
		)
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()
		let groupInfo = createGroupInfo()
		groupInfo._id = ["groupInfo-list", "L-dNNLe----0"]
		let entity: any = {
			load: (type, id) => {
				if (type == GroupInfoTypeRef && isSameId(id, groupInfo._id)) return Promise.resolve(groupInfo)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			},
		}
		const indexer = new GroupInfoIndexer(core, db, entity, suggestionFacadeMock)

		let indexUpdate = _createNewIndexUpdate(groupTypeInfo)

		let events = [createUpdate(OperationType.UPDATE, "groupInfo-list", "L-dNNLe----0")]
		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].groupType = GroupType.Admin
		await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, user)
		// nothing changed
		o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
		o(indexUpdate.move.length).equals(0)
		o(core._processDeleted.callCount).equals(1)
		o(core._processDeleted.args).deepEquals([events[0], indexUpdate])
		o(suggestionFacadeMock.addSuggestions.callCount).equals(1)
		o(suggestionFacadeMock.addSuggestions.callCount).equals(1)
	})
	o("processEntityEvents delete groupInfo", function (done) {
		let db: any = {
			key: aes256RandomKey(),
			iv: fixedIv,
		}
		let core: any = new IndexerCore(
			db,
			{
				queueEvents: false,
			} as any,
			browserDataStub,
		)
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()
		let groupInfo = createGroupInfo()
		groupInfo._id = ["groupInfo-list", "1"]
		let entity: any = {
			load: (type, id) => {
				if (type == GroupInfoTypeRef && isSameId(id, groupInfo._id)) return Promise.resolve(groupInfo)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			},
		}
		const indexer = new GroupInfoIndexer(core, db, entity, suggestionFacadeMock)

		let indexUpdate = _createNewIndexUpdate(groupTypeInfo)

		let events = [createUpdate(OperationType.DELETE, "groupInfo-list", "1")]
		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].groupType = GroupType.Admin
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

function createUpdate(type: OperationType, listId: Id, id: Id) {
	let update = createEntityUpdate()
	update.operation = type
	update.instanceListId = listId
	update.instanceId = id
	return update
}
