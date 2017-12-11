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
import {NOTHING_INDEXED_TIMESTAMP, FULL_INDEXED_TIMESTAMP} from "../../../../src/api/common/TutanotaConstants"
import {IndexerCore} from "../../../../src/api/worker/search/IndexerCore"
import {encryptIndexKey} from "../../../../src/api/worker/search/IndexUtils"
import {aes256RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {uint8ArrayToBase64} from "../../../../src/api/common/utils/Encoding"
import {GroupInfoIndexer} from "../../../../src/api/worker/search/GroupInfoIndexer"
import {createMailAddressAlias} from "../../../../src/api/entities/sys/MailAddressAlias"
import {createUser} from "../../../../src/api/entities/sys/User"
import {createCustomer, CustomerTypeRef} from "../../../../src/api/entities/sys/Customer"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"

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

	o("indexAllUserAndTeamGroupInfosForAdmin", function (done) {
		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => transaction}}:any)
		let core: any = new IndexerCore(db)
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

		const indexer = new GroupInfoIndexer(core, db, entity)
		indexer.indexAllUserAndTeamGroupInfosForAdmin(user).then(() => {
			o(core.writeIndexUpdate.callCount).equals(1)
			let indexUpdate: IndexUpdate = core.writeIndexUpdate.args[0]
			o(indexUpdate.indexTimestamp).equals(FULL_INDEXED_TIMESTAMP)
			o(indexUpdate.groupId).equals(customer.customerGroup)

			let expectedKeys = [uint8ArrayToBase64(encryptIndexKey(db.key, userGroupInfo._id[1])), uint8ArrayToBase64(encryptIndexKey(db.key, teamGroupInfo._id[1]))]
			o(Array.from(indexUpdate.create.encInstanceIdToElementData.keys())).deepEquals(expectedKeys)
		}).then(done)
	})

	o("indexAllUserAndTeamGroupInfosForAdmin not an admin", function (done) {
		let db: Db = ({key: aes256RandomKey(), dbFacade: {}}:any)
		let core: any = new IndexerCore(db)
		core.writeIndexUpdate = o.spy()

		let userGroupId = "userGroupId"
		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].admin = false
		user.customer = "customer-id"


		const indexer = new GroupInfoIndexer(core, db, (null:any))
		indexer.indexAllUserAndTeamGroupInfosForAdmin(user).then(() => {
			o(core.writeIndexUpdate.callCount).equals(0)
		}).then(done)
	})

	o("indexAllUserAndTeamGroupInfosForAdmin already indexed", function (done) {
		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => transaction}}:any)
		let core: any = new IndexerCore(db)
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

		const indexer = new GroupInfoIndexer(core, db, entity)
		indexer.indexAllUserAndTeamGroupInfosForAdmin(user).then(() => {
			o(core.writeIndexUpdate.callCount).equals(0)
		}).then(done)
	})

})
