// @flow
import o from "ospec/ospec.js"
import {createUser, UserTypeRef} from "../../../../src/api/entities/sys/User"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import {GroupDataOS, MetaDataOS} from "../../../../src/api/worker/search/DbFacade"
import {GroupType, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../../../src/api/common/TutanotaConstants"
import {Indexer, Metadata} from "../../../../src/api/worker/search/Indexer"
import {EntityEventBatchTypeRef, createEntityEventBatch} from "../../../../src/api/entities/sys/EntityEventBatch"
import {GENERATED_MAX_ID} from "../../../../src/api/common/EntityFunctions"
import {NotAuthorizedError} from "../../../../src/api/common/error/RestError"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"
import {aes256RandomKey, aes128RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {IndexerCore} from "../../../../src/api/worker/search/IndexerCore"
import {GroupInfoTypeRef} from "../../../../src/api/entities/sys/GroupInfo"
import {ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {MailTypeRef} from "../../../../src/api/entities/tutanota/Mail"
import {decrypt256Key, encrypt256Key} from "../../../../src/api/worker/crypto/CryptoFacade"
import {OutOfSyncError} from "../../../../src/api/common/error/OutOfSyncError"
import {timestampToGeneratedId, generatedIdToTimestamp} from "../../../../src/api/common/utils/Encoding"
import {EventQueue} from "../../../../src/api/worker/search/EventQueue"

o.spec("Indexer test", () => {

	o("init new db", function (done) {
		let metadata = {}
		let transaction = {
			get: (os, key) => {
				o(os).equals(MetaDataOS)
				o(key).equals(Metadata.userEncDbKey)
				return Promise.resolve(null)
			},
			put: (os, key, value) => {
				o(os).equals(MetaDataOS)
				metadata[key] = value
			},
			wait: () => Promise.resolve()
		}

		const indexer: any = new Indexer((null:any), ({sendIndexState: () => Promise.resolve()}:any))
		let groupBatches = [{groupId: "user-group-id", groupData: {}}]
		indexer._loadGroupData = o.spy(() => Promise.resolve(groupBatches))
		indexer._initGroupData = o.spy(batches => Promise.resolve())
		indexer.db.dbFacade = {
			open: o.spy(() => Promise.resolve()),
			createTransaction: () => transaction
		}
		indexer._contact.indexFullContactList = o.spy(() => Promise.resolve())
		indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin = o.spy(() => Promise.resolve())
		let persistentGroupData = [{persistentGroupData: "dummy"}]
		indexer._loadPersistentGroupData = o.spy(() => Promise.resolve(persistentGroupData))
		indexer._loadNewEntities = o.spy()

		let user = createUser()
		user.userGroup = createGroupMembership()
		user.userGroup.group = "user-group-id"
		let userGroupKey = aes128RandomKey()
		indexer.init(user, userGroupKey).then(() => {
			o(indexer._loadGroupData.args).deepEquals([user])
			o(indexer._initGroupData.args[0]).deepEquals(groupBatches)
			o(metadata[Metadata.mailIndexingEnabled]).equals(false)
			o(decrypt256Key(userGroupKey, metadata[Metadata.userEncDbKey])).deepEquals(indexer.db.key)

			o(indexer._contact.indexFullContactList.args).deepEquals([user.userGroup.group])
			o(indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin.args).deepEquals([user])
			o(indexer._loadPersistentGroupData.args).deepEquals([user])
			o(indexer._loadNewEntities.args).deepEquals([persistentGroupData])
			done()
		})
	})

	o("init existing db", function (done) {
		let userGroupKey = aes128RandomKey()
		let dbKey = aes256RandomKey()
		let userEncDbKey = encrypt256Key(userGroupKey, dbKey)
		let transaction = {
			get: (os, key) => {
				if (os == MetaDataOS && key == Metadata.userEncDbKey) return Promise.resolve(userEncDbKey)
				if (os == MetaDataOS && key == Metadata.mailIndexingEnabled) return Promise.resolve(true)
				if (os == MetaDataOS && key == Metadata.excludedListIds) return Promise.resolve(["excluded-list-id"])
				return Promise.resolve(null)
			},
			wait: () => Promise.resolve()
		}

		const indexer: any = new Indexer((null:any), ({sendIndexState: () => Promise.resolve()}:any))
		indexer.db.dbFacade = {
			open: o.spy(() => Promise.resolve()),
			createTransaction: () => transaction
		}
		let groupDiff = [{groupDiff: "dummy"}]
		indexer._groupDiff = o.spy(() => Promise.resolve(groupDiff))
		indexer._updateGroups = o.spy(() => Promise.resolve())
		indexer._mail.updateCurrentIndexTimestamp = o.spy(() => Promise.resolve())

		indexer._contact.indexFullContactList = o.spy(() => Promise.resolve())
		indexer._contact._suggestionFacade.load = o.spy(() => Promise.resolve())
		indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin = o.spy(() => Promise.resolve())
		indexer._groupInfo._suggestionFacade.load = o.spy(() => Promise.resolve())

		let persistentGroupData = [{persistentGroupData: "dummy"}]
		indexer._loadPersistentGroupData = o.spy(() => Promise.resolve(persistentGroupData))
		indexer._loadNewEntities = o.spy()


		let user = createUser()
		user.userGroup = createGroupMembership()
		user.userGroup.group = "user-group-id"
		indexer.init(user, userGroupKey).then(() => {
			o(indexer.db.key).deepEquals(dbKey)

			o(indexer._groupDiff.args).deepEquals([user])
			o(indexer._updateGroups.args).deepEquals([user, groupDiff])

			o(indexer._contact.indexFullContactList.args).deepEquals([user.userGroup.group])
			o(indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin.args).deepEquals([user])
			o(indexer._loadPersistentGroupData.args).deepEquals([user])
			o(indexer._loadNewEntities.args).deepEquals([persistentGroupData])
			o(indexer._contact._suggestionFacade.load.callCount).equals(1)
			o(indexer._groupInfo._suggestionFacade.load.callCount).equals(1)
			done()
		})
	})

	o("init existing db out of sync", function (done) {
		let userGroupKey = aes128RandomKey()
		let dbKey = aes256RandomKey()
		let userEncDbKey = encrypt256Key(userGroupKey, dbKey)
		let transaction = {
			get: (os, key) => {
				if (os == MetaDataOS && key == Metadata.userEncDbKey) return Promise.resolve(userEncDbKey)
				if (os == MetaDataOS && key == Metadata.mailIndexingEnabled) return Promise.resolve(true)
				if (os == MetaDataOS && key == Metadata.excludedListIds) return Promise.resolve(["excluded-list-id"])
				return Promise.resolve(null)
			},
			wait: () => Promise.resolve()
		}

		const indexer: any = new Indexer((null:any), ({sendIndexState: () => Promise.resolve()}:any))
		indexer.db.dbFacade = {
			open: o.spy(() => Promise.resolve()),
			createTransaction: () => transaction,
		}
		let groupDiff = [{groupDiff: "dummy"}]
		indexer._groupDiff = o.spy(() => Promise.resolve(groupDiff))
		indexer._updateGroups = o.spy(() => Promise.resolve())
		indexer._mail.updateCurrentIndexTimestamp = o.spy(() => Promise.resolve())

		indexer._contact.indexFullContactList = o.spy(() => Promise.resolve())
		indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin = o.spy(() => Promise.resolve())
		let persistentGroupData = [{persistentGroupData: "dummy"}]
		indexer._loadPersistentGroupData = o.spy(() => Promise.resolve(persistentGroupData))
		indexer._loadNewEntities = o.spy(() => Promise.reject(new OutOfSyncError()))
		indexer.disableMailIndexing = o.spy()


		let user = createUser()
		user.userGroup = createGroupMembership()
		user.userGroup.group = "user-group-id"
		indexer.init(user, userGroupKey).then(() => {
			o(indexer.db.key).deepEquals(dbKey)

			o(indexer._groupDiff.args).deepEquals([user])
			o(indexer._updateGroups.args).deepEquals([user, groupDiff])

			o(indexer._contact.indexFullContactList.args).deepEquals([user.userGroup.group])
			o(indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin.args).deepEquals([user])
			o(indexer._loadPersistentGroupData.args).deepEquals([user])
			o(indexer._loadNewEntities.args).deepEquals([persistentGroupData])
			done()
		})
	})

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
			getAll: (os) => {
				o(os).equals(GroupDataOS)
				return Promise.resolve([{key: deletedGroupId, value: groupData}, {
					key: user.memberships[1].group,
					value: {}
				}])
			}
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
		indexer.disableMailIndexing = o.spy(() => Promise.resolve())

		let user = createUser()
		let groupDiff = {deletedGroups: [{id: "groupId", type: GroupType.Mail}], newGroups: []}
		indexer._updateGroups(user, groupDiff).then(() => {
			o(indexer.disableMailIndexing.callCount).equals(1)
			done()
		})
	})

	o("_updateGroups disable MailIndexing in case of a deleted contact group", function (done) {
		let indexer: any = new Indexer((null:any), (null:any))
		indexer.disableMailIndexing = o.spy(() => Promise.resolve())

		let user = createUser()
		let groupDiff = {deletedGroups: [{id: "groupId", type: GroupType.Contact}], newGroups: []}
		indexer._updateGroups(user, groupDiff).then(() => {
			o(indexer.disableMailIndexing.callCount).equals(1)
			done()
		})
	})

	o("_updateGroups don't disable MailIndexing in case no mail or contact group has been deleted", function (done) {
		let indexer: any = new Indexer((null:any), (null:any))
		indexer.disableMailIndexing = o.spy()

		let user = createUser()
		let groupDiff = {deletedGroups: [{id: "groupId", type: GroupType.Team}], newGroups: []}
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
		let groupDiff = {deletedGroups: [], newGroups: [{id: "groupId", type: GroupType.Mail}]}
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
		let groupDiff = {deletedGroups: [], newGroups: [{id: "groupId", type: GroupType.Contact}]}
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
						groupType: GroupType.Mail
					}
				},
				{
					groupId: 'group-contact',
					groupData: {
						lastBatchIds: ["event-batch-id"],
						indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						groupType: GroupType.Contact
					}
				},
				{
					groupId: 'group-customer',
					groupData: {
						lastBatchIds: ["event-batch-id"],
						indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
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
			wait: () => Promise.resolve()
		}

		let indexer: any = new Indexer((null:any), (null:any))
		let stored = false

		indexer._initGroupData(groupBatches, transaction).then(result => {
			o(stored).equals(true)
			done()
		})
	})

	o("_loadNewEntities", function (done) {
		const lastBatchId = "L0JcCmw----0"
		let groupIdToEventBatches = [{
			groupId: "group-mail",
			eventBatchIds: ["newest-batch-id", lastBatchId],
		}]

		let batches = [createEntityEventBatch(), createEntityEventBatch()]
		batches[0]._id = ["group-mail", "batch-id"]
		batches[0].events = [createEntityUpdate(), createEntityUpdate()]
		batches[1]._id = ["group-mail", lastBatchId]
		batches[1].events = [createEntityUpdate(), createEntityUpdate()]

		let indexer: any = new Indexer((null:any), (null:any))
		indexer._entity = {
			loadAll: (type, groupId, startId) => {
				o(type).deepEquals(EntityEventBatchTypeRef)
				o(groupId).equals("group-mail")
				let expectedStartId = timestampToGeneratedId(generatedIdToTimestamp(lastBatchId) - 1)
				o(startId).equals(expectedStartId)
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
		const lastBatchId = "L0JcCmw----0"
		let groupIdToEventBatches = [{
			groupId: "group-mail",
			eventBatchIds: ["newest-batch-id", lastBatchId],
		}]

		let batches = [createEntityEventBatch()]
		batches[0]._id = ["group-mail", lastBatchId]
		batches[0].events = [createEntityUpdate(), createEntityUpdate()]

		let indexer: any = new Indexer((null:any), (null:any))
		indexer._entity = {
			loadAll: (type, groupId, startId) => {
				o(type).deepEquals(EntityEventBatchTypeRef)
				o(groupId).equals("group-mail")
				let expectedStartId = timestampToGeneratedId(generatedIdToTimestamp(lastBatchId) - 1)
				o(startId).equals(expectedStartId)
				return Promise.resolve(batches)
			}
		}
		indexer.processEntityEvents = o.spy()

		indexer._loadNewEntities(groupIdToEventBatches).then(() => {
			o(indexer.processEntityEvents.callCount).equals(0)
			done()
		})
	})

	o("_loadNewEntities out of sync", function (done) {
		const lastBatchId = "L0JcCmw----0"
		let groupIdToEventBatches = [{
			groupId: "group-mail",
			eventBatchIds: ["newest-batch-id", lastBatchId],
		}]

		let batches = [createEntityEventBatch()]
		batches[0]._id = ["group-mail", "batch-id"]
		batches[0].events = [createEntityUpdate(), createEntityUpdate()]

		let indexer: any = new Indexer((null:any), (null:any))
		indexer._entity = {
			loadAll: (type, groupId, startId) => {
				o(type).deepEquals(EntityEventBatchTypeRef)
				o(groupId).equals("group-mail")
				let expectedStartId = timestampToGeneratedId(generatedIdToTimestamp(lastBatchId) - 1)
				o(startId).equals(expectedStartId)
				return Promise.resolve(batches)
			}
		}
		indexer.processEntityEvents = o.spy()

		indexer._loadNewEntities(groupIdToEventBatches).catch(OutOfSyncError, e => {
			o(indexer.processEntityEvents.callCount).equals(0)
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

	o("processEntityEvents", function (done) {
		const indexer: any = new Indexer((null:any), (null:any))
		indexer._mail = {processEntityEvents: o.spy(() => Promise.resolve())}
		indexer._contact = {processEntityEvents: o.spy(() => Promise.resolve())}
		indexer._groupInfo = {processEntityEvents: o.spy(() => Promise.resolve())}
		indexer._processUserEntityEvents = o.spy(() => Promise.resolve())
		indexer._initParams = {user: createUser()}
		indexer._core.writeIndexUpdate = o.spy(() => Promise.resolve())
		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "group-id"
		indexer._initParams = {user}

		function update(typeRef: TypeRef<any>) {
			let u = createEntityUpdate()
			u.application = typeRef.app
			u.type = typeRef.type
			return u
		}

		let events = [update(MailTypeRef), update(ContactTypeRef), update(GroupInfoTypeRef), update(UserTypeRef)]
		indexer.processEntityEvents(events, "group-id", "batch-id").then(() => {
			o(indexer._core.writeIndexUpdate.callCount).equals(1)
			let indexUpdate = indexer._core.writeIndexUpdate.args[0]

			o(indexer._mail.processEntityEvents.callCount).equals(1)
			o(indexer._mail.processEntityEvents.args).deepEquals([[events[0]], "group-id", "batch-id", indexUpdate])

			o(indexer._contact.processEntityEvents.callCount).equals(1)
			o(indexer._contact.processEntityEvents.args).deepEquals([[events[1]], "group-id", "batch-id", indexUpdate])

			o(indexer._groupInfo.processEntityEvents.callCount).equals(1)
			o(indexer._groupInfo.processEntityEvents.args).deepEquals([[events[2]], "group-id", "batch-id", indexUpdate, user])

			o(indexer._processUserEntityEvents.callCount).equals(1)
			o(indexer._processUserEntityEvents.args).deepEquals([[events[3]]])
			done()
		})
	})

	o("processEntityEvents non indexed group", function (done) {
		const indexer: any = new Indexer((null:any), (null:any))
		indexer._mail = {processEntityEvents: o.spy(() => Promise.resolve())}
		indexer._contact = {processEntityEvents: o.spy(() => Promise.resolve())}
		indexer._groupInfo = {processEntityEvents: o.spy(() => Promise.resolve())}
		indexer._processUserEntityEvents = o.spy(() => Promise.resolve())
		indexer._initParams = {user: createUser()}
		indexer._core.writeIndexUpdate = o.spy(() => Promise.resolve())
		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].groupType = GroupType.Team
		user.memberships[0].group = "group-id"
		indexer._initParams = {user}

		function update(typeRef: TypeRef<any>) {
			let u = createEntityUpdate()
			u.application = typeRef.app
			u.type = typeRef.type
			return u
		}

		let events = [update(MailTypeRef), update(ContactTypeRef), update(GroupInfoTypeRef), update(UserTypeRef)]
		indexer.processEntityEvents(events, "group-id", "batch-id").then(() => {
			o(indexer._core.writeIndexUpdate.callCount).equals(0)
			o(indexer._mail.processEntityEvents.callCount).equals(0)
			o(indexer._contact.processEntityEvents.callCount).equals(0)
			o(indexer._groupInfo.processEntityEvents.callCount).equals(0)
			o(indexer._processUserEntityEvents.callCount).equals(0)
			done()
		})
	})

	o("processEntityEvents queue", function (done) {
		const indexer: any = new Indexer((null:any), (null:any))
		indexer._mail = {processEntityEvents: o.spy(() => Promise.resolve())}
		indexer._contact = {processEntityEvents: o.spy(() => Promise.resolve())}
		indexer._groupInfo = {processEntityEvents: o.spy(() => Promise.resolve())}
		indexer._processUserEntityEvents = o.spy(() => Promise.resolve())
		indexer._initParams = {user: createUser()}
		indexer._core.writeIndexUpdate = o.spy(() => Promise.resolve())
		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "group-id"
		indexer._initParams = {user}

		function update(typeRef: TypeRef<any>) {
			let u = createEntityUpdate()
			u.application = typeRef.app
			u.type = typeRef.type
			return u
		}

		let events = [update(MailTypeRef)]
		o(indexer._core.queue.queueEvents).equals(false)
		o(indexer._core.queue.eventQueue.length).equals(0)
		let first = indexer.processEntityEvents(events, "group-id", "batch-id-1")
		o(indexer._core.queue.queueEvents).equals(true)
		o(indexer._core.queue.eventQueue.length).equals(0)

		let events2 = [update(MailTypeRef)]
		indexer.processEntityEvents(events2, "group-id", "batch-id-2").then(() => {
			o(indexer._core.queue.queueEvents).equals(true)
			o(indexer._core.queue.eventQueue.length).equals(1)
		})
		let finalChecks = () => {
			if (indexer._core.queue.queueEvents == true || indexer._core.queue.eventQueue.length > 0) {
				setTimeout(finalChecks, 1)
			} else {
				o(indexer._core.writeIndexUpdate.callCount).equals(2)
				o(indexer._mail.processEntityEvents.callCount).equals(2)
				o(indexer._contact.processEntityEvents.callCount).equals(2)
				o(indexer._groupInfo.processEntityEvents.callCount).equals(2)
				o(indexer._processUserEntityEvents.callCount).equals(2)
				done()
			}
		}
		setTimeout(finalChecks, 1)
	})

	o("_processUserEntityEvents user is no admin", function (done) {
		let db: any = {key: aes256RandomKey()}
		let core: any = new IndexerCore(db, new EventQueue(() => true))
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()

		let oldUser = createUser()
		oldUser._id = "1"
		let newUser = createUser()
		newUser._id = "1"
		let entity: any = {
			load: (type, id) => {
				o(type).equals(UserTypeRef)
				o(id).equals(newUser._id)
				return Promise.resolve(newUser)
			}
		}
		const indexer: any = new Indexer((null:any), (null:any))
		indexer._entity = entity
		indexer._groupDiff = () => {
			return Promise.resolve({deletedGroups: [], newGroups: []})
		}
		indexer._updateGroups = o.spy()
		indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin = o.spy()
		indexer._initParams = {user: oldUser}

		let events = [createUpdate(OperationType.UPDATE, "1")]
		indexer._processUserEntityEvents(events).then(() => {
			o(indexer._updateGroups.callCount).equals(0)
			o(indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin.callCount).equals(0)
			done()
		})
	})


	o("_processUserEntityEvents user becomes admin", function (done) {
		let db: any = {key: aes256RandomKey()}
		let core: any = new IndexerCore(db, new EventQueue(() => true))
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()

		let oldUser = createUser()
		oldUser._id = "1"
		let newUser = createUser()
		newUser._id = "1"
		newUser.memberships = [createGroupMembership()]
		newUser.memberships[0].admin = true
		let entity: any = {
			load: (type, id) => {
				o(type).equals(UserTypeRef)
				o(id).equals(newUser._id)
				return Promise.resolve(newUser)
			}
		}
		const indexer: any = new Indexer((null:any), (null:any))
		indexer._entity = entity
		indexer._groupDiff = () => {
			return Promise.resolve({deletedGroups: [], newGroups: []})
		}
		indexer._updateGroups = o.spy()
		indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin = o.spy()
		indexer._initParams = {user: oldUser}

		let events = [createUpdate(OperationType.UPDATE, "1")]
		indexer._processUserEntityEvents(events).then(() => {
			o(indexer._updateGroups.callCount).equals(0)
			o(indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin.callCount).equals(1)
			o(indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin.args).deepEquals([newUser])
			done()
		})
	})

})

function createUpdate(type: OperationTypeEnum, id: Id) {
	let update = createEntityUpdate()
	update.operation = type
	update.instanceId = id
	return update
}