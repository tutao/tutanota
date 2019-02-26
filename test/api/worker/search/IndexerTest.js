// @flow
import o from "ospec/ospec.js"
import {createUser, UserTypeRef} from "../../../../src/api/entities/sys/User"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import {DbTransaction, GroupDataOS, MetaDataOS} from "../../../../src/api/worker/search/DbFacade"
import {GroupType, NOTHING_INDEXED_TIMESTAMP} from "../../../../src/api/common/TutanotaConstants"
import {Indexer, Metadata} from "../../../../src/api/worker/search/Indexer"
import {createEntityEventBatch, EntityEventBatchTypeRef} from "../../../../src/api/entities/sys/EntityEventBatch"
import {GENERATED_MAX_ID, getElementId} from "../../../../src/api/common/EntityFunctions"
import {NotAuthorizedError} from "../../../../src/api/common/error/RestError"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"
import {aes128RandomKey, aes256Encrypt, aes256RandomKey, IV_BYTE_LENGTH} from "../../../../src/api/worker/crypto/Aes"
import {GroupInfoTypeRef} from "../../../../src/api/entities/sys/GroupInfo"
import {ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {MailTypeRef} from "../../../../src/api/entities/tutanota/Mail"
import {decrypt256Key, encrypt256Key, fixedIv} from "../../../../src/api/worker/crypto/CryptoFacade"
import {OutOfSyncError} from "../../../../src/api/common/error/OutOfSyncError"
import {generatedIdToTimestamp, timestampToGeneratedId} from "../../../../src/api/common/utils/Encoding"
import {random} from "../../../../src/api/worker/crypto/Randomizer"
import {defer, downcast} from "../../../../src/api/common/utils/Utils"
import {browserDataStub, mock, spy} from "../../TestUtils"
import type {FutureBatchActions, QueuedBatch} from "../../../../src/api/worker/search/EventQueue"
import {EntityRestClient} from "../../../../src/api/worker/rest/EntityRestClient"
import {MembershipRemovedError} from "../../../../src/api/common/error/MembershipRemovedError"
import {WhitelabelChildTypeRef} from "../../../../src/api/entities/sys/WhitelabelChild"

const restClientMock: EntityRestClient = downcast({})

o.spec("Indexer test", () => {

	o("init new db", function (done) {
		let metadata = {}
		let transaction = {
			get: (os, key) => {
				o(os).equals(MetaDataOS)
				o(key).equals(Metadata.userEncDbKey)
				return Promise.resolve(null)
			},
			getAll: (os) => {
				// So that we don't run into "no group ids' check
				return Promise.resolve([{key: "key", value: "value"}])
			},
			put: (os, key, value) => {
				o(os).equals(MetaDataOS)
				metadata[key] = value
			},
			wait: () => Promise.resolve()
		}


		let groupBatches = [{groupId: "user-group-id", groupData: {}}]
		let persistentGroupData = [{persistentGroupData: "dummy"}]
		const indexer = mock(new Indexer(restClientMock, ({sendIndexState: () => Promise.resolve()}: any), true,
			browserDataStub), (mock) => {
			mock._loadGroupData = o.spy(() => Promise.resolve(groupBatches))
			mock._initGroupData = o.spy(batches => Promise.resolve())
			mock.db.dbFacade = {
				open: o.spy(() => Promise.resolve()),
				createTransaction: () => Promise.resolve(transaction)
			}
			mock._contact.indexFullContactList = o.spy(() => Promise.resolve())
			mock._groupInfo.indexAllUserAndTeamGroupInfosForAdmin = o.spy(() => Promise.resolve())
			mock._mail.indexMailboxes = o.spy(() => Promise.resolve())
			mock._whitelabelChildIndexer.indexAllWhitelabelChildrenForAdmin = o.spy(() => Promise.resolve())

			mock._loadPersistentGroupData = o.spy(() => Promise.resolve(persistentGroupData))
			mock._loadNewEntities = o.spy()
		})

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
			o(indexer._whitelabelChildIndexer.indexAllWhitelabelChildrenForAdmin.callCount).equals(1)
			o(indexer._mail.indexMailboxes.callCount).equals(1)

			o(indexer._loadPersistentGroupData.args).deepEquals([user])
			o(indexer._loadNewEntities.args).deepEquals([persistentGroupData])
			done()
		})
	})

	o("init existing db", function (done) {
		let userGroupKey = aes128RandomKey()
		let dbKey = aes256RandomKey()
		let encDbIv = aes256Encrypt(dbKey, fixedIv, random.generateRandomData(IV_BYTE_LENGTH), true, false)
		let userEncDbKey = encrypt256Key(userGroupKey, dbKey)
		let transaction = {
			get: (os, key) => {
				if (os == MetaDataOS && key == Metadata.userEncDbKey) return Promise.resolve(userEncDbKey)
				if (os == MetaDataOS && key == Metadata.mailIndexingEnabled) return Promise.resolve(true)
				if (os == MetaDataOS && key == Metadata.excludedListIds) return Promise.resolve(["excluded-list-id"])
				if (os == MetaDataOS && key == Metadata.encDbIv) return Promise.resolve(encDbIv)
				return Promise.resolve(null)
			},
			getAll: (os) => {
				// So that we don't run into "no group ids' check
				return Promise.resolve([{key: "key", value: "value"}])
			},
			wait: () => Promise.resolve()
		}


		let persistentGroupData = [{persistentGroupData: "dummy"}]
		let groupDiff = [{groupDiff: "dummy"}]
		const indexer = mock(new Indexer(restClientMock, ({sendIndexState: () => Promise.resolve()}: any), true,
			browserDataStub), (mock) => {
			mock.db.dbFacade = {
				open: o.spy(() => Promise.resolve()),
				createTransaction: () => Promise.resolve(transaction)
			}

			mock._loadGroupDiff = o.spy(() => Promise.resolve(groupDiff))
			mock._updateGroups = o.spy(() => Promise.resolve())
			mock._mail.updateCurrentIndexTimestamp = o.spy(() => Promise.resolve())

			mock._contact.indexFullContactList = o.spy(() => Promise.resolve())
			mock._contact.suggestionFacade.load = o.spy(() => Promise.resolve())
			mock._groupInfo.indexAllUserAndTeamGroupInfosForAdmin = o.spy(() => Promise.resolve())
			mock._groupInfo.suggestionFacade.load = o.spy(() => Promise.resolve())

			mock._whitelabelChildIndexer.suggestionFacade.load = o.spy(() => Promise.resolve())
			mock.indexAllWhitelabelChildrenForAdmin = o.spy(() => Promise.resolve())

			mock._loadPersistentGroupData = o.spy(() => Promise.resolve(persistentGroupData))
			mock._loadNewEntities = o.spy()
		})

		let user = createUser()
		user.userGroup = createGroupMembership()
		user.userGroup.group = "user-group-id"
		indexer.init(user, userGroupKey).then(() => {
			o(indexer.db.key).deepEquals(dbKey)

			o(indexer._loadGroupDiff.args).deepEquals([user])
			o(indexer._updateGroups.args).deepEquals([user, groupDiff])

			o(indexer._contact.indexFullContactList.args).deepEquals([user.userGroup.group])
			o(indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin.args).deepEquals([user])
			o(indexer._loadPersistentGroupData.args).deepEquals([user])
			o(indexer._loadNewEntities.args).deepEquals([persistentGroupData])
			o(indexer._contact.suggestionFacade.load.callCount).equals(1)
			o(indexer._groupInfo.suggestionFacade.load.callCount).equals(1)
			done()
		})
	})

	o("init existing db out of sync", function (done) {
		let userGroupKey = aes128RandomKey()
		let dbKey = aes256RandomKey()
		let userEncDbKey = encrypt256Key(userGroupKey, dbKey)
		let encDbIv = aes256Encrypt(dbKey, fixedIv, random.generateRandomData(IV_BYTE_LENGTH), true, false)
		let transaction = {
			get: (os, key) => {
				if (os == MetaDataOS && key == Metadata.userEncDbKey) return Promise.resolve(userEncDbKey)
				if (os == MetaDataOS && key == Metadata.mailIndexingEnabled) return Promise.resolve(true)
				if (os == MetaDataOS && key == Metadata.excludedListIds) return Promise.resolve(["excluded-list-id"])
				if (os == MetaDataOS && key == Metadata.encDbIv) return Promise.resolve(encDbIv)
				return Promise.resolve(null)
			},
			wait: () => Promise.resolve(),
			// So that we don't run into "no group ids' check
			getAll: () => Promise.resolve([{key: "key", value: "value"}])
		}

		let groupDiff = [{groupDiff: "dummy"}]
		let persistentGroupData = [{persistentGroupData: "dummy"}]
		const indexer = mock(new Indexer(restClientMock, ({sendIndexState: () => Promise.resolve()}: any), true,
			browserDataStub), (mock) => {
			mock.db.initialized = Promise.resolve()
			mock.db.dbFacade = {
				open: o.spy(() => Promise.resolve()),
				createTransaction: () => Promise.resolve(transaction),
			}
			mock._loadGroupDiff = o.spy(() => Promise.resolve(groupDiff))
			mock._updateGroups = o.spy(() => Promise.resolve())
			mock._mail.updateCurrentIndexTimestamp = o.spy(() => Promise.resolve())

			mock._contact.indexFullContactList = o.spy(() => Promise.resolve())
			mock._groupInfo.indexAllUserAndTeamGroupInfosForAdmin = o.spy(() => Promise.resolve())

			mock._loadPersistentGroupData = o.spy(() => Promise.resolve(persistentGroupData))
			mock._loadNewEntities = o.spy(() => Promise.reject(new OutOfSyncError()))
			mock.disableMailIndexing = o.spy()
		})

		let user = createUser()
		user.userGroup = createGroupMembership()
		user.userGroup.group = "user-group-id"
		indexer.init(user, userGroupKey).then(() => {
			o(indexer.db.key).deepEquals(dbKey)

			o(indexer._loadGroupDiff.args).deepEquals([user])
			o(indexer._updateGroups.args).deepEquals([user, groupDiff])

			o(indexer._contact.indexFullContactList.args).deepEquals([user.userGroup.group])
			o(indexer._groupInfo.indexAllUserAndTeamGroupInfosForAdmin.args).deepEquals([user])
			o(indexer._loadPersistentGroupData.args).deepEquals([user])
			o(indexer._loadNewEntities.args).deepEquals([persistentGroupData])
			done()
		})
	})

	o("_loadGroupDiff", function (done) {
		let user = createUser()
		user.memberships = [createGroupMembership(), createGroupMembership(), createGroupMembership()]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "new-group-id"
		user.memberships[1].groupType = GroupType.Contact
		user.memberships[1].group = "constant-group-id"

		let deletedGroupId = "deleted-group-id"
		let groupData = {groupType: GroupType.MailingList}
		let transaction = {
			getAll: (os) => {
				o(os).equals(GroupDataOS)
				return Promise.resolve([
					{key: deletedGroupId, value: groupData}, {
						key: user.memberships[1].group,
						value: {}
					}
				])
			}
		}

		let indexer = new Indexer(restClientMock, (null: any), true, browserDataStub)
		indexer.db.dbFacade = ({createTransaction: () => Promise.resolve(transaction)}: any
		)

		indexer._loadGroupDiff(user).then(result => {
			o(result).deepEquals({
				deletedGroups: [{id: 'deleted-group-id', type: GroupType.MailingList}],
				newGroups: [{id: 'new-group-id', type: GroupType.Mail}]
			})
			done()
		})
	})

	o("_updateGroups disable MailIndexing in case of a deleted mail group", function (done) {
		let indexer = mock(new Indexer(restClientMock, (null: any), true, browserDataStub), (mock) => {
			mock.disableMailIndexing = o.spy(() => Promise.resolve())
		})

		let user = createUser()
		let groupDiff = {deletedGroups: [{id: "groupId", type: GroupType.Mail}], newGroups: []}
		indexer._updateGroups(user, groupDiff).then(() => {
			o(true).equals(false)
		}).catch(MembershipRemovedError, (e) => {
			done()
		})
	})

	o("_updateGroups disable MailIndexing in case of a deleted contact group", function (done) {
		let indexer = mock(new Indexer(restClientMock, (null: any), true, browserDataStub), (mock) => {
			mock.disableMailIndexing = o.spy(() => Promise.resolve())
		})

		let user = createUser()
		let groupDiff = {deletedGroups: [{id: "groupId", type: GroupType.Contact}], newGroups: []}
		indexer._updateGroups(user, groupDiff).then(() => {
			o(true).equals(false)
		}).catch(MembershipRemovedError, (e) => {
			done()
		})
	})

	o("_updateGroups don't disable MailIndexing in case no mail or contact group has been deleted", function (done) {
		let indexer = mock(new Indexer(restClientMock, (null: any), true, browserDataStub), (mock) => {
			mock.disableMailIndexing = o.spy()
		})

		let user = createUser()
		let groupDiff = {deletedGroups: [{id: "groupId", type: GroupType.MailingList}], newGroups: []}
		indexer._updateGroups(user, groupDiff).then(() => {
			done()
		})
	})

	o("_updateGroups do not index new mail groups", function (done) {
		let transaction = "transaction"
		let groupBatches = "groupBatches"

		let indexer = mock(new Indexer(restClientMock, (null: any), true, browserDataStub), (mock) => {
			mock._loadGroupData = o.spy(() => Promise.resolve(groupBatches))
			mock._initGroupData = o.spy(() => Promise.resolve())
			mock.db.dbFacade = ({createTransaction: () => Promise.resolve(transaction)}: any)
			mock._mail.indexMailboxes = o.spy()
			mock._mail.currentIndexTimestamp = new Date().getTime()
		})

		let user = createUser()
		let groupDiff = {deletedGroups: [], newGroups: [{id: "groupId", type: GroupType.Mail}]}
		indexer._updateGroups(user, groupDiff).then(() => {
			o(indexer._loadGroupData.callCount).equals(1)
			o(indexer._loadGroupData.args[0]).equals(user)

			o(indexer._initGroupData.callCount).equals(1)
			o(indexer._initGroupData.args).deepEquals([groupBatches, transaction])
			o(indexer._mail.indexMailboxes.callCount).equals(0)
			done()
		})
	})

	o("_updateGroups only init group data for non mail groups (do not index)", function (done) {
		let transaction = "transaction"
		let groupBatches = "groupBatches"

		let indexer = mock(new Indexer(restClientMock, (null: any), true, browserDataStub), (mock) => {
			mock._loadGroupData = o.spy(() => Promise.resolve(groupBatches))
			mock._initGroupData = o.spy(() => Promise.resolve())
			mock.db.dbFacade = ({createTransaction: () => Promise.resolve(transaction)}: any)
			mock._mail.indexMailboxes = o.spy()
		})

		let user = createUser()
		let groupDiff = {deletedGroups: [], newGroups: [{id: "groupId", type: GroupType.Contact}]}
		indexer._updateGroups(user, groupDiff).then(() => {
			o(indexer._loadGroupData.callCount).equals(1)
			o(indexer._loadGroupData.args[0]).equals(user)

			o(indexer._initGroupData.callCount).equals(1)
			o(indexer._initGroupData.args).deepEquals([groupBatches, transaction])

			o(indexer._mail.indexMailboxes.callCount).equals(0)
			done()
		})
	})

	o("_loadGroupData", function (done) {
		let user = createUser()
		user.memberships = [
			createGroupMembership(), createGroupMembership(), createGroupMembership(), createGroupMembership()
		]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "group-mail"
		user.memberships[1].groupType = GroupType.MailingList
		user.memberships[1].group = "group-team"
		user.memberships[2].groupType = GroupType.Contact
		user.memberships[2].group = "group-contact"
		user.memberships[3].groupType = GroupType.Customer
		user.memberships[3].group = "group-customer"
		let indexer = mock(new Indexer(restClientMock, (null: any), true, browserDataStub), (mock) => {
			mock._entity = {
				loadRange: (type, listId, startId, count, reverse) => {
					o(type).equals(EntityEventBatchTypeRef)
					o(startId).equals(GENERATED_MAX_ID)
					o(count).equals(100)
					o(reverse).equals(true)
					return Promise.resolve([{_id: [null, "event-batch-id"]}])
				}
			}
		})
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
				}
			])
			done()
		})
	})

	o("_loadGroupData not authorized", function (done) {
		let user = createUser()
		user.memberships = [createGroupMembership(), createGroupMembership()]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "group-mail"
		user.memberships[1].groupType = GroupType.MailingList
		user.memberships[1].group = "group-team"
		let indexer = mock(new Indexer(restClientMock, (null: any), true, browserDataStub), (mock) => {
			let count = 0
			mock._entity = {
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
		})
		indexer._loadGroupData(user).then(result => {
			o(result).deepEquals([
				{
					groupId: 'group-mail',
					groupData: {
						lastBatchIds: ["event-batch-id"],
						indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						groupType: GroupType.Mail
					}
				}
			])
			done()
		})
	})


	o("_initGroupData", function (done) {
		let groupBatches = [
			{
				groupId: "groupId",
				groupData: {
					groupType: GroupType.Mail,
					lastBatchIds: [],
					indexTimestamp: 1
				}
			}
		]

		let transaction: DbTransaction = downcast({
			put: (os, key, value) => {
				o(os).equals(GroupDataOS)
				o(key).equals(groupBatches[0].groupId)
				o(value).deepEquals(groupBatches[0].groupData)
				stored = true
				return Promise.resolve()
			},
			wait: () => Promise.resolve()
		})

		let indexer = new Indexer(restClientMock, (null: any), true, browserDataStub)
		let stored = false

		indexer._initGroupData(groupBatches, transaction).then(result => {
			o(stored).equals(true)
			done()
		})
	})

	o("_loadNewEntities", async function () {
		const newestBatchId = "L0JcCmx----0"
		const oldestBatchId = "L0JcCmw----0"
		const groupId = "group-mail"
		let groupIdToEventBatches = [
			{
				groupId,
				eventBatchIds: [newestBatchId, oldestBatchId],
			}
		]

		let batches = [createEntityEventBatch(), createEntityEventBatch()]
		batches[0]._id = ["group-mail", "L0JcCmw----1"] // bigger than last
		batches[0].events = [createEntityUpdate(), createEntityUpdate()]
		batches[1]._id = ["group-mail", oldestBatchId]
		batches[1].events = [createEntityUpdate(), createEntityUpdate()]

		let indexer = new Indexer(restClientMock, (null: any), true, browserDataStub)
		indexer._entity = ({
			loadAll: (type, groupIdA, startId) => {
				o(type).deepEquals(EntityEventBatchTypeRef)
				o(groupIdA).equals(groupId)
				let expectedStartId = timestampToGeneratedId(generatedIdToTimestamp(oldestBatchId) - 1)
				o(startId).equals(expectedStartId)
				return Promise.resolve(batches)
			}
		}: any)
		downcast(indexer)._processEntityEvents = o.spy(() => Promise.resolve())
		const queue = indexer._core.queue
		downcast(queue).addBatches = spy()

		await indexer._loadNewEntities(groupIdToEventBatches)

		// two asserts, otherwise Node doesn't print deeply nested objects
		o(queue.addBatches.invocations.length).equals(1)
		o(queue.addBatches.invocations[0]).deepEquals(
			[[{groupId, batchId: getElementId(batches[0]), events: batches[0].events}]]
		)
	})

	o("_loadNewEntities batch already processed", function (done) {
		const newestBatchId = "L0JcCmx----0"
		const oldestBatchId = "L0JcCmw----0"
		let groupIdToEventBatches = [
			{
				groupId: "group-mail",
				eventBatchIds: [newestBatchId, oldestBatchId],
			}
		]

		let batches = [createEntityEventBatch()]
		batches[0]._id = ["group-mail", oldestBatchId]
		batches[0].events = [createEntityUpdate(), createEntityUpdate()]

		let indexer = mock(new Indexer(restClientMock, (null: any), true, browserDataStub), (mock) => {
			mock._entity = {
				loadAll: (type, groupId, startId) => {
					o(type).deepEquals(EntityEventBatchTypeRef)
					o(groupId).equals("group-mail")
					let expectedStartId = timestampToGeneratedId(generatedIdToTimestamp(oldestBatchId) - 1)
					o(startId).equals(expectedStartId)
					return Promise.resolve(batches)
				}
			}
			mock._processEntityEvents = o.spy()
		})

		indexer._loadNewEntities(groupIdToEventBatches).then(() => {
			o(indexer._processEntityEvents.callCount).equals(0)
			done()
		})
	})

	o("_loadNewEntities out of sync", function (done) {
		const newestBatchId = "L0JcCmx----0"
		const oldestBatchId = "L0JcCmw----0"
		let groupIdToEventBatches = [
			{
				groupId: "group-mail",
				eventBatchIds: [newestBatchId, oldestBatchId],
			}
		]

		let batches = [createEntityEventBatch()]
		batches[0]._id = ["group-mail", "L0JcCmw----1"] // bigger than last
		batches[0].events = [createEntityUpdate(), createEntityUpdate()]

		let indexer = mock(new Indexer(restClientMock, (null: any), true, browserDataStub), (mock) => {
			mock._entity = {
				loadAll: (type, groupId, startId) => {
					o(type).deepEquals(EntityEventBatchTypeRef)
					o(groupId).equals("group-mail")
					let expectedStartId = timestampToGeneratedId(generatedIdToTimestamp(oldestBatchId) - 1)
					o(startId).equals(expectedStartId)
					return Promise.resolve(batches)
				}
			}
			mock._processEntityEvents = o.spy()
		})

		indexer._loadNewEntities(groupIdToEventBatches).catch(OutOfSyncError, e => {
			o(indexer._processEntityEvents.callCount).equals(0)
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
		user.memberships = [
			createGroupMembership(), createGroupMembership(), createGroupMembership(), createGroupMembership()
		]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "group-mail"
		user.memberships[1].groupType = GroupType.MailingList
		user.memberships[1].group = "group-team"
		user.memberships[2].groupType = GroupType.Contact
		user.memberships[2].group = "group-contact"
		user.memberships[3].groupType = GroupType.Customer
		user.memberships[3].group = "group-customer"

		let indexer = new Indexer(restClientMock, (null: any), true, browserDataStub)
		indexer.db.dbFacade = ({createTransaction: () => Promise.resolve(transaction)}: any)

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

	o("_processEntityEvents", async function () {
		const groupId = "group-id"
		const batchId = "batch-id"

		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = groupId

		const indexer = mock(new Indexer(restClientMock, (null: any), true, browserDataStub), (indexerMock) => {
			indexerMock.db.initialized = Promise.resolve()
			indexerMock._mail = {processEntityEvents: o.spy(() => Promise.resolve())}
			indexerMock._contact = {processEntityEvents: o.spy(() => Promise.resolve())}
			indexerMock._groupInfo = {processEntityEvents: o.spy(() => Promise.resolve())}
			indexerMock._whitelabelChildIndexer = {processEntityEvents: o.spy(() => Promise.resolve())}
			indexerMock._processUserEntityEvents = o.spy(() => Promise.resolve())
			indexerMock._initParams = {user: createUser()}
			indexerMock._core.writeIndexUpdate = spy(() => Promise.resolve())
			indexerMock._initParams = {user}
		})

		function newUpdate<T>(typeRef: TypeRef<T>) {
			let u = createEntityUpdate()
			u.application = typeRef.app
			u.type = typeRef.type
			return u
		}

		let events = [
			newUpdate(MailTypeRef), newUpdate(ContactTypeRef), newUpdate(GroupInfoTypeRef), newUpdate(UserTypeRef), newUpdate(WhitelabelChildTypeRef)
		]
		indexer._indexedGroupIds = [groupId]
		const batch = {events, groupId, batchId}
		const futureActions: FutureBatchActions = {deleted: new Map(), moved: new Map()}
		await indexer._processEntityEvents(batch, futureActions)

		o(indexer._core.writeIndexUpdate.invocations.length).equals(4)
		let indexUpdateMail = indexer._core.writeIndexUpdate.invocations[0][0]

		o(indexer._mail.processEntityEvents.callCount).equals(1)
		o(indexer._mail.processEntityEvents.args)
			.deepEquals([[events[0]], groupId, batchId, indexUpdateMail, futureActions])

		let indexUpdateContact = indexer._core.writeIndexUpdate.invocations[1][0]
		o(indexer._contact.processEntityEvents.callCount).equals(1)
		o(indexer._contact.processEntityEvents.args).deepEquals([[events[1]], groupId, batchId, indexUpdateContact])

		let indexUpdateGroupInfo = indexer._core.writeIndexUpdate.invocations[2][0]
		o(indexer._groupInfo.processEntityEvents.callCount).equals(1)
		o(indexer._groupInfo.processEntityEvents.args).deepEquals([[events[2]], groupId, batchId, indexUpdateGroupInfo, user])

		// no index update for user type

		let indexUpdateWhitelabel = indexer._core.writeIndexUpdate.invocations[3][0]
		o(indexer._whitelabelChildIndexer.processEntityEvents.callCount).equals(1)
		o(indexer._whitelabelChildIndexer.processEntityEvents.args).deepEquals([[events[4]], groupId, batchId, indexUpdateWhitelabel, user])
	})

	o("processEntityEvents non indexed group", function (done) {
		let user = createUser()
		user.memberships = [createGroupMembership()]
		user.memberships[0].groupType = GroupType.MailingList
		user.memberships[0].group = "group-id"
		const indexer = mock(new Indexer(restClientMock, (null: any), true, browserDataStub), (mock) => {
			mock.db.initialized = Promise.resolve()
			mock._mail = {processEntityEvents: o.spy(() => Promise.resolve())}
			mock._contact = {processEntityEvents: o.spy(() => Promise.resolve())}
			mock._groupInfo = {processEntityEvents: o.spy(() => Promise.resolve())}
			mock._processUserEntityEvents = o.spy(() => Promise.resolve())
			mock._initParams = {user: createUser()}
			mock._core.writeIndexUpdate = o.spy(() => Promise.resolve())
			mock._initParams = {user}
		})

		function update(typeRef: TypeRef<any>) {
			let u = createEntityUpdate()
			u.application = typeRef.app
			u.type = typeRef.type
			return u
		}

		let events = [update(MailTypeRef), update(ContactTypeRef), update(GroupInfoTypeRef), update(UserTypeRef)]
		const batch: QueuedBatch = {events, groupId: "group-id", batchId: "batch-id"}
		indexer._indexedGroupIds = ["group-id"]
		indexer._processEntityEvents(batch, {deleted: new Map(), moved: new Map()}).then(() => {
			o(indexer._core.writeIndexUpdate.callCount).equals(0)
			o(indexer._mail.processEntityEvents.callCount).equals(0)
			o(indexer._contact.processEntityEvents.callCount).equals(0)
			o(indexer._groupInfo.processEntityEvents.callCount).equals(0)
			o(indexer._processUserEntityEvents.callCount).equals(0)
			done()
		})
	})

	o("_processEntityEvents", async function () {
		const doneDeferred = defer()
		const indexer = mock(new Indexer(restClientMock, (null: any), true, browserDataStub), (mock) => {
			mock.db.initialized = Promise.resolve()
			mock._mail = {processEntityEvents: o.spy(() => Promise.resolve())}
			mock._contact = {processEntityEvents: o.spy(() => Promise.resolve())}
			mock._groupInfo = {processEntityEvents: o.spy(() => Promise.resolve())}
			mock._processUserEntityEvents = o.spy(() => Promise.resolve())
			mock._initParams = {user: createUser()}
			mock._core.writeIndexUpdate = o.spy(() => Promise.resolve())
			let user = createUser()
			user.memberships = [createGroupMembership()]
			user.memberships[0].groupType = GroupType.Mail
			user.memberships[0].group = "group-id"
			mock._initParams = {user}
			const _processNext = mock._core.queue._processNext.bind(mock._core.queue)
			mock._core.queue._processNext = spy(() => {
				if (mock._core.queue._eventQueue.length === 0) {
					doneDeferred.resolve()
				}
				_processNext()
			})
		})

		function update(typeRef: TypeRef<any>) {
			let u = createEntityUpdate()
			u.application = typeRef.app
			u.type = typeRef.type
			return u
		}


		let events1 = [update(MailTypeRef)]
		indexer._indexedGroupIds = ["group-id"]
		const batch1: QueuedBatch = {
			events: events1,
			groupId: "group-id",
			batchId: "batch-id-1"
		}
		let events2 = [update(MailTypeRef)]
		indexer._indexedGroupIds = ["group-id"]
		const batch2: QueuedBatch = {
			events: events2,
			groupId: "group-id",
			batchId: "batch-id-2"
		}

		indexer.addBatchesToQueue([batch1, batch2])
		indexer.startProcessing()

		await doneDeferred.promise

		o(indexer._core.writeIndexUpdate.callCount).equals(2)
		o(indexer._mail.processEntityEvents.callCount).equals(2)
		o(indexer._contact.processEntityEvents.callCount).equals(0)
		o(indexer._groupInfo.processEntityEvents.callCount).equals(0)
	})

	o("_getStartIdForLoadingMissedEventBatches", function () {
		let indexer = new Indexer(restClientMock, (null: any), true, browserDataStub)

		// one batch that is very young, so its id is returned minus 1 ms
		o(indexer._getStartIdForLoadingMissedEventBatches(["L0JcCm1-----"])).equals("L0JcCm0-----") // - 1 ms
		// two batches that are very young, so the oldest id is returned minus 1 ms
		o(indexer._getStartIdForLoadingMissedEventBatches(["L0JcCm2-----", "L0JcCm1-----"])).equals("L0JcCm0-----") // - 1 ms

		// two batches of which the oldest is exactly one minute old, so the oldest id is returned minus 1 ms. this tests the inner limit
		let oneMinuteOld = timestampToGeneratedId(generatedIdToTimestamp("L0JcCm1-----") - 1000 * 60)
		let oneMinuteOldMinusOneMS = timestampToGeneratedId(generatedIdToTimestamp("L0JcCm1-----") - 1000 * 60 - 1) // - 1 ms
		o(indexer._getStartIdForLoadingMissedEventBatches(["L0JcCm1----", oneMinuteOld])).equals(oneMinuteOldMinusOneMS)

		// two batches of which the oldest is exactly one minute and one ms old, so the newest id is returned minus 1 ms. this tests the outer limit
		let olderThanOneMinute = timestampToGeneratedId(generatedIdToTimestamp("L0JcCm1-----") - 1000 * 60 - 1)
		let newestMinusOneMinute = timestampToGeneratedId(generatedIdToTimestamp("L0JcCm1-----") - 1000 * 60)
		o(indexer._getStartIdForLoadingMissedEventBatches(["L0JcCm1----", olderThanOneMinute])).equals(newestMinusOneMinute)

		// two batches of which the oldest is very old, so the newest id is returned minus 1 ms.
		let veryOld = timestampToGeneratedId(generatedIdToTimestamp("L0JcCm1-----") - 1000 * 60 * 10)
		o(indexer._getStartIdForLoadingMissedEventBatches(["L0JcCm1----", veryOld])).equals(newestMinusOneMinute)
	})
})