//
// NOTE: some of the mocking is this file is pretty old and we should replace spy() with something more modern
//
import o from "@tutao/otest"
import {
	CUSTOM_MAX_ID,
	CUSTOM_MIN_ID,
	elementIdPart,
	firstBiggerThanSecond,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	getElementId,
	getListId,
	stringToCustomId,
} from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { arrayOf, clone, deepEqual, downcast, isSameTypeRef, last, neverNull, TypeRef } from "@tutao/tutanota-utils"
import {
	CustomerTypeRef,
	EntityUpdate,
	EntityUpdateTypeRef,
	ExternalUserReferenceTypeRef,
	GroupKeyTypeRef,
	MailAddressToGroupTypeRef,
	PermissionTypeRef,
	RootInstanceTypeRef,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { CacheMode, EntityRestClient, typeRefToPath } from "../../../../../src/common/api/worker/rest/EntityRestClient.js"
import { QueuedBatch } from "../../../../../src/common/api/worker/EventQueue.js"
import {
	CacheStorage,
	DefaultEntityRestCache,
	expandId,
	EXTEND_RANGE_MIN_CHUNK_SIZE,
} from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache.js"
import {
	BodyTypeRef,
	CalendarEventTypeRef,
	ContactTypeRef,
	Mail,
	MailBoxTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { OfflineStorage, OfflineStorageCleaner } from "../../../../../src/common/api/worker/offline/OfflineStorage.js"
import { assertThrows, mockAttribute, spy, unmockAttribute, verify } from "@tutao/tutanota-test-utils"
import { NoZoneDateProvider } from "../../../../../src/common/api/common/utils/NoZoneDateProvider.js"
import { RestClient } from "../../../../../src/common/api/worker/rest/RestClient.js"
import { NotAuthorizedError, NotFoundError } from "../../../../../src/common/api/common/error/RestError.js"
import { EphemeralCacheStorage } from "../../../../../src/common/api/worker/rest/EphemeralCacheStorage.js"
import { OperationType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { OfflineStorageMigrator } from "../../../../../src/common/api/worker/offline/OfflineStorageMigrator.js"
import { createEventElementId } from "../../../../../src/common/api/common/utils/CommonCalendarUtils.js"
import { InterWindowEventFacadeSendDispatcher } from "../../../../../src/common/native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { func, instance, matchers, object, replace, when } from "testdouble"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade.js"
import { createTestEntity } from "../../../TestUtils.js"
import { CustomCacheHandler, CustomCacheHandlerMap } from "../../../../../src/common/api/worker/rest/cacheHandler/CustomCacheHandler"
import { EntityUpdateData, entityUpdatesAsData } from "../../../../../src/common/api/common/utils/EntityUpdateUtils"

const { anything } = matchers

const offlineDatabaseTestKey = new Uint8Array([3957386659, 354339016, 3786337319, 3366334248])

async function getOfflineStorage(userId: Id, handlerMap: CustomCacheHandlerMap): Promise<CacheStorage> {
	const { PerWindowSqlCipherFacade } = await import("../../../../../src/common/desktop/db/PerWindowSqlCipherFacade.js")
	const { OfflineDbRefCounter } = await import("../../../../../src/common/desktop/db/OfflineDbRefCounter.js")
	const { DesktopSqlCipher } = await import("../../../../../src/common/desktop/db/DesktopSqlCipher.js")

	const odbRefCounter = new OfflineDbRefCounter({
		async create(userid: string, key: Uint8Array, retry?: boolean): Promise<SqlCipherFacade> {
			const db = new DesktopSqlCipher(__NODE_GYP_better_sqlite3, ":memory:", false)
			//integrity check breaks for in memory database
			await db.openDb(userId, key)
			return db
		},

		async delete(userId: string): Promise<void> {},
	})
	const migratorMock = instance(OfflineStorageMigrator)

	const sqlCipherFacade = new PerWindowSqlCipherFacade(odbRefCounter)
	await sqlCipherFacade.openDb(userId, offlineDatabaseTestKey)
	const interWindowEventSender = instance(InterWindowEventFacadeSendDispatcher)
	const offlineStorageCleanerMock = object<OfflineStorageCleaner>()
	const offlineStorage = new OfflineStorage(
		sqlCipherFacade,
		interWindowEventSender,
		new NoZoneDateProvider(),
		migratorMock,
		offlineStorageCleanerMock,
		handlerMap,
	)
	await offlineStorage.init({ userId, databaseKey: offlineDatabaseTestKey, timeRangeDate: new Date("2025-03-21T12:33:40.972Z"), forceNewDatabase: false })
	return offlineStorage
}

async function getEphemeralStorage(userId, handlerMap): Promise<EphemeralCacheStorage> {
	return new EphemeralCacheStorage(handlerMap)
}

testEntityRestCache("ephemeral", getEphemeralStorage)
node(() => testEntityRestCache("offline", getOfflineStorage))()

export function testEntityRestCache(name: string, getStorage: (userId: Id, customCacheHandlerMap: CustomCacheHandlerMap) => Promise<CacheStorage>) {
	const groupId = "groupId"
	const batchId = "batchId"
	o.spec(`EntityRestCache ${name}`, function () {
		let storage: CacheStorage
		let customCacheHandlerMap: CustomCacheHandlerMap
		let cache: DefaultEntityRestCache

		// The entity client will assert to throwing if an unexpected method is called
		// You can mock it's attributes if you want to assert that a given method will be called
		let entityRestClient: EntityRestClient
		let userId: Id | null

		let createUpdate = function (typeRef: TypeRef<any>, listId: Id, id: Id, operation: OperationType): EntityUpdate {
			let eu = createTestEntity(EntityUpdateTypeRef)
			eu.application = typeRef.app
			eu.type = typeRef.type
			eu.instanceListId = listId
			eu.instanceId = id
			eu.operation = operation
			return eu
		}

		let createId = function (idText) {
			//return idText
			return Array(13 - idText.length).join("-") + idText
		}

		let createMailDetailsBlobInstance = function (archiveId, id, bodyText): MailDetailsBlob {
			let body = createTestEntity(BodyTypeRef, { text: bodyText })
			let mailDetails = createTestEntity(MailDetailsTypeRef, { _id: createId(id), body: body })
			return createTestEntity(MailDetailsBlobTypeRef, { _id: [archiveId, mailDetails._id], details: mailDetails })
		}

		let createMailInstance = function (listId, id, subject): Mail {
			let mail = createTestEntity(MailTypeRef)
			mail._id = [listId, createId(id)]
			mail.subject = subject ?? ""
			mail.mailDetails = ["mailDetailsListId", "mailDetailsElementId"]
			return mail
		}

		function mockRestClient(): EntityRestClient {
			let notToBeCalled = function (name: string) {
				return function (...args) {
					throw new Error(name + " should not have been called. arguments: " + String(args))
				}
			}
			const restClient = object<RestClient>()
			when(restClient.getServerTimestampMs()).thenReturn(Date.now())

			return downcast({
				load: notToBeCalled("load"),
				loadRange: notToBeCalled("loadRange"),
				loadMultiple: notToBeCalled("loadMultiple"),
				setup: notToBeCalled("setup"),
				setupMultiple: notToBeCalled("setupMultiple"),
				update: notToBeCalled("update"),
				erase: notToBeCalled("erase"),
				entityEventsReceived: (e) => Promise.resolve(e),
				getRestClient: () => restClient,
			})
		}

		o.beforeEach(async function () {
			userId = "userId"
			customCacheHandlerMap = object()
			storage = await getStorage(userId, customCacheHandlerMap)
			entityRestClient = mockRestClient()
			cache = new DefaultEntityRestCache(entityRestClient, storage)
		})

		o.spec("entityEventsReceived", function () {
			const path = typeRefToPath(ContactTypeRef)
			const contactListId1 = "contactListId1"
			const contactListId2 = "contactListId2"
			const id1 = "id1"
			const id2 = "id2"
			const id3 = "id3"
			const id4 = "id4"
			const id5 = "id5"
			const id6 = "id6"
			const id7 = "id7"

			//Calendarevents
			const calendarEventListId = "calendarEventListId"
			let timestamp = Date.now()
			const calendarEventIds = [0, 1, 2, 3, 4, 5, 6].map((n) => createEventElementId(timestamp, n))

			o("writes batch meta on entity update", async function () {
				const contact1 = createTestEntity(ContactTypeRef, { _id: [contactListId1, id1] })
				const contact2 = createTestEntity(ContactTypeRef, { _id: [contactListId1, id2] })

				const batch = [
					createUpdate(ContactTypeRef, contactListId1, id1, OperationType.CREATE),
					createUpdate(ContactTypeRef, contactListId1, id2, OperationType.CREATE),
				]

				const loadMultiple = func<typeof entityRestClient.loadMultiple>()
				when(loadMultiple(ContactTypeRef, contactListId1, [id1, id2])).thenResolve([contact1, contact2])
				replace(entityRestClient, "loadMultiple", loadMultiple)

				const putLastBatchIdForGroup = func<typeof storage.putLastBatchIdForGroup>()
				when(putLastBatchIdForGroup(groupId, batchId)).thenResolve(undefined)
				replace(storage, "putLastBatchIdForGroup", putLastBatchIdForGroup)

				await cache.entityEventsReceived(makeBatch(batch))
				await cache.getLastEntityEventBatchForGroup(groupId)
				verify(putLastBatchIdForGroup(groupId, batchId))
			})

			o.spec("postMultiple", function () {
				o.beforeEach(async function () {
					await storage.setNewRangeForList(ContactTypeRef, contactListId1, id1, id7)
					await storage.setNewRangeForList(ContactTypeRef, contactListId2, id1, id7)
					//when using offline calendar ids are always in cache range
				})
				o("entity events received should call loadMultiple when receiving updates from a postMultiple", async function () {
					const contact1 = createTestEntity(ContactTypeRef, { _id: [contactListId1, id1] })
					const contact2 = createTestEntity(ContactTypeRef, { _id: [contactListId1, id2] })

					const batch = [
						createUpdate(ContactTypeRef, contactListId1, id1, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId1, id2, OperationType.CREATE),
					]
					const loadMultiple = spy(function (typeRef, listId, ids) {
						o(isSameTypeRef(typeRef, ContactTypeRef)).equals(true)
						o(listId).equals(contactListId1)
						o(ids).deepEquals(["id1", "id2"])
						return Promise.resolve([contact1, contact2])
					})
					const mock = mockAttribute(entityRestClient, entityRestClient.loadMultiple, loadMultiple)
					const updates = await cache.entityEventsReceived(makeBatch(batch))
					unmockAttribute(mock)
					o(loadMultiple.callCount).equals(1)("loadMultiple is called")
					o(await storage.get(ContactTypeRef, contactListId1, id1)).notEquals(null)
					o(await storage.get(ContactTypeRef, contactListId1, id2)).notEquals(null)
					o(updates).deepEquals(entityUpdatesAsData(batch))
				})

				if (name === "offline") {
					// in the other case storage is an EphemeralCache which doesn't use custom handlers or caches calendar events.
					o("entity events received should call loadMultiple when receiving updates from a postMultiple with CustomCacheHandler", async function () {
						const event1 = createTestEntity(CalendarEventTypeRef, { _id: [calendarEventListId, calendarEventIds[0]] })
						const event2 = createTestEntity(CalendarEventTypeRef, { _id: [calendarEventListId, calendarEventIds[1]] })
						// We only consider events to be in the range if we do actually have correct range
						await storage.setNewRangeForList(CalendarEventTypeRef, calendarEventListId, CUSTOM_MIN_ID, CUSTOM_MAX_ID)

						const batch = [
							createUpdate(CalendarEventTypeRef, calendarEventListId, calendarEventIds[0], OperationType.CREATE),
							createUpdate(ContactTypeRef, calendarEventListId, calendarEventIds[1], OperationType.CREATE),
						]
						const loadMultiple = spy(function (typeRef, listId, ids) {
							o(isSameTypeRef(typeRef, CalendarEventTypeRef)).equals(true)
							o(listId).equals(calendarEventListId)
							o(ids).deepEquals([calendarEventIds[0], calendarEventIds[1]])
							return Promise.resolve([event1, event2])
						})
						const mock = mockAttribute(entityRestClient, entityRestClient.loadMultiple, loadMultiple)
						const updates = await cache.entityEventsReceived(makeBatch(batch))
						unmockAttribute(mock)
						o(loadMultiple.callCount).equals(1)("loadMultiple is called")
						o(await storage.get(CalendarEventTypeRef, calendarEventListId, calendarEventIds[0])).notEquals(null)
						o(await storage.get(CalendarEventTypeRef, calendarEventListId, calendarEventIds[1])).notEquals(null)
						o(updates).deepEquals(entityUpdatesAsData(batch))
					})
				}

				o("post multiple with different update type and list ids should make multiple load calls", async function () {
					const batch = [
						createUpdate(ContactTypeRef, contactListId1, id1, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId1, id2, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId2, id3, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId2, id4, OperationType.CREATE),
						createUpdate(CustomerTypeRef, null as any, id5, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId1, id2, OperationType.UPDATE),
						createUpdate(CalendarEventTypeRef, calendarEventListId, calendarEventIds[0], OperationType.CREATE),
						createUpdate(CalendarEventTypeRef, calendarEventListId, calendarEventIds[1], OperationType.CREATE),
					]
					const load = spy(function (typeRef, id) {
						const { listId, elementId } = expandId(id)

						if (isSameTypeRef(typeRef, ContactTypeRef)) {
							o(elementId).equals(id2)
							return Promise.resolve(
								createTestEntity(ContactTypeRef, {
									_id: [neverNull(listId), elementId],
								}),
							)
						} else if (isSameTypeRef(typeRef, CustomerTypeRef)) {
							o(["id5", "id6", "id7"].includes(elementId)).equals(true)
							return Promise.resolve(
								createTestEntity(CustomerTypeRef, {
									_id: elementId,
								}),
							)
						}
						throw new Error("load: should not be reached" + typeRef)
					})
					const loadMultiple = spy(function (typeRef, listId, ids) {
						if (isSameTypeRef(typeRef, ContactTypeRef) || isSameTypeRef(typeRef, CalendarEventTypeRef)) {
							if (listId === contactListId1) {
								o(ids).deepEquals(["id1", "id2"])
								return Promise.resolve([
									createTestEntity(ContactTypeRef, {
										_id: [listId, id1],
									}),
									createTestEntity(ContactTypeRef, {
										_id: [listId, id2],
									}),
								])
							} else if (listId === calendarEventListId) {
								o(ids).deepEquals([calendarEventIds[0], calendarEventIds[1]])
								return Promise.resolve([
									createTestEntity(CalendarEventTypeRef, {
										_id: [calendarEventListId, calendarEventIds[0]],
									}),
									createTestEntity(CalendarEventTypeRef, {
										_id: [calendarEventListId, calendarEventIds[1]],
									}),
								])
							} else if (listId === contactListId2) {
								o(ids).deepEquals(["id3", "id4"])
								return Promise.resolve([
									createTestEntity(ContactTypeRef, {
										_id: [listId, "id3"],
									}),
									createTestEntity(ContactTypeRef, {
										_id: [listId, "id4"],
									}),
								])
							}
						}
						throw new Error(`load multiple: should not be reached, typeref is ${typeRef}, listid is ${listId} `)
					})

					if (name === "offline") {
						await storage.setNewRangeForList(CalendarEventTypeRef, calendarEventListId, CUSTOM_MIN_ID, CUSTOM_MAX_ID)
					}

					const loadMock = mockAttribute(entityRestClient, entityRestClient.load, load)
					const loadMultipleMock = mockAttribute(entityRestClient, entityRestClient.loadMultiple, loadMultiple)
					const filteredUpdates = await cache.entityEventsReceived(makeBatch(batch))
					unmockAttribute(loadMock)
					unmockAttribute(loadMultipleMock)
					o(load.callCount).equals(1)("One load for the customer create")
					o(await storage.get(ContactTypeRef, contactListId1, id1)).notEquals(null)
					o(await storage.get(ContactTypeRef, contactListId1, id2)).notEquals(null)
					o(await storage.get(ContactTypeRef, contactListId2, id3)).notEquals(null)
					o(await storage.get(ContactTypeRef, contactListId2, id4)).notEquals(null)
					if (name === "offline") {
						o(loadMultiple.callCount).equals(3)("Three load multiple, one for each contact list and one for the calendar list")
						o(await storage.get(CalendarEventTypeRef, calendarEventListId, calendarEventIds[0])).notEquals(null)(
							"when using offline storage event 0 should be cached",
						)
						o(await storage.get(CalendarEventTypeRef, calendarEventListId, calendarEventIds[1])).notEquals(null)(
							"when using offline storage event 1 should be cached",
						)
					} else {
						o(loadMultiple.callCount).equals(2)("two load multiple, one for each contact list and none for the calendar list")
						o(await storage.get(CalendarEventTypeRef, calendarEventListId, calendarEventIds[0])).equals(null)(
							"when using offline storage event 0 should not be cached",
						)
						o(await storage.get(CalendarEventTypeRef, calendarEventListId, calendarEventIds[1])).equals(null)(
							"when using offline storage event 1 should not be cached",
						)
					}
					o(await storage.get(CustomerTypeRef, null, id5)).equals(null)
					o(filteredUpdates.length).equals(batch.length)
					for (const update of batch) {
						o(filteredUpdates.includes(update as EntityUpdateData)).equals(true)
					}
				})

				o("returns empty [] when loadMultiple throwing an error ", async function () {
					const batch = [
						createUpdate(ContactTypeRef, contactListId1, id1, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId1, id2, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId2, id3, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId2, id4, OperationType.CREATE),
					]
					const loadMultiple = spy(function (typeRef, listId, ids) {
						o(isSameTypeRef(typeRef, ContactTypeRef)).equals(true)

						if (listId === contactListId1) {
							o(ids).deepEquals(["id1", "id2"])
							return Promise.resolve([
								createTestEntity(ContactTypeRef, {
									_id: [listId, id1],
								}),
								createTestEntity(ContactTypeRef, {
									_id: [listId, id2],
								}),
							])
						} else if (listId === contactListId2) {
							o(ids).deepEquals(["id3", "id4"])
							return Promise.reject(new NotAuthorizedError("bam"))
						}
					})
					const loadMultipleMock = mockAttribute(entityRestClient, entityRestClient.loadMultiple, loadMultiple)
					const updates = await cache.entityEventsReceived(makeBatch(batch))
					unmockAttribute(loadMultipleMock)

					o(loadMultiple.callCount).equals(2)
					o(await storage.get(ContactTypeRef, contactListId1, id1)).notEquals(null)
					o(await storage.get(ContactTypeRef, contactListId1, id2)).notEquals(null)
					o(await storage.get(ContactTypeRef, contactListId2, id3)).equals(null)
					o(await storage.get(ContactTypeRef, contactListId2, id4)).equals(null)
					o(updates).deepEquals(entityUpdatesAsData(batch.slice(0, 2)))
				})
			})
			o.spec("post  multiple cache range", function () {
				o("update is not in cache range", async function () {
					const batch = [
						createUpdate(ContactTypeRef, contactListId1, id1, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId1, id2, OperationType.CREATE),
					]
					const updates = await cache.entityEventsReceived(makeBatch(batch))

					o(await storage.get(ContactTypeRef, contactListId1, id1)).equals(null)
					o(await storage.get(ContactTypeRef, contactListId1, id2)).equals(null)
					o(updates).deepEquals(entityUpdatesAsData(batch))
				})

				o("updates partially not loaded by loadMultiple", async function () {
					await storage.setNewRangeForList(ContactTypeRef, contactListId1, id1, id2)

					const batch = [
						createUpdate(ContactTypeRef, contactListId1, id1, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId1, id2, OperationType.CREATE),
					]
					const loadMultiple = spy(function (typeRef, listId, ids) {
						if (isSameTypeRef(typeRef, ContactTypeRef)) {
							if (listId === contactListId1) {
								o(ids).deepEquals(["id1", "id2"])
								return Promise.resolve([createTestEntity(ContactTypeRef, { _id: [listId, id1] })])
							}
						}
						throw new Error("should not be reached")
					})
					const loadMultipleMock = mockAttribute(entityRestClient, entityRestClient.loadMultiple, loadMultiple)
					const filteredUpdates = await cache.entityEventsReceived(makeBatch(batch))
					unmockAttribute(loadMultipleMock)

					o(loadMultiple.callCount).equals(1)
					o(await storage.get(ContactTypeRef, contactListId1, id1)).notEquals(null)
					o(await storage.get(ContactTypeRef, contactListId1, id2)).equals(null)
					o(filteredUpdates.length).equals(batch.length - 1)
					for (const update of batch.slice(0, 1)) {
						o(filteredUpdates.includes(update as EntityUpdateData)).equals(true)
					}
				})

				o("update are partially in cache range ", async function () {
					await storage.setNewRangeForList(ContactTypeRef, contactListId1, id1, id1)
					await storage.setNewRangeForList(ContactTypeRef, contactListId2, id4, id4)

					const batch = [
						createUpdate(ContactTypeRef, contactListId1, id1, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId1, id2, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId2, id3, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId2, id4, OperationType.CREATE),
					]
					const loadMultiple = spy(function (typeRef, listId, ids) {
						if (isSameTypeRef(typeRef, ContactTypeRef)) {
							if (listId === contactListId1) {
								o(ids).deepEquals(["id1"])
								return Promise.resolve([
									createTestEntity(ContactTypeRef, {
										_id: [listId, id1],
									}),
								])
							} else if (listId === contactListId2) {
								o(ids).deepEquals(["id4"])
								return Promise.resolve([
									createTestEntity(ContactTypeRef, {
										_id: [listId, "id4"],
									}),
								])
							}
						}
						throw new Error("should not be reached")
					})
					const loadMultipleMock = mockAttribute(entityRestClient, entityRestClient.loadMultiple, loadMultiple)
					const filteredUpdates = await cache.entityEventsReceived(makeBatch(batch))
					unmockAttribute(loadMultipleMock)
					o(loadMultiple.callCount).equals(2) // twice for contact creations (per list id)
					o(await storage.get(ContactTypeRef, contactListId1, id1)).notEquals(null)
					o(await storage.get(ContactTypeRef, contactListId1, id2)).equals(null)
					o(await storage.get(ContactTypeRef, contactListId2, id3)).equals(null)
					o(await storage.get(ContactTypeRef, contactListId2, id4)).notEquals(null)
					o(filteredUpdates.length).equals(batch.length)
					for (const update of batch) {
						o(filteredUpdates.includes(update as EntityUpdateData)).equals(true)
					}
				})
				o("update  partially results in NotAuthorizedError ", async function () {
					await storage.setNewRangeForList(ContactTypeRef, contactListId1, id1, id1)
					await storage.setNewRangeForList(ContactTypeRef, contactListId2, id4, id4)

					const batch = [
						createUpdate(ContactTypeRef, contactListId1, id1, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId1, id2, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId2, id3, OperationType.CREATE),
						createUpdate(ContactTypeRef, contactListId2, id4, OperationType.CREATE),
					]
					const loadMultiple = spy(function (typeRef, listId, ids) {
						if (isSameTypeRef(typeRef, ContactTypeRef)) {
							if (listId === contactListId1) {
								o(ids).deepEquals(["id1"])
								return Promise.resolve([
									createTestEntity(ContactTypeRef, {
										_id: [listId, id1],
									}),
								])
							} else if (listId === contactListId2) {
								o(ids).deepEquals(["id4"])
								return Promise.reject(new NotAuthorizedError("bam"))
							}
						}
						throw new Error("should not be reached")
					})
					const loadMultipleMock = mockAttribute(entityRestClient, entityRestClient.loadMultiple, loadMultiple)
					const filteredUpdates = await cache.entityEventsReceived(makeBatch(batch))
					o(loadMultiple.callCount).equals(2) // twice for contact creations (per list id)
					o(await storage.get(ContactTypeRef, contactListId1, id1)).notEquals(null)
					o(await storage.get(ContactTypeRef, contactListId1, id2)).equals(null)
					o(await storage.get(ContactTypeRef, contactListId2, id3)).equals(null)
					o(await storage.get(ContactTypeRef, contactListId2, id4)).equals(null)
					o(filteredUpdates.length).equals(batch.length - 1)
					for (const update of batch.slice(0, 3)) {
						o(filteredUpdates.includes(update as EntityUpdateData)).equals(true)
					}
					unmockAttribute(loadMultipleMock)
				})
			})
			o("element create notifications are not loaded from server", async function () {
				await cache.entityEventsReceived(makeBatch([createUpdate(MailBoxTypeRef, null as any, "id1", OperationType.CREATE)]))
			})

			o("element update notifications are not put into cache", async function () {
				await cache.entityEventsReceived(makeBatch([createUpdate(MailBoxTypeRef, null as any, "id1", OperationType.UPDATE)]))
			})

			// element notifications
			o("Update event for cached entity is received, it should be redownloaded", async function () {
				const archiveId = "archiveId"
				const mailDetailsId = "detailsId1"
				let mailDetailsBlob = createMailDetailsBlobInstance(archiveId, mailDetailsId, "hello")
				await storage.put(mailDetailsBlob)

				const load = spy(async () => createMailDetailsBlobInstance(archiveId, mailDetailsId, "goodbye"))
				const loadMock = mockAttribute(entityRestClient, entityRestClient.load, load)
				await cache.entityEventsReceived(makeBatch([createUpdate(MailDetailsBlobTypeRef, archiveId, createId(mailDetailsId), OperationType.UPDATE)]))
				o(load.callCount).equals(1) // entity is loaded from server
				o(isSameTypeRef(load.args[0], MailDetailsBlobTypeRef)).equals(true)
				o(load.args[1]).deepEquals([archiveId, createId(mailDetailsId)])
				const blob = await cache.load(MailDetailsBlobTypeRef, [archiveId, createId(mailDetailsId)])
				o(blob.details.body.text).equals("goodbye")
				o(load.callCount).equals(1) // entity is provided from cache

				unmockAttribute(loadMock)
			})

			// element notifications
			o("When update event for cached entity is received but it can't be downloaded it is removed from cache", async function () {
				const archiveId = "archiveId"
				const mailDetailsId = "detailsId1"
				let mailDetailsBlob = createMailDetailsBlobInstance(archiveId, mailDetailsId, "hello")
				await storage.put(mailDetailsBlob)

				const load = spy(async () => {
					throw new NotFoundError("test!")
				})
				const loadMock = mockAttribute(entityRestClient, entityRestClient.load, load)
				await cache.entityEventsReceived(makeBatch([createUpdate(MailDetailsBlobTypeRef, archiveId, createId(mailDetailsId), OperationType.UPDATE)]))
				o(load.callCount).equals(1) // entity is loaded from server
				o(await storage.get(mailDetailsBlob._type, archiveId, createId(mailDetailsId))).equals(null)("the blob is deleted from the cache")

				unmockAttribute(loadMock)
			})

			o("MailSetEntry should not be loaded when a move event is received", async function () {
				const instance = createTestEntity(MailSetEntryTypeRef, { _id: ["listId1", "id1"] })
				await storage.put(instance)

				const newListId = "listid2"
				const newInstance = clone(instance)
				newInstance._id = [newListId, getElementId(instance)]

				// The moved mail will not be loaded from the server
				await cache.entityEventsReceived(
					makeBatch([
						createUpdate(MailSetEntryTypeRef, getListId(instance), getElementId(instance), OperationType.DELETE),
						createUpdate(MailSetEntryTypeRef, newListId, getElementId(instance), OperationType.CREATE),
					]),
				)

				const load = spy(() => Promise.reject(new Error("error from test")))
				const loadMock = mockAttribute(entityRestClient, entityRestClient.load, load)
				const thrown = await assertThrows(Error, () => cache.load(MailSetEntryTypeRef, [getListId(instance), getElementId(instance)]))
				o(thrown.message).equals("error from test")
				o(load.callCount).equals(1)("load is called once")
				const result2 = await cache.load(MailSetEntryTypeRef, [newListId, getElementId(instance)])
				o(result2).deepEquals(newInstance)("Cached instance is a newInstance")
				unmockAttribute(loadMock)
			})

			o("element should be deleted from the cache when a delete event is received", async function () {
				const archiveId = "archiveId"
				const mailDetailsId = "detailsId1"
				let mailDetailsBlob = createMailDetailsBlobInstance(archiveId, mailDetailsId, "hello")
				await storage.put(mailDetailsBlob)

				const load = spy(function () {
					return Promise.reject(new NotFoundError("not found"))
				})
				const loadMock = mockAttribute(entityRestClient, entityRestClient.load, load)
				await cache.entityEventsReceived(makeBatch([createUpdate(MailDetailsBlobTypeRef, archiveId, createId(mailDetailsId), OperationType.DELETE)]))
				// entity is not loaded from server when it is deleted
				o(load.callCount).equals(0)
				await assertThrows(NotFoundError, () => cache.load(MailDetailsBlobTypeRef, [archiveId, createId(mailDetailsId)]))
				unmockAttribute(loadMock)

				// we tried to reload the mail body using the rest client, because it was removed from the cache
				o(load.callCount).equals(1)
			})
			o("id is in range but instance doesn't exist after moving lower range", async function () {
				const listId = "listId1"

				const mailSetEntries = [1, 2, 3].map((i) => createTestEntity(MailSetEntryTypeRef, { _id: [listId, "id" + i] }))
				const newListId = "listId2"

				const loadRange = spy(() => Promise.resolve(mailSetEntries))
				const loadRangeMock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)
				storage.lockRangesDbAccess = spy(storage.lockRangesDbAccess)
				storage.unlockRangesDbAccess = spy(storage.unlockRangesDbAccess)

				await cache.loadRange(MailSetEntryTypeRef, listId, GENERATED_MIN_ID, 3, false)

				// Verify that we lock/unlock the ranges database when loading the range
				o(storage.lockRangesDbAccess.invocations).deepEquals([[listId]])
				o(storage.unlockRangesDbAccess.invocations).deepEquals([[listId]])

				o(loadRange.callCount).equals(1)
				unmockAttribute(loadRangeMock)

				// Move mail event: we don't try to load the mail again, we just update our cached mail
				await cache.entityEventsReceived(
					makeBatch([
						createUpdate(MailSetEntryTypeRef, getListId(mailSetEntries[0]), getElementId(mailSetEntries[0]), OperationType.DELETE),
						createUpdate(MailSetEntryTypeRef, newListId, getElementId(mailSetEntries[0]), OperationType.CREATE),
					]),
				)

				// id1 was moved to another list, which means it is no longer cached, which means we should try to load it again (causing NotFoundError)
				const load = spy(() => Promise.reject(new Error("This is not the mailSetEntry you're looking for")))
				const loadMock = mockAttribute(entityRestClient, entityRestClient.load, load)
				const thrown = await assertThrows(Error, () => cache.load(MailSetEntryTypeRef, [listId, getElementId(mailSetEntries[0])]))
				o(thrown.message).equals("This is not the mailSetEntry you're looking for")
				o(load.callCount).equals(1)
				unmockAttribute(loadMock)
			})

			o("id is in range but instance doesn't exist after moving upper range", async function () {
				const listId = "listId1"
				const mailSetEntries = [1, 2, 3].map((i) => createTestEntity(MailSetEntryTypeRef, { _id: [listId, "id" + i] }))

				const loadRange = spy(async () => Promise.resolve(mailSetEntries))
				const loadRangeMock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)

				await cache.loadRange(MailSetEntryTypeRef, "listId1", GENERATED_MIN_ID, 3, false)
				o(loadRange.callCount).equals(1)

				unmockAttribute(loadRangeMock)

				// Move mail event: we don't try to load the mail again, we just update our cached mail
				await cache.entityEventsReceived(
					makeBatch([
						createUpdate(MailSetEntryTypeRef, "listId1", getElementId(mailSetEntries[2]), OperationType.DELETE),
						createUpdate(MailSetEntryTypeRef, "listId2", getElementId(mailSetEntries[2]), OperationType.CREATE),
					]),
				)

				// id3 was moved to another list, which means it is no longer cached, which means we should try to load it again when requested (causing NotFoundError)
				const load = spy(async function () {
					throw new Error("This is not the mailSetEntry you're looking for")
				})
				const loadMock = mockAttribute(entityRestClient, entityRestClient.load, load)
				const thrown = await assertThrows(Error, () => cache.load(MailSetEntryTypeRef, ["listId1", getElementId(mailSetEntries[2])]))
				o(thrown.message).equals("This is not the mailSetEntry you're looking for")
				// load was called when we tried to load the moved mailSetEntry when we tried to load the moved mail
				o(load.callCount).equals(1)
				unmockAttribute(loadMock)
			})

			o("delete Mail deletes MailDetailsBlob", async function () {
				const mailDetailsBlob = createTestEntity(MailDetailsBlobTypeRef, { _id: ["archiveId", "blobId"] })
				const mail = createMailInstance("listId1", "id1", "mail 1")
				mail.mailDetails = mailDetailsBlob._id

				await storage.put(mail)
				await storage.put(mailDetailsBlob)

				await cache.entityEventsReceived(makeBatch([createUpdate(MailTypeRef, mail._id[0], mail._id[1], OperationType.DELETE)]))

				o(await storage.get(MailTypeRef, mail._id[0], mail._id[1])).equals(null)
				o(await storage.get(MailDetailsBlobTypeRef, mailDetailsBlob._id[0], mailDetailsBlob._id[1])).equals(null)
			})

			// list element notifications
			o("when the list is not cached, mail create notifications are not put into cache", async function () {
				await cache.entityEventsReceived(makeBatch([createUpdate(MailTypeRef, "listId1", createId("id1"), OperationType.CREATE)]))
			})

			o("when the list is not cached but there is a custom cache handler, mail create notifications are put into cache", async function () {
				const customCacheHandler: CustomCacheHandler<Mail> = {
					shouldLoadOnCreateEvent: () => true,
				}
				when(customCacheHandlerMap.get(MailTypeRef)).thenReturn(customCacheHandler)
				const mail = createMailInstance("listId1", "id1", "i am a mail")
				const load = func<EntityRestClient["load"]>()
				when(load(MailTypeRef, mail._id)).thenResolve(mail)
				mockAttribute(entityRestClient, entityRestClient.load, load)

				await cache.entityEventsReceived(makeBatch([createUpdate(MailTypeRef, getListId(mail), getElementId(mail), OperationType.CREATE)]))

				o(await storage.get(MailTypeRef, getListId(mail), getElementId(mail))).deepEquals(mail)
			})

			o("list element update notifications are not put into cache", async function () {
				await cache.entityEventsReceived(makeBatch([createUpdate(MailTypeRef, "listId1", createId("id1"), OperationType.UPDATE)]))
			})

			o("list element is updated in cache", async function () {
				let initialMail = createMailInstance("listId1", createId("id1"), "hello")
				await storage.put(initialMail)

				let mailUpdate = createMailInstance("listId1", createId("id1"), "goodbye")
				const load = spy(function (typeRef, id) {
					o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
					o(id).deepEquals(["listId1", createId("id1")])
					return Promise.resolve(mailUpdate)
				})

				const loadMock = mockAttribute(entityRestClient, entityRestClient.load, load)
				await cache.entityEventsReceived(makeBatch([createUpdate(MailTypeRef, "listId1", createId("id1"), OperationType.UPDATE)]))
				o(load.callCount).equals(1) // entity is loaded from server

				const mail = await cache.load(MailTypeRef, ["listId1", createId("id1")])
				o(mail.subject).equals("goodbye")
				o(load.callCount).equals(1) // entity is provided from cache

				unmockAttribute(loadMock)
			})

			o("when deleted from a range, then the remaining range will still be retrieved from the cache", async function () {
				const originalMails = await setupMailList(true, true)
				// no load should be called
				await cache.entityEventsReceived(makeBatch([createUpdate(MailTypeRef, "listId1", createId("id2"), OperationType.DELETE)]))
				const mails = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MIN_ID, 4, false)
				// The entity is provided from the cache
				o(mails).deepEquals([originalMails[0], originalMails[2]])
			})
		}) // entityEventsReceived

		o("when reading from the cache, the entities will be cloned", async function () {
			const archiveId = "archiveId"
			const mailDetailsBlob = createMailDetailsBlobInstance(archiveId, "id1", "hello")
			await storage.put(mailDetailsBlob)

			const mailDetailsBlob1 = await cache.load(MailDetailsBlobTypeRef, [archiveId, createId("id1")])
			o(mailDetailsBlob1 == mailDetailsBlob).equals(false)
			const mailDetailsBlob2 = await cache.load(MailDetailsBlobTypeRef, [archiveId, createId("id1")])
			o(mailDetailsBlob1 == mailDetailsBlob2).equals(false)
		})

		o("when reading from the cache, the entities will be cloned pt.2", async function () {
			let mail = createMailInstance("listId1", "id1", "hello")
			await storage.put(mail)
			const mail1 = await cache.load(MailTypeRef, ["listId1", createId("id1")])
			o(mail1 == mail).equals(false)
			const mail2 = await cache.load(MailTypeRef, ["listId1", createId("id1")])
			o(mail1 == mail2).equals(false)
		})

		async function setupMailList(loadedUntilMinId: boolean, loadedUntilMaxId: boolean): Promise<Mail[]> {
			let mail1 = createMailInstance("listId1", "id1", "hello1")
			let mail2 = createMailInstance("listId1", "id2", "hello2")
			let mail3 = createMailInstance("listId1", "id3", "hello3")
			let startId = loadedUntilMaxId ? GENERATED_MAX_ID : createId("id4")
			let count = loadedUntilMinId ? 4 : 3
			const loadRange = spy(function (typeRef, listId, start, countParam, reverse) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(listId).equals("listId1")
				o(start).equals(startId)
				o(countParam).equals(count)
				o(reverse).equals(true)
				return Promise.resolve([mail3, mail2, mail1])
			})
			const mock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)
			// load the mails in reverse because this is the mail use case. return them in reverse to have the intuitive order
			const mails = await cache.loadRange(MailTypeRef, "listId1", startId, count, true)
			o(mails).deepEquals(clone([mail3, mail2, mail1]))
			o(loadRange.callCount).equals(1) // entities are loaded from server
			unmockAttribute(mock)
			return clone([mail1, mail2, mail3])
		}

		o("when reading from the cache, the entities will be cloned (range requests)", async function () {
			const originalMails = await setupMailList(true, true)

			// the range request will be provided from the cache
			const mails = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MIN_ID, 3, false)
			o(mails).deepEquals(originalMails)
			o(mails[0] == originalMails[0]).equals(false)
			o(mails[1] == originalMails[1]).equals(false)
			o(mails[2] == originalMails[2]).equals(false)
		})

		o("list elements are provided from cache - range min to max loaded", async function () {
			const originalMails = await setupMailList(true, true)

			let mails

			mails = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MIN_ID, 3, false)
			o(mails).deepEquals(originalMails)

			mails = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MIN_ID, 1, false)
			o(mails).deepEquals(originalMails.slice(0, 1))

			mails = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MIN_ID, 4, false)
			o(mails).deepEquals(originalMails)

			mails = await cache.loadRange(MailTypeRef, "listId1", createId("id1"), 2, false)
			o(mails).deepEquals(originalMails.slice(1, 3))

			mails = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MAX_ID, 3, true)
			o(mails).deepEquals([originalMails[2], originalMails[1], originalMails[0]])

			mails = await cache.loadRange(MailTypeRef, "listId1", createId("id2"), 1, true)
			o(mails).deepEquals(originalMails.slice(0, 1))

			mails = await cache.loadRange(MailTypeRef, "listId1", createId("id2"), 3, true)
			o(mails).deepEquals(originalMails.slice(0, 1))
		})

		o("list elements are provided from cache - range min to id3 loaded", async function () {
			const originalMails = await setupMailList(true, false)
			let mails
			mails = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MIN_ID, 3, false)
			o(mails).deepEquals(originalMails)
			mails = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MIN_ID, 1, false)
			o(mails).deepEquals(originalMails.slice(0, 1))
			mails = await cache.loadRange(MailTypeRef, "listId1", createId("id1"), 2, false)
			o(mails).deepEquals(originalMails.slice(1, 3))
			mails = await cache.loadRange(MailTypeRef, "listId1", createId("id2"), 1, true)
			o(mails).deepEquals(originalMails.slice(0, 1))
			mails = await cache.loadRange(MailTypeRef, "listId1", createId("id2"), 3, true)
			o(mails).deepEquals(originalMails.slice(0, 1))
			mails = await cache.loadRange(MailTypeRef, "listId1", createId("id0"), 3, true)
			o(mails).deepEquals([])
		})

		o("list elements are provided from cache - range max to id1 loaded", async function () {
			const originalMails = await setupMailList(false, true)
			let mails
			mails = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MAX_ID, 3, true)
			o(mails).deepEquals([originalMails[2], originalMails[1], originalMails[0]])
			mails = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MAX_ID, 2, true)
			o(mails).deepEquals([originalMails[2], originalMails[1]])
			mails = await cache.loadRange(MailTypeRef, "listId1", createId("id5"), 1, false)
			o(mails).deepEquals([])

			mails = await cache.loadRange(MailTypeRef, "listId1", createId("id2"), 1, true)
			o(mails).deepEquals(originalMails.slice(0, 1))
			mails = await cache.loadRange(MailTypeRef, "listId1", createId("id1"), 2, false)
			o(mails).deepEquals(originalMails.slice(1, 3))
		})

		o("load list elements partly from server - range min to id3 loaded", async function () {
			let mail4 = createMailInstance("listId1", "id4", "subject4")
			const cachedMails = await setupMailList(true, false)
			const loadRange = spy(function (typeRef, listId, start, count, reverse) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(listId).equals("listId1")
				o(start).equals(getElementId(cachedMails[2]))
				o(count).equals(1)
				o(reverse).equals(false)
				return Promise.resolve([mail4])
			})

			const loadRangeMock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)

			const result = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MIN_ID, 4, false)

			o(result).deepEquals([cachedMails[0], cachedMails[1], cachedMails[2], clone(mail4)])
			o((await storage.get(MailTypeRef, getListId(mail4), getElementId(mail4)))!).deepEquals(mail4)
			o(loadRange.callCount).equals(1) // entities are provided from server

			unmockAttribute(loadRangeMock)
		})

		o("load list elements partly from server - range min to id3 loaded - range request id2 count 2", async function () {
			let mail4 = createMailInstance("listId1", "id4", "subject4")
			const cachedMails = await setupMailList(true, false)
			const loadRange = spy(function (typeRef, listId, start, count, reverse) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(listId).equals("listId1")
				o(start).equals(getElementId(cachedMails[2]))
				o(count).equals(1)
				o(reverse).equals(false)
				return Promise.resolve([mail4])
			})

			const loadRangeMock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)

			const result = await cache.loadRange(MailTypeRef, "listId1", createId("id2"), 2, false)

			o(result).deepEquals([cachedMails[2], clone(mail4)])
			o((await storage.get(MailTypeRef, getListId(mail4), getElementId(mail4)))!).deepEquals(mail4)
			o(loadRange.callCount).equals(1) // entities are provided from server

			unmockAttribute(loadRangeMock)
		})

		o("when part of a range is already in cache, load range should only try to load what it doesn't have already", async function () {
			let mail0 = createMailInstance("listId1", "id0", "subject0")
			const cachedMails = await setupMailList(false, true)
			const loadRange = spy(function (typeRef, listId, start, count, reverse) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(listId).equals("listId1")
				o(start).equals(getElementId(cachedMails[0]))
				o(count).equals(3)
				o(reverse).equals(true)
				return Promise.resolve([mail0])
			})

			const loadRangeMock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)
			const result = await cache.loadRange(MailTypeRef, "listId1", createId("id2"), 4, true)

			o((await storage.get(MailTypeRef, getListId(mail0), getElementId(mail0)))!).deepEquals(mail0)
			o(result).deepEquals([cachedMails[0], clone(mail0)])
			o(loadRange.callCount).equals(1) // entities are provided from server
			unmockAttribute(loadRangeMock)
		})

		o("load list elements partly from server - range max to id2 loaded - loadMore", async function () {
			let mail0 = createMailInstance("listId1", "id0", "subject0")
			const cachedMails = await setupMailList(false, true)
			const loadRange = spy(function (typeRef, listId, start, count, reverse) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(listId).equals("listId1")
				o(start).equals(cachedMails[0]._id[1])
				o(count).equals(4)
				o(reverse).equals(true)
				return Promise.resolve([mail0])
			})

			const mock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)
			const result = await cache.loadRange(MailTypeRef, "listId1", createId("id1"), 4, true)

			o((await storage.get(MailTypeRef, getListId(mail0), getElementId(mail0)))!).deepEquals(mail0)
			o(result).deepEquals([clone(mail0)])
			o(loadRange.callCount).equals(1) // entities are provided from server
			unmockAttribute(mock)
		})

		o("load range starting outside of stored range - not reverse", async function () {
			const listId = "listId1"
			const mail5 = createMailInstance(listId, "id5", "subject5")
			const mail6 = createMailInstance(listId, "id6", "subject6")

			const cachedMails = await setupMailList(true, false)
			const loadRange = spy(function (typeRef, listId, start, count, reverse) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(listId).equals(listId)
				o(start).equals(createId("id4"))
				o(count).equals(EXTEND_RANGE_MIN_CHUNK_SIZE)
				// the cache actually loads from the end of the range which is id4
				//TODO  shouldn't it be id3?
				o(reverse).equals(false)
				return Promise.resolve([mail5, mail6])
			})

			const loadRangeMock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)
			const result = await cache.loadRange(MailTypeRef, listId, createId("id5"), 4, false)

			o(loadRange.callCount).equals(1) // entities are provided from server
			o(result).deepEquals([clone(mail6)])

			// further range reads are fully taken from range
			const result2 = await cache.loadRange(MailTypeRef, listId, createId("id1"), 4, false)

			o(loadRange.callCount).equals(1) // entities are provided from cache
			o(result2).deepEquals([cachedMails[1], cachedMails[2], clone(mail5), clone(mail6)])
			unmockAttribute(loadRangeMock)
		})

		o("load range starting outside of stored range - reverse", async function () {
			let mailFirst = createMailInstance("listId1", "ic5", "subject") // use ids smaller than "id1"
			let mailSecond = createMailInstance("listId1", "ic8", "subject")
			await setupMailList(false, false)
			const loadRange = spy(function (typeRef, listId, start, count, reverse) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(listId).equals("listId1")
				// the cache actually loads from the end of the range which is id1
				o(start).equals(createId("id1"))
				o(count).equals(EXTEND_RANGE_MIN_CHUNK_SIZE)
				o(reverse).equals(true)
				return Promise.resolve([mailSecond, mailFirst])
			})
			const mock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)
			const result = await cache.loadRange(MailTypeRef, "listId1", createId("ic6"), 4, true)

			o(result).deepEquals([clone(mailFirst)])
			o((await storage.get(MailTypeRef, getListId(mailFirst), getElementId(mailFirst)))!).deepEquals(mailFirst)
			o(loadRange.callCount).equals(1) // entities are provided from server
			unmockAttribute(mock)
		})

		o("reverse load range starting outside of stored range - no new elements", async function () {
			await setupMailList(false, false)
			const loadRange = spy(function (typeRef, listId, start, count, reverse) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(listId).equals("listId1")
				// the cache actually loads from the end of the range which is id1
				o(start).equals(createId("id1"))
				o(count).equals(EXTEND_RANGE_MIN_CHUNK_SIZE)
				o(reverse).equals(true)
				return Promise.resolve([])
			})
			const mock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)
			const result = await cache.loadRange(MailTypeRef, "listId1", createId("ic6"), 4, true)
			o(result).deepEquals([])
			o(loadRange.callCount).equals(1) // entities are provided from server
			unmockAttribute(mock)
		})

		o("no elements in range", async function () {
			const loadRange = spy(function (typeRef, listId, start, count, reverse) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(listId).equals("listId1")
				o(start).equals(GENERATED_MAX_ID)
				o(count).equals(100)
				o(reverse).equals(true)
				return Promise.resolve([])
			})

			const mock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)

			const result = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MAX_ID, 100, true)

			o(result).deepEquals([])

			const result2 = await cache.loadRange(MailTypeRef, "listId1", GENERATED_MAX_ID, 100, true)

			o(result2).deepEquals([])
			o(loadRange.callCount).equals(1) // entities are only initially tried to be loaded from server
			unmockAttribute(mock)
		})

		o("custom id range is not stored", async function () {
			let ref = clone(createTestEntity(ExternalUserReferenceTypeRef))
			ref._id = ["listId1", stringToCustomId("custom")]
			const loadRange = spy(function (typeRef, listId, start, count, reverse) {
				o(isSameTypeRef(typeRef, ExternalUserReferenceTypeRef)).equals(true)
				o(listId).equals("listId1")
				o(start).equals(CUSTOM_MIN_ID)
				o(count).equals(1)
				o(reverse).equals(false)
				return Promise.resolve([ref])
			})

			const mock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)
			const result1 = await cache.loadRange(ExternalUserReferenceTypeRef, "listId1", CUSTOM_MIN_ID, 1, false)

			o(result1).deepEquals([ref])
			const result2 = await cache.loadRange(ExternalUserReferenceTypeRef, "listId1", CUSTOM_MIN_ID, 1, false)

			o(result2).deepEquals([ref])
			o(loadRange.callCount).equals(2) // entities are always provided from server
			unmockAttribute(mock)
		})

		o("when custom id type is cacheable, the range is cached", async function () {
			let ref = clone(createTestEntity(GroupKeyTypeRef))
			ref._id = ["listId1", stringToCustomId("1")]
			const loadRange = spy(function (typeRef, listId, start, count, reverse) {
				o(isSameTypeRef(typeRef, GroupKeyTypeRef)).equals(true)
				o(listId).equals("listId1")
				o(start).equals(CUSTOM_MIN_ID)
				o(count).equals(1)
				o(reverse).equals(false)
				return Promise.resolve([ref])
			})

			const mock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)
			const result1 = await cache.loadRange(GroupKeyTypeRef, "listId1", CUSTOM_MIN_ID, 1, false)
			o(loadRange.callCount).equals(1) // second call deliviers custom id items from cache.

			o(result1).deepEquals([ref])
			const result2 = await cache.loadRange(GroupKeyTypeRef, "listId1", CUSTOM_MIN_ID, 1, false)

			o(result2).deepEquals([ref])
			o(loadRange.callCount).equals(1) // second call delivers custom id it	ems from cache.
			unmockAttribute(mock)
		})

		o("Load towards the range with start being before the existing range. Range will be extended. Reverse. ", async function () {
			const ids = [createId("1"), createId("2"), createId("3"), createId("4"), createId("5")]
			const listId1 = "listId1"
			const mail1 = createMailInstance(listId1, ids[0], "hello1")
			const mail2 = createMailInstance(listId1, ids[1], "hello2")
			const mail3 = createMailInstance(listId1, ids[2], "hello3")

			await storage.setNewRangeForList(MailTypeRef, listId1, ids[0], ids[2])
			for (const mail of [mail1, mail2, mail3]) {
				await storage.put(mail)
			}
			const moreMails = new Map()
			moreMails.set(ids[3], createMailInstance(listId1, ids[3], "hello4"))
			moreMails.set(ids[4], createMailInstance(listId1, ids[4], "hello5"))

			const loadRange = spy(function (...an) {
				return Promise.resolve([moreMails.get(ids[3]), moreMails.get(ids[4])])
			})

			const mock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)

			const originalUpper = (await storage.getRangeForList(MailTypeRef, listId1))?.upper

			const result1 = await cache.loadRange(MailTypeRef, listId1, GENERATED_MAX_ID, 5, true)

			o(loadRange.callCount).equals(1)("entities are provided from server")
			o(loadRange.args[2]).equals(originalUpper)("starts extending range beginning with upperId")
			o(await storage.isElementIdInCacheRange(MailTypeRef, listId1, GENERATED_MAX_ID)).equals(true)("MAX ID is in cache range")
			const expectedResult = [moreMails.get(ids[4]), moreMails.get(ids[3]), mail3, mail2, mail1]
			o(result1).deepEquals(expectedResult)("Returns all elements in reverse order")

			// further requests are resolved from the cache
			const result2 = await cache.loadRange(MailTypeRef, listId1, GENERATED_MAX_ID, 5, true)

			o(result2).deepEquals(expectedResult)
			o(loadRange.callCount).equals(1) // entities are provided from cache
			unmockAttribute(mock)
		})

		o("Load towards the range with start being before the existing range. Range will be extended. Not Reverse.", async function () {
			const ids = [createId("1"), createId("2"), createId("3"), createId("4"), createId("5")]
			const listId1 = "listId1"

			const mail1 = createMailInstance(listId1, ids[0], "hello1")
			const mail2 = createMailInstance(listId1, ids[1], "hello2")
			const mail3 = createMailInstance(listId1, ids[2], "hello3")
			const mail4 = createMailInstance(listId1, ids[3], "hello4")
			const mail5 = createMailInstance(listId1, ids[4], "hello5")

			await storage.setNewRangeForList(MailTypeRef, listId1, ids[2], ids[4])

			for (const mail of [mail3, mail4, mail5]) {
				await storage.put(mail)
			}

			const loadRange = spy(function (...any) {
				return Promise.resolve([mail2, mail1])
			})

			const mock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)

			const originalLower = (await storage.getRangeForList(MailTypeRef, listId1))?.lower

			const result1 = await cache.loadRange(MailTypeRef, listId1, GENERATED_MIN_ID, 5, false)

			o(loadRange.callCount).equals(1)("entities are provided from server")
			o(loadRange.args[2]).equals(originalLower)("starts extending range beginning with lowerId")
			o(await storage.isElementIdInCacheRange(MailTypeRef, listId1, GENERATED_MIN_ID)).equals(true)("MIN ID is in cache range")
			const expectedResult = [mail1, mail2, mail3, mail4, mail5]
			o(result1).deepEquals(expectedResult)("Returns all elements in reverse order")

			// further requests are resolved from the cache
			const result2 = await cache.loadRange(MailTypeRef, listId1, GENERATED_MIN_ID, 5, false)

			o(result2).deepEquals(expectedResult)
			o(loadRange.callCount).equals(1)("server is called only once at the end") // entities are provided from cache
			unmockAttribute(mock)
		})

		o(
			"When there is a non-reverse range request that loads away from the existing range, the range will grow to include startId + the rest from the server",
			async function () {
				const clientMock = object<EntityRestClient>()
				const cache = new DefaultEntityRestCache(clientMock, storage)

				const listId = "listId"

				const id1 = createId("1")
				const id2 = createId("2")
				const id3 = createId("3")
				const id4 = createId("4")
				const id5 = createId("5")
				const id6 = createId("6")

				const mail1 = createMailInstance(listId, id1, "hello1")
				const mail2 = createMailInstance(listId, id2, "hello2")
				const mail3 = createMailInstance(listId, id3, "hello3")
				const mail4 = createMailInstance(listId, id4, "hello4")
				const mail5 = createMailInstance(listId, id5, "hello5")
				const mail6 = createMailInstance(listId, id6, "hello6")

				await storage.setNewRangeForList(MailTypeRef, listId, id1, id2)
				await storage.put(mail1)
				await storage.put(mail2)

				when(clientMock.loadRange(anything(), listId, id2, EXTEND_RANGE_MIN_CHUNK_SIZE, false, {})).thenResolve([mail3, mail4, mail5, mail6])

				const result = await cache.loadRange(MailTypeRef, listId, id3, 2, false)

				o(result).deepEquals([mail4, mail5])

				o((await storage.getRangeForList(MailTypeRef, listId))!).deepEquals({
					lower: id1,
					upper: GENERATED_MAX_ID,
				})

				o(await storage.getIdsInRange(MailTypeRef, listId)).deepEquals([id1, id2, id3, id4, id5, id6])
			},
		)

		o(
			"When there is a non-reverse range request that loads in the direction of the existing range, the range will grow to include the startId",
			async function () {
				const clientMock = object<EntityRestClient>()
				const cache = new DefaultEntityRestCache(clientMock, storage)

				const listId = "listId1"

				const mails = arrayOf(100, (idx) => createMailInstance(listId, createId(`${idx}`), `hola ${idx}`))

				await storage.setNewRangeForList(MailTypeRef, listId, getElementId(mails[98]), getElementId(mails[99]))
				await storage.put(mails[98])
				await storage.put(mails[99])

				when(clientMock.loadRange(anything(), listId, getElementId(mails[98]), EXTEND_RANGE_MIN_CHUNK_SIZE, true, {})).thenResolve(
					mails.slice(58, 98).reverse(),
				)

				when(clientMock.loadRange(anything(), listId, getElementId(mails[58]), EXTEND_RANGE_MIN_CHUNK_SIZE, true, {})).thenResolve(
					mails.slice(18, 58).reverse(),
				)

				when(clientMock.loadRange(anything(), listId, getElementId(mails[18]), EXTEND_RANGE_MIN_CHUNK_SIZE, true, {})).thenResolve(
					mails.slice(0, 18).reverse(),
				)

				const result = await cache.loadRange(MailTypeRef, listId, GENERATED_MIN_ID, 2, false)

				o(result).deepEquals([mails[0], mails[1]])

				o((await storage.getRangeForList(MailTypeRef, listId))!).deepEquals({
					lower: GENERATED_MIN_ID,
					upper: getElementId(mails[99]),
				})
				o(await storage.getIdsInRange(MailTypeRef, listId)).deepEquals(mails.map(getElementId))
			},
		)

		o(
			"When there is a reverse range request that loads in the direction of the existing range, the range will grow to include the startId",
			async function () {
				const clientMock = object<EntityRestClient>()
				const cache = new DefaultEntityRestCache(clientMock, storage)

				const listId = "listId1"
				const mails = arrayOf(100, (idx) => createMailInstance(listId, createId(`${idx}`), `hola ${idx}`))

				await storage.setNewRangeForList(MailTypeRef, listId, getElementId(mails[0]), getElementId(mails[1]))
				await storage.put(mails[0])
				await storage.put(mails[1])

				when(clientMock.loadRange(anything(), listId, getElementId(mails[1]), EXTEND_RANGE_MIN_CHUNK_SIZE, false, {})).thenResolve(mails.slice(2, 42))

				when(clientMock.loadRange(anything(), listId, getElementId(mails[41]), EXTEND_RANGE_MIN_CHUNK_SIZE, false, {})).thenResolve(mails.slice(42, 82))

				when(clientMock.loadRange(anything(), listId, getElementId(mails[81]), EXTEND_RANGE_MIN_CHUNK_SIZE, false, {})).thenResolve(mails.slice(82))

				const result = await cache.loadRange(MailTypeRef, listId, GENERATED_MAX_ID, 2, true)

				o(result).deepEquals([mails[mails.length - 1], mails[mails.length - 2]])

				o((await storage.getRangeForList(MailTypeRef, listId))!).deepEquals({
					lower: getElementId(mails[0]),
					upper: GENERATED_MAX_ID,
				})
				o(await storage.getIdsInRange(MailTypeRef, listId)).deepEquals(mails.map(getElementId))
			},
		)

		o(
			"The range request starts on one end of the existing range, and would finish on the other end, so it loads from either direction of the range",
			async function () {
				const clientMock = object<EntityRestClient>()
				const cache = new DefaultEntityRestCache(clientMock, storage)

				const id1 = createId("1")
				const id2 = createId("2")
				const id3 = createId("3")
				const id4 = createId("4")
				const id5 = createId("5")
				const id6 = createId("6")

				const listId = "listId"

				const mail1 = createMailInstance(listId, id1, "ok")
				const mail2 = createMailInstance(listId, id2, "ok")
				const mail3 = createMailInstance(listId, id3, "ok")
				const mail4 = createMailInstance(listId, id4, "ok")
				const mail5 = createMailInstance(listId, id5, "ok")

				await storage.setNewRangeForList(MailTypeRef, listId, id2, id3)
				await storage.put(mail2)
				await storage.put(mail3)

				// First it will try to load in the direction of start id from the existing range
				when(clientMock.loadRange(anything(), listId, id2, EXTEND_RANGE_MIN_CHUNK_SIZE, true, {})).thenResolve([mail1])

				// It will then fall into the "load from within the range" case
				// It will try to load starting from the end of the range
				when(clientMock.loadRange(anything(), listId, id3, 7, false, {})).thenResolve([mail4, mail5])

				const result = await cache.loadRange(MailTypeRef, listId, GENERATED_MIN_ID, 10, false)

				o((await storage.getRangeForList(MailTypeRef, listId))!).deepEquals({
					lower: GENERATED_MIN_ID,
					upper: GENERATED_MAX_ID,
				})

				o(await storage.getIdsInRange(MailTypeRef, listId)).deepEquals([id1, id2, id3, id4, id5])

				o(result).deepEquals([mail1, mail2, mail3, mail4, mail5])
			},
		)

		o("loadMultiple should load necessary elements from the server, and get the rest from the cache", async function () {
			const listId = "listId"
			const inCache = [createMailInstance(listId, "1", "1"), createMailInstance(listId, "3", "3")]

			const notInCache = [createMailInstance(listId, "2", "2"), createMailInstance(listId, "5", "5")]
			await Promise.all(inCache.map(async (i) => await storage.put(i)))
			const ids = inCache.concat(notInCache).map(getElementId)

			const loadMultiple = spy((...any) => Promise.resolve(notInCache))
			const mock = mockAttribute(entityRestClient, entityRestClient.loadMultiple, loadMultiple)

			const result = await cache.loadMultiple(MailTypeRef, listId, ids)

			o(result).deepEquals(notInCache.concat(inCache))("all mails are in cache")
			o(loadMultiple.callCount).equals(1)("load multiple is called once")
			o(loadMultiple.args).deepEquals([MailTypeRef, listId, notInCache.map(getElementId), undefined, {}])(
				"load multiple is called for mails not in cache",
			)
			for (const item of inCache.concat(notInCache)) {
				o(await storage.get(MailTypeRef, listId, getElementId(item))).notEquals(null)("element is in cache " + getElementId(item))
			}
			unmockAttribute(mock)
		})

		o("loadRange from server and provide cached entities from the cache", async function () {
			const listId = "listId"

			const inCache = [createMailInstance(listId, "0", "0"), createMailInstance(listId, "1", "1"), createMailInstance(listId, "3", "3")]

			const serverMails = [...inCache, createMailInstance(listId, "4", "4"), createMailInstance(listId, "5", "5"), createMailInstance(listId, "6", "6")]

			await storage.setNewRangeForList(MailTypeRef, listId, GENERATED_MIN_ID, createId("3"))
			await Promise.all(inCache.map(async (i) => await storage.put(i)))

			const loadRange = spy(async (typeRef, listIdToLoad: string, startId: Id, count: number, reverse: boolean) => {
				if (listId !== listIdToLoad) throw new NotFoundError("unknown list id")
				return serverMails.filter((mail) => firstBiggerThanSecond(getElementId(mail), startId)).slice(0, count)
			})

			const mockLoadRange = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)

			const result = await cache.loadRange(MailTypeRef, listId, createId("1"), 3, false)

			// checking if our cache asked us for the right amount of mails, in this case ids 4, 5 and 6 starting at mail 1 (excl.)
			o(loadRange.invocations[0][3]).equals(2)
			o(loadRange.invocations[0][2]).equals(createId("3"))

			for (let i = 0; i++; i < result.length) {
				o(result[i]).deepEquals(serverMails[i])(`result ${i} does not match`)
			}

			for (const item of serverMails.slice(0, -1)) {
				const mail = await storage.get(MailTypeRef, listId, getElementId(item))
				o(mail).notEquals(null)
			}
			const lastId = getElementId(last(serverMails)!)
			o(await storage.get(MailTypeRef, listId, lastId)).equals(null)

			unmockAttribute(mockLoadRange)
		})

		o("load passes same parameters to entityRestClient", async function () {
			const contactId: IdTuple = [createId("0"), createId("1")]
			const contact = createTestEntity(ContactTypeRef, {
				_id: contactId,
				firstName: "greg",
			})
			const client = downcast<EntityRestClient>({
				load: spy(() => contact),
			})
			const cache = new DefaultEntityRestCache(client, storage)
			await cache.load(ContactTypeRef, contactId, {
				queryParams: {
					myParam: "param",
				},
				extraHeaders: {
					myHeader: "header",
				},
			})
			const [typeRef, id, opts] = client.load.args as Parameters<EntityRestClient["load"]>
			o(isSameTypeRef(typeRef, ContactTypeRef)).equals(true)
			o(id).deepEquals(contactId)
			o(opts).deepEquals({
				queryParams: {
					myParam: "param",
				},
				extraHeaders: {
					myHeader: "header",
				},
			})
		})
		o("single entity is cached after being loaded", async function () {
			const contactId: IdTuple = [createId("0"), createId("1")]
			const contactOnTheServer = createTestEntity(ContactTypeRef, {
				_id: contactId,
				firstName: "greg",
			})
			const client = downcast<EntityRestClient>({
				load: spy(async () => {
					return contactOnTheServer
				}),
			})
			const cache = new DefaultEntityRestCache(client, storage)
			const firstLoaded = await cache.load(ContactTypeRef, contactId)
			o(firstLoaded).deepEquals(contactOnTheServer)
			// @ts-ignore
			o(client.load.callCount).equals(1)("The entity rest client was called because the contact isn't in cache")
			const secondLoaded = await cache.load(ContactTypeRef, contactId)
			o(secondLoaded).deepEquals(contactOnTheServer)
			// @ts-ignore
			o(client.load.callCount).equals(1)("The rest client was not called again, because the contact was loaded from the cache")
		})

		o("A new range request for a nonexistent range should initialize that range", async function () {
			const loadRange = spy(function (typeRef, listId, ...an) {
				return [
					createTestEntity(ContactTypeRef, { _id: [listId, createId("1")] }),
					createTestEntity(ContactTypeRef, { _id: [listId, createId("2")] }),
					createTestEntity(ContactTypeRef, { _id: [listId, createId("3")] }),
					createTestEntity(ContactTypeRef, { _id: [listId, createId("4")] }),
					createTestEntity(ContactTypeRef, { _id: [listId, createId("5")] }),
					createTestEntity(ContactTypeRef, { _id: [listId, createId("6")] }),
				]
			})

			const mock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)

			const result = await cache.loadRange(ContactTypeRef, createId("0"), GENERATED_MIN_ID, 1000, false)

			o(result.length).equals(6)

			unmockAttribute(mock)
		})

		o("single entity is not cached if it is an ignored entity", async function () {
			const permissionId: IdTuple = [createId("0"), createId("1")]
			const permissionOnTheServer = createTestEntity(PermissionTypeRef, {
				_id: permissionId,
			})
			const client = downcast<EntityRestClient>({
				load: spy(async () => {
					return permissionOnTheServer
				}),
			})
			const cache = new DefaultEntityRestCache(client, storage)
			await cache.load(PermissionTypeRef, permissionId)
			await cache.load(PermissionTypeRef, permissionId)
			// @ts-ignore
			o(client.load.callCount).equals(2)("The permission was loaded both times from the server")
		})

		o.test("when loading single ET custom id entity it is cached", async function () {
			const id = stringToCustomId("1")
			const client: EntityRestClient = object()
			const entity = createTestEntity(MailAddressToGroupTypeRef, {
				_id: id,
			})
			when(client.load(MailAddressToGroupTypeRef, id, anything())).thenResolve(entity)
			const cache = new DefaultEntityRestCache(client, storage)

			const loadedEntity = await cache.load(MailAddressToGroupTypeRef, id)
			await cache.load(MailAddressToGroupTypeRef, id)

			o(loadedEntity).deepEquals(entity)
			verify(client.load(MailAddressToGroupTypeRef, id), { ignoreExtraArgs: true, times: 1 })
		})

		o.test("when loading single LET custom id entity it is cached", async function () {
			const id: IdTuple = [createId("0"), stringToCustomId("1")]
			const client: EntityRestClient = object()
			const entity = createTestEntity(RootInstanceTypeRef, {
				_id: id,
			})
			when(client.load(RootInstanceTypeRef, id, anything())).thenResolve(entity)
			const cache = new DefaultEntityRestCache(client, storage)

			const loadedEntity = await cache.load(RootInstanceTypeRef, id)
			await cache.load(RootInstanceTypeRef, id)

			o(loadedEntity).deepEquals(entity)
			verify(client.load(RootInstanceTypeRef, id), { ignoreExtraArgs: true, times: 1 })
		})

		o.test("when loading multiple ET custom id entities are cached", async function () {
			const ids = [stringToCustomId("1"), stringToCustomId("2")]
			const client: EntityRestClient = object()
			const firstEntity = createTestEntity(MailAddressToGroupTypeRef, {
				_id: ids[0],
			})
			const secondEntity = createTestEntity(MailAddressToGroupTypeRef, {
				_id: ids[1],
			})

			when(client.loadMultiple(MailAddressToGroupTypeRef, null, ids), { ignoreExtraArgs: true }).thenResolve([firstEntity, secondEntity])
			const cache = new DefaultEntityRestCache(client, storage)

			const loadedEntity = await cache.loadMultiple(MailAddressToGroupTypeRef, null, ids)
			await cache.loadMultiple(MailAddressToGroupTypeRef, null, ids)

			o(loadedEntity).deepEquals([firstEntity, secondEntity])
			verify(client.loadMultiple(MailAddressToGroupTypeRef, null, ids), { ignoreExtraArgs: true, times: 1 })
		})

		o.test("when loading multiple LET custom id entities are cached", async function () {
			const listId = createId("0")
			const ids: IdTuple[] = [
				[listId, stringToCustomId("1")],
				[listId, stringToCustomId("2")],
			]
			const client: EntityRestClient = object()
			const firstEntity = createTestEntity(RootInstanceTypeRef, {
				_id: ids[0],
			})
			const secondEntity = createTestEntity(RootInstanceTypeRef, {
				_id: ids[1],
			})

			when(client.loadMultiple(RootInstanceTypeRef, listId, [elementIdPart(ids[0]), elementIdPart(ids[1])], anything()), {
				ignoreExtraArgs: true,
			}).thenResolve([firstEntity, secondEntity])
			const cache = new DefaultEntityRestCache(client, storage)

			const loadedEntity = await cache.loadMultiple(RootInstanceTypeRef, listId, [elementIdPart(ids[0]), elementIdPart(ids[1])])
			await cache.loadMultiple(RootInstanceTypeRef, listId, [elementIdPart(ids[0]), elementIdPart(ids[1])])

			o(loadedEntity).deepEquals([firstEntity, secondEntity])
			verify(client.loadMultiple(RootInstanceTypeRef, listId, [elementIdPart(ids[0]), elementIdPart(ids[1])]), {
				ignoreExtraArgs: true,
				times: 1,
			})
		})

		o.spec("no user id", function () {
			o("get", async function () {
				userId = null
				entityRestClient.load = spy(async () => createTestEntity(ContactTypeRef, { _id: ["listId", "id"] })) as EntityRestClient["load"]
				await cache.load(ContactTypeRef, ["listId", "id"])
				o(entityRestClient.load.callCount).equals(1)
			})

			o("put", async function () {
				userId = null
				entityRestClient.setup = spy(async () => "id")
				await cache.setup("listId", createTestEntity(ContactTypeRef, { _id: ["listId", "id"] }))
				o(entityRestClient.setup.callCount).equals(1)
			})
		})

		o.spec("CacheMode.Bypass", () => {
			const listId = createId("0")

			o("load", async function () {
				const contactId: IdTuple = [listId, createId("1")]
				const contactOnTheServer = createTestEntity(ContactTypeRef, {
					_id: contactId,
					firstName: "greg",
				})

				const client: EntityRestClient = object()
				when(client.load(ContactTypeRef, contactId, anything())).thenResolve(contactOnTheServer)
				const cache = new DefaultEntityRestCache(client, storage)

				const cacheBypassed1 = await cache.load(ContactTypeRef, contactId, { cacheMode: CacheMode.WriteOnly })
				o(cacheBypassed1).deepEquals(contactOnTheServer)
				// Fresh cache; should be loaded remotely and cached
				verify(client.load(ContactTypeRef, contactId, anything()), { times: 1 })

				const cacheBypassed2 = await cache.load(ContactTypeRef, contactId, { cacheMode: CacheMode.WriteOnly })
				o(cacheBypassed2).deepEquals(contactOnTheServer)
				// Since we're bypassing it, it should still be loaded remotely (but still cached)
				verify(client.load(ContactTypeRef, contactId, anything()), { times: 2 })

				const cached = await cache.load(ContactTypeRef, contactId, { cacheMode: CacheMode.ReadAndWrite })
				o(cached).deepEquals(contactOnTheServer)
				// We aren't bypassing it with Cache, so it should just use the cache
				verify(client.load(ContactTypeRef, contactId, anything()), { times: 2 })

				const cacheBypassed3 = await cache.load(ContactTypeRef, contactId, { cacheMode: CacheMode.WriteOnly })
				o(cacheBypassed3).deepEquals(contactOnTheServer)
				// Bypassing again; should be loaded remotely
				verify(client.load(ContactTypeRef, contactId, anything()), { times: 3 })
			})

			o("loadMultiple", async function () {
				const contactAId: IdTuple = [listId, createId("1")]
				const contactAOnTheServer = createTestEntity(ContactTypeRef, {
					_id: contactAId,
					firstName: "greg",
				})

				const contactBId: IdTuple = [listId, createId("2")]
				const contactBOnTheServer = createTestEntity(ContactTypeRef, {
					_id: contactBId,
					firstName: "bob",
				})

				const client: EntityRestClient = object()
				when(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId)], anything(), anything())).thenResolve([contactAOnTheServer])
				when(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactBId)], anything(), anything())).thenResolve([contactBOnTheServer])
				when(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId), elementIdPart(contactBId)], anything(), anything())).thenResolve([
					contactAOnTheServer,
					contactBOnTheServer,
				])

				const cache = new DefaultEntityRestCache(client, storage)

				const cacheBypassed1 = await cache.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId)], undefined, {
					cacheMode: CacheMode.WriteOnly,
				})
				o(cacheBypassed1).deepEquals([contactAOnTheServer])
				// Fresh cache; should be loaded remotely and cached
				verify(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId)], undefined, anything()), { times: 1 })

				const cacheBypassed2 = await cache.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId)], undefined, {
					cacheMode: CacheMode.WriteOnly,
				})
				o(cacheBypassed2).deepEquals([contactAOnTheServer])
				// Still bypassing
				verify(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId)], undefined, anything()), { times: 2 })

				const cached = await cache.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId), elementIdPart(contactBId)], undefined, {
					cacheMode: CacheMode.ReadAndWrite,
				})
				o(true).equals(cached.some((a) => deepEqual(a, contactAOnTheServer)))
				o(true).equals(cached.some((b) => deepEqual(b, contactBOnTheServer)))
				// Not bypassing; should have both contacts now, but only asked for B from server
				verify(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId)], undefined, anything()), { times: 2 })
				verify(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactBId)], undefined, anything()), { times: 1 })

				const cacheBypassed3 = await cache.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId), elementIdPart(contactBId)], undefined, {
					cacheMode: CacheMode.WriteOnly,
				})
				o(cacheBypassed3).deepEquals([contactAOnTheServer, contactBOnTheServer])
				// Bypassed again
				verify(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId), elementIdPart(contactBId)], undefined, anything()), { times: 1 })
			})
		})

		o.spec("CacheMode.ReadOnly", () => {
			const listId = createId("0")

			o("load", async function () {
				const contactId: IdTuple = [listId, createId("1")]
				const contactOnTheServer = createTestEntity(ContactTypeRef, {
					_id: contactId,
					firstName: "greg",
				})

				const client: EntityRestClient = object()
				when(client.load(ContactTypeRef, contactId, anything())).thenResolve(contactOnTheServer)
				const cache = new DefaultEntityRestCache(client, storage)

				const cacheReadonly1 = await cache.load(ContactTypeRef, contactId, { cacheMode: CacheMode.ReadOnly })
				o(cacheReadonly1).deepEquals(contactOnTheServer)
				// Fresh cache; should be loaded remotely (but not cached)
				verify(client.load(ContactTypeRef, contactId, anything()), { times: 1 })

				const cacheReadonly2 = await cache.load(ContactTypeRef, contactId, { cacheMode: CacheMode.ReadOnly })
				o(cacheReadonly2).deepEquals(contactOnTheServer)
				// It wasn't cached before, so it should be loaded remotely again
				verify(client.load(ContactTypeRef, contactId, anything()), { times: 2 })

				const cached = await cache.load(ContactTypeRef, contactId, { cacheMode: CacheMode.ReadAndWrite })
				o(cached).deepEquals(contactOnTheServer)
				// Again, it wasn't cached before, so it should be loaded remotely again
				verify(client.load(ContactTypeRef, contactId, anything()), { times: 3 })

				const cacheReadonly3 = await cache.load(ContactTypeRef, contactId, { cacheMode: CacheMode.ReadOnly })
				o(cacheReadonly3).deepEquals(contactOnTheServer)
				// Since it was cached before, it won't be loaded remotely
				verify(client.load(ContactTypeRef, contactId, anything()), { times: 3 })
			})

			o("loadMultiple", async function () {
				const contactAId: IdTuple = [listId, createId("1")]
				const contactAOnTheServer = createTestEntity(ContactTypeRef, {
					_id: contactAId,
					firstName: "greg",
				})

				const contactBId: IdTuple = [listId, createId("2")]
				const contactBOnTheServer = createTestEntity(ContactTypeRef, {
					_id: contactBId,
					firstName: "bob",
				})

				const client: EntityRestClient = object()
				when(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId)], anything(), anything())).thenResolve([contactAOnTheServer])
				when(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactBId)], anything(), anything())).thenResolve([contactBOnTheServer])

				const cache = new DefaultEntityRestCache(client, storage)

				const cacheReadOnly1 = await cache.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId)], undefined, {
					cacheMode: CacheMode.ReadOnly,
				})
				o(cacheReadOnly1).deepEquals([contactAOnTheServer])
				// Fresh cache; should be loaded remotely and cached
				verify(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId)], undefined, anything()), { times: 1 })

				const cached = await cache.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId)], undefined, { cacheMode: CacheMode.ReadAndWrite })
				o(cached).deepEquals([contactAOnTheServer])
				// Wasn't written earlier; should be written now
				verify(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId)], undefined, anything()), { times: 2 })

				const cacheReadOnly2 = await cache.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId), elementIdPart(contactBId)], undefined, {
					cacheMode: CacheMode.ReadOnly,
				})
				o(true).equals(cacheReadOnly2.some((a) => deepEqual(a, contactAOnTheServer)))
				o(true).equals(cacheReadOnly2.some((b) => deepEqual(b, contactBOnTheServer)))
				// Should have only asked for B from server since we cached A earlier
				verify(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactAId)], undefined, anything()), { times: 2 })
				verify(client.loadMultiple(ContactTypeRef, listId, [elementIdPart(contactBId)], undefined, anything()), { times: 1 })
			})

			o("loadRange - full list", async function () {
				const contactAId: IdTuple = [listId, createId("1")]
				const contactAOnTheServer = createTestEntity(ContactTypeRef, {
					_id: contactAId,
					firstName: "greg",
				})

				const contactBId: IdTuple = [listId, createId("2")]
				const contactBOnTheServer = createTestEntity(ContactTypeRef, {
					_id: contactBId,
					firstName: "bob",
				})

				const client: EntityRestClient = object()
				when(client.loadRange(ContactTypeRef, listId, createId("0"), 2, false, anything())).thenResolve([contactAOnTheServer, contactBOnTheServer])

				const cache = new DefaultEntityRestCache(client, storage)
				const cacheReadonly1 = await cache.loadRange(ContactTypeRef, listId, createId("0"), 2, false, { cacheMode: CacheMode.ReadOnly })
				o(cacheReadonly1).deepEquals([contactAOnTheServer, contactBOnTheServer])
				// Fresh cache; should be loaded remotely and cached
				verify(client.loadRange(ContactTypeRef, listId, createId("0"), 2, false, anything()), { times: 1 })

				const cached = await cache.loadRange(ContactTypeRef, listId, createId("0"), 2, false, { cacheMode: CacheMode.ReadAndWrite })
				o(cached).deepEquals([contactAOnTheServer, contactBOnTheServer])
				// Wasn't saved before
				verify(client.loadRange(ContactTypeRef, listId, createId("0"), 2, false, anything()), { times: 2 })

				const cacheReadonly2 = await cache.loadRange(ContactTypeRef, listId, createId("0"), 2, false, { cacheMode: CacheMode.ReadOnly })
				o(cacheReadonly2).deepEquals([contactAOnTheServer, contactBOnTheServer])
				// Was saved before now
				verify(client.loadRange(ContactTypeRef, listId, createId("0"), 2, false, anything()), { times: 2 })
			})

			o("loadRange - partial list", async function () {
				const contactAId: IdTuple = [listId, createId("1")]
				const contactAOnTheServer = createTestEntity(ContactTypeRef, {
					_id: contactAId,
					firstName: "greg",
				})

				const contactBId: IdTuple = [listId, createId("2")]
				const contactBOnTheServer = createTestEntity(ContactTypeRef, {
					_id: contactBId,
					firstName: "bob",
				})

				const client: EntityRestClient = object()
				when(client.loadRange(ContactTypeRef, listId, createId("0"), anything(), false, anything())).thenResolve([
					contactAOnTheServer,
					contactBOnTheServer,
				])
				when(client.loadRange(ContactTypeRef, listId, createId("1"), anything(), false, anything())).thenResolve([contactBOnTheServer])

				const cache = new DefaultEntityRestCache(client, storage)
				const cacheReadonly1 = await cache.loadRange(ContactTypeRef, listId, createId("1"), 2, false, { cacheMode: CacheMode.ReadOnly })
				o(cacheReadonly1).deepEquals([contactBOnTheServer])
				// Fresh cache
				verify(client.loadRange(ContactTypeRef, listId, createId("1"), 2, false, anything()), { times: 1 })

				const cached = await cache.loadRange(ContactTypeRef, listId, createId("1"), 2, false, { cacheMode: CacheMode.ReadAndWrite })
				o(cached).deepEquals([contactBOnTheServer])
				// Was saved before now
				verify(client.loadRange(ContactTypeRef, listId, createId("1"), 2, false, anything()), { times: 2 })

				const cacheReadonly2 = await cache.loadRange(ContactTypeRef, listId, createId("0"), 2, false, { cacheMode: CacheMode.ReadOnly })
				o(cacheReadonly2).deepEquals([contactAOnTheServer, contactBOnTheServer])
				// Only the second one was saved
				verify(client.loadRange(ContactTypeRef, listId, createId("1"), 2, false, anything()), { times: 2 })
				verify(client.loadRange(ContactTypeRef, listId, createId("0"), 2, false, anything()), { times: 1 })
			})
		})
	})

	function makeBatch(updates: Array<EntityUpdate>): QueuedBatch {
		return {
			events: entityUpdatesAsData(updates),
			groupId: groupId,
			batchId: "batchId",
		}
	}
}
