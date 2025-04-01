import {
	EntityEventBatch,
	EntityEventBatchTypeRef,
	EntityUpdateTypeRef,
	GroupMembershipTypeRef,
	UserTypeRef,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { DbFacade } from "../../../../../src/common/api/worker/search/DbFacade.js"
import { ENTITY_EVENT_BATCH_TTL_DAYS, GroupType, NOTHING_INDEXED_TIMESTAMP, OperationType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { IndexedDbIndexer, initSearchIndexObjectStores } from "../../../../../src/mail-app/workerUtils/index/IndexedDbIndexer.js"
import { NotAuthorizedError } from "../../../../../src/common/api/common/error/RestError.js"
import { ContactListTypeRef, ContactTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { OutOfSyncError } from "../../../../../src/common/api/common/error/OutOfSyncError.js"
import { assertThrows, mock } from "@tutao/tutanota-test-utils"
import { createTestEntity } from "../../../TestUtils.js"
import { EventQueue, QueuedBatch } from "../../../../../src/common/api/worker/EventQueue.js"
import { MembershipRemovedError } from "../../../../../src/common/api/common/error/MembershipRemovedError.js"
import { GENERATED_MAX_ID, getElementId, timestampToGeneratedId } from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { daysToMillis, defer, freshVersioned, TypeRef } from "@tutao/tutanota-utils"
import { Aes256Key, aes256RandomKey, aesEncrypt, decryptKey, encryptKey, fixedIv, IV_BYTE_LENGTH, random } from "@tutao/tutanota-crypto"
import o from "@tutao/otest"
import { func, matchers, object, verify, when } from "testdouble"
import { CacheInfo } from "../../../../../src/common/api/worker/facades/LoginFacade.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { ContactIndexer } from "../../../../../src/mail-app/workerUtils/index/ContactIndexer.js"
import { InfoMessageHandler } from "../../../../../src/common/gui/InfoMessageHandler.js"
import { GroupDataOS, Metadata, MetaDataOS } from "../../../../../src/common/api/worker/search/IndexTables.js"
import { MailIndexer } from "../../../../../src/mail-app/workerUtils/index/MailIndexer.js"
import { IndexerCore } from "../../../../../src/mail-app/workerUtils/index/IndexerCore"
import { entityUpdatesAsData } from "../../../../../src/common/api/common/utils/EntityUpdateUtils"
import { EncryptedDbWrapper } from "../../../../../src/common/api/worker/search/EncryptedDbWrapper"
import { VersionedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper"
import { DbStub } from "./DbStub"
import type { GroupData } from "../../../../../src/common/api/worker/search/SearchTypes"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade"
import { DateProvider } from "../../../../../src/common/api/common/DateProvider"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"

const SERVER_TIME = new Date("1994-06-08").getTime()
let contactList = createTestEntity(ContactListTypeRef)
contactList._ownerGroup = "ownerGroupId"
contactList.contacts = "contactListId"

// Beware: these tests use partial mocking and other actionable practices. It would be nice to refactor the class to
// not do this.
o.spec("IndexedDbIndexer", () => {
	const OUT_OF_DATE_SERVER_TIME = SERVER_TIME - daysToMillis(ENTITY_EVENT_BATCH_TTL_DAYS) - 1000 * 60 * 60 * 24
	const serverDateProvider: DateProvider = {
		now() {
			return SERVER_TIME
		},
		timeZone(): string {
			throw new ProgrammingError("not supported")
		},
	}

	let keyLoaderFacade: KeyLoaderFacade
	let mailIndexer: MailIndexer
	let contactIndexer: ContactIndexer
	let idbStub = new DbStub()
	let dbWithStub: EncryptedDbWrapper
	let core: IndexerCore
	let entityClient: EntityClient
	let key: Aes256Key
	let iv: Uint8Array
	let infoMessageHandler: InfoMessageHandler
	let indexerTemplate: IndexedDbIndexer

	o.beforeEach(function () {
		key = aes256RandomKey()
		iv = fixedIv
		mailIndexer = object()
		;(mailIndexer as Writeable<MailIndexer>).mailIndexingEnabled = false

		idbStub = new DbStub()
		initSearchIndexObjectStores(idbStub)
		dbWithStub = new EncryptedDbWrapper(idbStub as Partial<DbFacade> as DbFacade)

		core = object()
		entityClient = object()
		contactIndexer = object()
		infoMessageHandler = object()
		keyLoaderFacade = object()

		indexerTemplate = new IndexedDbIndexer(serverDateProvider, dbWithStub, core, infoMessageHandler, entityClient, mailIndexer, contactIndexer)
	})

	o.spec("init with db", function () {
		const loadedGroupData = {
			lastBatchIds: [],
			indexTimestamp: 0,
			groupType: GroupType.User,
		}

		const groupBatches: {
			groupId: Id
			groupData: GroupData
		}[] = [
			{
				groupId: "user-group-id",
				groupData: loadedGroupData,
			},
		]

		const persistentGroupData = [
			{
				groupId: "some-group-id",
				eventBatchIds: [],
			},
		]

		let groupDiff: {
			deletedGroups: {
				id: Id
				type: GroupType
			}[]
			newGroups: {
				id: Id
				type: GroupType
			}[]
		} = {
			deletedGroups: [],
			newGroups: [],
		}

		const user = createTestEntity(UserTypeRef, {
			userGroup: createTestEntity(GroupMembershipTypeRef, {
				group: "user-group-id",
			}),
		})

		const loadGroupData = func<IndexedDbIndexer["_loadGroupData"]>()
		const loadPersistentGroupData = func<IndexedDbIndexer["_loadPersistentGroupData"]>()
		const loadAndQueueMissedEntityUpdates = func<IndexedDbIndexer["_loadAndQueueMissedEntityUpdates"]>()
		const loadGroupDiff = func<IndexedDbIndexer["_loadGroupDiff"]>()
		const updateGroups = func<IndexedDbIndexer["_updateGroups"]>()
		const disableMailIndexing = func<IndexedDbIndexer["disableMailIndexing"]>()

		o.test("init new db", async function () {
			when(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything())).thenResolve()
			when(contactIndexer.indexFullContactList()).thenResolve()
			when(contactIndexer.areContactsIndexed()).thenResolve(false)
			when(entityClient.loadRoot(ContactListTypeRef, matchers.anything())).thenResolve(contactList)

			when(loadGroupData(user)).thenResolve(groupBatches)
			when(loadPersistentGroupData(user)).thenResolve(persistentGroupData)
			when(loadAndQueueMissedEntityUpdates(matchers.anything())).thenResolve()

			const indexer = mock(indexerTemplate, (mock) => {
				mock._loadGroupData = loadGroupData
				mock._loadPersistentGroupData = loadPersistentGroupData
				mock._loadAndQueueMissedEntityUpdates = loadAndQueueMissedEntityUpdates
			})
			let userGroupKey = freshVersioned(aes256RandomKey())

			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)

			await indexer.init({ user, keyLoaderFacade })

			o.check(idbStub.getValue(GroupDataOS, "user-group-id")).deepEquals(loadedGroupData)
			o.check(idbStub.getValue(MetaDataOS, Metadata.mailIndexingEnabled)).equals(false)

			// this gets what was passed in db.init()
			const { key } = await dbWithStub.encryptionData()
			o.check(decryptKey(userGroupKey.object, idbStub.getValue(MetaDataOS, Metadata.userEncDbKey))).deepEquals(key)

			verify(contactIndexer.indexFullContactList())
			verify(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything()), { times: 1 })
			verify(loadPersistentGroupData(user))
			verify(loadAndQueueMissedEntityUpdates(persistentGroupData))
		})

		o.test("init existing db no errors", async function () {
			let userGroupKey = freshVersioned(aes256RandomKey())
			let dbKey = aes256RandomKey()
			let encDbIv = aesEncrypt(dbKey, fixedIv, random.generateRandomData(IV_BYTE_LENGTH), true)
			let userEncDbKey = encryptKey(userGroupKey.object, dbKey)
			const userGroupKeyVersion = 0

			const t = await idbStub.createTransaction()
			t.put(MetaDataOS, Metadata.userEncDbKey, userEncDbKey)
			t.put(MetaDataOS, Metadata.mailIndexingEnabled, true)
			t.put(MetaDataOS, Metadata.excludedListIds, ["excluded-list-id"])
			t.put(MetaDataOS, Metadata.encDbIv, encDbIv)
			t.put(MetaDataOS, Metadata.userGroupKeyVersion, userGroupKeyVersion)
			// to avoid empty groups check in _updateIndexedGroups
			t.put(GroupDataOS, "group-id", "some-data")

			when(contactIndexer.areContactsIndexed()).thenResolve(true)
			when(entityClient.loadRoot(ContactListTypeRef, matchers.anything())).thenResolve(contactList)

			when(loadGroupDiff(user)).thenResolve(groupDiff)
			when(loadPersistentGroupData(user)).thenResolve(persistentGroupData)
			when(loadAndQueueMissedEntityUpdates(persistentGroupData)).thenResolve()

			const indexer = mock(indexerTemplate, (mock) => {
				mock._loadGroupDiff = loadGroupDiff
				mock._updateGroups = updateGroups
				mock._loadPersistentGroupData = loadPersistentGroupData
				mock._loadAndQueueMissedEntityUpdates = loadAndQueueMissedEntityUpdates
			})

			when(keyLoaderFacade.loadSymUserGroupKey(userGroupKeyVersion)).thenResolve(userGroupKey.object)

			await indexer.init({ user, keyLoaderFacade })
			const { key } = await dbWithStub.encryptionData()
			o.check(key).deepEquals(dbKey)
			verify(loadGroupDiff(user))
			verify(updateGroups(user, groupDiff))
			verify(contactIndexer.indexFullContactList(), { times: 0 })
			verify(loadPersistentGroupData(user))
			verify(loadAndQueueMissedEntityUpdates(persistentGroupData))
		})

		o.test("init existing db out of sync", async () => {
			let userGroupKey = freshVersioned(aes256RandomKey())
			let dbKey = aes256RandomKey()
			let userEncDbKey = encryptKey(userGroupKey.object, dbKey)
			const userGroupKeyVersion = 0
			let encDbIv = aesEncrypt(dbKey, fixedIv, random.generateRandomData(IV_BYTE_LENGTH), true)
			const t = await idbStub.createTransaction()
			t.put(MetaDataOS, Metadata.userEncDbKey, userEncDbKey)
			t.put(MetaDataOS, Metadata.userGroupKeyVersion, userGroupKeyVersion)
			t.put(MetaDataOS, Metadata.mailIndexingEnabled, true)
			t.put(MetaDataOS, Metadata.encDbIv, encDbIv)
			t.put(MetaDataOS, Metadata.lastEventIndexTimeMs, SERVER_TIME)
			// to avoid empty groups check in _updateIndexedGroups
			t.put(GroupDataOS, "group-id", "some-data")

			when(contactIndexer.areContactsIndexed()).thenResolve(true)
			when(entityClient.loadRoot(ContactListTypeRef, matchers.anything())).thenResolve(contactList)

			when(loadGroupDiff(user)).thenResolve(groupDiff)
			when(loadPersistentGroupData(user)).thenResolve(persistentGroupData)
			when(loadAndQueueMissedEntityUpdates(matchers.anything())).thenReject(new OutOfSyncError("is out of sync ;-)"))

			const indexer = mock(indexerTemplate, (mock) => {
				mock._loadGroupDiff = loadGroupDiff
				mock._updateGroups = updateGroups
				mock._loadPersistentGroupData = loadPersistentGroupData
				mock._loadAndQueueMissedEntityUpdates = loadAndQueueMissedEntityUpdates
				mock.disableMailIndexing = disableMailIndexing
			})

			when(keyLoaderFacade.loadSymUserGroupKey(userGroupKeyVersion)).thenResolve(userGroupKey.object)

			await indexer.init({ user, keyLoaderFacade })
			const { key } = await dbWithStub.encryptionData()
			o.check(key).deepEquals(dbKey)
			verify(loadGroupDiff(user))
			verify(updateGroups(user, groupDiff))
			verify(contactIndexer.indexFullContactList(), { times: 0 })
			verify(loadPersistentGroupData(user))
			verify(loadAndQueueMissedEntityUpdates(persistentGroupData))
		})
	})

	o.test("_loadGroupDiff", async function () {
		const mailGroupId = "new-group-id"
		const contactGroupId = "constant-group-id"
		const deletedGroupId = "deleted-group-id"

		const user = createTestEntity(UserTypeRef, {
			memberships: [
				createTestEntity(GroupMembershipTypeRef, {
					groupType: GroupType.Mail,
					group: mailGroupId,
				}),
				createTestEntity(GroupMembershipTypeRef, {
					groupType: GroupType.Contact,
					group: contactGroupId,
				}),
				createTestEntity(GroupMembershipTypeRef),
			],
		})
		const groupData = {
			groupType: GroupType.MailingList,
		}
		const t = await idbStub.createTransaction()
		t.put(GroupDataOS, deletedGroupId, groupData)
		t.put(GroupDataOS, contactGroupId, { groupType: GroupType.Mail })

		const indexer = indexerTemplate

		const result = await indexer._loadGroupDiff(user)
		o.check(result).deepEquals({
			deletedGroups: [
				{
					id: "deleted-group-id",
					type: GroupType.MailingList,
				},
			],
			newGroups: [
				{
					id: mailGroupId,
					type: GroupType.Mail,
				},
			],
		})
	})

	o.spec("_updateGroups", function () {
		o.test("disable MailIndexing in case of a deleted mail group", async function () {
			let indexer = mock(indexerTemplate, (mock) => {
				mock.disableMailIndexing = func()
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
			await o.check(() => indexer._updateGroups(user, groupDiff)).asyncThrows(MembershipRemovedError)
		})

		o.test("disable MailIndexing in case of a deleted contact group", async function () {
			let indexer = mock(indexerTemplate, (mock) => {
				mock.disableMailIndexing = func()
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
			await o(() => indexer._updateGroups(user, groupDiff)).asyncThrows(MembershipRemovedError)
		})

		o.test("don't disable MailIndexing in case no mail or contact group has been deleted", async function () {
			let indexer = mock(indexerTemplate, (mock) => {
				mock.disableMailIndexing = func()
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

		o.test("do not index new mail groups", async function () {
			let user = createTestEntity(UserTypeRef)
			let groupBatches = []

			const loadGroupData = func<IndexedDbIndexer["_loadGroupData"]>()
			const initGroupData = func<IndexedDbIndexer["_initGroupData"]>()
			when(loadGroupData(user), { ignoreExtraArgs: true }).thenResolve(groupBatches)

			let indexer = mock(indexerTemplate, (mock) => {
				mock._loadGroupData = loadGroupData
				mock._initGroupData = initGroupData
			})

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
			verify(loadGroupData(user, matchers.anything()))
			verify(initGroupData(groupBatches, matchers.anything()))
			verify(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("only init group data for non mail groups (do not index)", async function () {
			let groupBatches = []
			let user = createTestEntity(UserTypeRef)

			const loadGroupData = func<IndexedDbIndexer["_loadGroupData"]>()
			const initGroupData = func<IndexedDbIndexer["_initGroupData"]>()
			when(loadGroupData(user), { ignoreExtraArgs: true }).thenResolve(groupBatches)

			let indexer = mock(indexerTemplate, (mock) => {
				mock._loadGroupData = loadGroupData
				mock._initGroupData = initGroupData
			})

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

			verify(initGroupData(groupBatches, matchers.anything()))
			verify(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything()), { times: 0 })
		})
	})

	o.spec("_loadGroupData", function () {
		o.test("_loadGroup on the server", async function () {
			const user = createTestEntity(UserTypeRef, {
				memberships: [
					createTestEntity(GroupMembershipTypeRef, {
						groupType: GroupType.Mail,
						group: "group-mail",
					}),
					createTestEntity(GroupMembershipTypeRef, {
						groupType: GroupType.MailingList,
						group: "group-team",
					}),
					createTestEntity(GroupMembershipTypeRef, {
						groupType: GroupType.Contact,
						group: "group-contact",
					}),
					createTestEntity(GroupMembershipTypeRef, {
						groupType: GroupType.Customer,
						group: "group-customer",
					}),
				],
			})

			when(entityClient.loadRange(EntityEventBatchTypeRef, matchers.anything(), GENERATED_MAX_ID, 1, true)).thenResolve([
				createTestEntity(EntityEventBatchTypeRef, {
					_id: ["batch-list-id", "event-batch-id"],
				}),
			])
			let indexer = indexerTemplate

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

		o.test("_loadGroupData not authorized", async function () {
			const user = createTestEntity(UserTypeRef, {
				memberships: [
					createTestEntity(GroupMembershipTypeRef, {
						groupType: GroupType.Mail,
						group: "group-mail",
					}),
					createTestEntity(GroupMembershipTypeRef, {
						groupType: GroupType.MailingList,
						group: "group-team",
					}),
				],
			})

			when(entityClient.loadRange(EntityEventBatchTypeRef, "group-mail", GENERATED_MAX_ID, 1, true)).thenResolve([
				createTestEntity(EntityEventBatchTypeRef, {
					_id: ["batch-list-id", "event-batch-id"],
				}),
			])
			when(entityClient.loadRange(EntityEventBatchTypeRef, "group-team", GENERATED_MAX_ID, 1, true)).thenReject(new NotAuthorizedError("test"))

			const indexer = indexerTemplate
			const result = await indexer._loadGroupData(user)
			o.check(result).deepEquals([
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
	})

	o.test("_initGroupData", async function () {
		const groupId = "groupId"
		let groupBatches = [
			{
				groupId: groupId,
				groupData: {
					groupType: GroupType.Mail,
					lastBatchIds: [],
					indexTimestamp: 1,
				},
			},
		]

		let indexer = indexerTemplate
		const transaction = await idbStub.createTransaction()

		await indexer._initGroupData(groupBatches, transaction)

		o(idbStub.getValue(GroupDataOS, groupId)).deepEquals(groupBatches[0].groupData)
	})

	o.spec("_loadAndQueueMissedEntityUpdates", function () {
		o.test("when it loads the events it starts from the newest one and it queues them for processing", async function () {
			const newestBatchId = timestampToGeneratedId(new Date("2025-03-31T14:13:22.853Z").getTime())
			const oldestBatchId = timestampToGeneratedId(new Date("2025-03-31T14:12:00.244Z").getTime())
			const newEventBatchId = timestampToGeneratedId(new Date("2025-03-31T14:14:00.244Z").getTime())

			const groupId = "group-mail"
			const groupIdToEventBatches = [
				{
					groupId,
					eventBatchIds: [newestBatchId, oldestBatchId],
				},
			]
			let batches = [
				createTestEntity(EntityEventBatchTypeRef, {
					_id: ["group-mail", newEventBatchId],
					events: [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)],
				}),
			]
			const transaction = await idbStub.createTransaction()
			transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, SERVER_TIME)

			dbWithStub.init({ key, iv })
			let indexer = indexerTemplate
			when(entityClient.loadAll(EntityEventBatchTypeRef, groupId, newestBatchId)).thenResolve(batches)

			indexer._processEntityEvents = func<IndexedDbIndexer["_processEntityEvents"]>()
			const queue = indexer.eventQueue
			queue.addBatches = func<EventQueue["addBatches"]>()
			await indexer._loadAndQueueMissedEntityUpdates(groupIdToEventBatches)
			verify(queue.addBatches(matchers.anything()), { times: 1 })
			verify(
				queue.addBatches([
					{
						groupId,
						batchId: getElementId(batches[0]),
						events: entityUpdatesAsData(batches[0].events),
					},
				]),
			)
			o(idbStub.getValue(MetaDataOS, Metadata.lastEventIndexTimeMs)).deepEquals(SERVER_TIME)
		})

		o.test("when loading the events and receiving one of the loaded ones via ws it will only process it once", async function () {
			// websocket events can overall with the initially loaded events and we filter out those we have already
			// processed by comparing the IDs. We remember our starting point in _loadAndQueueMissedEntityUpdates and
			// ignore everything older
			// <- newer -- older ->
			// +--------+---------------------------+--------------+
			//          |                           |               |
			//          |        previous newest batch id          oldest batch id
			//          |        (also ws batch id)
			//          |
			//        latest loaded batch id
			const previousNewestBatchId = timestampToGeneratedId(new Date("2025-03-31T14:13:22.853Z").getTime())
			const oldestBatchId = timestampToGeneratedId(new Date("2025-03-31T14:12:00.244Z").getTime())
			const newEventBatchId = timestampToGeneratedId(new Date("2025-03-31T14:14:00.244Z").getTime())
			const groupId = "group-mail"
			let groupIdToEventBatches = [
				{
					groupId,
					eventBatchIds: [previousNewestBatchId, oldestBatchId],
				},
			]
			let batches = [
				createTestEntity(EntityEventBatchTypeRef, {
					_id: ["group-mail", newEventBatchId],
					events: [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)],
				}),
			]
			const transaction = await idbStub.createTransaction()
			transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, SERVER_TIME)

			dbWithStub.init({ key, iv })
			let indexer = indexerTemplate
			when(entityClient.loadAll(EntityEventBatchTypeRef, matchers.anything(), previousNewestBatchId)).thenResolve(batches)
			indexer._processEntityEvents = func<IndexedDbIndexer["_processEntityEvents"]>()
			const queue = indexer.eventQueue
			queue.addBatches = func<EventQueue["addBatches"]>()
			await indexer._loadAndQueueMissedEntityUpdates(groupIdToEventBatches)
			verify(queue.addBatches(matchers.anything()), { times: 1 })
			verify(
				queue.addBatches([
					{
						groupId,
						batchId: getElementId(batches[0]),
						events: entityUpdatesAsData(batches[0].events),
					},
				]),
			)

			o.check(idbStub.getValue(MetaDataOS, Metadata.lastEventIndexTimeMs)).deepEquals(SERVER_TIME)
			// say we received a batch that was previous newest id, but is older than what we have loaded
			const realtimeEvents = entityUpdatesAsData([createTestEntity(EntityUpdateTypeRef)])
			await indexer.processEntityEvents(realtimeEvents, previousNewestBatchId, groupId)
			await indexer._realtimeEventQueue.waitForEmptyQueue()
			// Check that we filtered out batch which we already loaded and added
			verify(queue.addBatches(matchers.anything()), { times: 1 })
		})

		o.test("when loading the events and receiving an older one via ws it will only process it once", async function () {
			// websocket events can overall with the initially loaded events and we filter out those we have already
			// processed by comparing the IDs. We remember our starting point in _loadAndQueueMissedEntityUpdates and
			// ignore everything older
			// <- newer -- older ->
			// +--------+---------------------------+--------------+
			//          |                           |               |
			//          |        previous newest batch id          oldest batch id
			//          |
			//          |
			//        latest loaded batch id
			//         (also ws batch id)
			const previousNewestBatchId = timestampToGeneratedId(new Date("2025-03-31T14:13:22.853Z").getTime())
			const oldestBatchId = timestampToGeneratedId(new Date("2025-03-31T14:12:00.244Z").getTime())
			const newEventBatchId = timestampToGeneratedId(new Date("2025-03-31T14:14:00.244Z").getTime())
			const groupId = "group-mail"
			let groupIdToEventBatches = [
				{
					groupId,
					eventBatchIds: [previousNewestBatchId, oldestBatchId],
				},
			]
			let batches = [
				createTestEntity(EntityEventBatchTypeRef, {
					_id: ["group-mail", newEventBatchId],
					events: [createTestEntity(EntityUpdateTypeRef), createTestEntity(EntityUpdateTypeRef)],
				}),
			]
			const transaction = await idbStub.createTransaction()
			transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, SERVER_TIME)

			dbWithStub.init({ key, iv })
			let indexer = indexerTemplate
			when(entityClient.loadAll(EntityEventBatchTypeRef, matchers.anything(), previousNewestBatchId)).thenResolve(batches)
			indexer._processEntityEvents = func<IndexedDbIndexer["_processEntityEvents"]>()
			const queue = indexer.eventQueue
			queue.addBatches = func<EventQueue["addBatches"]>()
			await indexer._loadAndQueueMissedEntityUpdates(groupIdToEventBatches)
			verify(queue.addBatches(matchers.anything()), { times: 1 })
			verify(
				queue.addBatches([
					{
						groupId,
						batchId: getElementId(batches[0]),
						events: entityUpdatesAsData(batches[0].events),
					},
				]),
			)
			o.check(idbStub.getValue(MetaDataOS, Metadata.lastEventIndexTimeMs)).deepEquals(SERVER_TIME)
			// say we received a batch that is the same id as what we already loaded
			const realtimeEvents = entityUpdatesAsData([createTestEntity(EntityUpdateTypeRef)])
			await indexer.processEntityEvents(realtimeEvents, newEventBatchId, groupId)
			await indexer._realtimeEventQueue.waitForEmptyQueue()
			// Check that we filtered out batch which we already loaded and added
			verify(queue.addBatches(matchers.anything()), { times: 1 })
		})

		o.test("when websocket events are received before init finishes it queues them after the initial ones", async function () {
			// <- newer -- older ->
			// +--------+---------------------------+--------------+
			//          |                           |               |
			//          |          loaded new batch id         oldest batch id
			//          |
			//          |
			//        realtime batch id
			//         (also ws batch id)

			const oldestBatchId = timestampToGeneratedId(new Date("2025-03-31T14:12:00.244Z").getTime())
			const loadedNewBatchId = timestampToGeneratedId(new Date("2025-03-31T14:13:22.853Z").getTime())
			const realtimeBatchId = timestampToGeneratedId(new Date("2025-03-31T14:14:00.244Z").getTime())

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
			]
			const transaction = await idbStub.createTransaction()
			transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, SERVER_TIME)

			dbWithStub.init({ key, iv })
			let indexer = indexerTemplate
			const loadCompleted = defer<EntityEventBatch[]>()
			when(entityClient.loadAll(EntityEventBatchTypeRef, matchers.anything(), matchers.anything())).thenReturn(loadCompleted.promise)
			indexer._processEntityEvents = func<IndexedDbIndexer["_processEntityEvents"]>()
			const queue = indexer.eventQueue
			queue.addBatches = func<EventQueue["addBatches"]>()

			const loadPromise = indexer._loadAndQueueMissedEntityUpdates(groupIdToEventBatches)

			const realtimeUpdates = entityUpdatesAsData([
				createTestEntity(EntityUpdateTypeRef, {
					instanceId: "realtime",
				}),
			])
			await indexer.processEntityEvents(realtimeUpdates, realtimeBatchId, groupId)
			loadCompleted.resolve(loadedBatches)
			await loadPromise

			// Check that we filtered out batch which we already loaded and added
			// Use captor to ensure the order
			const captor = matchers.captor()
			verify(queue.addBatches(captor.capture()))
			o.check(captor.values).deepEquals([
				[
					{
						groupId,
						batchId: getElementId(loadedBatches[0]),
						events: loadedBatches[0].events,
					},
				],
				[
					{
						groupId,
						batchId: realtimeBatchId,
						events: realtimeUpdates,
					},
				],
			])
			o.check(idbStub.getValue(MetaDataOS, Metadata.lastEventIndexTimeMs)).deepEquals(SERVER_TIME)
		})

		o.test("when lastEventIndexTimeMs is longer than out of sync interval it throws an error", async function () {
			const oldestBatchId = timestampToGeneratedId(new Date("2025-03-31T14:12:00.244Z").getTime())
			const newestBatchId = timestampToGeneratedId(new Date("2025-03-31T14:14:00.244Z").getTime())

			let groupIdToEventBatches = [
				{
					groupId: "group-mail",
					eventBatchIds: [newestBatchId, oldestBatchId],
				},
			]
			const transaction = await idbStub.createTransaction()
			transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, OUT_OF_DATE_SERVER_TIME)

			const processEntityEvents = func<IndexedDbIndexer["_processEntityEvents"]>()

			dbWithStub.init({ key, iv })
			let indexer = mock(indexerTemplate, (mock) => {
				mock._processEntityEvents = processEntityEvents
			})
			await assertThrows(OutOfSyncError, () => indexer._loadAndQueueMissedEntityUpdates(groupIdToEventBatches))
			o.check(idbStub.getValue(MetaDataOS, Metadata.lastEventIndexTimeMs)).deepEquals(OUT_OF_DATE_SERVER_TIME)
			verify(processEntityEvents(matchers.anything()), { times: 0 })
		})
	})

	o.test("_loadPersistentGroupData", async function () {
		const customerGroupId = "group-customer"
		const mailGroupId = "group-mail"
		const contactGroupId = "group-contact"

		const lastMailBatch = "last-mail-batch-id"
		const lastContactBatch = "last-contact-batch-id"
		const lastCustomerBatch = "last-customer-batch-id"

		let groupData = {
			lastBatchIds: [lastMailBatch],
		}
		const transaction = await idbStub.createTransaction()

		transaction.put(GroupDataOS, mailGroupId, {
			lastBatchIds: [lastMailBatch],
		})
		transaction.put(GroupDataOS, "group-team", groupData)
		transaction.put(GroupDataOS, contactGroupId, {
			lastBatchIds: [lastContactBatch],
		})

		transaction.put(GroupDataOS, customerGroupId, {
			lastBatchIds: [lastCustomerBatch],
		})

		let user = createTestEntity(UserTypeRef, {
			memberships: [
				createTestEntity(GroupMembershipTypeRef, {
					groupType: GroupType.Mail,
					group: mailGroupId,
				}),
				createTestEntity(GroupMembershipTypeRef, {
					groupType: GroupType.MailingList,
					group: "group-team",
				}),
				createTestEntity(GroupMembershipTypeRef, {
					groupType: GroupType.Contact,
					group: contactGroupId,
				}),
				createTestEntity(GroupMembershipTypeRef, {
					groupType: GroupType.Customer,
					group: customerGroupId,
				}),
			],
		})

		let indexer = indexerTemplate

		const groupIdToEventBatches = await indexer._loadPersistentGroupData(user)
		o.check(groupIdToEventBatches).deepEquals([
			{
				groupId: mailGroupId,
				eventBatchIds: [lastMailBatch],
			},
			{
				groupId: contactGroupId,
				eventBatchIds: [lastContactBatch],
			},
			{
				groupId: customerGroupId,
				eventBatchIds: [lastCustomerBatch],
			},
		])
	})

	o.spec("processEntityEvents", function () {
		o.test("dispatches events to indexers and writes the timestamp", async function () {
			const groupId = "group-id"
			const batchId = "batch-id"
			const user = createTestEntity(UserTypeRef, {
				memberships: [
					createTestEntity(GroupMembershipTypeRef, {
						groupType: GroupType.Mail,
						group: groupId,
					}),
				],
			})

			dbWithStub.init({ key, iv })
			const indexer = mock(indexerTemplate, (indexerMock) => {
				indexerMock._processUserEntityEvents = func<IndexedDbIndexer["_processUserEntityEvents"]>()
				indexerMock._initParams = {
					user,
				}
				indexerMock.initDeferred = defer()
				indexerMock.initDeferred.resolve()
			})

			function newUpdate<T>(typeRef: TypeRef<T>) {
				let u = createTestEntity(EntityUpdateTypeRef)
				u.application = typeRef.app
				u.type = typeRef.type
				return u
			}

			let events = entityUpdatesAsData([newUpdate(MailTypeRef), newUpdate(ContactTypeRef), newUpdate(UserTypeRef)])
			indexer._indexedGroupIds = [groupId]
			const batch = {
				events,
				groupId,
				batchId,
			}
			await indexer._processEntityEvents(batch)
			verify(core.writeGroupDataBatchId(groupId, batchId))
			verify(mailIndexer.processEntityEvents(events, groupId, batchId), { times: 1 })
			verify(contactIndexer.processEntityEvents(events, groupId, batchId), { times: 1 })
		})

		o.test("when called for batch from non indexed group it does nothing", async function () {
			const user = createTestEntity(UserTypeRef)

			const processUserEntityEvents = func<IndexedDbIndexer["_processUserEntityEvents"]>()

			dbWithStub.init({ key, iv })
			const indexer = mock(indexerTemplate, (mock) => {
				mock._processUserEntityEvents = processUserEntityEvents
				mock._initParams = {
					user,
				}
				mock.initDeferred = defer()
				mock.initDeferred.resolve()
			})

			function update(typeRef: TypeRef<any>) {
				let u = createTestEntity(EntityUpdateTypeRef)
				u.application = typeRef.app
				u.type = typeRef.type
				return u
			}

			let events = entityUpdatesAsData([update(MailTypeRef), update(ContactTypeRef), update(UserTypeRef)])
			const batch: QueuedBatch = {
				events,
				groupId: "unindexed-group-id",
				batchId: "batch-id",
			}
			indexer._indexedGroupIds = ["group-id"]

			await indexer._processEntityEvents(batch)

			verify(core.writeGroupDataBatchId(matchers.anything(), matchers.anything()), { times: 0 })
			verify(mailIndexer.processEntityEvents(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			verify(contactIndexer.processEntityEvents(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			verify(processUserEntityEvents(matchers.anything()), { times: 0 })
		})

		o.test("when receiving multiple events it dispatches both and records the batch twice", async function () {
			const groupId = "group-id"
			const user = createTestEntity(UserTypeRef, {
				memberships: [
					createTestEntity(GroupMembershipTypeRef, {
						groupType: GroupType.Mail,
						group: groupId,
					}),
				],
			})

			dbWithStub.init({ key, iv })
			const indexer = mock(indexerTemplate, (mock) => {
				mock._processUserEntityEvents = func<IndexedDbIndexer["_processUserEntityEvents"]>()
				mock._initParams = {
					user,
				}
				mock.initDeferred = defer()
				mock.initDeferred.resolve()
			})

			indexer._indexedGroupIds = ["group-id"]

			const events1 = entityUpdatesAsData([
				createTestEntity(EntityUpdateTypeRef, {
					application: MailTypeRef.app,
					type: MailTypeRef.type,
					operation: OperationType.CREATE,
					instanceId: "id-1",
				}),
			])
			const batchId1 = "batch-id-1"
			const batch1: QueuedBatch = {
				events: events1,
				groupId: groupId,
				batchId: batchId1,
			}
			const events2 = entityUpdatesAsData([
				createTestEntity(EntityUpdateTypeRef, {
					application: MailTypeRef.app,
					type: MailTypeRef.type,
					operation: OperationType.CREATE,
					instanceId: "id-2",
				}),
			])
			const batchId2 = "batch-id-2"
			const batch2: QueuedBatch = {
				events: events2,
				groupId: groupId,
				batchId: batchId2,
			}
			indexer.processEntityEvents(batch1.events, batch1.batchId, batch1.groupId)
			indexer.processEntityEvents(batch2.events, batch2.batchId, batch2.groupId)

			indexer._realtimeEventQueue.resume()

			indexer._startProcessing()
			await indexer.eventQueue.waitForEmptyQueue()

			verify(core.writeGroupDataBatchId(groupId, batchId1))
			verify(mailIndexer.processEntityEvents(events1, groupId, batchId1))
			verify(contactIndexer.processEntityEvents(events1, groupId, batchId1))

			verify(core.writeGroupDataBatchId(groupId, batchId2))
			verify(mailIndexer.processEntityEvents(events2, groupId, batchId2))
			verify(contactIndexer.processEntityEvents(events2, groupId, batchId2))
		})
	})

	o.spec("init", function () {
		let indexer: IndexedDbIndexer
		let user = createTestEntity(UserTypeRef, {
			userGroup: createTestEntity(GroupMembershipTypeRef, {
				group: "user-group-id",
			}),
		})
		let userGroupKey: VersionedKey

		o.beforeEach(async function () {
			userGroupKey = freshVersioned(aes256RandomKey())
			const transactionDouble = await idbStub.createTransaction()
			transactionDouble.put(GroupDataOS, "key", "value")

			when(entityClient.loadRoot(ContactListTypeRef, user.userGroup.group)).thenResolve(contactList)

			indexer = indexerTemplate
		})

		o("When init() is called and contacts have already been indexed they are not indexed again", async function () {
			when(contactIndexer.areContactsIndexed()).thenResolve(true)
			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)
			await indexer.init({ user, keyLoaderFacade })
			verify(contactIndexer.indexFullContactList(), { times: 0 })
		})

		o("When init() is called and contacts have not been indexed before, they are indexed", async function () {
			when(contactIndexer.areContactsIndexed()).thenResolve(false)
			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)
			await indexer.init({ user, keyLoaderFacade })
			verify(contactIndexer.indexFullContactList())
		})

		o("When init() is called with a fresh db and contacts have not been indexed, they will be downloaded", async function () {
			when(contactIndexer.areContactsIndexed()).thenResolve(true)
			const cacheInfo: CacheInfo = {
				isPersistent: true,
				isNewOfflineDb: true,
				databaseKey: new Uint8Array([1, 2, 3]),
			}

			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)
			await indexer.init({ user, keyLoaderFacade, cacheInfo })
			verify(entityClient.loadAll(ContactTypeRef, contactList.contacts))
		})

		o("When init() is called with a fresh db and contacts are not yet indexed, they will be indexed and not downloaded", async function () {
			when(contactIndexer.areContactsIndexed()).thenResolve(false)
			const cacheInfo: CacheInfo = {
				isPersistent: true,
				isNewOfflineDb: true,
				databaseKey: new Uint8Array([1, 2, 3]),
			}

			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)
			await indexer.init({ user, keyLoaderFacade, cacheInfo })

			verify(contactIndexer.indexFullContactList())
			verify(entityClient.loadAll(ContactTypeRef, contactList.contacts), { times: 0 })
		})

		o("When init() is called with a fresh db and the cache is not persisted the indexing is not enabled", async function () {
			when(contactIndexer.areContactsIndexed()).thenResolve(true)
			const cacheInfo: CacheInfo = {
				isPersistent: false,
				isNewOfflineDb: true,
				databaseKey: new Uint8Array([1, 2, 3]),
			}

			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)

			await indexer.init({ user, keyLoaderFacade, cacheInfo })
		})
	})
	o.spec("enable/disable mailIndexing", function () {
		let indexer: IndexedDbIndexer
		const userGroupId = "user-group-id"
		let user = createTestEntity(UserTypeRef, {
			userGroup: createTestEntity(GroupMembershipTypeRef, {
				group: userGroupId,
			}),
		})
		let userGroupKey: VersionedKey

		o.beforeEach(async function () {
			userGroupKey = freshVersioned(aes256RandomKey())
			when(contactIndexer.areContactsIndexed()).thenResolve(true)
			// for initial init
			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)
			// for re-init
			when(keyLoaderFacade.loadSymUserGroupKey(0)).thenResolve(userGroupKey.object)
			when(mailIndexer.doInitialMailIndexing(matchers.anything())).thenResolve()
			when(mailIndexer.disableMailIndexing()).thenResolve()
			indexer = indexerTemplate
			const t = await idbStub.createTransaction()
			t.put(GroupDataOS, userGroupId, { groupType: GroupType.User })

			await indexer.init({ user, keyLoaderFacade })
		})

		o.spec("enableMailIndexing", function () {
			o.test("when was actually enabled it does initial mail indexing", async function () {
				when(mailIndexer.enableMailIndexing()).thenResolve(true)
				await indexer.enableMailIndexing()
				verify(mailIndexer.enableMailIndexing())
				verify(mailIndexer.doInitialMailIndexing(user))
			})

			o.test("when was already enabled it does nothing", async function () {
				when(mailIndexer.enableMailIndexing()).thenResolve(false)
				await indexer.enableMailIndexing()
				verify(mailIndexer.enableMailIndexing())
				verify(mailIndexer.doInitialMailIndexing(matchers.anything()), { times: 0 })
			})
		})

		o.spec("disableMailIndexing", function () {
			o.test("it deletes the index and initializes again", async function () {
				await indexer.disableMailIndexing()

				verify(mailIndexer.disableMailIndexing())
			})
		})
	})
})
