// @flow
import o from "ospec/ospec.js"
import {createUser} from "../../../../src/api/entities/sys/User"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import {GroupDataOS} from "../../../../src/api/worker/search/DbFacade"
import {GroupType, NOTHING_INDEXED_TIMESTAMP} from "../../../../src/api/common/TutanotaConstants"
import {Indexer} from "../../../../src/api/worker/search/Indexer"
import {EntityEventBatchTypeRef, createEntityEventBatch} from "../../../../src/api/entities/sys/EntityEventBatch"
import {GENERATED_MAX_ID} from "../../../../src/api/common/EntityFunctions"
import {NotAuthorizedError} from "../../../../src/api/common/error/RestError"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"

o.spec("Indexer test", () => {


	o("_groupDiff", function (done) {
		let user = createUser()
		user.memberships = [createGroupMembership(), createGroupMembership(), createGroupMembership()]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "new-group-id"
		user.memberships[1].groupType = GroupType.Contact
		user.memberships[1].group = "constant-group-id"

		let deletedGroupId = "deleted-group-id"
		let groupData = {groupType: GroupType.Team}
		let transaction = {
			getAllKeys: (os) => {
				o(os).equals(GroupDataOS)
				return Promise.resolve([deletedGroupId, user.memberships[1].group])
			},
			get: (os, groupId) => {
				o(os).equals(GroupDataOS)
				o(groupId).equals(deletedGroupId)
				return Promise.resolve(groupData)
			},
		}

		let indexer = new Indexer((null:any), (null:any))
		indexer.db.dbFacade = ({createTransaction: () => transaction}:any)

		indexer._groupDiff(user).then(result => {
			o(result).deepEquals({
				deletedGroups: [{id: 'deleted-group-id', type: GroupType.Team}],
				newGroups: [{id: 'new-group-id', type: GroupType.Mail}]
			})
			done()
		})
	})

	o("_updateGroups disable MailIndexing in case of a deleted mail group", function (done) {
		let indexer: any = new Indexer((null:any), (null:any))
		indexer.disableMailIndexing = o.spy()

		let user = createUser()
		let groupDiff = Promise.resolve({deletedGroups: [{id: "groupId", type: GroupType.Mail}], newGroups: []})
		indexer._updateGroups(user, groupDiff).then(() => {
			o(indexer.disableMailIndexing.callCount).equals(1)
			done()
		})
	})

	o("_updateGroups disable MailIndexing in case of a deleted contact group", function (done) {
		let indexer: any = new Indexer((null:any), (null:any))
		indexer.disableMailIndexing = o.spy()

		let user = createUser()
		let groupDiff = Promise.resolve({deletedGroups: [{id: "groupId", type: GroupType.Contact}], newGroups: []})
		indexer._updateGroups(user, groupDiff).then(() => {
			o(indexer.disableMailIndexing.callCount).equals(1)
			done()
		})
	})

	o("_updateGroups don't disable MailIndexing in case no mail or contact group has been deleted", function (done) {
		let indexer: any = new Indexer((null:any), (null:any))
		indexer.disableMailIndexing = o.spy()

		let user = createUser()
		let groupDiff = Promise.resolve({deletedGroups: [{id: "groupId", type: GroupType.Team}], newGroups: []})
		indexer._updateGroups(user, groupDiff).then(() => {
			o(indexer.disableMailIndexing.callCount).equals(0)
			done()
		})
	})

	o("_updateGroups index new mail groups", function (done) {
		let transaction = "transaction"
		let groupBatches = "groupBatches"

		let indexer: any = new Indexer((null:any), (null:any))
		indexer._loadGroupData = o.spy(() => Promise.resolve(groupBatches))
		indexer._initGroupData = o.spy(() => Promise.resolve())
		indexer.db.dbFacade = ({createTransaction: () => transaction}:any)
		indexer._mail.indexMailbox = o.spy()
		indexer._mail.currentIndexTimestamp = new Date().getTime()

		let user = createUser()
		let groupDiff = Promise.resolve({deletedGroups: [], newGroups: [{id: "groupId", type: GroupType.Mail}]})
		indexer._updateGroups(user, groupDiff).then(() => {
			o(indexer._loadGroupData.callCount).equals(1)
			o(indexer._loadGroupData.args[0]).equals(user)

			o(indexer._initGroupData.callCount).equals(1)
			o(indexer._initGroupData.args).deepEquals([groupBatches, transaction])

			o(indexer._mail.indexMailbox.callCount).equals(1)
			o(indexer._mail.indexMailbox.args).deepEquals([user, indexer._mail.currentIndexTimestamp])
			done()
		})
	})

	o("_updateGroups only init group data for non mail groups (do not index)", function (done) {
		let transaction = "transaction"
		let groupBatches = "groupBatches"

		let indexer: any = new Indexer((null:any), (null:any))
		indexer._loadGroupData = o.spy(() => Promise.resolve(groupBatches))
		indexer._initGroupData = o.spy(() => Promise.resolve())
		indexer.db.dbFacade = ({createTransaction: () => transaction}:any)
		indexer._mail.indexMailbox = o.spy()

		let user = createUser()
		let groupDiff = Promise.resolve({deletedGroups: [], newGroups: [{id: "groupId", type: GroupType.Contact}]})
		indexer._updateGroups(user, groupDiff).then(() => {
			o(indexer._loadGroupData.callCount).equals(1)
			o(indexer._loadGroupData.args[0]).equals(user)

			o(indexer._initGroupData.callCount).equals(1)
			o(indexer._initGroupData.args).deepEquals([groupBatches, transaction])

			o(indexer._mail.indexMailbox.callCount).equals(0)
			done()
		})
	})

	o("_loadGroupData", function (done) {
		let user = createUser()
		user.memberships = [createGroupMembership(), createGroupMembership(), createGroupMembership(), createGroupMembership()]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "group-mail"
		user.memberships[1].groupType = GroupType.Team
		user.memberships[1].group = "group-team"
		user.memberships[2].groupType = GroupType.Contact
		user.memberships[2].group = "group-contact"
		user.memberships[3].groupType = GroupType.Customer
		user.memberships[3].group = "group-customer"
		let indexer: any = new Indexer((null:any), (null:any))
		indexer._entity = {
			loadRange: (type, listId, startId, count, reverse) => {
				o(type).equals(EntityEventBatchTypeRef)
				o(startId).equals(GENERATED_MAX_ID)
				o(count).equals(100)
				o(reverse).equals(true)
				return Promise.resolve([{_id: [null, "event-batch-id"]}])
			}
		}
		indexer._loadGroupData(user).then(result => {
			o(result).deepEquals([
				{
					groupId: 'group-mail',
					groupData: {
						lastBatchIds: ["event-batch-id"],
						indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						excludedListIds: [],
						groupType: GroupType.Mail
					}
				},
				{
					groupId: 'group-contact',
					groupData: {
						lastBatchIds: ["event-batch-id"],
						indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						excludedListIds: [],
						groupType: GroupType.Contact
					}
				},
				{
					groupId: 'group-customer',
					groupData: {
						lastBatchIds: ["event-batch-id"],
						indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						excludedListIds: [],
						groupType: GroupType.Customer
					}
				}])
			done()
		})
	})

	o("_loadGroupData not authorized", function (done) {
		let user = createUser()
		user.memberships = [createGroupMembership(), createGroupMembership()]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "group-mail"
		user.memberships[1].groupType = GroupType.Team
		user.memberships[1].group = "group-team"
		let indexer: any = new Indexer((null:any), (null:any))
		let count = 0
		indexer._entity = {
			loadRange: (type, listId, startId, count, reverse) => {
				if (count == 0) {
					console.log("EEE")
					count++
					return Promise.reject(new NotAuthorizedError("test"))
				} else {
					return Promise.resolve([{_id: [null, "event-batch-id"]}])
				}
			}
		}
		indexer._loadGroupData(user).then(result => {
			o(result).deepEquals([
				{
					groupId: 'group-mail',
					groupData: {
						lastBatchIds: ["event-batch-id"],
						indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						excludedListIds: [],
						groupType: GroupType.Mail
					}
				}])
			done()
		})
	})


	o("_initGroupData", function (done) {
		let groupBatches = [{
			groupId: "groupId",
			groupData: {groupType: GroupType.Mail}
		}]

		let transaction = {
			put: (os, key, value) => {
				o(os).equals(GroupDataOS)
				o(key).equals(groupBatches[0].groupId)
				o(value).deepEquals(groupBatches[0].groupData)
				stored = true
				return Promise.resolve()
			},
			await: () => Promise.resolve()
		}

		let indexer: any = new Indexer((null:any), (null:any))
		let stored = false

		indexer._initGroupData(groupBatches, transaction).then(result => {
			o(stored).equals(true)
			done()
		})
	})

	o("_loadPersistentGroupData", function (done) {
		let groupData = {lastBatchIds: ["last-batch-id"]}
		let transaction = {
			get: (os, groupId) => {
				o(os).equals(GroupDataOS)
				return Promise.resolve(groupData)
			},
		}

		let user = createUser()
		user.memberships = [createGroupMembership(), createGroupMembership(), createGroupMembership(), createGroupMembership()]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "group-mail"
		user.memberships[1].groupType = GroupType.Team
		user.memberships[1].group = "group-team"
		user.memberships[2].groupType = GroupType.Contact
		user.memberships[2].group = "group-contact"
		user.memberships[3].groupType = GroupType.Customer
		user.memberships[3].group = "group-customer"

		let indexer = new Indexer((null:any), (null:any))
		indexer.db.dbFacade = ({createTransaction: () => transaction}:any)

		indexer._loadPersistentGroupData(user).then(groupIdToEventBatches => {
			o(groupIdToEventBatches).deepEquals([
				{
					groupId: "group-mail",
					eventBatchIds: ["last-batch-id"],
				},
				{
					groupId: "group-contact",
					eventBatchIds: ["last-batch-id"],
				},
				{
					groupId: "group-customer",
					eventBatchIds: ["last-batch-id"],
				},
			])
			done()
		})

	})

	o("_loadNewEntities", function (done) {
		let groupIdToEventBatches = [{
			groupId: "group-mail",
			eventBatchIds: ["newest-batch-id", "last-batch-id"],
		}]

		let batches = [createEntityEventBatch()]
		batches[0]._id = ["group-mail", "batch-id"]
		batches[0].events = [createEntityUpdate(), createEntityUpdate()]

		let indexer: any = new Indexer((null:any), (null:any))
		indexer._entity = {
			loadAll: (type, groupId, startId) => {
				o(type).deepEquals(EntityEventBatchTypeRef)
				o(groupId).equals("group-mail")
				o(startId).equals("last-batch-id")
				return Promise.resolve(batches)
			}
		}
		indexer.processEntityEvents = o.spy()

		indexer._loadNewEntities(groupIdToEventBatches).then(() => {
			o(indexer.processEntityEvents.args).deepEquals([batches[0].events, groupIdToEventBatches[0].groupId, batches[0]._id[1]])
			done()
		})
	})

	o("_loadNewEntities batch already processed", function (done) {
		let groupIdToEventBatches = [{
			groupId: "group-mail",
			eventBatchIds: ["newest-batch-id", "last-batch-id"],
		}]

		let batches = [createEntityEventBatch()]
		batches[0]._id = ["group-mail", "last-batch-id"]
		batches[0].events = [createEntityUpdate(), createEntityUpdate()]

		let indexer: any = new Indexer((null:any), (null:any))
		indexer._entity = {
			loadAll: (type, groupId, startId) => {
				o(type).deepEquals(EntityEventBatchTypeRef)
				o(groupId).equals("group-mail")
				o(startId).equals("last-batch-id")
				return Promise.resolve(batches)
			}
		}
		indexer.processEntityEvents = o.spy()

		indexer._loadNewEntities(groupIdToEventBatches).then(() => {
			o(indexer.processEntityEvents.callCount).equals(0)
			done()
		})
	})

})
