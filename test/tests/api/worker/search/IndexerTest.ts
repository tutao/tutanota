import { EntityEventBatchTypeRef, EntityUpdateTypeRef, GroupMembershipTypeRef, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { DbFacade, DbTransaction } from "../../../../../src/common/api/worker/search/DbFacade.js"
import {
	ENTITY_EVENT_BATCH_TTL_DAYS,
	FULL_INDEXED_TIMESTAMP,
	GroupType,
	NOTHING_INDEXED_TIMESTAMP,
	OperationType,
} from "../../../../../src/common/api/common/TutanotaConstants.js"
import { Indexer } from "../../../../../src/mail-app/workerUtils/index/Indexer.js"
import { NotAuthorizedError } from "../../../../../src/common/api/common/error/RestError.js"
import { ContactListTypeRef, ContactTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { OutOfSyncError } from "../../../../../src/common/api/common/error/OutOfSyncError.js"
import { assertThrows, mock, spy } from "@tutao/tutanota-test-utils"
import { browserDataStub, createTestEntity } from "../../../TestUtils.js"
import type { QueuedBatch } from "../../../../../src/common/api/worker/EventQueue.js"
import { EntityRestClient } from "../../../../../src/common/api/worker/rest/EntityRestClient.js"
import { MembershipRemovedError } from "../../../../../src/common/api/common/error/MembershipRemovedError.js"
import { GENERATED_MAX_ID, generatedIdToTimestamp, getElementId, timestampToGeneratedId } from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { daysToMillis, defer, downcast, freshVersioned, TypeRef } from "@tutao/tutanota-utils"
import { aes256RandomKey, aesEncrypt, decryptKey, encryptKey, fixedIv, IV_BYTE_LENGTH, random } from "@tutao/tutanota-crypto"
import { DefaultEntityRestCache } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache.js"
import o from "@tutao/otest"
import { func, instance, matchers, object, replace, reset, verify, when } from "testdouble"
import { CacheInfo } from "../../../../../src/common/api/worker/facades/LoginFacade.js"
import { RestClient } from "../../../../../src/common/api/worker/rest/RestClient.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { ContactIndexer } from "../../../../../src/mail-app/workerUtils/index/ContactIndexer.js"
import { InfoMessageHandler } from "../../../../../src/common/gui/InfoMessageHandler.js"
import { GroupDataOS, Metadata, MetaDataOS } from "../../../../../src/common/api/worker/search/IndexTables.js"
import { MailFacade } from "../../../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { MailIndexer } from "../../../../../src/mail-app/workerUtils/index/MailIndexer.js"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"

const SERVER_TIME = new Date("1994-06-08").getTime()
let contactList = createTestEntity(ContactListTypeRef)
contactList._ownerGroup = "ownerGroupId"
contactList.contacts = "contactListId"
o.spec("IndexerTest", () => {
	const OUT_OF_DATE_SERVER_TIME = SERVER_TIME - daysToMillis(ENTITY_EVENT_BATCH_TTL_DAYS) - 1000 * 60 * 60 * 24
	const restClientMock: EntityRestClient = downcast({
		getRestClient() {
			return {
				getServerTimestampMs() {
					return SERVER_TIME
				},
			}
		},
	})
	const entityRestCache: DefaultEntityRestCache = downcast({})

	const mailFacade: MailFacade = downcast({})
	const keyLoaderFacade = object<KeyLoaderFacade>()

	o("init new db", async function () {
		let metadata = {}
		const expectedKeys = Object.keys(Metadata)
		let transaction = {
			get: (os, key) => {
				o(os).equals(MetaDataOS)
				o(key).equals(expectedKeys.shift())
				return Promise.resolve(null)
			},
			getAll: (os) => {
				// So that we don't run into "no group ids' check
				return Promise.resolve([
					{
						key: "key",
						value: "value",
					},
				])
			},
			put: (os, key, value) => {
				o(os).equals(MetaDataOS)
				metadata[key] = value
			},
			wait: () => Promise.resolve(),
		}
		let groupBatches = [
			{
				groupId: "user-group-id",
				groupData: {},
			},
		]
		let persistentGroupData = [
			{
				persistentGroupData: "dummy",
			},
		]
		const infoMessageHandler = object<InfoMessageHandler>()
		const indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock._loadGroupData = spy(() => Promise.resolve(groupBatches))
			mock._initGroupData = spy((batches) => Promise.resolve())
			mock.db.dbFacade = {
				open: spy(() => Promise.resolve()),
				createTransaction: () => Promise.resolve(transaction),
			}
			mock._contact.indexFullContactList = spy(() => Promise.resolve())
			mock._contact.getIndexTimestamp = spy(() => Promise.resolve(NOTHING_INDEXED_TIMESTAMP))
			mock._mail.indexMailboxes = spy(() => Promise.resolve())
			mock._loadPersistentGroupData = spy(() => Promise.resolve(persistentGroupData))
			mock._loadNewEntities = spy(async () => {})
			mock._entity.loadRoot = spy(() => Promise.resolve(contactList))
		})
		let user = createTestEntity(UserTypeRef)
		user.userGroup = createTestEntity(GroupMembershipTypeRef)
		user.userGroup.group = "user-group-id"
		let userGroupKey = freshVersioned(aes256RandomKey())

		when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)

		await indexer.init({ user, keyLoaderFacade })
		o(indexer._loadGroupData.args).deepEquals([user])
		o(indexer._initGroupData.args[0]).deepEquals(groupBatches)
		o(metadata[Metadata.mailIndexingEnabled]).equals(false)
		o(decryptKey(userGroupKey.object, metadata[Metadata.userEncDbKey])).deepEquals(indexer.db.key)
		o(indexer._entity.loadRoot.args).deepEquals([ContactListTypeRef, user.userGroup.group])
		o(indexer._contact.indexFullContactList.callCount).equals(1)
		o(indexer._contact.indexFullContactList.args).deepEquals([contactList])
		o(indexer._mail.indexMailboxes.callCount).equals(1)
		o(indexer._loadPersistentGroupData.args).deepEquals([user])
		o(indexer._loadNewEntities.args).deepEquals([persistentGroupData])
	})

	o("init existing db", async function () {
		let userGroupKey = freshVersioned(aes256RandomKey())
		let dbKey = aes256RandomKey()
		let encDbIv = aesEncrypt(dbKey, fixedIv, random.generateRandomData(IV_BYTE_LENGTH), true)
		let userEncDbKey = encryptKey(userGroupKey.object, dbKey)
		const userGroupKeyVersion = 0
		let transaction = {
			get: (os, key) => {
				if (os == MetaDataOS && key == Metadata.userEncDbKey) return Promise.resolve(userEncDbKey)
				if (os == MetaDataOS && key == Metadata.mailIndexingEnabled) return Promise.resolve(true)
				if (os == MetaDataOS && key == Metadata.excludedListIds) return Promise.resolve(["excluded-list-id"])
				if (os == MetaDataOS && key == Metadata.encDbIv) return Promise.resolve(encDbIv)
				if (os == MetaDataOS && key == Metadata.userGroupKeyVersion) {
					return Promise.resolve(userGroupKeyVersion)
				}
				return Promise.resolve(null)
			},
			getAll: (os) => {
				// So that we don't run into "no group ids' check
				return Promise.resolve([
					{
						key: "key",
						value: "value",
					},
				])
			},
			wait: () => Promise.resolve(),
		}
		let persistentGroupData = [
			{
				persistentGroupData: "dummy",
			},
		]
		let groupDiff = [
			{
				groupDiff: "dummy",
			},
		]
		const infoMessageHandler = object<InfoMessageHandler>()
		const indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock.db.dbFacade = {
				open: spy(() => Promise.resolve()),
				createTransaction: () => Promise.resolve(transaction),
			}
			mock._loadGroupDiff = spy(() => Promise.resolve(groupDiff))
			mock._updateGroups = spy(() => Promise.resolve())
			mock._mail.updateCurrentIndexTimestamp = spy(() => Promise.resolve())
			mock._contact.indexFullContactList = spy(() => Promise.resolve())
			mock._contact.getIndexTimestamp = spy(() => Promise.resolve(FULL_INDEXED_TIMESTAMP))
			mock._contact.suggestionFacade.load = spy(() => Promise.resolve())
			mock._loadPersistentGroupData = spy(() => Promise.resolve(persistentGroupData))
			mock._loadNewEntities = spy(async () => {})
			mock._entity.loadRoot = spy(() => Promise.resolve(contactList))
		})
		let user = createTestEntity(UserTypeRef)
		user.userGroup = createTestEntity(GroupMembershipTypeRef)
		user.userGroup.group = "user-group-id"

		when(keyLoaderFacade.loadSymUserGroupKey(userGroupKeyVersion)).thenResolve(userGroupKey.object)

		await indexer.init({ user, keyLoaderFacade })
		o(indexer.db.key).deepEquals(dbKey)
		o(indexer._loadGroupDiff.args).deepEquals([user])
		o(indexer._updateGroups.args).deepEquals([user, groupDiff])
		o(indexer._entity.loadRoot.args).deepEquals([ContactListTypeRef, user.userGroup.group])
		o(indexer._contact.indexFullContactList.callCount).equals(0)
		o(indexer._loadPersistentGroupData.args).deepEquals([user])
		o(indexer._loadNewEntities.args).deepEquals([persistentGroupData])
		o(indexer._contact.suggestionFacade.load.callCount).equals(1)
	})

	o("init existing db out of sync", async () => {
		let userGroupKey = freshVersioned(aes256RandomKey())
		let dbKey = aes256RandomKey()
		let userEncDbKey = encryptKey(userGroupKey.object, dbKey)
		const userGroupKeyVersion = 0
		let encDbIv = aesEncrypt(dbKey, fixedIv, random.generateRandomData(IV_BYTE_LENGTH), true)
		let transaction = {
			get: async (os, key) => {
				if (os == MetaDataOS && key == Metadata.userEncDbKey) return userEncDbKey
				if (os == MetaDataOS && key == Metadata.userGroupKeyVersion) {
					return userGroupKeyVersion
				}
				if (os == MetaDataOS && key == Metadata.mailIndexingEnabled) return true
				if (os == MetaDataOS && key == Metadata.excludedListIds) return ["excluded-list-id"]
				if (os == MetaDataOS && key == Metadata.encDbIv) return encDbIv
				if (os == MetaDataOS && key == Metadata.lastEventIndexTimeMs) return SERVER_TIME
				return null
			},
			wait: () => Promise.resolve(),
			// So that we don't run into "no group ids' check
			getAll: () =>
				Promise.resolve([
					{
						key: "key",
						value: "value",
					},
				]),
		}
		let groupDiff = [
			{
				groupDiff: "dummy",
			},
		]
		let persistentGroupData = [
			{
				persistentGroupData: "dummy",
			},
		]
		const infoMessageHandler = object<InfoMessageHandler>()
		const indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock.db.initialized = Promise.resolve()
			mock.db.dbFacade = {
				open: spy(() => Promise.resolve()),
				createTransaction: () => Promise.resolve(transaction),
			}
			mock._loadGroupDiff = spy(() => Promise.resolve(groupDiff))
			mock._updateGroups = spy(() => Promise.resolve())
			mock._mail.updateCurrentIndexTimestamp = spy(() => Promise.resolve())
			mock._contact.indexFullContactList = spy(() => Promise.resolve())
			mock._contact.getIndexTimestamp = spy(() => Promise.resolve(FULL_INDEXED_TIMESTAMP))
			mock._loadPersistentGroupData = spy(() => Promise.resolve(persistentGroupData))
			mock._loadNewEntities = spy(() => Promise.reject(new OutOfSyncError("is out of sync ;-)")))
			mock.disableMailIndexing = spy()
			mock._entity.loadRoot = spy(() => Promise.resolve(contactList))
		})
		let user = createTestEntity(UserTypeRef)
		user.userGroup = createTestEntity(GroupMembershipTypeRef)
		user.userGroup.group = "user-group-id"

		when(keyLoaderFacade.loadSymUserGroupKey(userGroupKeyVersion)).thenResolve(userGroupKey.object)

		await indexer.init({ user, keyLoaderFacade })
		o(indexer.db.key).deepEquals(dbKey)
		o(indexer._loadGroupDiff.args).deepEquals([user])
		o(indexer._updateGroups.args).deepEquals([user, groupDiff])
		o(indexer._entity.loadRoot.args).deepEquals([ContactListTypeRef, user.userGroup.group])
		o(indexer._contact.indexFullContactList.callCount).equals(0)
		o(indexer._loadPersistentGroupData.args).deepEquals([user])
		o(indexer._loadNewEntities.args).deepEquals([persistentGroupData])
	})
	o("_loadGroupDiff", async function () {
		let user = createTestEntity(UserTypeRef)
		user.memberships = [createTestEntity(GroupMembershipTypeRef), createTestEntity(GroupMembershipTypeRef), createTestEntity(GroupMembershipTypeRef)]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "new-group-id"
		user.memberships[1].groupType = GroupType.Contact
		user.memberships[1].group = "constant-group-id"
		let deletedGroupId = "deleted-group-id"
		let groupData = {
			groupType: GroupType.MailingList,
		}
		let transaction = {
			getAll: (os) => {
				o(os).equals(GroupDataOS)
				return Promise.resolve([
					{
						key: deletedGroupId,
						value: groupData,
					},
					{
						key: user.memberships[1].group,
						value: {
							groupType: GroupType.Mail,
						},
					},
				])
			},
		}
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade)
		indexer.db.dbFacade = {
			createTransaction: () => Promise.resolve(transaction),
		} as any

		const result = await indexer._loadGroupDiff(user)
		o(result).deepEquals({
			deletedGroups: [
				{
					id: "deleted-group-id",
					type: GroupType.MailingList,
				},
			],
			newGroups: [
				{
					id: "new-group-id",
					type: GroupType.Mail,
				},
			],
		})
	})

	o("_updateGroups disable MailIndexing in case of a deleted mail group", async function () {
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock.disableMailIndexing = spy(() => Promise.resolve())
		})
		let user = createTestEntity(UserTypeRef)
		let groupDiff = {
			deletedGroups: [
				{
					id: "groupId",
					type: GroupType.Mail,
				},
			],
			newGroups: [],
		}
		await o(() => indexer._updateGroups(user, groupDiff)).asyncThrows(MembershipRemovedError)
	})

	o("_updateGroups disable MailIndexing in case of a deleted contact group", async function () {
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock.disableMailIndexing = spy(() => Promise.resolve())
		})
		let user = createTestEntity(UserTypeRef)
		let groupDiff = {
			deletedGroups: [
				{
					id: "groupId",
					type: GroupType.Contact,
				},
			],
			newGroups: [],
		}
		const e = await assertThrows(MembershipRemovedError, () => indexer._updateGroups(user, groupDiff))
	})

	o("_updateGroups don't disable MailIndexing in case no mail or contact group has been deleted", async function () {
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock.disableMailIndexing = spy()
		})
		let user = createTestEntity(UserTypeRef)
		let groupDiff = {
			deletedGroups: [
				{
					id: "groupId",
					type: GroupType.MailingList,
				},
			],
			newGroups: [],
		}

		await indexer._updateGroups(user, groupDiff)
	})

	o("_updateGroups do not index new mail groups", async function () {
		let transaction = "transaction"
		let groupBatches = "groupBatches"
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock._loadGroupData = spy(() => Promise.resolve(groupBatches))
			mock._initGroupData = spy(() => Promise.resolve())
			mock.db.dbFacade = {
				createTransaction: () => Promise.resolve(transaction),
			} as any
			mock._mail.indexMailboxes = spy()
			mock._mail.currentIndexTimestamp = new Date().getTime()
		})
		let user = createTestEntity(UserTypeRef)
		let groupDiff = {
			deletedGroups: [],
			newGroups: [
				{
					id: "groupId",
					type: GroupType.Mail,
				},
			],
		}

		await indexer._updateGroups(user, groupDiff)
		o(indexer._loadGroupData.callCount).equals(1)
		o(indexer._loadGroupData.args[0]).equals(user)
		o(indexer._initGroupData.callCount).equals(1)
		o(indexer._initGroupData.args).deepEquals([groupBatches, transaction])
		o(indexer._mail.indexMailboxes.callCount).equals(0)
	})
	o("_updateGroups only init group data for non mail groups (do not index)", async function () {
		let transaction = "transaction"
		let groupBatches = "groupBatches"
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock._loadGroupData = spy(() => Promise.resolve(groupBatches))
			mock._initGroupData = spy(() => Promise.resolve())
			mock.db.dbFacade = {
				createTransaction: () => Promise.resolve(transaction),
			} as any
			mock._mail.indexMailboxes = spy()
		})
		let user = createTestEntity(UserTypeRef)
		let groupDiff = {
			deletedGroups: [],
			newGroups: [
				{
					id: "groupId",
					type: GroupType.Contact,
				},
			],
		}

		await indexer._updateGroups(user, groupDiff)
		o(indexer._loadGroupData.callCount).equals(1)
		o(indexer._loadGroupData.args[0]).equals(user)
		o(indexer._initGroupData.callCount).equals(1)
		o(indexer._initGroupData.args).deepEquals([groupBatches, transaction])
		o(indexer._mail.indexMailboxes.callCount).equals(0)
	})
	o("_loadGroupData", async function () {
		let user = createTestEntity(UserTypeRef)
		user.memberships = [
			createTestEntity(GroupMembershipTypeRef),
			createTestEntity(GroupMembershipTypeRef),
			createTestEntity(GroupMembershipTypeRef),
			createTestEntity(GroupMembershipTypeRef),
		]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "group-mail"
		user.memberships[1].groupType = GroupType.MailingList
		user.memberships[1].group = "group-team"
		user.memberships[2].groupType = GroupType.Contact
		user.memberships[2].group = "group-contact"
		user.memberships[3].groupType = GroupType.Customer
		user.memberships[3].group = "group-customer"
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock._entity = {
				loadRange: (type, listId, startId, count, reverse) => {
					o(type).equals(EntityEventBatchTypeRef)
					o(startId).equals(GENERATED_MAX_ID)
					o(count).equals(1)
					o(reverse).equals(true)
					return Promise.resolve([
						{
							_id: [null, "event-batch-id"],
						},
					])
				},
			}
		})

		const result = await indexer._loadGroupData(user)
		o(result).deepEquals([
			{
				groupId: "group-mail",
				groupData: {
					lastBatchIds: ["event-batch-id"],
					indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
					groupType: GroupType.Mail,
				},
			},
			{
				groupId: "group-contact",
				groupData: {
					lastBatchIds: ["event-batch-id"],
					indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
					groupType: GroupType.Contact,
				},
			},
			{
				groupId: "group-customer",
				groupData: {
					lastBatchIds: ["event-batch-id"],
					indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
					groupType: GroupType.Customer,
				},
			},
		])
	})

	o("_loadGroupData not authorized", async function () {
		let user = createTestEntity(UserTypeRef)
		user.memberships = [createTestEntity(GroupMembershipTypeRef), createTestEntity(GroupMembershipTypeRef)]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "group-mail"
		user.memberships[1].groupType = GroupType.MailingList
		user.memberships[1].group = "group-team"
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			let count = 0
			mock._entity = {
				loadRange: (type, listId, startId, count, reverse) => {
					if (count == 0) {
						console.log("EEE")
						count++
						return Promise.reject(new NotAuthorizedError("test"))
					} else {
						return Promise.resolve([
							{
								_id: [null, "event-batch-id"],
							},
						])
					}
				},
			}
		})

		const result = await indexer._loadGroupData(user)
		o(result).deepEquals([
			{
				groupId: "group-mail",
				groupData: {
					lastBatchIds: ["event-batch-id"],
					indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
					groupType: GroupType.Mail,
				},
			},
		])
	})
	o("_initGroupData", async function () {
		let groupBatches = [
			{
				groupId: "groupId",
				groupData: {
					groupType: GroupType.Mail,
					lastBatchIds: [],
					indexTimestamp: 1,
				},
			},
		]
		let transaction: DbTransaction = downcast({
			put: (os, key, value) => {
				o(os).equals(GroupDataOS)
				o(key).equals(groupBatches[0].groupId)
				o(value).deepEquals(groupBatches[0].groupData)
				stored = true
				return Promise.resolve()
			},
			wait: () => Promise.resolve(),
		})
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade)
		let stored = false

		await indexer._initGroupData(groupBatches, transaction)
		o(stored).equals(true)
	})

	o("_loadNewEntities", async function () {
		const newestBatchId = "L0JcCmx----0"
		const oldestBatchId = "L0JcCmw----0"
		const groupId = "group-mail"
		let groupIdToEventBatches = [
			{
				groupId,
				eventBatchIds: [newestBatchId, oldestBatchId],
			},
		]
		let batches = [createTestEntity(EntityEventBatchTypeRef), createTestEntity(EntityEventBatchTypeRef)]
		batches[0]._id = ["group-mail", "L0JcCmw----1"] // bigger than last

		batches[0].events = [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)]
		batches[1]._id = ["group-mail", oldestBatchId]
		batches[1].events = [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)]
		let transaction = {
			get: async (os, key) => {
				if (os == MetaDataOS && key == Metadata.lastEventIndexTimeMs) return SERVER_TIME
				return null
			},
			put: spy(async (os, key, value) => {}),
		}
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock.db.initialized = Promise.resolve()
			mock.db.dbFacade = {
				createTransaction: () => Promise.resolve(transaction),
			}
		})
		indexer._entity = {
			loadAll: (type, groupIdA, startId) => {
				o(type).deepEquals(EntityEventBatchTypeRef)
				o(groupIdA).equals(groupId)
				let expectedStartId = timestampToGeneratedId(generatedIdToTimestamp(oldestBatchId) - 1)
				o(startId).equals(expectedStartId)
				return Promise.resolve(batches)
			},
		} as any
		downcast(indexer)._processEntityEvents = spy(() => Promise.resolve())
		const queue = indexer._core.queue
		downcast(queue).addBatches = spy()
		await indexer._loadNewEntities(groupIdToEventBatches)
		// two asserts, otherwise Node doesn't print deeply nested objects
		// @ts-ignore
		o(queue.addBatches.invocations.length).equals(1)
		// @ts-ignore
		o(queue.addBatches.invocations[0]).deepEquals([
			[
				{
					groupId,
					batchId: getElementId(batches[0]),
					events: batches[0].events,
				},
			],
		])
		o(transaction.put.args).deepEquals([MetaDataOS, Metadata.lastEventIndexTimeMs, SERVER_TIME])
	})

	o("load events and then receive latest again", async function () {
		const newestBatchId = "L0JcCmx----0"
		const oldestBatchId = "L0JcCmw----0"
		const groupId = "group-mail"
		let groupIdToEventBatches = [
			{
				groupId,
				eventBatchIds: [newestBatchId, oldestBatchId],
			},
		]
		let batches = [createTestEntity(EntityEventBatchTypeRef), createTestEntity(EntityEventBatchTypeRef)]
		const loadedNewBatchId = "L0JcCmw----1"
		batches[0]._id = ["group-mail", loadedNewBatchId] // newer than oldest but older than newest

		batches[0].events = [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)]
		batches[1]._id = ["group-mail", oldestBatchId]
		batches[1].events = [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)]
		let transaction = {
			get: async (os, key) => {
				if (os == MetaDataOS && key == Metadata.lastEventIndexTimeMs) return SERVER_TIME
				return null
			},
			put: spy(async (os, key, value) => {}),
		}
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock.db.initialized = Promise.resolve()
			mock.db.dbFacade = {
				createTransaction: () => Promise.resolve(transaction),
			}
		})
		indexer._entity = {
			loadAll: (type, groupIdA, startId) => Promise.resolve(batches),
		} as any
		downcast(indexer)._processEntityEvents = spy(() => Promise.resolve())
		const queue = indexer._core.queue
		downcast(queue).addBatches = spy()
		await indexer._loadNewEntities(groupIdToEventBatches)
		// Check that we actually added loaded batch
		// two asserts, otherwise Node doesn't print deeply nested objects
		o(queue.addBatches.invocations.length).equals(1)
		o(queue.addBatches.invocations[0]).deepEquals([
			[
				{
					groupId,
					batchId: getElementId(batches[0]),
					events: batches[0].events,
				},
			],
		])
		o(transaction.put.args).deepEquals([MetaDataOS, Metadata.lastEventIndexTimeMs, SERVER_TIME])
		// say we received the same batch via ws
		const realtimeEvents = [createTestEntity(EntityUpdateTypeRef)]
		indexer.addBatchesToQueue([
			{
				groupId,
				events: realtimeEvents,
				batchId: loadedNewBatchId,
			},
		])
		// Check that we filtered out batch which we already loaded and added
		o(queue.addBatches.invocations.length).equals(1)
	})
	o("load events and then receive older again", async function () {
		const newestBatchId = "L0JcCmx----0"
		const oldestBatchId = "L0JcCmw----0"
		const groupId = "group-mail"
		let groupIdToEventBatches = [
			{
				groupId,
				eventBatchIds: [newestBatchId, oldestBatchId],
			},
		]
		let batches = [createTestEntity(EntityEventBatchTypeRef), createTestEntity(EntityEventBatchTypeRef)]
		const loadedNewBatchId = "L0JcCmy-----" // newer than newest

		batches[0]._id = ["group-mail", loadedNewBatchId]
		batches[0].events = [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)]
		batches[1]._id = ["group-mail", oldestBatchId]
		batches[1].events = [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)]
		let transaction = {
			get: async (os, key) => {
				if (os == MetaDataOS && key == Metadata.lastEventIndexTimeMs) return SERVER_TIME
				return null
			},
			put: spy(async (os, key, value) => {}),
		}
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock.db.initialized = Promise.resolve()
			mock.db.dbFacade = {
				createTransaction: () => Promise.resolve(transaction),
			}
		})
		indexer._entity = {
			loadAll: (type, groupIdA, startId) => Promise.resolve(batches),
		} as any
		downcast(indexer)._processEntityEvents = spy(() => Promise.resolve())
		const queue = indexer._core.queue
		downcast(queue).addBatches = spy()
		await indexer._loadNewEntities(groupIdToEventBatches)
		// Check that we actually added loaded batch
		// two asserts, otherwise Node doesn't print deeply nested objects
		// @ts-ignore
		o(queue.addBatches.invocations.length).equals(1)
		// @ts-ignore
		o(queue.addBatches.invocations[0]).deepEquals([
			[
				{
					groupId,
					batchId: getElementId(batches[0]),
					events: batches[0].events,
				},
			],
		])
		o(transaction.put.args).deepEquals([MetaDataOS, Metadata.lastEventIndexTimeMs, SERVER_TIME])
		// say we received the older batch via ws
		indexer.addBatchesToQueue([
			{
				groupId,
				events: [],
				batchId: newestBatchId,
			},
		])
		// Check that we filtered out batch which we already loaded and added
		// @ts-ignore
		o(queue.addBatches.invocations.length).equals(1)
	})

	o("receive realtime events before init finishes", async function () {
		const oldestBatchId = "L0JcCmw----0"
		const loadedNewBatchId = "L0JcCmw----1" // newer than oldest but older than realtime

		const realtimeBatchId = "L0JcCmx----0"
		const groupId = "group-mail"
		let groupIdToEventBatches = [
			{
				groupId,
				eventBatchIds: [oldestBatchId],
			},
		]
		let loadedBatches = [
			createTestEntity(EntityEventBatchTypeRef, {
				_id: ["group-mail", loadedNewBatchId],
				events: [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)],
			}),
			createTestEntity(EntityEventBatchTypeRef, {
				_id: ["group-mail", oldestBatchId],
			}),
		]
		let transaction = {
			get: async (os, key) => {
				if (os == MetaDataOS && key == Metadata.lastEventIndexTimeMs) return SERVER_TIME
				return null
			},
			put: spy(async (os, key, value) => {}),
		}
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock.db.initialized = Promise.resolve()
			mock.db.dbFacade = {
				createTransaction: () => Promise.resolve(transaction),
			}
		})
		const loadCompleted = defer()
		indexer._entity = {
			loadAll: (type, groupIdA, startId) => loadCompleted.promise,
		} as any
		downcast(indexer)._processEntityEvents = spy(() => Promise.resolve())
		const queue = indexer._core.queue
		downcast(queue).addBatches = spy()

		const loadPromise = indexer._loadNewEntities(groupIdToEventBatches)

		const realtimeUpdates = [
			createTestEntity(EntityUpdateTypeRef, {
				instanceId: "realtime",
			}),
		]
		indexer.addBatchesToQueue([
			{
				groupId,
				events: realtimeUpdates,
				batchId: realtimeBatchId,
			},
		])
		loadCompleted.resolve(loadedBatches)
		await loadPromise
		// Check that we filtered out batch which we already loaded and added
		o(queue.addBatches.invocations.length).equals(2)
		o(queue.addBatches.invocations[0]).deepEquals([
			[
				{
					groupId,
					batchId: getElementId(loadedBatches[0]),
					events: loadedBatches[0].events,
				},
			],
		])
		o(queue.addBatches.invocations[1]).deepEquals([
			[
				{
					groupId,
					batchId: realtimeBatchId,
					events: realtimeUpdates,
				},
			],
		])
		o(transaction.put.args).deepEquals([MetaDataOS, Metadata.lastEventIndexTimeMs, SERVER_TIME])
	})

	o("_loadNewEntities batch already processed", async function () {
		const newestBatchId = "L0JcCmx----0"
		const oldestBatchId = "L0JcCmw----0"
		let groupIdToEventBatches = [
			{
				groupId: "group-mail",
				eventBatchIds: [newestBatchId, oldestBatchId],
			},
		]
		let batches = [createTestEntity(EntityEventBatchTypeRef)]
		batches[0]._id = ["group-mail", oldestBatchId]
		batches[0].events = [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)]
		let transaction = {
			get: async (os, key) => {
				if (os == MetaDataOS && key == Metadata.lastEventIndexTimeMs) return SERVER_TIME
				return null
			},
			put: spy(async (os, key, value) => {}),
		}
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock._entity = {
				loadAll: (type, groupId, startId) => {
					o(type).deepEquals(EntityEventBatchTypeRef)
					o(groupId).equals("group-mail")
					let expectedStartId = timestampToGeneratedId(generatedIdToTimestamp(oldestBatchId) - 1)
					o(startId).equals(expectedStartId)
					return Promise.resolve(batches)
				},
			}
			mock._processEntityEvents = spy()
			mock.db.dbFacade = {
				createTransaction: () => Promise.resolve(transaction),
			}
			mock.db.initialized = Promise.resolve()
		})
		await indexer._loadNewEntities(groupIdToEventBatches)
		// @ts-ignore
		o(indexer._processEntityEvents.callCount).equals(0)
		o(transaction.put.args).deepEquals([MetaDataOS, Metadata.lastEventIndexTimeMs, SERVER_TIME])
	})

	o("_loadNewEntities out of sync", async function () {
		const newestBatchId = "L0JcCmx----0"
		const oldestBatchId = "L0JcCmw----0"
		let groupIdToEventBatches = [
			{
				groupId: "group-mail",
				eventBatchIds: [newestBatchId, oldestBatchId],
			},
		]
		let batches = [createTestEntity(EntityEventBatchTypeRef)]
		batches[0]._id = ["group-mail", "L0JcCmw----1"] // bigger than last

		batches[0].events = [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)]
		let transaction = {
			get: async (os, key) => {
				return null
			},
			put: spy(async (os, key, value) => {}),
		}
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock._entity = {
				loadAll: (type, groupId, startId) => {
					o(type).deepEquals(EntityEventBatchTypeRef)
					o(groupId).equals("group-mail")
					let expectedStartId = timestampToGeneratedId(generatedIdToTimestamp(oldestBatchId) - 1)
					o(startId).equals(expectedStartId)
					return Promise.resolve(batches)
				},
			}
			mock._processEntityEvents = spy(() => Promise.resolve())
			mock.db.dbFacade = {
				createTransaction: () => Promise.resolve(transaction),
			}
			mock.db.initialized = Promise.resolve()
		})
		await assertThrows(OutOfSyncError, () => indexer._loadNewEntities(groupIdToEventBatches))
		// @ts-ignore
		o(indexer._processEntityEvents.callCount).equals(0)
		o(transaction.put.callCount).equals(0)
	})
	o("_loadNewEntities out of date", async function () {
		const newestBatchId = "L0JcCmx----0"
		const oldestBatchId = "L0JcCmw----0"
		let groupIdToEventBatches = [
			{
				groupId: "group-mail",
				eventBatchIds: [newestBatchId, oldestBatchId],
			},
		]
		let batches = [createTestEntity(EntityEventBatchTypeRef)]
		batches[0]._id = ["group-mail", "L0JcCmw----1"] // bigger than last

		batches[0].events = [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)]
		let transaction = {
			get: async (os, key) => {
				if (os === MetaDataOS && key === Metadata.lastEventIndexTimeMs) return OUT_OF_DATE_SERVER_TIME
				return null
			},
			put: spy(async () => {}),
		}
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock._processEntityEvents = spy(() => Promise.resolve())
			mock.db.dbFacade = {
				createTransaction: () => Promise.resolve(transaction),
			}
			mock.db.initialized = Promise.resolve()
		})
		await assertThrows(OutOfSyncError, () => indexer._loadNewEntities(groupIdToEventBatches))
		o(indexer._processEntityEvents.callCount).equals(0)
		o(transaction.put.callCount).equals(0)
	})

	o("_loadPersistentGroupData", async function () {
		let groupData = {
			lastBatchIds: ["last-batch-id"],
		}
		let transaction = {
			get: (os, groupId) => {
				o(os).equals(GroupDataOS)
				return Promise.resolve(groupData)
			},
		}
		let user = createTestEntity(UserTypeRef)
		user.memberships = [
			createTestEntity(GroupMembershipTypeRef),
			createTestEntity(GroupMembershipTypeRef),
			createTestEntity(GroupMembershipTypeRef),
			createTestEntity(GroupMembershipTypeRef),
		]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = "group-mail"
		user.memberships[1].groupType = GroupType.MailingList
		user.memberships[1].group = "group-team"
		user.memberships[2].groupType = GroupType.Contact
		user.memberships[2].group = "group-contact"
		user.memberships[3].groupType = GroupType.Customer
		user.memberships[3].group = "group-customer"
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade)
		indexer.db.dbFacade = {
			createTransaction: () => Promise.resolve(transaction),
		} as any

		const groupIdToEventBatches = await indexer._loadPersistentGroupData(user)
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
	})

	o("_processEntityEvents_1", async function () {
		const groupId = "group-id"
		const batchId = "batch-id"
		let user = createTestEntity(UserTypeRef)
		user.memberships = [createTestEntity(GroupMembershipTypeRef)]
		user.memberships[0].groupType = GroupType.Mail
		user.memberships[0].group = groupId
		const infoMessageHandler = object<InfoMessageHandler>()
		const indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (indexerMock) => {
			indexerMock.db.initialized = Promise.resolve()
			indexerMock._mail = {
				processEntityEvents: spy(() => Promise.resolve()),
			}
			indexerMock._contact = {
				processEntityEvents: spy(() => Promise.resolve()),
			}
			indexerMock._processUserEntityEvents = spy(() => Promise.resolve())
			indexerMock._initParams = {
				user: createTestEntity(UserTypeRef),
			}
			indexerMock._core.writeIndexUpdateWithBatchId = spy(() => Promise.resolve())
			indexerMock._initParams = {
				user,
			}
		})

		function newUpdate<T>(typeRef: TypeRef<T>) {
			let u = createTestEntity(EntityUpdateTypeRef)
			u.application = typeRef.app
			u.type = typeRef.type
			return u
		}

		let events = [newUpdate(MailTypeRef), newUpdate(ContactTypeRef), newUpdate(UserTypeRef)]
		indexer._indexedGroupIds = [groupId]
		const batch = {
			events,
			groupId,
			batchId,
		}
		await indexer._processEntityEvents(batch)
		o(indexer._core.writeIndexUpdateWithBatchId.invocations.length).equals(2)
		let indexUpdateMail = indexer._core.writeIndexUpdateWithBatchId.invocations[0][2]
		o(indexer._mail.processEntityEvents.callCount).equals(1)
		o(indexer._mail.processEntityEvents.args).deepEquals([[events[0]], groupId, batchId, indexUpdateMail])
		let indexUpdateContact = indexer._core.writeIndexUpdateWithBatchId.invocations[1][2]
		o(indexer._contact.processEntityEvents.callCount).equals(1)
		o(indexer._contact.processEntityEvents.args).deepEquals([[events[1]], groupId, batchId, indexUpdateContact])
	})
	o("processEntityEvents non indexed group", async function () {
		let user = createTestEntity(UserTypeRef)
		user.memberships = [createTestEntity(GroupMembershipTypeRef)]
		user.memberships[0].groupType = GroupType.MailingList
		user.memberships[0].group = "group-id"
		const infoMessageHandler = object<InfoMessageHandler>()
		const indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock.db.initialized = Promise.resolve()
			mock._mail = {
				processEntityEvents: spy(() => Promise.resolve()),
			}
			mock._contact = {
				processEntityEvents: spy(() => Promise.resolve()),
			}
			mock._processUserEntityEvents = spy(() => Promise.resolve())
			mock._initParams = {
				user: createTestEntity(UserTypeRef),
			}
			mock._core.writeIndexUpdate = spy(() => Promise.resolve())
			mock._initParams = {
				user,
			}
		})

		function update(typeRef: TypeRef<any>) {
			let u = createTestEntity(EntityUpdateTypeRef)
			u.application = typeRef.app
			u.type = typeRef.type
			return u
		}

		let events = [update(MailTypeRef), update(ContactTypeRef), update(UserTypeRef)]
		const batch: QueuedBatch = {
			events,
			groupId: "group-id",
			batchId: "batch-id",
		}
		indexer._indexedGroupIds = ["group-id"]

		await indexer._processEntityEvents(batch)
		o(indexer._core.writeIndexUpdate.callCount).equals(0)
		o(indexer._mail.processEntityEvents.callCount).equals(0)
		o(indexer._contact.processEntityEvents.callCount).equals(0)
		o(indexer._processUserEntityEvents.callCount).equals(0)
	})

	o("_processEntityEvents_2", async function () {
		const doneDeferred = defer()
		const infoMessageHandler = object<InfoMessageHandler>()
		const indexer = mock(new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade), (mock) => {
			mock.db.initialized = Promise.resolve()
			mock._mail = {
				processEntityEvents: spy(() => Promise.resolve()),
			}
			mock._contact = {
				processEntityEvents: spy(() => Promise.resolve()),
			}
			mock._processUserEntityEvents = spy(() => Promise.resolve())
			mock._initParams = {
				user: createTestEntity(UserTypeRef),
			}
			mock._core.writeIndexUpdateWithBatchId = spy(() => Promise.resolve())
			let user = createTestEntity(UserTypeRef)
			user.memberships = [createTestEntity(GroupMembershipTypeRef)]
			user.memberships[0].groupType = GroupType.Mail
			user.memberships[0].group = "group-id"
			mock._initParams = {
				user,
			}

			const _processNext = mock._core.queue.processNext.bind(mock._core.queue)

			mock._core.queue.processNext = spy(() => {
				if (mock._core.queue.eventQueue.length === 0) {
					doneDeferred.resolve(null)
				}

				_processNext()
			})
		})
		const events1 = [
			createTestEntity(EntityUpdateTypeRef, {
				application: MailTypeRef.app,
				type: MailTypeRef.type,
				operation: OperationType.CREATE,
				instanceId: "id-1",
			}),
		]
		indexer._indexedGroupIds = ["group-id"]
		const batch1: QueuedBatch = {
			events: events1,
			groupId: "group-id",
			batchId: "batch-id-1",
		}
		const events2 = [
			createTestEntity(EntityUpdateTypeRef, {
				application: MailTypeRef.app,
				type: MailTypeRef.type,
				operation: OperationType.CREATE,
				instanceId: "id-2",
			}),
		]
		indexer._indexedGroupIds = ["group-id"]
		const batch2: QueuedBatch = {
			events: events2,
			groupId: "group-id",
			batchId: "batch-id-2",
		}
		indexer.addBatchesToQueue([batch1, batch2])

		indexer._realtimeEventQueue.resume()

		indexer.startProcessing()
		await doneDeferred.promise
		// @ts-ignore
		o(indexer._core.writeIndexUpdateWithBatchId.callCount).equals(2)
		// @ts-ignore
		o(indexer._mail.processEntityEvents.callCount).equals(2)
		// @ts-ignore
		o(indexer._contact.processEntityEvents.callCount).equals(0)
	})

	o("_getStartIdForLoadingMissedEventBatches", function () {
		const infoMessageHandler = object<InfoMessageHandler>()
		let indexer = new Indexer(restClientMock, infoMessageHandler, browserDataStub, entityRestCache, mailFacade)
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

	o.spec("Contact indexing and caching", function () {
		let indexer: Indexer
		let user = createTestEntity(UserTypeRef)
		user.userGroup = createTestEntity(GroupMembershipTypeRef)
		user.userGroup.group = "user-group-id"
		let userGroupKey

		function makeIndexer() {
			userGroupKey = freshVersioned(aes256RandomKey())
			const infoMessageHandlerDouble = object<InfoMessageHandler>()

			const entityRestClientDouble: EntityRestClient = instance(EntityRestClient)
			const restClientDouble: RestClient = instance(RestClient)
			when(restClientDouble.getServerTimestampMs()).thenReturn(SERVER_TIME)
			when(entityRestClientDouble.getRestClient()).thenReturn(restClientDouble)

			indexer = new Indexer(entityRestClientDouble, infoMessageHandlerDouble, browserDataStub, instance(DefaultEntityRestCache), mailFacade)
			const transactionDouble = object<DbTransaction>()
			when(transactionDouble.getAll(matchers.anything())).thenResolve([
				{
					key: "key",
					value: "value",
				},
			])
			when(transactionDouble.put(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(null)

			const dbFacadeDouble = instance(DbFacade)
			when(dbFacadeDouble.createTransaction(matchers.anything(), matchers.anything())).thenResolve(transactionDouble)
			replace(indexer.db, "dbFacade", dbFacadeDouble)

			const entityDouble = instance(EntityClient)
			when(entityDouble.loadRoot(ContactListTypeRef, user.userGroup.group)).thenResolve(contactList)
			replace(indexer, "_entity", entityDouble)

			const contactDouble = instance(ContactIndexer)
			replace(indexer, "_contact", contactDouble)
		}

		o.beforeEach(function () {
			makeIndexer()
		})
		o.afterEach(function () {
			reset()
		})

		o("When init() is called and contacts have already been indexed they are not indexed again", async function () {
			when(indexer._contact.getIndexTimestamp(contactList)).thenResolve(FULL_INDEXED_TIMESTAMP)
			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)
			await indexer.init({ user, keyLoaderFacade })
			verify(indexer._contact.indexFullContactList(contactList), { times: 0 })
		})

		o("When init() is called and contacts have not been indexed before, they are indexed", async function () {
			when(indexer._contact.getIndexTimestamp(contactList)).thenResolve(NOTHING_INDEXED_TIMESTAMP)
			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)
			await indexer.init({ user, keyLoaderFacade })
			verify(indexer._contact.indexFullContactList(contactList))
		})

		o("When init() is called with a fresh db and contacts have not been indexed, they will be downloaded", async function () {
			when(indexer._contact.getIndexTimestamp(contactList)).thenResolve(FULL_INDEXED_TIMESTAMP)
			const cacheInfo: CacheInfo = {
				isPersistent: true,
				isNewOfflineDb: true,
				databaseKey: new Uint8Array([1, 2, 3]),
			}

			indexer._mail.enableMailIndexing = func<MailIndexer["enableMailIndexing"]>()
			when(indexer._mail.enableMailIndexing(matchers.anything())).thenResolve(undefined)

			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)
			await indexer.init({ user, keyLoaderFacade, cacheInfo })
			verify(indexer._entity.loadAll(ContactTypeRef, contactList.contacts))
		})

		o("When init() is called with a fresh db and contacts are not yet indexed, they will be indexed and not downloaded", async function () {
			when(indexer._contact.getIndexTimestamp(contactList)).thenResolve(NOTHING_INDEXED_TIMESTAMP)
			const cacheInfo: CacheInfo = {
				isPersistent: true,
				isNewOfflineDb: true,
				databaseKey: new Uint8Array([1, 2, 3]),
			}
			indexer._mail.enableMailIndexing = func<MailIndexer["enableMailIndexing"]>()
			when(indexer._mail.enableMailIndexing(matchers.anything())).thenResolve(undefined)

			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)
			await indexer.init({ user, keyLoaderFacade, cacheInfo })

			verify(indexer._contact.indexFullContactList(contactList))
			verify(indexer._entity.loadAll(ContactTypeRef, contactList.contacts), { times: 0 })
		})

		o("When init() is called with a fresh db and the cache is not persisted the indexing is not enabled", async function () {
			when(indexer._contact.getIndexTimestamp(contactList)).thenResolve(FULL_INDEXED_TIMESTAMP)
			const cacheInfo: CacheInfo = {
				isPersistent: false,
				isNewOfflineDb: true,
				databaseKey: new Uint8Array([1, 2, 3]),
			}

			indexer._mail.enableMailIndexing = func<MailIndexer["enableMailIndexing"]>()
			when(indexer._mail.enableMailIndexing(matchers.anything())).thenResolve(undefined)
			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)

			await indexer.init({ user, keyLoaderFacade, cacheInfo })
		})
	})
})
