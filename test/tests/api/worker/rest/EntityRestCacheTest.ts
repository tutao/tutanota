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
	listIdPart,
	stringToCustomId,
} from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { arrayOf, clone, downcast, isSameTypeRef, last, neverNull, TypeRef } from "@tutao/tutanota-utils"
import {
	BucketKeyTypeRef,
	CustomerTypeRef,
	EntityUpdate,
	EntityUpdateTypeRef,
	ExternalUserReferenceTypeRef,
	GroupMembershipTypeRef,
	GroupRootTypeRef,
	InstanceSessionKeyTypeRef,
	PermissionTypeRef,
	UserTypeRef,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { EntityRestClient, typeRefToPath } from "../../../../../src/common/api/worker/rest/EntityRestClient.js"
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
	MailTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { OfflineStorage, OfflineStorageCleaner } from "../../../../../src/common/api/worker/offline/OfflineStorage.js"
import { assertThrows, mockAttribute, spy, unmockAttribute, verify } from "@tutao/tutanota-test-utils"
import { NoZoneDateProvider } from "../../../../../src/common/api/common/utils/NoZoneDateProvider.js"
import { RestClient } from "../../../../../src/common/api/worker/rest/RestClient.js"
import { NotAuthorizedError, NotFoundError } from "../../../../../src/common/api/common/error/RestError.js"
import { EphemeralCacheStorage } from "../../../../../src/common/api/worker/rest/EphemeralCacheStorage.js"
import { GroupType, OperationType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { OfflineStorageMigrator } from "../../../../../src/common/api/worker/offline/OfflineStorageMigrator.js"
import { createEventElementId } from "../../../../../src/common/api/common/utils/CommonCalendarUtils.js"
import { InterWindowEventFacadeSendDispatcher } from "../../../../../src/common/native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { func, instance, matchers, object, replace, when } from "testdouble"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade.js"
import { createTestEntity } from "../../../TestUtils.js"

const { anything } = matchers

const offlineDatabaseTestKey = new Uint8Array([3957386659, 354339016, 3786337319, 3366334248])

async function getOfflineStorage(userId: Id): Promise<CacheStorage> {
	const { PerWindowSqlCipherFacade } = await import("../../../../../src/common/desktop/db/PerWindowSqlCipherFacade.js")
	const { OfflineDbRefCounter } = await import("../../../../../src/common/desktop/db/OfflineDbRefCounter.js")
	const { DesktopSqlCipher } = await import("../../../../../src/common/desktop/db/DesktopSqlCipher.js")

	const odbRefCounter = new OfflineDbRefCounter({
		async create(userid: string, key: Uint8Array, retry?: boolean): Promise<SqlCipherFacade> {
			// @ts-ignore Added by sqliteNativeBannerPlugin
			const nativePath = buildOptions.sqliteNativePath
			const db = new DesktopSqlCipher(nativePath, ":memory:", false)
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
	const offlineStorage = new OfflineStorage(sqlCipherFacade, interWindowEventSender, new NoZoneDateProvider(), migratorMock, offlineStorageCleanerMock)
	await offlineStorage.init({ userId, databaseKey: offlineDatabaseTestKey, timeRangeDays: 42, forceNewDatabase: false })
	return offlineStorage
}

async function getEphemeralStorage(): Promise<EphemeralCacheStorage> {
	return new EphemeralCacheStorage()
}

testEntityRestCache("ephemeral", getEphemeralStorage)
node(() => testEntityRestCache("offline", getOfflineStorage))()

export function testEntityRestCache(name: string, getStorage: (userId: Id) => Promise<CacheStorage>) {
	const groupId = "groupId"
	const batchId = "batchId"
	o.spec(`EntityRestCache ${name}`, function () {
		let storage: CacheStorage
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
			storage = await getStorage(userId)
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
					o(updates).deepEquals(batch)
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
						o(updates).deepEquals(batch)
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
						o(filteredUpdates.includes(update)).equals(true)
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
					o(updates).deepEquals(batch.slice(0, 2))
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
					o(updates).deepEquals(batch)
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
						o(filteredUpdates.includes(update)).equals(true)
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
						o(filteredUpdates.includes(update)).equals(true)
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
						o(filteredUpdates.includes(update)).equals(true)
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

			o("Mail should not be loaded when a move event is received", async function () {
				const instance = createMailInstance("listId1", "id1", "henlo")
				await storage.put(instance)

				const newListId = "listid2"
				const newInstance = clone(instance)
				newInstance._id = [newListId, getElementId(instance)]

				// The moved mail will not be loaded from the server
				await cache.entityEventsReceived(
					makeBatch([
						createUpdate(MailTypeRef, getListId(instance), getElementId(instance), OperationType.DELETE),
						createUpdate(MailTypeRef, newListId, getElementId(instance), OperationType.CREATE),
					]),
				)

				const load = spy(() => Promise.reject(new Error("error from test")))
				const loadMock = mockAttribute(entityRestClient, entityRestClient.load, load)
				const thrown = await assertThrows(Error, () => cache.load(MailTypeRef, [getListId(instance), getElementId(instance)]))
				o(thrown.message).equals("error from test")
				o(load.callCount).equals(1)("load is called once")
				const result2 = await cache.load(MailTypeRef, [newListId, getElementId(instance)])
				o(result2).deepEquals(newInstance)("Cached instance is a newInstance")
				unmockAttribute(loadMock)
			})
			o("Mail should not be loaded when a move event is received - update bucket key", async function () {
				const instance = createMailInstance("listId1", "id1", "henlo")
				instance.bucketKey = createTestEntity(BucketKeyTypeRef, {
					bucketEncSessionKeys: [
						createTestEntity(InstanceSessionKeyTypeRef, {
							instanceList: "listId1",
							instanceId: getElementId(instance),
						}),
					],
				})
				await storage.put(instance)

				const newListId = "listId2"

				// The moved mail will not be loaded from the server
				await cache.entityEventsReceived(
					makeBatch([
						createUpdate(MailTypeRef, getListId(instance), getElementId(instance), OperationType.DELETE),
						createUpdate(MailTypeRef, newListId, getElementId(instance), OperationType.CREATE),
					]),
				)

				const load = spy(() => Promise.reject(new Error("error from test")))
				const loadMock = mockAttribute(entityRestClient, entityRestClient.load, load)
				const thrown = await assertThrows(Error, () => cache.load(MailTypeRef, [getListId(instance), getElementId(instance)]))
				o(thrown.message).equals("error from test")
				o(load.callCount).equals(1)("load is called once")
				const result2 = await cache.load(MailTypeRef, [newListId, getElementId(instance)])
				o(result2.bucketKey?.bucketEncSessionKeys[0].instanceList).deepEquals(newListId)("Cached instance has updated InstanceSessionKey")
				unmockAttribute(loadMock)
			})

			o("id is in range but instance doesn't exist after moving lower range", async function () {
				const listId = "listId1"

				const mails = [1, 2, 3].map((i) => createMailInstance(listId, "id" + i, "mail" + i))
				const newListId = "listId2"

				const loadRange = spy(() => Promise.resolve(mails))
				const loadRangeMock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)
				storage.lockRangesDbAccess = spy(storage.lockRangesDbAccess)
				storage.unlockRangesDbAccess = spy(storage.unlockRangesDbAccess)

				await cache.loadRange(MailTypeRef, listId, GENERATED_MIN_ID, 3, false)

				// Verify that we lock/unlock the ranges database when loading the range
				o(storage.lockRangesDbAccess.invocations).deepEquals([[listId]])
				o(storage.unlockRangesDbAccess.invocations).deepEquals([[listId]])

				o(loadRange.callCount).equals(1)
				unmockAttribute(loadRangeMock)

				// Move mail event: we don't try to load the mail again, we just update our cached mail
				await cache.entityEventsReceived(
					makeBatch([
						createUpdate(MailTypeRef, getListId(mails[0]), getElementId(mails[0]), OperationType.DELETE),
						createUpdate(MailTypeRef, newListId, getElementId(mails[0]), OperationType.CREATE),
					]),
				)

				// id3 was moved to another list, which means it is no longer cached, which means we should try to load it again (causing NotFoundError)
				const load = spy(() => Promise.reject(new Error("This is not the mail you're looking for")))
				const loadMock = mockAttribute(entityRestClient, entityRestClient.load, load)
				const thrown = await assertThrows(Error, () => cache.load(MailTypeRef, [listId, getElementId(mails[0])]))
				o(thrown.message).equals("This is not the mail you're looking for")
				o(load.callCount).equals(1)
				unmockAttribute(loadMock)
			})

			o("id is in range but instance doesn't exist after moving upper range", async function () {
				const mails = [
					createMailInstance("listId1", "id1", "mail 1"),
					createMailInstance("listId1", "id2", "mail 2"),
					createMailInstance("listId1", "id3", "mail 3"),
				]

				const loadRange = spy(async () => Promise.resolve(mails))
				const loadRangeMock = mockAttribute(entityRestClient, entityRestClient.loadRange, loadRange)

				await cache.loadRange(MailTypeRef, "listId1", GENERATED_MIN_ID, 3, false)
				o(loadRange.callCount).equals(1)

				unmockAttribute(loadRangeMock)

				// Move mail event: we don't try to load the mail again, we just update our cached mail
				await cache.entityEventsReceived(
					makeBatch([
						createUpdate(MailTypeRef, "listId1", "id3", OperationType.DELETE),
						createUpdate(MailTypeRef, "listId2", "id3", OperationType.CREATE),
					]),
				)

				// id3 was moved to another list, which means it is no longer cached, which means we should try to load it again when requested (causing NotFoundError)
				const load = spy(async function () {
					throw new Error("This is not the mail you're looking for")
				})
				const loadMock = mockAttribute(entityRestClient, entityRestClient.load, load)
				const thrown = await assertThrows(Error, () => cache.load(MailTypeRef, ["listId1", "id3"]))
				o(thrown.message).equals("This is not the mail you're looking for")
				//load was called when we tried to load the moved mail when we tried to load the moved mail
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
			o("list element create notifications are not put into cache", async function () {
				await cache.entityEventsReceived(makeBatch([createUpdate(MailTypeRef, "listId1", createId("id1"), OperationType.CREATE)]))
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

			o.spec("membership changes", function () {
				o("no membership change does not delete an entity and lastUpdateBatchIdPerGroup", async function () {
					const userId = "userId"
					const calendarGroupId = "calendarGroupId"
					const initialUser = createTestEntity(UserTypeRef, {
						_id: userId,
						memberships: [
							createTestEntity(GroupMembershipTypeRef, {
								_id: "mailShipId",
								groupType: GroupType.Mail,
							}),
							createTestEntity(GroupMembershipTypeRef, {
								_id: "calendarShipId",
								group: calendarGroupId,
								groupType: GroupType.Calendar,
							}),
						],
					})

					entityRestClient.load = func<EntityRestClient["load"]>()
					when(entityRestClient.load(UserTypeRef, userId)).thenResolve(initialUser)

					await storage.put(initialUser)

					const eventId: IdTuple = ["eventListId", "eventId"]
					const event = createTestEntity(CalendarEventTypeRef, {
						_id: eventId,
						_ownerGroup: calendarGroupId,
					})

					await storage.put(event)
					await storage.putLastBatchIdForGroup(calendarGroupId, "1")
					storage.getUserId = () => userId

					await cache.entityEventsReceived(makeBatch([createUpdate(UserTypeRef, "", userId, OperationType.UPDATE)]))

					o(await storage.get(CalendarEventTypeRef, listIdPart(eventId), elementIdPart(eventId))).notEquals(null)("Event has been evicted from cache")
					o(await storage.getLastBatchIdForGroup(calendarGroupId)).notEquals(null)
				})

				o("membership change deletes an element entity and lastUpdateBatchIdPerGroup", async function () {
					const userId = "userId"
					const calendarGroupId = "calendarGroupId"
					const initialUser = createTestEntity(UserTypeRef, {
						_id: userId,
						memberships: [
							createTestEntity(GroupMembershipTypeRef, {
								_id: "mailShipId",
								groupType: GroupType.Mail,
							}),
							createTestEntity(GroupMembershipTypeRef, {
								_id: "calendarShipId",
								group: calendarGroupId,
								groupType: GroupType.Calendar,
							}),
						],
					})

					await storage.put(initialUser)

					const updatedUser = createTestEntity(UserTypeRef, {
						_id: userId,
						memberships: [
							createTestEntity(GroupMembershipTypeRef, {
								_id: "mailShipId",
								groupType: GroupType.Mail,
							}),
						],
					})

					entityRestClient.load = func<EntityRestClient["load"]>()
					when(entityRestClient.load(UserTypeRef, userId)).thenResolve(updatedUser)

					const groupRootId = "groupRootId"
					const groupRoot = createTestEntity(GroupRootTypeRef, {
						_id: groupRootId,
						_ownerGroup: calendarGroupId,
					})

					await storage.put(groupRoot)
					await storage.putLastBatchIdForGroup(calendarGroupId, "1")
					storage.getUserId = () => userId

					await cache.entityEventsReceived(makeBatch([createUpdate(UserTypeRef, "", userId, OperationType.UPDATE)]))

					o(await storage.get(CalendarEventTypeRef, null, groupRootId)).equals(null)("GroupRoot has been evicted from cache")
					o(await storage.getLastBatchIdForGroup(calendarGroupId)).equals(null)
				})

				o("membership change deletes a list entity and lastUpdateBatchIdPerGroup", async function () {
					const userId = "userId"
					const calendarGroupId = "calendarGroupId"
					const initialUser = createTestEntity(UserTypeRef, {
						_id: userId,
						memberships: [
							createTestEntity(GroupMembershipTypeRef, {
								_id: "mailShipId",
								groupType: GroupType.Mail,
							}),
							createTestEntity(GroupMembershipTypeRef, {
								_id: "calendarShipId",
								group: calendarGroupId,
								groupType: GroupType.Calendar,
							}),
						],
					})

					await storage.put(initialUser)

					const updatedUser = createTestEntity(UserTypeRef, {
						_id: userId,
						memberships: [
							createTestEntity(GroupMembershipTypeRef, {
								_id: "mailShipId",
								groupType: GroupType.Mail,
							}),
						],
					})

					entityRestClient.load = func<EntityRestClient["load"]>()
					when(entityRestClient.load(UserTypeRef, userId)).thenResolve(updatedUser)

					const eventId: IdTuple = ["eventListId", "eventId"]
					const event = createTestEntity(CalendarEventTypeRef, {
						_id: eventId,
						_ownerGroup: calendarGroupId,
					})

					await storage.put(event)
					await storage.putLastBatchIdForGroup?.(calendarGroupId, "1")
					storage.getUserId = () => userId

					await cache.entityEventsReceived(makeBatch([createUpdate(UserTypeRef, "", userId, OperationType.UPDATE)]))

					o(await storage.get(CalendarEventTypeRef, listIdPart(eventId), elementIdPart(eventId))).equals(null)("Event has been evicted from cache")
					const deletedRange = await storage.getRangeForList(CalendarEventTypeRef, listIdPart(eventId))
					o(deletedRange).equals(null)
					storage.getLastBatchIdForGroup && o(await storage.getLastBatchIdForGroup(calendarGroupId)).equals(null)
				})

				o("membership change but for another user does nothing", async function () {
					const userId = "userId"
					const calendarGroupId = "calendarGroupId"
					const initialUser = createTestEntity(UserTypeRef, {
						_id: userId,
						memberships: [
							createTestEntity(GroupMembershipTypeRef, {
								_id: "mailShipId",
								groupType: GroupType.Mail,
							}),
							createTestEntity(GroupMembershipTypeRef, {
								_id: "calendarShipId",
								group: calendarGroupId,
								groupType: GroupType.Calendar,
							}),
						],
					})

					await storage.put(initialUser)

					const updatedUser = createTestEntity(UserTypeRef, {
						_id: userId,
						memberships: [
							createTestEntity(GroupMembershipTypeRef, {
								_id: "mailShipId",
								groupType: GroupType.Mail,
							}),
						],
					})

					entityRestClient.load = func<EntityRestClient["load"]>()
					when(entityRestClient.load(UserTypeRef, userId)).thenResolve(updatedUser)

					const eventId: IdTuple = ["eventListId", "eventId"]
					const event = createTestEntity(CalendarEventTypeRef, {
						_id: eventId,
						_ownerGroup: calendarGroupId,
					})

					await storage.put(event)
					storage.getUserId = () => "anotherUserId"

					await cache.entityEventsReceived(makeBatch([createUpdate(UserTypeRef, "", userId, OperationType.UPDATE)]))

					o(await storage.get(CalendarEventTypeRef, listIdPart(eventId), elementIdPart(eventId))).notEquals(null)("Event has been evicted from cache")
				})
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

				when(clientMock.loadRange(anything(), listId, id2, EXTEND_RANGE_MIN_CHUNK_SIZE, false)).thenResolve([mail3, mail4, mail5, mail6])

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

				when(clientMock.loadRange(anything(), listId, getElementId(mails[98]), EXTEND_RANGE_MIN_CHUNK_SIZE, true)).thenResolve(
					mails.slice(58, 98).reverse(),
				)

				when(clientMock.loadRange(anything(), listId, getElementId(mails[58]), EXTEND_RANGE_MIN_CHUNK_SIZE, true)).thenResolve(
					mails.slice(18, 58).reverse(),
				)

				when(clientMock.loadRange(anything(), listId, getElementId(mails[18]), EXTEND_RANGE_MIN_CHUNK_SIZE, true)).thenResolve(
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

				when(clientMock.loadRange(anything(), listId, getElementId(mails[1]), EXTEND_RANGE_MIN_CHUNK_SIZE, false)).thenResolve(mails.slice(2, 42))

				when(clientMock.loadRange(anything(), listId, getElementId(mails[41]), EXTEND_RANGE_MIN_CHUNK_SIZE, false)).thenResolve(mails.slice(42, 82))

				when(clientMock.loadRange(anything(), listId, getElementId(mails[81]), EXTEND_RANGE_MIN_CHUNK_SIZE, false)).thenResolve(mails.slice(82))

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
				when(clientMock.loadRange(anything(), listId, id2, EXTEND_RANGE_MIN_CHUNK_SIZE, true)).thenResolve([mail1])

				// It will then fall into the "load from within the range" case
				// It will try to load starting from the end of the range
				when(clientMock.loadRange(anything(), listId, id3, 7, false)).thenResolve([mail4, mail5])

				const result = await cache.loadRange(MailTypeRef, listId, GENERATED_MIN_ID, 10, false)

				o((await storage.getRangeForList(MailTypeRef, listId))!).deepEquals({ lower: GENERATED_MIN_ID, upper: GENERATED_MAX_ID })

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
			o(loadMultiple.args).deepEquals([MailTypeRef, listId, notInCache.map(getElementId), undefined])("load multiple is called for mails not in cache")
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
	})

	function makeBatch(updates: Array<EntityUpdate>): QueuedBatch {
		return {
			events: updates,
			groupId: groupId,
			batchId: "batchId",
		}
	}
}
