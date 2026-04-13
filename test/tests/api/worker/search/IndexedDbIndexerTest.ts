import { ClientModelInfo, ClientTypeModelResolver, entityUpdateUtils, sysTypeRefs, timestampToGeneratedId, tutanotaTypeRefs } from "@tutao/typeRefs"
import { DbFacade } from "../../../../../src/common/api/worker/search/DbFacade.js"
import { daysToMillis, ENTITY_EVENT_BATCH_TTL_DAYS, NOTHING_INDEXED_TIMESTAMP } from "@tutao/appEnv"
import { IndexedDbIndexer, initSearchIndexObjectStores } from "../../../../../src/mail-app/workerUtils/index/IndexedDbIndexer.js"
import { NotAuthorizedError, NotFoundError } from "../../../../../src/common/api/common/error/RestError.js"
import o, { mock } from "@tutao/otest"
import { createTestEntity } from "../../../TestUtils.js"
import { EventQueue, QueuedBatch } from "../../../../../src/common/api/worker/EventQueue.js"
import { MembershipRemovedError } from "../../../../../src/common/api/common/error/MembershipRemovedError.js"
import { defer, downcast, freshVersioned, promiseMap, TypeRef } from "@tutao/utils"
import { Aes256Key, aes256RandomKey, aesEncrypt, decryptKey, encryptKey, FIXED_IV } from "@tutao/crypto"
import { func, matchers, object, verify, when } from "testdouble"
import { CacheInfo } from "../../../../../src/common/api/worker/facades/LoginFacade.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { ContactIndexer } from "../../../../../src/mail-app/workerUtils/index/ContactIndexer.js"
import { InfoMessageHandler } from "../../../../../src/common/gui/InfoMessageHandler.js"
import { GroupDataOS, Metadata, MetaDataOS } from "../../../../../src/common/api/worker/search/IndexTables.js"
import { MailIndexer } from "../../../../../src/mail-app/workerUtils/index/MailIndexer.js"
import { IndexerCore } from "../../../../../src/mail-app/workerUtils/index/IndexerCore"
import { EncryptedDbWrapper } from "../../../../../src/common/api/worker/search/EncryptedDbWrapper"
import { VersionedKey } from "@tutao/instancePipeline"
import { DbStub } from "./DbStub"
import type { GroupData } from "../../../../../src/common/api/worker/search/SearchTypes"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade"
import { DateProvider } from "../../../../../src/common/api/common/DateProvider"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"
import { GroupType, OperationType } from "@tutao/appEnv"

const SERVER_TIME = new Date("1994-06-08").getTime()
const serverDateProvider: DateProvider = {
	now() {
		return SERVER_TIME
	},
	timeZone(): string {
		throw new ProgrammingError("not supported")
	},
}
let contactList = createTestEntity(tutanotaTypeRefs.ContactListTypeRef)
contactList._ownerGroup = "ownerGroupId"
contactList.contacts = "contactListId"

// Beware: these tests use partial mocking and other actionable practices. It would be nice to refactor the class to
// not do this.
o.spec("IndexedDbIndexer", () => {
	const OUT_OF_DATE_SERVER_TIME = SERVER_TIME - daysToMillis(ENTITY_EVENT_BATCH_TTL_DAYS) - 1000 * 60 * 60 * 24

	const noPatchesAndInstance: Pick<entityUpdateUtils.EntityUpdateData, "instance" | "patches" | "blobInstance"> = {
		instance: null,
		patches: null,
		blobInstance: null,
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
	let clientTypeModelResolver: ClientTypeModelResolver
	let indexerTemplate: IndexedDbIndexer

	o.beforeEach(function () {
		clientTypeModelResolver = ClientModelInfo.getNewInstanceForTestsOnly()
		key = aes256RandomKey()
		iv = FIXED_IV
		mailIndexer = object()
		;(mailIndexer as Writeable<MailIndexer>).mailIndexingEnabled = false

		idbStub = new DbStub()
		initSearchIndexObjectStores(downcast(idbStub))
		dbWithStub = new EncryptedDbWrapper(idbStub as Partial<DbFacade> as DbFacade)

		core = object()
		core.indexedGroupIds = []
		entityClient = object()
		contactIndexer = object()
		infoMessageHandler = object()
		keyLoaderFacade = object()

		indexerTemplate = new IndexedDbIndexer(
			serverDateProvider,
			dbWithStub,
			core,
			infoMessageHandler,
			entityClient,
			mailIndexer,
			contactIndexer,
			clientTypeModelResolver,
			keyLoaderFacade,
		)
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

		const user = createTestEntity(sysTypeRefs.UserTypeRef, {
			userGroup: createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
				group: "user-group-id",
			}),
		})

		const loadGroupData = func<IndexedDbIndexer["_loadGroupData"]>()
		const loadGroupDiff = func<IndexedDbIndexer["_loadGroupDiff"]>()
		const updateGroups = func<IndexedDbIndexer["_updateGroups"]>()
		const disableMailIndexing = func<IndexedDbIndexer["disableMailIndexing"]>()

		o.test("init new db", async function () {
			when(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything())).thenResolve()
			when(contactIndexer.indexFullContactList()).thenResolve()
			when(contactIndexer.areContactsIndexed()).thenResolve(false)
			when(entityClient.loadRoot(tutanotaTypeRefs.ContactListTypeRef, matchers.anything())).thenResolve(contactList)

			when(loadGroupData(user)).thenResolve(groupBatches)

			const indexer = mock(indexerTemplate, (mock) => {
				mock._loadGroupData = loadGroupData
			})
			let userGroupKey = freshVersioned(aes256RandomKey())

			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)

			await indexer.fullLoginInit({ user })

			o.check(idbStub.getValue(GroupDataOS, "user-group-id")).deepEquals(loadedGroupData)
			o.check(idbStub.getValue(MetaDataOS, Metadata.mailIndexingEnabled)).equals(false)

			// this gets what was passed in db.init()
			const { key } = await dbWithStub.encryptionData()
			o.check(decryptKey(userGroupKey.object, idbStub.getValue(MetaDataOS, Metadata.userEncDbKey))).deepEquals(key)

			verify(contactIndexer.indexFullContactList())
			verify(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything()), { times: 1 })
		})

		o.test("init existing db no errors", async function () {
			let userGroupKey = freshVersioned(aes256RandomKey())
			let dbKey = aes256RandomKey()
			let encDbIv = aesEncrypt(dbKey, FIXED_IV)
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
			when(entityClient.loadRoot(tutanotaTypeRefs.ContactListTypeRef, matchers.anything())).thenResolve(contactList)

			when(loadGroupDiff(user)).thenResolve(groupDiff)

			const indexer = mock(indexerTemplate, (mock) => {
				mock._loadGroupDiff = loadGroupDiff
				mock._updateGroups = updateGroups
			})

			when(keyLoaderFacade.loadSymUserGroupKey(userGroupKeyVersion)).thenResolve(userGroupKey.object)
			when(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything())).thenResolve()

			await indexer.fullLoginInit({ user })
			const { key } = await dbWithStub.encryptionData()
			o.check(key).deepEquals(dbKey)
			verify(loadGroupDiff(user))
			verify(updateGroups(user, groupDiff))
			verify(contactIndexer.indexFullContactList(), { times: 0 })
		})

		o.test("init existing db out of sync", async () => {
			let userGroupKey = freshVersioned(aes256RandomKey())
			let dbKey = aes256RandomKey()
			let userEncDbKey = encryptKey(userGroupKey.object, dbKey)
			const userGroupKeyVersion = 0
			let encDbIv = aesEncrypt(dbKey, FIXED_IV)
			const t = await idbStub.createTransaction()
			t.put(MetaDataOS, Metadata.userEncDbKey, userEncDbKey)
			t.put(MetaDataOS, Metadata.userGroupKeyVersion, userGroupKeyVersion)
			t.put(MetaDataOS, Metadata.mailIndexingEnabled, true)
			t.put(MetaDataOS, Metadata.encDbIv, encDbIv)
			t.put(MetaDataOS, Metadata.lastEventIndexTimeMs, SERVER_TIME)
			// to avoid empty groups check in _updateIndexedGroups
			t.put(GroupDataOS, "group-id", "some-data")

			when(contactIndexer.areContactsIndexed()).thenResolve(true)
			when(entityClient.loadRoot(tutanotaTypeRefs.ContactListTypeRef, matchers.anything())).thenResolve(contactList)

			when(loadGroupDiff(user)).thenResolve(groupDiff)

			const indexer = mock(indexerTemplate, (mock) => {
				mock._loadGroupDiff = loadGroupDiff
				mock._updateGroups = updateGroups
				mock.disableMailIndexing = disableMailIndexing
			})

			when(keyLoaderFacade.loadSymUserGroupKey(userGroupKeyVersion)).thenResolve(userGroupKey.object)
			when(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything())).thenResolve()

			await indexer.fullLoginInit({ user })
			const { key } = await dbWithStub.encryptionData()
			o.check(key).deepEquals(dbKey)
			verify(loadGroupDiff(user))
			verify(updateGroups(user, groupDiff))
			verify(contactIndexer.indexFullContactList(), { times: 0 })
		})
	})

	o.test("_loadGroupDiff", async function () {
		const mailGroupId = "new-group-id"
		const contactGroupId = "constant-group-id"
		const deletedGroupId = "deleted-group-id"

		const user = createTestEntity(sysTypeRefs.UserTypeRef, {
			memberships: [
				createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					groupType: GroupType.Mail,
					group: mailGroupId,
				}),
				createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					groupType: GroupType.Contact,
					group: contactGroupId,
				}),
				createTestEntity(sysTypeRefs.GroupMembershipTypeRef),
			],
			userGroup: createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
				groupType: GroupType.User,
				group: "user-group-id",
			}),
		})
		const groupData = {
			groupType: GroupType.MailingList,
		}
		const t = await idbStub.createTransaction()
		t.put(GroupDataOS, deletedGroupId, groupData)
		t.put(GroupDataOS, contactGroupId, { groupType: GroupType.Contact })

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
				{
					id: "user-group-id",
					type: GroupType.User,
				},
			],
		})
	})

	o.spec("_updateGroups", function () {
		o.test("disable MailIndexing in case of a deleted mail group", async function () {
			let indexer = mock(indexerTemplate, (mock) => {
				mock.disableMailIndexing = func()
			})
			let user = createTestEntity(sysTypeRefs.UserTypeRef)
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
			let user = createTestEntity(sysTypeRefs.UserTypeRef)
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
			let user = createTestEntity(sysTypeRefs.UserTypeRef)
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
			let user = createTestEntity(sysTypeRefs.UserTypeRef)
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
			let user = createTestEntity(sysTypeRefs.UserTypeRef)

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
		o.test("_loadGroup initializes with GeneratedId from recent timestamp when there is no entry", async function () {
			const user = createTestEntity(sysTypeRefs.UserTypeRef, {
				memberships: [
					createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
						groupType: GroupType.Mail,
						group: "group-mail",
					}),
					createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
						groupType: GroupType.MailingList,
						group: "group-team",
					}),
					createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
						groupType: GroupType.Contact,
						group: "group-contact",
					}),
					createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
						groupType: GroupType.Customer,
						group: "group-customer",
					}),
				],
				userGroup: createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					groupType: GroupType.User,
					group: "group-user",
				}),
			})

			let indexer = indexerTemplate
			const FIVE_SECONDS_IN_MILLISECONDS = 5000
			const lastProcessedBatchId = timestampToGeneratedId(serverDateProvider.now() - FIVE_SECONDS_IN_MILLISECONDS)
			const result = await indexer._loadGroupData(user)
			o.check(result).deepEquals([
				{
					groupId: "group-mail",
					groupData: {
						lastBatchIds: [lastProcessedBatchId],
						indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						groupType: GroupType.Mail,
					},
				},
				{
					groupId: "group-contact",
					groupData: {
						lastBatchIds: [lastProcessedBatchId],
						indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						groupType: GroupType.Contact,
					},
				},
				{
					groupId: "group-user",
					groupData: {
						lastBatchIds: [lastProcessedBatchId],
						indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						groupType: GroupType.User,
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

		o.check(idbStub.getValue(GroupDataOS, groupId)).deepEquals(groupBatches[0].groupData)
	})

	o.test("_loadPersistentGroupData", async function () {
		const customerGroupId = "group-customer"
		const mailGroupId = "group-mail"
		const contactGroupId = "group-contact"

		const lastMailBatch = "last-mail-batch-id"
		const lastContactBatch = "last-contact-batch-id"
		const lastCustomerBatch = "last-customer-batch-id"

		let groupData = {
			lastBatchId: lastMailBatch,
		}
		const transaction = await idbStub.createTransaction()

		transaction.put(GroupDataOS, mailGroupId, {
			lastBatchId: lastMailBatch,
		})
		transaction.put(GroupDataOS, "group-team", groupData)
		transaction.put(GroupDataOS, contactGroupId, {
			lastBatchId: lastContactBatch,
		})

		transaction.put(GroupDataOS, customerGroupId, {
			lastBatchId: lastCustomerBatch,
		})

		let user = createTestEntity(sysTypeRefs.UserTypeRef, {
			memberships: [
				createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					groupType: GroupType.Mail,
					group: mailGroupId,
				}),
				createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					groupType: GroupType.MailingList,
					group: "group-team",
				}),
				createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					groupType: GroupType.Contact,
					group: contactGroupId,
				}),
				createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					groupType: GroupType.Customer,
					group: customerGroupId,
				}),
			],
		})

		let indexer = indexerTemplate
	})

	o.spec("processEntityEvents", function () {
		o.test("dispatches events to indexers and writes the timestamp", async function () {
			const groupId = "group-id"
			const batchId = "batch-id"
			const user = createTestEntity(sysTypeRefs.UserTypeRef, {
				memberships: [
					createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
						groupType: GroupType.Mail,
						group: groupId,
					}),
				],
				userGroup: createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					groupType: GroupType.User,
					group: "user-group-id",
				}),
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
				return {
					typeRef,
				} as Partial<entityUpdateUtils.EntityUpdateData> as entityUpdateUtils.EntityUpdateData
			}

			let events = [newUpdate(tutanotaTypeRefs.MailTypeRef), newUpdate(tutanotaTypeRefs.ContactTypeRef), newUpdate(sysTypeRefs.UserTypeRef)]
			const batch = {
				events,
				groupId,
				batchId,
			}
			await indexer._processEntityEvents(batch)
			verify(core.putLastBatchIdForGroup(groupId, batchId))
			verify(mailIndexer.processEntityEvents(events, groupId, batchId), { times: 1 })
			verify(contactIndexer.processEntityEvents(events, groupId, batchId), { times: 1 })
		})

		o.test("when it receives the events it queues them for processing", async function () {
			const newestBatchId = timestampToGeneratedId(new Date("2025-03-31T14:13:22.853Z").getTime())

			const groupId = "group-mail"
			const events = [
				createTestEntity(sysTypeRefs.EntityUpdateTypeRef, {
					typeId: tutanotaTypeRefs.MailTypeRef.typeId.toString(),
				}),
				createTestEntity(sysTypeRefs.EntityUpdateTypeRef, {
					typeId: tutanotaTypeRefs.MailTypeRef.typeId.toString(),
				}),
			]
			const entityUpdateData = await promiseMap(events, async (e) => await entityUpdateUtils.entityUpdateToUpdateData(e, null, null))
			const transaction = await idbStub.createTransaction()
			transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, SERVER_TIME)

			dbWithStub.init({ key, iv })
			let indexer = indexerTemplate

			indexer._processEntityEvents = func<IndexedDbIndexer["_processEntityEvents"]>()
			const queue = indexer.eventQueue
			queue.addBatches = func<EventQueue["addBatches"]>()
			await indexer.processEntityEvents(entityUpdateData, newestBatchId, groupId)
			verify(queue.addBatches(matchers.anything()), { times: 1 })
			verify(
				queue.addBatches([
					{
						groupId,
						batchId: newestBatchId,
						events: entityUpdateData,
					},
				]),
			)
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
			o.check(idbStub.getValue(MetaDataOS, Metadata.lastEventIndexTimeMs)).deepEquals(OUT_OF_DATE_SERVER_TIME)
			verify(processEntityEvents(matchers.anything()), { times: 0 })
		})

		o.test("when receiving multiple events it dispatches both and records the batch twice", async function () {
			const groupId = "group-id"
			const user = createTestEntity(sysTypeRefs.UserTypeRef, {
				memberships: [
					createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
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

			const events1: entityUpdateUtils.EntityUpdateData[] = [
				{
					typeRef: tutanotaTypeRefs.MailTypeRef,
					operation: OperationType.CREATE,
					instanceId: "id-1",
					instanceListId: "list-id",
					...noPatchesAndInstance,
				},
			]

			const batchId1 = "batch-id-1"
			const batch1: QueuedBatch = {
				events: events1,
				groupId: groupId,
				batchId: batchId1,
			}

			const events2: entityUpdateUtils.EntityUpdateData[] = [
				{
					typeRef: tutanotaTypeRefs.MailTypeRef,
					operation: OperationType.CREATE,
					instanceId: "id-2",
					instanceListId: "list-id",
					...noPatchesAndInstance,
				},
			]
			const batchId2 = "batch-id-2"
			const batch2: QueuedBatch = {
				events: events2,
				groupId: groupId,
				batchId: batchId2,
			}
			await indexer.processEntityEvents(batch1.events, batch1.batchId, batch1.groupId)
			await indexer.processEntityEvents(batch2.events, batch2.batchId, batch2.groupId)

			indexer.eventQueue.resume()

			indexer._startProcessing()
			await indexer.eventQueue.waitForEmptyQueue()

			verify(core.putLastBatchIdForGroup(groupId, batchId1))
			verify(mailIndexer.processEntityEvents(events1, groupId, batchId1))
			verify(contactIndexer.processEntityEvents(events1, groupId, batchId1))

			verify(core.putLastBatchIdForGroup(groupId, batchId2))
			verify(mailIndexer.processEntityEvents(events2, groupId, batchId2))
			verify(contactIndexer.processEntityEvents(events2, groupId, batchId2))
		})

		o.spec("handles mail updates", () => {
			let indexer: IndexedDbIndexer

			const testBatch: { batchId: Id; groupId: Id; events: readonly entityUpdateUtils.EntityUpdateData[] } = {
				events: [
					{
						typeRef: tutanotaTypeRefs.MailTypeRef,
						operation: OperationType.CREATE,
						instanceId: "id-1",
						instanceListId: "create",
						...noPatchesAndInstance,
					},
					{
						typeRef: tutanotaTypeRefs.ContactTypeRef,
						operation: OperationType.CREATE,
						instanceId: "id-2",
						instanceListId: "create",
						...noPatchesAndInstance,
					},
					{
						typeRef: tutanotaTypeRefs.MailTypeRef,
						operation: OperationType.CREATE,
						instanceId: "id-3",
						instanceListId: "create",
						...noPatchesAndInstance,
					},

					{
						typeRef: tutanotaTypeRefs.MailTypeRef,
						operation: OperationType.UPDATE,
						instanceId: "id-4",
						instanceListId: "update",
						...noPatchesAndInstance,
					},
					{
						typeRef: tutanotaTypeRefs.ContactTypeRef,
						operation: OperationType.UPDATE,
						instanceId: "id-5",
						instanceListId: "update",
						...noPatchesAndInstance,
					},
					{
						typeRef: tutanotaTypeRefs.MailTypeRef,
						operation: OperationType.UPDATE,
						instanceId: "id-6",
						instanceListId: "update",
						...noPatchesAndInstance,
					},

					{
						typeRef: tutanotaTypeRefs.MailTypeRef,
						operation: OperationType.DELETE,
						instanceId: "id-7",
						instanceListId: "delete",
						...noPatchesAndInstance,
					},
					{
						typeRef: tutanotaTypeRefs.ContactTypeRef,
						operation: OperationType.DELETE,
						instanceId: "id-8",
						instanceListId: "delete",
						...noPatchesAndInstance,
					},
					{
						typeRef: tutanotaTypeRefs.MailTypeRef,
						operation: OperationType.DELETE,
						instanceId: "id-9",
						instanceListId: "delete",
						...noPatchesAndInstance,
					},
				],
				groupId: "blah",
				batchId: "asdf",
			}

			o.beforeEach(() => {
				indexer = mock(indexerTemplate, (mock) => {
					mock._processUserEntityEvents = func<IndexedDbIndexer["_processUserEntityEvents"]>()
					mock.initDeferred = defer()
					mock._indexedGroupIds = [testBatch.groupId]
					mock.initDeferred.resolve()
				})
			})

			o.test("create", async () => {
				await indexer._processEntityEvents(testBatch)
				verify(mailIndexer.afterMailCreated(["create", "id-1"]))
				verify(mailIndexer.afterMailCreated(["create", "id-3"]))
				verify(mailIndexer.afterMailCreated(matchers.anything()), { times: 2 })
				verify(core.putLastBatchIdForGroup(testBatch.groupId, testBatch.batchId))
			})
			o.test("update", async () => {
				await indexer._processEntityEvents(testBatch)
				verify(mailIndexer.afterMailUpdated(["update", "id-4"]))
				verify(mailIndexer.afterMailUpdated(["update", "id-6"]))
				verify(mailIndexer.afterMailUpdated(matchers.anything()), { times: 2 })
				verify(core.putLastBatchIdForGroup(testBatch.groupId, testBatch.batchId))
			})
			o.test("delete", async () => {
				await indexer._processEntityEvents(testBatch)
				verify(mailIndexer.afterMailDeleted(["delete", "id-7"]))
				verify(mailIndexer.afterMailDeleted(["delete", "id-9"]))
				verify(mailIndexer.afterMailDeleted(matchers.anything()), { times: 2 })
				verify(core.putLastBatchIdForGroup(testBatch.groupId, testBatch.batchId))
			})

			o.test("gracefully handles not found errors", async () => {
				when(mailIndexer.afterMailCreated(["create", "id-1"])).thenReject(new NotFoundError("Not found :("))
				when(mailIndexer.afterMailCreated(["update", "id-4"])).thenReject(new NotFoundError("Not found :("))
				await indexer._processEntityEvents(testBatch)

				verify(mailIndexer.afterMailCreated(["create", "id-1"]))
				verify(mailIndexer.afterMailCreated(["create", "id-3"]))
				verify(mailIndexer.afterMailCreated(matchers.anything()), { times: 2 })

				verify(mailIndexer.afterMailUpdated(["update", "id-4"]))
				verify(mailIndexer.afterMailUpdated(["update", "id-6"]))
				verify(mailIndexer.afterMailUpdated(matchers.anything()), { times: 2 })

				verify(mailIndexer.afterMailDeleted(["delete", "id-7"]))
				verify(mailIndexer.afterMailDeleted(["delete", "id-9"]))
				verify(mailIndexer.afterMailDeleted(matchers.anything()), { times: 2 })

				verify(core.putLastBatchIdForGroup(testBatch.groupId, testBatch.batchId))
			})

			o.test("gracefully handles not authorized errors", async () => {
				when(mailIndexer.afterMailCreated(["create", "id-1"])).thenReject(new NotAuthorizedError("You shall not pass :("))
				when(mailIndexer.afterMailCreated(["update", "id-4"])).thenReject(new NotAuthorizedError("You shall not pass :("))
				await indexer._processEntityEvents(testBatch)

				verify(mailIndexer.afterMailCreated(["create", "id-1"]))
				verify(mailIndexer.afterMailCreated(["create", "id-3"]))
				verify(mailIndexer.afterMailCreated(matchers.anything()), { times: 2 })

				verify(mailIndexer.afterMailUpdated(["update", "id-4"]))
				verify(mailIndexer.afterMailUpdated(["update", "id-6"]))
				verify(mailIndexer.afterMailUpdated(matchers.anything()), { times: 2 })

				verify(mailIndexer.afterMailDeleted(["delete", "id-7"]))
				verify(mailIndexer.afterMailDeleted(["delete", "id-9"]))
				verify(mailIndexer.afterMailDeleted(matchers.anything()), { times: 2 })

				verify(core.putLastBatchIdForGroup(testBatch.groupId, testBatch.batchId))
			})
		})
	})

	o.spec("init", function () {
		let indexer: IndexedDbIndexer
		let user = createTestEntity(sysTypeRefs.UserTypeRef, {
			userGroup: createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
				group: "user-group-id",
			}),
		})
		let userGroupKey: VersionedKey

		o.beforeEach(async function () {
			userGroupKey = freshVersioned(aes256RandomKey())
			const transactionDouble = await idbStub.createTransaction()
			transactionDouble.put(GroupDataOS, "key", "value")

			when(entityClient.loadRoot(tutanotaTypeRefs.ContactListTypeRef, user.userGroup.group)).thenResolve(contactList)

			indexer = indexerTemplate
		})

		o.test("When init() is called and contacts have already been indexed they are not indexed again", async function () {
			when(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything())).thenResolve()
			when(contactIndexer.areContactsIndexed()).thenResolve(true)
			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)
			await indexer.fullLoginInit({ user })
			verify(contactIndexer.indexFullContactList(), { times: 0 })
		})

		o.test("When init() is called and contacts have not been indexed before, they are indexed", async function () {
			when(contactIndexer.areContactsIndexed()).thenResolve(false)
			when(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything())).thenResolve()
			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)
			await indexer.fullLoginInit({ user })
			verify(contactIndexer.indexFullContactList())
		})

		o.test("When init() is called with a fresh db and contacts are not yet indexed, they will be indexed and not downloaded", async function () {
			when(contactIndexer.areContactsIndexed()).thenResolve(false)
			when(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything())).thenResolve()
			const cacheInfo: CacheInfo = {
				isPersistent: true,
				isNewOfflineDb: true,
				databaseKey: new Uint8Array([1, 2, 3]),
			}

			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)
			await indexer.fullLoginInit({ user })

			verify(contactIndexer.indexFullContactList())
			verify(entityClient.loadAll(tutanotaTypeRefs.ContactTypeRef, contactList.contacts), { times: 0 })
		})

		o.test("When init() is called with a fresh db and the cache is not persisted the indexing is not enabled", async function () {
			when(contactIndexer.areContactsIndexed()).thenResolve(true)
			when(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything())).thenResolve()
			const cacheInfo: CacheInfo = {
				isPersistent: false,
				isNewOfflineDb: true,
				databaseKey: new Uint8Array([1, 2, 3]),
			}

			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(userGroupKey)

			await indexer.fullLoginInit({ user })
		})
	})
	o.spec("enable/disable mailIndexing", function () {
		let indexer: IndexedDbIndexer
		const userGroupId = "user-group-id"
		let user = createTestEntity(sysTypeRefs.UserTypeRef, {
			userGroup: createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
				group: userGroupId,
				groupType: GroupType.User,
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
			when(mailIndexer.indexMailboxes(matchers.anything(), matchers.anything())).thenResolve()
			indexer = indexerTemplate
			const t = await idbStub.createTransaction()
			t.put(GroupDataOS, userGroupId, { groupType: GroupType.User })

			await indexer.fullLoginInit({ user })
		})

		o.spec("enableMailIndexing", function () {
			o.test("when was actually enabled it does initial mail indexing", async function () {
				when(mailIndexer.enableMailIndexing()).thenResolve(true)
				await indexer.enableMailIndexing()
				verify(mailIndexer.enableMailIndexing())
				verify(mailIndexer.doInitialMailIndexing(user))
			})

			o.test("does not process events while doing initial indexing", async function () {
				when(mailIndexer.enableMailIndexing()).thenResolve(true)

				// to manually control when initial indexing is done
				const initialIndexingDone = defer<void>()
				// to listen until initial indexing is called
				const initialIndexingCalled = defer<void>()
				when(mailIndexer.doInitialMailIndexing(user)).thenDo(() => {
					initialIndexingCalled.resolve()
					return initialIndexingDone.promise
				})

				// do wait until process will be called on mail indexer
				const processDeferred = defer<void>()
				const updates: entityUpdateUtils.EntityUpdateData[] = [
					{
						typeRef: tutanotaTypeRefs.MailTypeRef,
						instanceId: "instanceId",
						instanceListId: "instanceListId",
						operation: OperationType.CREATE,
						...noPatchesAndInstance,
					},
				]
				when(mailIndexer.processEntityEvents(updates, matchers.anything(), matchers.anything())).thenDo(() => processDeferred.resolve())
				indexer.enableMailIndexing()

				await initialIndexingCalled.promise
				// dispatch an event while initial indexing is running and see that it is not immediately processed
				await indexer.processEntityEvents(updates, "batchId", userGroupId)
				// not processed yet
				verify(mailIndexer.processEntityEvents(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })

				// allow initial indexing to finish
				initialIndexingDone.resolve()
				// wait until process callback is called
				await processDeferred.promise
				verify(mailIndexer.processEntityEvents(updates, userGroupId, "batchId"))
				verify(mailIndexer.doInitialMailIndexing(user))
			})

			o.test("does not process events while extending mail Index", async function () {
				when(mailIndexer.enableMailIndexing()).thenResolve(true)

				const time = new Date("2022-03-31T14:12:00.244Z")
				// to manually control when extending mail indexing is done
				const extendMailIndexingDone = defer<void>()
				const extendingMailIndexingCalled = defer<void>()
				when(mailIndexer.extendIndexIfNeeded(user, time.getTime())).thenDo(() => {
					extendingMailIndexingCalled.resolve()
					return extendMailIndexingDone.promise
				})

				// do wait until process will be called on extending mail indexer
				const processDeferred = defer<void>()
				const updates: entityUpdateUtils.EntityUpdateData[] = [
					{
						typeRef: tutanotaTypeRefs.MailTypeRef,
						instanceId: "instanceId",
						instanceListId: "instanceListId",
						operation: OperationType.CREATE,
						...noPatchesAndInstance,
					},
				]
				when(mailIndexer.processEntityEvents(updates, matchers.anything(), matchers.anything())).thenDo(() => processDeferred.resolve())
				indexer.extendMailIndex(time.getTime())

				await extendingMailIndexingCalled.promise
				await indexer.processEntityEvents(updates, "batchId", userGroupId)
				// not processed yet
				verify(mailIndexer.processEntityEvents(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })

				// allow extending indexing to finish
				extendMailIndexingDone.resolve()
				// wait until process callback is called
				await processDeferred.promise
				verify(mailIndexer.processEntityEvents(updates, userGroupId, "batchId"))
				verify(mailIndexer.extendIndexIfNeeded(user, time.getTime()))
			})

			o.test("when was already enabled it does nothing", async function () {
				when(mailIndexer.enableMailIndexing()).thenResolve(false)
				await indexer.enableMailIndexing()
				verify(mailIndexer.enableMailIndexing())
				verify(mailIndexer.doInitialMailIndexing(matchers.anything()), { times: 0 })
			})
		})

		o.spec("disableMailIndexing", function () {
			o.test("when not stopped processing", async function () {
				verify(mailIndexer.init(user), { times: 1 }) // one was from the initial init
				when(core.isStoppedProcessing()).thenReturn(false)

				await indexer.disableMailIndexing()
				verify(core.isStoppedProcessing())
				verify(mailIndexer.cancelMailIndexing())
				verify(dbWithStub.dbFacade.deleteDatabase(user._id))

				verify(mailIndexer.init(user), { times: 2 }) // +1 when disableMailIndexing was called
			})
			o.test("when stopped processing", async function () {
				verify(mailIndexer.init(user), { times: 1 }) // one was from the initial init
				when(core.isStoppedProcessing()).thenReturn(true)

				await indexer.disableMailIndexing()
				verify(core.isStoppedProcessing())
				verify(mailIndexer.cancelMailIndexing(), { times: 0 })
				verify(dbWithStub.dbFacade.deleteDatabase(matchers.anything()), { times: 0 })

				verify(mailIndexer.init(matchers.anything()), { times: 1 }) // no additional calls
			})
		})
	})
	o.test("when deleteIndex", async function () {
		const userId = "user-Id"
		const queue = indexerTemplate.eventQueue
		queue.pause = func<EventQueue["pause"]>()
		queue.waitForEmptyQueue = func<EventQueue["waitForEmptyQueue"]>()
		const queueWaitCalled = defer<void>()
		const queueWaitDone = defer<void>()
		when(queue.waitForEmptyQueue()).thenDo(() => {
			queueWaitCalled.resolve()
			return queueWaitDone.promise
		})

		const deletePromise = indexerTemplate.deleteIndex(userId)
		await queueWaitCalled
		verify(queue.pause())
		verify(mailIndexer.cancelMailIndexing())
		verify(core.stopProcessing())
		o.check(idbStub.deleted).equals(false)
		queueWaitDone.resolve()
		await deletePromise
		o.check(idbStub.deleted).equals(true)
	})

	o.test("when cancel Indexing", function () {
		const queue = indexerTemplate.eventQueue
		queue.resume = func<EventQueue["resume"]>()
		indexerTemplate.cancelMailIndexing()
		verify(mailIndexer.cancelMailIndexing())
		verify(queue.resume())
	})

	o.test("_stopProcessing", async function () {
		const queue = indexerTemplate.eventQueue
		queue.waitForEmptyQueue = func<EventQueue["waitForEmptyQueue"]>()

		const queueEmptyPromise = defer<void>()
		when(queue.waitForEmptyQueue()).thenReturn(queueEmptyPromise.promise)

		let processingStopped = false
		const stopProcessingPromise = indexerTemplate._stopProcessing()
		verify(core.stopProcessing())
		verify(mailIndexer.cancelMailIndexing())

		stopProcessingPromise.then(() => {
			processingStopped = true
		})
		o.check(processingStopped).equals(false)
		queueEmptyPromise.resolve()
		await stopProcessingPromise
		o.check(processingStopped).equals(true)
	})
})
