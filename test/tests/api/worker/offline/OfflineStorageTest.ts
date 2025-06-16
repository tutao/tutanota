import o from "@tutao/otest"
import { verify } from "@tutao/tutanota-test-utils"
import { OfflineStorage, OfflineStorageCleaner, TableDefinitions } from "../../../../../src/common/api/worker/offline/OfflineStorage.js"
import { instance, matchers, object, when } from "testdouble"
import {
	constructMailSetEntryId,
	CUSTOM_MAX_ID,
	CUSTOM_MIN_ID,
	deconstructMailSetEntryId,
	elementIdPart,
	ensureBase64Ext,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	generatedIdToTimestamp,
	getElementId,
	listIdPart,
	timestampToGeneratedId,
} from "../../../../../src/common/api/common/utils/EntityUtils.js"
import {
	assertNotNull,
	downcast,
	getDayShifted,
	getFirstOrThrow,
	getTypeString,
	lastThrow,
	mapNullable,
	promiseMap,
	typedKeys,
	TypeRef,
} from "@tutao/tutanota-utils"
import { DateProvider } from "../../../../../src/common/api/common/DateProvider.js"
import {
	BodyTypeRef,
	ContactListTypeRef,
	createContactList,
	createMailFolderRef,
	FileTypeRef,
	Mail,
	MailAddressTypeRef,
	MailBagTypeRef,
	MailBoxTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailFolder,
	MailFolderTypeRef,
	MailSetEntry,
	MailSetEntryTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { OfflineStorageMigrator } from "../../../../../src/common/api/worker/offline/OfflineStorageMigrator.js"
import { InterWindowEventFacadeSendDispatcher } from "../../../../../src/common/native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { SqlType, untagSqlObject } from "../../../../../src/common/api/worker/offline/SqlValue.js"
import { MailSetKind } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { Type as TypeId } from "../../../../../src/common/api/common/EntityConstants.js"
import { GroupMembershipTypeRef, User, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { DesktopSqlCipher } from "../../../../../src/common/desktop/db/DesktopSqlCipher.js"
import { clientInitializedTypeModelResolver, createTestEntity, modelMapperFromTypeModelResolver, removeOriginals } from "../../../TestUtils.js"
import { sql } from "../../../../../src/common/api/worker/offline/Sql.js"
import { MailOfflineCleaner } from "../../../../../src/mail-app/workerUtils/offline/MailOfflineCleaner.js"
import { CustomCacheHandler, CustomCacheHandlerMap } from "../../../../../src/common/api/worker/rest/cacheHandler/CustomCacheHandler"
import { ModelMapper } from "../../../../../src/common/api/worker/crypto/ModelMapper"
import { Entity, ServerModelParsedInstance, SomeEntity } from "../../../../../src/common/api/common/EntityTypes"
import { TypeModelResolver } from "../../../../../src/common/api/common/EntityFunctions"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade"
import { expandId } from "../../../../../src/common/api/worker/rest/RestClientIdUtils"
import { BlobArchiveRefTypeRef, createBlobArchiveRef } from "../../../../../src/common/api/entities/storage/TypeRefs"

function incrementId(id: Id, ms: number) {
	const timestamp = generatedIdToTimestamp(id)
	return timestampToGeneratedId(timestamp + ms)
}

class IdGenerator {
	constructor(private currentId: Id) {}

	getNext(incrementByMs: number = 60000): Id {
		this.currentId = incrementId(this.currentId, incrementByMs)
		return this.currentId
	}
}

function incrementMailSetEntryId(mailSetEntryId, mailId, ms: number) {
	const { receiveDate } = deconstructMailSetEntryId(mailSetEntryId)
	return constructMailSetEntryId(new Date(receiveDate.getTime() + ms), mailId)
}

class MailSetEntryIdGenerator {
	constructor(private currentMailSetEntryId: Id) {}

	getNext(mailId: Id, incrementByMs: number = 60000) {
		this.currentMailSetEntryId = incrementMailSetEntryId(this.currentMailSetEntryId, mailId, incrementByMs)
		return this.currentMailSetEntryId
	}
}

const databasePath = ":memory:"
export const offlineDatabaseTestKey = Uint8Array.from([3957386659, 354339016, 3786337319, 3366334248])

o.spec("OfflineStorageDb", function () {
	const now = new Date("2022-01-01 00:00:00 UTC")
	const timeRangeDate = new Date("2021-12-22 00:00:00 UTC")
	const userId = "userId"
	const databaseKey = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])

	/** get an id based on a timestamp that is {@param days} days away from the time range cutoff */
	const offsetId = (days: number) => timestampToGeneratedId(getDayShifted(timeRangeDate, days).getTime())
	const offsetMailSetEntryId = (days: number, mailId: Id) => constructMailSetEntryId(getDayShifted(timeRangeDate, days), mailId)
	const cutoffMailSetEntryId = offsetMailSetEntryId(0, GENERATED_MAX_ID)

	let dbFacade: DesktopSqlCipher
	let dateProviderMock: DateProvider
	let storage: OfflineStorage
	let migratorMock: OfflineStorageMigrator
	let offlineStorageCleanerMock: OfflineStorageCleaner
	let interWindowEventSenderMock: InterWindowEventFacadeSendDispatcher
	let typeModelResolver: TypeModelResolver
	let modelMapper: ModelMapper
	let customCacheHandlerMap: CustomCacheHandlerMap

	o.beforeEach(async function () {
		// integrity checks do not work with in-memory databases
		dbFacade = new DesktopSqlCipher(databasePath, false)

		dateProviderMock = object<DateProvider>()
		migratorMock = instance(OfflineStorageMigrator)
		interWindowEventSenderMock = instance(InterWindowEventFacadeSendDispatcher)
		offlineStorageCleanerMock = new MailOfflineCleaner()
		typeModelResolver = clientInitializedTypeModelResolver()
		modelMapper = modelMapperFromTypeModelResolver(typeModelResolver)
		when(dateProviderMock.now()).thenReturn(now.getTime())
		customCacheHandlerMap = object()

		storage = new OfflineStorage(
			dbFacade,
			interWindowEventSenderMock,
			dateProviderMock,
			migratorMock,
			offlineStorageCleanerMock,
			modelMapper,
			typeModelResolver,
			customCacheHandlerMap,
			{},
		)
	})

	o.afterEach(async function () {
		await dbFacade.closeDb()
	})

	async function toStorableInstance(entity: Entity): Promise<ServerModelParsedInstance> {
		return downcast<ServerModelParsedInstance>(await modelMapper.mapToClientModelParsedInstance(entity._type, entity))
	}

	o.spec("additionalTables", () => {
		let sqlMock: SqlCipherFacade

		o.beforeEach(async () => {
			sqlMock = object()
			// to satisfy the external o.afterEach()
			// we won't actually use this storage instance for these tests, since we don't want to test with real facades
			await storage.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })
		})

		o.test("init calls createTables which initializes all tables", async () => {
			const storageWithMockedSql = new OfflineStorage(sqlMock, object(), object(), object(), object(), object(), object(), object(), {
				some_table: {
					definition: "some statement will be run here",
					purgedWithCache: false,
				},
				another_table: {
					definition: "another statement will be run here",
					purgedWithCache: true,
				},
			})
			await storageWithMockedSql.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })
			verify(sqlMock.run("some statement will be run here", []))
			verify(sqlMock.run("another statement will be run here", []))

			for (const table of typedKeys(TableDefinitions)) {
				verify(
					sqlMock.run(
						matchers.argThat((arg: string) => arg.startsWith(`CREATE TABLE IF NOT EXISTS ${table}`)),
						[],
					),
				)
			}
		})

		o.test("purgeStorage purges all purgeable tables", async () => {
			when(sqlMock.get(matchers.contains("SELECT COUNT(*) as metadata_exists"), matchers.anything())).thenResolve({
				metadata_exists: { type: SqlType.Number, value: 1 },
			})

			const storageWithMockedSql = new OfflineStorage(sqlMock, object(), object(), object(), object(), object(), object(), object(), {
				some_table: {
					definition: "some statement will be run here",
					purgedWithCache: false,
				},
				another_table: {
					definition: "another statement will be run here",
					purgedWithCache: true,
				},
			})
			await storageWithMockedSql.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })
			await storageWithMockedSql.purgeStorage()
			verify(sqlMock.run("DROP TABLE IF EXISTS another_table", []))
			verify(sqlMock.run("DROP TABLE IF EXISTS some_table", []), { times: 0 })

			for (const table of typedKeys(TableDefinitions)) {
				verify(sqlMock.run(`DROP TABLE IF EXISTS ${table}`, []), {
					times: TableDefinitions[table].purgedWithCache ? 1 : 0,
				})
			}
		})

		o.test("purgeStorage calls onBeforePurged", async () => {
			when(sqlMock.get(matchers.contains("SELECT COUNT(*) as metadata_exists"), matchers.anything())).thenResolve({
				metadata_exists: { type: SqlType.Number, value: 1 },
			})

			const storageWithMockedSql = new OfflineStorage(sqlMock, object(), object(), object(), object(), object(), object(), object(), {
				some_table: {
					definition: "some statement will be run here",
					purgedWithCache: false,
					async onBeforePurged(sqlCipherFacade: SqlCipherFacade) {
						sqlCipherFacade.run("onBeforePurged was called", [])
					},
				},
				another_table: {
					definition: "another statement will be run here",
					purgedWithCache: true,
				},
			})
			await storageWithMockedSql.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })
			await storageWithMockedSql.purgeStorage()
			verify(sqlMock.run("onBeforePurged was called", []), { times: 1 })
		})

		o.test("tables are created after migration", async function () {
			when(sqlMock.get(matchers.contains("SELECT COUNT(*) as metadata_exists"), matchers.anything())).thenResolve({
				metadata_exists: { type: SqlType.Number, value: 1 },
			})

			const storageWithMockedSql = new OfflineStorage(sqlMock, object(), object(), object(), object(), object(), object(), object(), {
				some_table: {
					definition: "some statement will be run here",
					purgedWithCache: false,
				},
			})

			when(migratorMock.migrate(storageWithMockedSql, dbFacade)).thenDo(() => {
				verify(sqlMock.run("some statement will be run here", []), { times: 1 })
			})
			await storageWithMockedSql.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })
			verify(sqlMock.run("some statement will be run here", []), { times: 2 })
		})
	})

	o.spec("Unit test", function () {
		async function getAllIdsForType(typeRef: TypeRef<unknown>): Promise<Id[]> {
			const typeModel = await typeModelResolver.resolveClientTypeReference(typeRef)
			let preparedQuery
			switch (typeModel.type) {
				case TypeId.Element.valueOf():
					preparedQuery = sql`select *
                                        from element_entities
                                        where type = ${getTypeString(typeRef)}`
					break
				case TypeId.ListElement.valueOf():
					preparedQuery = sql`select *
                                        from list_entities
                                        where type = ${getTypeString(typeRef)}`
					break
				case TypeId.BlobElement.valueOf():
					preparedQuery = sql`select *
                                        from blob_element_entities
                                        where type = ${getTypeString(typeRef)}`
					break
				default:
					throw new Error("must be a persistent type")
			}
			return (await dbFacade.all(preparedQuery.query, preparedQuery.params)).map((r) => r.elementId.value as Id)
		}

		o.test("migrations are run", async function () {
			await storage.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })
			verify(migratorMock.migrate(storage, dbFacade))
		})

		o.spec("custom cache handlers", function () {
			const userId = "userId1"

			o.beforeEach(async function () {
				await storage.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })
			})

			o.test("put calls the cache handler", async function () {
				const user = createTestEntity(
					UserTypeRef,
					{
						_id: userId,
						_ownerGroup: "ownerGroup",
					},
					{ populateAggregates: true },
				)
				user.userGroup._original = structuredClone(user.userGroup)
				user._original = structuredClone(user)
				const storableUser = await toStorableInstance(user)

				const userCacheHandler: CustomCacheHandler<User> = object()
				when(customCacheHandlerMap.get(UserTypeRef)).thenReturn(userCacheHandler)

				await storage.put(UserTypeRef, storableUser)
				verify(userCacheHandler.onBeforeCacheUpdate?.(user))
			})

			o.test("putMultiple calls the cache handler", async function () {
				const user = createTestEntity(
					UserTypeRef,
					{
						_id: userId,
						_ownerGroup: "ownerGroup",
					},
					{ populateAggregates: true },
				)
				user.userGroup._original = structuredClone(user.userGroup)
				user._original = structuredClone(user)
				const storableUser = await toStorableInstance(user)

				const userCacheHandler: CustomCacheHandler<User> = object()
				when(customCacheHandlerMap.get(UserTypeRef)).thenReturn(userCacheHandler)

				await storage.putMultiple(UserTypeRef, [storableUser])
				verify(userCacheHandler.onBeforeCacheUpdate?.(user))
			})

			o.test("deleteIfExists calls the cache handler", async function () {
				const user = createTestEntity(
					UserTypeRef,
					{
						_id: userId,
						_ownerGroup: "ownerGroup",
					},
					{ populateAggregates: true },
				)
				const storableUser = await toStorableInstance(user)

				const userCacheHandler: CustomCacheHandler<User> = object()
				when(customCacheHandlerMap.get(UserTypeRef)).thenReturn(userCacheHandler)

				await storage.put(UserTypeRef, storableUser)

				await storage.deleteIfExists(UserTypeRef, null, userId)
				verify(userCacheHandler.onBeforeCacheDeletion?.(userId))
			})

			o.spec("deleteAllOfType", function () {
				o.test("calls the cache handler for element types", async function () {
					const user = createTestEntity(
						UserTypeRef,
						{
							_id: userId,
							_ownerGroup: "ownerGroup",
						},
						{ populateAggregates: true },
					)
					const storableUser = await toStorableInstance(user)

					const userCacheHandler: CustomCacheHandler<User> = object()
					when(customCacheHandlerMap.get(UserTypeRef)).thenReturn(userCacheHandler)

					await storage.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })

					await storage.put(UserTypeRef, storableUser)

					await storage.deleteAllOfType(UserTypeRef)
					verify(userCacheHandler.onBeforeCacheDeletion?.(userId))
				})

				o.test("calls the cache handler for list element types", async function () {
					const id: IdTuple = ["listId", "id1"]
					const entityToStore = createTestEntity(
						MailTypeRef,
						{
							_id: id,
							_ownerGroup: "ownerGroup",
						},
						{ populateAggregates: true },
					)
					const storableMail = await toStorableInstance(entityToStore)

					const customCacheHandler: CustomCacheHandler<Mail> = object()
					when(customCacheHandlerMap.get(MailTypeRef)).thenReturn(customCacheHandler)

					await storage.put(MailTypeRef, storableMail)

					await storage.deleteAllOfType(MailTypeRef)
					verify(customCacheHandler.onBeforeCacheDeletion?.(id))
				})

				o.test("calls the cache handler for blob element types", async function () {
					const id: IdTuple = ["listId", "id1"]
					const entityToStore = createTestEntity(
						MailDetailsBlobTypeRef,
						{
							_id: id,
							_ownerGroup: "ownerGroup",
						},
						{ populateAggregates: true },
					)
					const storableDetails = await toStorableInstance(entityToStore)

					const customCacheHandler: CustomCacheHandler<MailDetailsBlob> = object()
					when(customCacheHandlerMap.get(MailDetailsBlobTypeRef)).thenReturn(customCacheHandler)

					await storage.put(MailDetailsBlobTypeRef, storableDetails)

					await storage.deleteAllOfType(MailDetailsBlobTypeRef)
					verify(customCacheHandler.onBeforeCacheDeletion?.(id))
				})
			})

			o.spec("deleteAllOwnedBy", function () {
				const userId = "id1"
				const groupId = "groupId"

				o.test("calls the cache handler for element types", async function () {
					const user = createTestEntity(
						UserTypeRef,
						{
							_id: userId,
							_ownerGroup: groupId,
						},
						{ populateAggregates: true },
					)
					const storableUser = await toStorableInstance(user)

					const userCacheHandler: CustomCacheHandler<User> = object()
					when(customCacheHandlerMap.get(UserTypeRef)).thenReturn(userCacheHandler)

					await storage.put(UserTypeRef, storableUser)

					await storage.deleteAllOwnedBy(groupId)
					verify(userCacheHandler.onBeforeCacheDeletion?.(userId))
				})

				o.test("calls the cache handler for list element types", async function () {
					const id: IdTuple = ["listId", "id1"]
					const entityToStore = createTestEntity(
						MailTypeRef,
						{
							_id: id,
							_ownerGroup: groupId,
						},
						{ populateAggregates: true },
					)
					const storableMail = await toStorableInstance(entityToStore)

					const customCacheHandler: CustomCacheHandler<Mail> = object()
					when(customCacheHandlerMap.get(MailTypeRef)).thenReturn(customCacheHandler)

					await storage.put(MailTypeRef, storableMail)

					await storage.deleteAllOwnedBy(groupId)
					verify(customCacheHandler.onBeforeCacheDeletion?.(id))
				})

				o.test("calls the cache handler for blob element types", async function () {
					const id: IdTuple = ["listId", "id1"]
					const entityToStore = createTestEntity(
						MailDetailsBlobTypeRef,
						{
							_id: id,
							_ownerGroup: groupId,
						},
						{ populateAggregates: true },
					)
					const storableDetailsBlob = await toStorableInstance(entityToStore)

					const customCacheHandler: CustomCacheHandler<MailDetailsBlob> = object()
					when(customCacheHandlerMap.get(MailDetailsBlobTypeRef)).thenReturn(customCacheHandler)

					await storage.put(MailDetailsBlobTypeRef, storableDetailsBlob)

					await storage.deleteAllOwnedBy(groupId)
					verify(customCacheHandler.onBeforeCacheDeletion?.(id))
				})

				o.test("removes last batch id for the deleted group", async function () {
					await storage.putLastBatchIdForGroup("group1", "batch1")
					await storage.putLastBatchIdForGroup("group2", "batch2")

					await storage.deleteAllOwnedBy("group1")
					o.check(await storage.getLastBatchIdForGroup("group1")).equals(null)
					o.check(await storage.getLastBatchIdForGroup("group2")).equals("batch2")
				})
			})

			o.test("deleteIn calls the cache handler", async function () {
				const id: IdTuple = ["listId", "id1"]
				const entityToStore = createTestEntity(
					MailDetailsBlobTypeRef,
					{
						_id: id,
						_ownerGroup: "ownerGroup",
					},
					{ populateAggregates: true },
				)
				const storableDetailsBlob = await toStorableInstance(entityToStore)

				const customCacheHandler: CustomCacheHandler<MailDetailsBlob> = object()
				when(customCacheHandlerMap.get(MailDetailsBlobTypeRef)).thenReturn(customCacheHandler)

				await storage.put(MailDetailsBlobTypeRef, storableDetailsBlob)

				await storage.deleteIn(MailDetailsBlobTypeRef, "listId", ["id1"])
				verify(customCacheHandler.onBeforeCacheDeletion?.(id))
			})
		})

		o.spec("Offline storage round trip", function () {
			o.spec("ElementType", function () {
				o.test("deleteAllOfType", async function () {
					const userId = "id1"
					const user = createTestEntity(UserTypeRef, {
						_id: userId,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						userGroup: createTestEntity(GroupMembershipTypeRef, {
							group: "groupId",
							groupInfo: ["groupInfoListId", "groupInfoElementId"],
							groupMember: ["groupMemberListId", "groupMemberElementId"],
						}),
						successfulLogins: "successfulLogins",
						failedLogins: "failedLogins",
						secondFactorAuthentications: "secondFactorAuthentications",
					})
					const storableUser = await toStorableInstance(user)

					await storage.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })

					let storedUser = await storage.get(UserTypeRef, null, userId)
					o.check(storedUser).equals(null)

					await storage.put(UserTypeRef, storableUser)

					storedUser = await storage.get(UserTypeRef, null, userId)
					o.check(storedUser!._id).equals(user._id)

					await storage.deleteAllOfType(UserTypeRef)

					storedUser = await storage.get(UserTypeRef, null, userId)
					o.check(storedUser).equals(null)
				})

				o.test("putMultiple and get", async function () {
					const userId1 = "id1"
					const userId2 = "id2"
					const storableUsers = [
						createTestEntity(UserTypeRef, {
							_id: userId1,
							_ownerGroup: "ownerGroup",
							_permissions: "permissions",
							userGroup: createTestEntity(GroupMembershipTypeRef, {
								group: "groupId",
								groupInfo: ["groupInfoListId", "groupInfoElementId"],
								groupMember: ["groupMemberListId", "groupMemberElementId"],
							}),
							successfulLogins: "successfulLogins",
							failedLogins: "failedLogins",
							secondFactorAuthentications: "secondFactorAuthentications",
						}),
						createTestEntity(UserTypeRef, {
							_id: userId2,
							_ownerGroup: "ownerGroup",
							_permissions: "permissions",
							userGroup: createTestEntity(GroupMembershipTypeRef, {
								group: "groupId",
								groupInfo: ["groupInfoListId", "groupInfoElementId"],
								groupMember: ["groupMemberListId", "groupMemberElementId"],
							}),
							successfulLogins: "successfulLogins",
							failedLogins: "failedLogins",
							secondFactorAuthentications: "secondFactorAuthentications",
						}),
					]

					await storage.init({ userId: userId1, databaseKey, timeRangeDate, forceNewDatabase: false })

					let storedUsers = [await storage.get(UserTypeRef, null, userId1), await storage.get(UserTypeRef, null, userId2)].filter((u) => u != null)
					o(storedUsers).deepEquals([])

					await storage.putMultiple(UserTypeRef, await Promise.all(storableUsers.map(async (u) => await toStorableInstance(u))))

					storedUsers = [assertNotNull(await storage.get(UserTypeRef, null, userId1)), assertNotNull(await storage.get(UserTypeRef, null, userId2))]
					o(storedUsers.map(removeOriginals)).deepEquals(storableUsers)
				})
			})

			o.spec("put", function () {
				o.test("when updating element types the rowid is preserved", async function () {
					await storage.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })
					const id = "id1"
					const ownerGroup = "ownerGroup1"

					const entity = createContactList({
						_id: id,
						_ownerGroup: ownerGroup,
						_permissions: "permissions",
						_ownerEncSessionKey: null,
						_ownerKeyVersion: null,
						contacts: "contactsId",
						photos: null,
					})
					await storage.put(ContactListTypeRef, await toStorableInstance(entity))
					const rowIdQuery = sql`SELECT rowid
                                           FROM element_entities
                                           WHERE elementId = ${id}`
					const rowId = (await dbFacade.get(rowIdQuery.query, rowIdQuery.params))?.rowid.value

					await storage.put(ContactListTypeRef, await toStorableInstance(entity))

					const newRowId = (await dbFacade.get(rowIdQuery.query, rowIdQuery.params))?.rowid.value
					o.check(newRowId).equals(rowId)
				})

				o.test("when updating list element types the rowid is preserved", async function () {
					await storage.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })
					const id: IdTuple = ["id1", "idPart2"]
					const ownerGroup = "ownerGroup1"

					const entity = createBlobArchiveRef({
						_id: id,
						_ownerGroup: ownerGroup,
						_permissions: "permissions",
						archive: "archiveId",
					})

					await storage.put(BlobArchiveRefTypeRef, await toStorableInstance(entity))
					const rowIdQuery = sql`SELECT rowid
                                           FROM list_entities
                                           WHERE listId = ${listIdPart(id)}
                                             AND elementId = ${elementIdPart(id)}`
					const rowId = (await dbFacade.get(rowIdQuery.query, rowIdQuery.params))?.rowid.value

					await storage.put(BlobArchiveRefTypeRef, await toStorableInstance(entity))

					const newRowId = (await dbFacade.get(rowIdQuery.query, rowIdQuery.params))?.rowid.value
					o.check(newRowId).equals(rowId)
				})

				o.test("when updating blob element types the rowid is preserved", async function () {
					await storage.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })
					const id: IdTuple = ["id1", "idPart2"]
					const ownerGroup = "ownerGroup1"

					const entity = createTestEntity(MailDetailsBlobTypeRef, {
						_id: id,
						_ownerGroup: ownerGroup,
					})

					await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(entity))
					const rowIdQuery = sql`SELECT rowid
                                           FROM blob_element_entities
                                           WHERE listId = ${listIdPart(id)}
                                             AND elementId = ${elementIdPart(id)}`
					const rowId = (await dbFacade.get(rowIdQuery.query, rowIdQuery.params))?.rowid.value

					await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(entity))

					const newRowId = (await dbFacade.get(rowIdQuery.query, rowIdQuery.params))?.rowid.value
					o.check(newRowId).equals(rowId)
				})
			})

			o.spec("ListElementType generatedId", function () {
				o.test("deleteAllOfType", async function () {
					const listId = "listId1"
					const elementId = "id1"
					const storableMail = await toStorableInstance(
						createTestEntity(MailTypeRef, {
							_id: [listId, elementId],
							_ownerGroup: "ownerGroup",
							_permissions: "permissions",
							sender: createTestEntity(MailAddressTypeRef, {
								name: "some name",
								address: "address@tuta.com",
							}),
							conversationEntry: ["listId", "listElementId"],
						}),
					)

					await storage.init({ userId: elementId, databaseKey, timeRangeDate, forceNewDatabase: false })

					let mail = await storage.get(MailTypeRef, listId, elementId)
					o.check(mail).equals(null)

					await storage.put(MailTypeRef, storableMail)
					await storage.setNewRangeForList(MailTypeRef, listId, elementId, elementId)

					mail = await storage.get(MailTypeRef, listId, elementId)
					o.check(mail!._id).deepEquals([listId, elementId])
					const rangeBefore = await storage.getRangeForList(MailTypeRef, listId)
					o.check(rangeBefore).deepEquals({ upper: elementId, lower: elementId })
					await storage.deleteAllOfType(MailTypeRef)

					mail = await storage.get(MailTypeRef, listId, elementId)
					o.check(mail).equals(null)
					const rangeAfter = await storage.getRangeForList(MailTypeRef, listId)
					o.check(rangeAfter).equals(null)
				})

				o.test("putMultiple and provideMultiple", async function () {
					const listId = "listId1"
					const elementId1 = "id1"
					const elementId2 = "id2"
					const storableMail1 = createTestEntity(MailTypeRef, {
						_id: [listId, elementId1],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						sender: createTestEntity(MailAddressTypeRef, {
							name: "some name",
							address: "address@tuta.com",
						}),
						conversationEntry: ["listId", "listElementId"],
					})
					const storableMail2 = createTestEntity(MailTypeRef, {
						_id: [listId, elementId2],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						sender: createTestEntity(MailAddressTypeRef, {
							name: "some name",
							address: "address@tuta.com",
						}),
						conversationEntry: ["listId", "listElementId"],
					})

					await storage.init({ userId: elementId1, databaseKey, timeRangeDate, forceNewDatabase: false })

					let mails = await storage.provideMultiple(MailTypeRef, listId, [elementId1])
					o.check(mails).deepEquals([])

					await storage.putMultiple(MailTypeRef, [await toStorableInstance(storableMail1)])

					mails = await storage.provideMultiple(MailTypeRef, listId, [elementId1, elementId2])
					mails.map(removeOriginals)
					o.check(mails).deepEquals([storableMail1])

					await storage.putMultiple(MailTypeRef, [await toStorableInstance(storableMail2)])

					mails = await storage.provideMultiple(MailTypeRef, listId, [elementId1, elementId2])
					mails.map(removeOriginals)
					o.check(mails).deepEquals([storableMail1, storableMail2])
				})
			})

			o.spec("ListElementType customId", function () {
				o.test("deleteAllOfType", async function () {
					const listId = "listId1"
					const elementId = constructMailSetEntryId(new Date(), "mailId")
					const storableMailSetEntry = createTestEntity(MailSetEntryTypeRef, {
						_id: [listId, elementId],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						mail: ["mailListId", "mailId"],
					})

					await storage.init({ userId: elementId, databaseKey, timeRangeDate, forceNewDatabase: false })

					let mailSetEntry = await storage.get(MailSetEntryTypeRef, listId, elementId)
					o.check(mailSetEntry).equals(null)

					await storage.put(MailSetEntryTypeRef, await toStorableInstance(storableMailSetEntry))
					await storage.setNewRangeForList(MailSetEntryTypeRef, listId, elementId, elementId)

					mailSetEntry = await storage.get(MailSetEntryTypeRef, listId, elementId)
					o.check(mailSetEntry!._id).deepEquals(storableMailSetEntry._id)
					const rangeBefore = await storage.getRangeForList(MailSetEntryTypeRef, listId)
					o.check(rangeBefore).deepEquals({ upper: elementId, lower: elementId })
					await storage.deleteAllOfType(MailSetEntryTypeRef)

					mailSetEntry = await storage.get(MailSetEntryTypeRef, listId, elementId)
					o.check(mailSetEntry).equals(null)
					const rangeAfter = await storage.getRangeForList(MailSetEntryTypeRef, listId)
					o.check(rangeAfter).equals(null)
				})

				o.test("putMultiple and provideMultiple", async function () {
					const listId = "listId1"
					const elementId1 = constructMailSetEntryId(new Date(1724675875113), "mailId1")
					const elementId2 = constructMailSetEntryId(new Date(1724675899978), "mailId2")
					const storableMailSetEntry1 = createTestEntity(MailSetEntryTypeRef, {
						_id: [listId, elementId1],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						mail: ["mailListId", "mailId"],
					})
					storableMailSetEntry1._original = structuredClone(storableMailSetEntry1)
					const storableMailSetEntry2 = createTestEntity(MailSetEntryTypeRef, {
						_id: [listId, elementId2],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						mail: ["mailListId", "mailId"],
					})
					storableMailSetEntry2._original = structuredClone(storableMailSetEntry2)

					await storage.init({ userId: elementId1, databaseKey, timeRangeDate, forceNewDatabase: false })

					let mails = await storage.provideMultiple(MailSetEntryTypeRef, listId, [elementId1])
					o.check(mails).deepEquals([])

					await storage.putMultiple(MailSetEntryTypeRef, [await toStorableInstance(storableMailSetEntry1)])

					mails = await storage.provideMultiple(MailSetEntryTypeRef, listId, [elementId1, elementId2])
					o.check(mails).deepEquals([storableMailSetEntry1])

					await storage.putMultiple(MailSetEntryTypeRef, [await toStorableInstance(storableMailSetEntry2)])

					mails = await storage.provideMultiple(MailSetEntryTypeRef, listId, [elementId1, elementId2])
					o.check(mails).deepEquals([storableMailSetEntry1, storableMailSetEntry2])
				})
			})

			o.spec("BlobElementType", function () {
				o.test("put, get and delete", async function () {
					const archiveId = "archiveId"
					const blobElementId = "id1"
					const storableMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
						_id: [archiveId, blobElementId],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						details: createTestEntity(MailDetailsTypeRef, {
							recipients: createTestEntity(RecipientsTypeRef, {}),
							body: createTestEntity(BodyTypeRef, {}),
						}),
					})

					await storage.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })

					let mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
					o.check(mailDetailsBlob).equals(null)

					await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(storableMailDetails))

					mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
					removeOriginals(mailDetailsBlob)
					o.check(mailDetailsBlob).deepEquals(storableMailDetails)

					await storage.deleteIfExists(MailDetailsBlobTypeRef, archiveId, blobElementId)

					mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
					o.check(mailDetailsBlob).equals(null)
				})

				o.test("putMultiple, provideMultiple and deleteIn", async function () {
					const archiveId = "archiveId"
					const blobElementId1 = "id1"
					const blobElementId2 = "id2"
					const storableMailDetails = [
						createTestEntity(MailDetailsBlobTypeRef, {
							_id: [archiveId, blobElementId1],
							_ownerGroup: "ownerGroup",
							_permissions: "permissions",
							details: createTestEntity(MailDetailsTypeRef, {
								recipients: createTestEntity(RecipientsTypeRef, {}),
								body: createTestEntity(BodyTypeRef, {}),
							}),
						}),
						createTestEntity(MailDetailsBlobTypeRef, {
							_id: [archiveId, blobElementId2],
							_ownerGroup: "ownerGroup",
							_permissions: "permissions",
							details: createTestEntity(MailDetailsTypeRef, {
								recipients: createTestEntity(RecipientsTypeRef, {}),
								body: createTestEntity(BodyTypeRef, {}),
							}),
						}),
					]

					await storage.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })

					let mailDetailsBlob = await storage.provideMultiple(MailDetailsBlobTypeRef, archiveId, [blobElementId1, blobElementId2])
					o.check(mailDetailsBlob).deepEquals([])

					await storage.putMultiple(MailDetailsBlobTypeRef, await Promise.all(storableMailDetails.map(async (smd) => await toStorableInstance(smd))))

					mailDetailsBlob = await storage.provideMultiple(MailDetailsBlobTypeRef, archiveId, [blobElementId1, blobElementId2])
					o.check(mailDetailsBlob.map(removeOriginals)).deepEquals(storableMailDetails)

					await storage.deleteIn(MailDetailsBlobTypeRef, archiveId, [blobElementId1, blobElementId2])

					mailDetailsBlob = await storage.provideMultiple(MailDetailsBlobTypeRef, archiveId, [blobElementId1, blobElementId2])
					o.check(mailDetailsBlob).deepEquals([])
				})

				o.test("put, get and deleteAllOwnedBy", async function () {
					const archiveId = "archiveId"
					const blobElementId = "id1"
					const _ownerGroup = "ownerGroup"
					const storableMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
						_id: [archiveId, blobElementId],
						_ownerGroup,
						_permissions: "permissions",
						details: createTestEntity(MailDetailsTypeRef, {
							recipients: createTestEntity(RecipientsTypeRef, {}),
							body: createTestEntity(BodyTypeRef, {}),
						}),
					})

					await storage.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })

					await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(storableMailDetails))

					await storage.deleteAllOwnedBy(_ownerGroup)

					const mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
					o.check(mailDetailsBlob).equals(null)
				})
			})
		})

		o.spec("Clearing excluded data for MailSet mailbox", function () {
			const spamFolderId = "spamFolder"
			const trashFolderId = "trashFolder"
			const spamFolderEntriesId = "spamFolderEntriesId"
			const trashFolderEntriesId = "trashFolderEntriesId"
			const mailBagMailListId = "mailBagMailListId"

			const mailSetEntryType = getTypeString(MailSetEntryTypeRef)

			o.beforeEach(async function () {
				await storage.init({ userId, databaseKey, timeRangeDate, forceNewDatabase: false })

				const storableMailBox = await toStorableInstance(
					createTestEntity(MailBoxTypeRef, {
						_id: "mailboxId",
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						sentAttachments: "sentAttachments",
						receivedAttachments: "receivedAttachments",
						importedAttachments: "importedAttachments",
						mailImportStates: "mailImportStates",
						currentMailBag: createTestEntity(MailBagTypeRef, { _id: "mailBagId", mails: mailBagMailListId }),
						folders: createMailFolderRef({ folders: "mailFolderList" }),
					}),
				)
				await storage.put(MailBoxTypeRef, storableMailBox)
				const storableSpamFolder = createTestEntity(MailFolderTypeRef, {
					_id: ["mailFolderList", spamFolderId],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					entries: spamFolderEntriesId,
					folderType: MailSetKind.SPAM,
				})
				await storage.put(MailFolderTypeRef, await toStorableInstance(storableSpamFolder))
				const storableTrashFolder = await toStorableInstance(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", trashFolderId],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						entries: trashFolderEntriesId,
						folderType: MailSetKind.TRASH,
					}),
				)
				await storage.put(MailFolderTypeRef, storableTrashFolder)
			})

			o.test("ranges before timeRangeDays will be deleted", async function () {
				const oneDayBeforeTimeRangeDays = -1
				const twoDaysBeforeTimeRangeDays = -2

				const mailId: IdTuple = [mailBagMailListId, "anything"]
				const mailSetEntryElementId = offsetMailSetEntryId(oneDayBeforeTimeRangeDays, elementIdPart(mailId))
				const mailSetEntryId: IdTuple = ["mailSetEntriesListId", mailSetEntryElementId]
				const mailDetailsBlobId: IdTuple = ["mailDetailsList", "mailDetailsBlobId"]

				const storableMailFolder = await toStorableInstance(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", "mailFolderId"],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						entries: listIdPart(mailSetEntryId),
					}),
				)
				await storage.put(MailFolderTypeRef, storableMailFolder)
				const storableEntry = await toStorableInstance(
					createTestEntity(MailSetEntryTypeRef, {
						_id: mailSetEntryId,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						mail: mailId,
					}),
				)
				await storage.put(MailSetEntryTypeRef, storableEntry)
				const storableMail = await toStorableInstance(
					createTestEntity(MailTypeRef, {
						_id: mailId,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						mailDetails: mailDetailsBlobId,
						sets: [mailSetEntryId],
						sender: createTestEntity(MailAddressTypeRef, {
							name: "some name",
							address: "address@tuta.com",
						}),
						conversationEntry: ["listId", "listElementId"],
					}),
				)
				await storage.put(MailTypeRef, storableMail)
				const storableDetails = await toStorableInstance(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: mailDetailsBlobId,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						details: createTestEntity(MailDetailsTypeRef, {
							recipients: createTestEntity(RecipientsTypeRef, {}),
							body: createTestEntity(BodyTypeRef, {}),
						}),
					}),
				)
				await storage.put(MailDetailsBlobTypeRef, storableDetails)

				const lowerMailSetEntryIdForRange = offsetMailSetEntryId(twoDaysBeforeTimeRangeDays, GENERATED_MIN_ID)
				const upperMailSetEntryIdForRange = offsetMailSetEntryId(oneDayBeforeTimeRangeDays, GENERATED_MAX_ID)
				await storage.setNewRangeForList(MailSetEntryTypeRef, listIdPart(mailSetEntryId), lowerMailSetEntryIdForRange, upperMailSetEntryIdForRange)
				const upperBeforeTimeRangeDays = offsetId(oneDayBeforeTimeRangeDays) // negative number == mail newer than timeRangeDays
				const lowerBeforeTimeRangeDays = offsetId(twoDaysBeforeTimeRangeDays)
				await storage.setNewRangeForList(MailTypeRef, mailBagMailListId, lowerBeforeTimeRangeDays, upperBeforeTimeRangeDays)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDate, userId)

				const allRanges = await dbFacade.all("SELECT * FROM ranges", [])
				o.check(allRanges).deepEquals([])
				const allMails = await getAllIdsForType(MailTypeRef)
				o.check(allMails).deepEquals([])
				const allMailSetEntries = await getAllIdsForType(MailSetEntryTypeRef)
				o.check(allMailSetEntries).deepEquals([])
				const allBlobDetails = await getAllIdsForType(MailDetailsBlobTypeRef)
				o.check(allBlobDetails).deepEquals([])
			})
			o.test("modified ranges will be shrunk", async function () {
				const twoDaysBeforeTimeRangeDays = -2
				const twoDaysAfterTimeRangeDays = 2

				const entriesListId = "mailSetEntriesListIdRanges"
				const lowerMailSetEntryIdForRange = offsetMailSetEntryId(twoDaysBeforeTimeRangeDays, GENERATED_MIN_ID)
				const upperMailSetEntryIdForRange = offsetMailSetEntryId(twoDaysAfterTimeRangeDays, GENERATED_MAX_ID)
				const storableInbox = await toStorableInstance(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", "mailFolderId"],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						entries: entriesListId,
						folderType: MailSetKind.INBOX,
					}),
				)
				await storage.put(MailFolderTypeRef, storableInbox)

				await storage.setNewRangeForList(MailSetEntryTypeRef, entriesListId, lowerMailSetEntryIdForRange, upperMailSetEntryIdForRange)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDate, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				const mailSetEntryTypeModel = await typeModelResolver.resolveClientTypeReference(MailSetEntryTypeRef)
				o.check(mapNullable(newRange, untagSqlObject)).deepEquals({
					type: mailSetEntryType,
					listId: entriesListId,
					// we need to encode with base64Ext, as we read raw data from the database, which stores custom elementIds in base64Ext not base64Url
					lower: ensureBase64Ext(mailSetEntryTypeModel, cutoffMailSetEntryId),
					upper: ensureBase64Ext(mailSetEntryTypeModel, upperMailSetEntryIdForRange),
				})
			})
			o.test("unmodified ranges will not be deleted or shrunk", async function () {
				const oneDayAfterTimeRangeDays = 1
				const twoDaysAfterTimeRangeDays = 2

				const entriesListId = "mailSetEntriesListIdRanges"
				const lowerMailSetEntryIdForRange = offsetMailSetEntryId(oneDayAfterTimeRangeDays, GENERATED_MIN_ID)
				const upperMailSetEntryIdForRange = offsetMailSetEntryId(twoDaysAfterTimeRangeDays, GENERATED_MAX_ID)
				const storableCustomFolder = await toStorableInstance(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", "mailFolderId"],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						entries: entriesListId,
						folderType: MailSetKind.CUSTOM,
					}),
				)
				await storage.put(MailFolderTypeRef, storableCustomFolder)
				await storage.setNewRangeForList(MailSetEntryTypeRef, entriesListId, lowerMailSetEntryIdForRange, upperMailSetEntryIdForRange)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDate, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				const mailSetEntryTypeModel = await typeModelResolver.resolveClientTypeReference(MailSetEntryTypeRef)
				o.check(mapNullable(newRange, untagSqlObject)).deepEquals({
					type: mailSetEntryType,
					listId: entriesListId,
					// we need to encode with base64Ext, as we read raw data from the database, which stores custom elementIds in base64Ext not base64Url
					lower: ensureBase64Ext(mailSetEntryTypeModel, lowerMailSetEntryIdForRange),
					upper: ensureBase64Ext(mailSetEntryTypeModel, upperMailSetEntryIdForRange),
				})
			})
			o.test("complete ranges won't be lost if entities are all newer than cutoff", async function () {
				const twoDaysAfterTimeRangeDays = 2

				const mailId: IdTuple = [mailBagMailListId, offsetId(twoDaysAfterTimeRangeDays)]
				const mailSetEntryElementId = offsetMailSetEntryId(twoDaysAfterTimeRangeDays, elementIdPart(mailId))
				const mailSetEntryId: IdTuple = ["mailSetEntriesListId", mailSetEntryElementId]
				const mailDetailsBlobId: IdTuple = ["mailDetailsList", "mailDetailsBlobId"]

				const lowerMailSetEntryIdForRange = CUSTOM_MIN_ID
				const upperMailSetEntryIdForRange = CUSTOM_MAX_ID

				await storage.setNewRangeForList(MailSetEntryTypeRef, listIdPart(mailSetEntryId), lowerMailSetEntryIdForRange, upperMailSetEntryIdForRange)
				const upper = offsetId(twoDaysAfterTimeRangeDays)
				const lower = GENERATED_MIN_ID
				await storage.setNewRangeForList(MailTypeRef, mailBagMailListId, lower, upper)

				const mail = await toStorableInstance(
					createTestEntity(MailTypeRef, {
						_id: mailId,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						mailDetails: mailDetailsBlobId,
						sets: [mailSetEntryId],
						sender: createTestEntity(MailAddressTypeRef, {
							name: "some name",
							address: "address@tuta.com",
						}),
						conversationEntry: ["listId", "listElementId"],
					}),
				)
				const mailFolder = await toStorableInstance(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", "folderId"],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						entries: listIdPart(mailSetEntryId),
					}),
				)

				await storage.put(MailFolderTypeRef, mailFolder)
				await storage.put(MailTypeRef, mail)
				const storableSetEntry = await toStorableInstance(
					createTestEntity(MailSetEntryTypeRef, {
						_id: mailSetEntryId,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						mail: mailId,
					}),
				)
				await storage.put(MailSetEntryTypeRef, storableSetEntry)
				const storableDetailsBlob = await toStorableInstance(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: mailDetailsBlobId,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						details: createTestEntity(MailDetailsTypeRef, {
							recipients: createTestEntity(RecipientsTypeRef, {}),
							body: createTestEntity(BodyTypeRef, {}),
						}),
					}),
				)
				await storage.put(MailDetailsBlobTypeRef, storableDetailsBlob)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDate, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				const mailSetEntryTypeModel = await typeModelResolver.resolveClientTypeReference(MailSetEntryTypeRef)
				o.check(mapNullable(newRange, untagSqlObject)).deepEquals({
					type: mailSetEntryType,
					listId: listIdPart(mailSetEntryId),
					// we need to encode with base64Ext, as we read raw data from the database, which stores custom elementIds in base64Ext not base64Url
					lower: ensureBase64Ext(mailSetEntryTypeModel, lowerMailSetEntryIdForRange),
					upper: ensureBase64Ext(mailSetEntryTypeModel, upperMailSetEntryIdForRange),
				})

				const allFolderIds = await getAllIdsForType(MailFolderTypeRef)
				o.check(allFolderIds).deepEquals(["folderId", spamFolderId, trashFolderId])
				const allMailIds = await getAllIdsForType(MailTypeRef)
				o.check(allMailIds).deepEquals([elementIdPart(mailId)])
				const allMailSetEntries = await getAllIdsForType(MailSetEntryTypeRef)
				// we need to encode with base64Ext, as we read raw data from the database, which stores custom elementIds in base64Ext not base64Url
				o.check(allMailSetEntries).deepEquals([ensureBase64Ext(mailSetEntryTypeModel, mailSetEntryElementId)])
				const allBlobDetails = await getAllIdsForType(MailDetailsBlobTypeRef)
				o.check(allBlobDetails).deepEquals([elementIdPart(mailDetailsBlobId)])
			})
			o.test("complete ranges will be modified if some entities are older than cutoff", async function () {
				const twoDaysBeforeTimeRangeDays = -2

				const mailId: IdTuple = [mailBagMailListId, offsetId(twoDaysBeforeTimeRangeDays)]
				const mailSetEntryElementId = offsetMailSetEntryId(twoDaysBeforeTimeRangeDays, elementIdPart(mailId))
				const mailSetEntryId: IdTuple = ["mailSetEntriesListId", mailSetEntryElementId]
				const mailDetailsBlobId: IdTuple = ["mailDetailsList", "mailDetailsBlobId"]

				const lowerMailSetEntryIdForRange = CUSTOM_MIN_ID
				const upperMailSetEntryIdForRange = CUSTOM_MAX_ID

				await storage.setNewRangeForList(MailSetEntryTypeRef, listIdPart(mailSetEntryId), lowerMailSetEntryIdForRange, upperMailSetEntryIdForRange)
				const upper = offsetId(twoDaysBeforeTimeRangeDays)
				await storage.setNewRangeForList(MailTypeRef, mailBagMailListId, GENERATED_MIN_ID, upper)

				const mail = await toStorableInstance(
					createTestEntity(MailTypeRef, {
						_id: mailId,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						mailDetails: mailDetailsBlobId,
						sets: [mailSetEntryId],
						sender: createTestEntity(MailAddressTypeRef, {
							name: "some name",
							address: "address@tuta.com",
						}),
						conversationEntry: ["listId", "listElementId"],
					}),
				)
				const mailFolder = await toStorableInstance(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", "folderId"],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						entries: listIdPart(mailSetEntryId),
					}),
				)
				const storableMailSetEntry = await toStorableInstance(
					createTestEntity(MailSetEntryTypeRef, {
						_id: mailSetEntryId,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						mail: mailId,
					}),
				)
				await storage.put(MailFolderTypeRef, mailFolder)
				await storage.put(MailTypeRef, mail)
				await storage.put(MailSetEntryTypeRef, storableMailSetEntry)
				const storableDetails = await toStorableInstance(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: mailDetailsBlobId,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						details: createTestEntity(MailDetailsTypeRef, {
							recipients: createTestEntity(RecipientsTypeRef, {}),
							body: createTestEntity(BodyTypeRef, {}),
						}),
					}),
				)
				await storage.put(MailDetailsBlobTypeRef, storableDetails)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDate, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				const mailSetEntryTypeModel = await typeModelResolver.resolveClientTypeReference(MailSetEntryTypeRef)
				o.check(mapNullable(newRange, untagSqlObject)).deepEquals({
					type: mailSetEntryType,
					listId: listIdPart(mailSetEntryId),
					// we need to encode with base64Ext, as we read raw data from the database, which stores custom elementIds in base64Ext not base64Url
					lower: ensureBase64Ext(mailSetEntryTypeModel, cutoffMailSetEntryId),
					upper: ensureBase64Ext(mailSetEntryTypeModel, upperMailSetEntryIdForRange),
				})

				const allFolderIds = await getAllIdsForType(MailFolderTypeRef)
				o.check(allFolderIds).deepEquals(["folderId", spamFolderId, trashFolderId])
				const allMailIds = await getAllIdsForType(MailTypeRef)
				o.check(allMailIds).deepEquals([])
				const allMailSetEntries = await getAllIdsForType(MailSetEntryTypeRef)
				// we need to encode with base64Ext, as we read raw data from the database, which stores custom elementIds in base64Ext not base64Url
				o.check(allMailSetEntries).deepEquals([])
				const allBlobDetails = await getAllIdsForType(MailDetailsBlobTypeRef)
				o.check(allBlobDetails).deepEquals([])
			})

			o.test("only mails that are older than cutoff are deleted from trash and spam and their descendents", async function () {
				const twoDaysAfterTimeRangeDays = 2
				const threeDaysAfterTimeRangeDays = 3
				const fourDaysAfterTimeRangeDays = 4
				const fiveDaysBeforeTimeRangeDays = -5

				const spamDetailsId: IdTuple = ["detailsListId", "spamDetailsId"]
				const oldSpamDetailsId: IdTuple = ["detailsListId", "oldSpamDetailsId"]
				const trashDetailsId: IdTuple = ["detailsListId", "trashDetailsId"]
				const trashSubfolderDetailsId: IdTuple = ["detailsListId", "trashSubFolderDetailsId"]

				const trashSubfolderId = "trashSubfolderId"
				const trashSubfolderEntriesId = "trashSubfolderEntriesId"

				const spamMailId = offsetId(twoDaysAfterTimeRangeDays)
				const spamMail = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, spamMailId],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mailDetails: spamDetailsId,
					sender: createTestEntity(MailAddressTypeRef, {
						name: "some name",
						address: "address@tuta.com",
					}),
					conversationEntry: ["listId", "listElementId"],
				})
				const oldSpamMailId = offsetId(fiveDaysBeforeTimeRangeDays)
				const oldSpamMail = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, oldSpamMailId],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mailDetails: oldSpamDetailsId,
					sender: createTestEntity(MailAddressTypeRef, {
						name: "some name",
						address: "address@tuta.com",
					}),
					conversationEntry: ["listId", "listElementId"],
				})
				const trashMailId = offsetId(threeDaysAfterTimeRangeDays)
				const trashMail = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, trashMailId],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mailDetails: trashDetailsId,
					sender: createTestEntity(MailAddressTypeRef, {
						name: "some name",
						address: "address@tuta.com",
					}),
					conversationEntry: ["listId", "listElementId"],
				})
				const trashSubfolderMailId = offsetId(fourDaysAfterTimeRangeDays)
				const trashSubfolderMail = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, trashSubfolderMailId],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mailDetails: trashSubfolderDetailsId,
					sender: createTestEntity(MailAddressTypeRef, {
						name: "some name",
						address: "address@tuta.com",
					}),
					conversationEntry: ["listId", "listElementId"],
				})

				const spamMailSetEntryElementId = offsetMailSetEntryId(twoDaysAfterTimeRangeDays, spamMailId)
				const oldSpamMailSetEntryElementId = offsetMailSetEntryId(fiveDaysBeforeTimeRangeDays, oldSpamMailId)
				const trashMailSetEntryElementId = offsetMailSetEntryId(threeDaysAfterTimeRangeDays, trashMailId)
				const trashSubfolderMailSetEntryElementId = offsetMailSetEntryId(fourDaysAfterTimeRangeDays, trashSubfolderMailId)
				const spamMailSetEntryId: IdTuple = [spamFolderEntriesId, spamMailSetEntryElementId]
				const oldSpamMailSetEntryId: IdTuple = [spamFolderEntriesId, oldSpamMailSetEntryElementId]
				const trashMailSetEntryId: IdTuple = [trashFolderEntriesId, trashMailSetEntryElementId]
				const trashSubfolderMailSetEntryId: IdTuple = [trashSubfolderEntriesId, trashSubfolderMailSetEntryElementId]

				const storableCustomFolder = await toStorableInstance(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", trashSubfolderId],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						parentFolder: ["mailFolderList", trashFolderId],
						entries: trashSubfolderEntriesId,
						folderType: MailSetKind.CUSTOM,
					}),
				)
				await storage.put(MailFolderTypeRef, storableCustomFolder)

				const storableSpamMailSetEntry = await toStorableInstance(
					createTestEntity(MailSetEntryTypeRef, {
						_id: spamMailSetEntryId,
						mail: spamMail._id,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
					}),
				)
				await storage.put(MailSetEntryTypeRef, storableSpamMailSetEntry)

				const storableOldSpamMailSetEntry = await toStorableInstance(
					createTestEntity(MailSetEntryTypeRef, {
						_id: oldSpamMailSetEntryId,
						mail: oldSpamMail._id,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
					}),
				)
				await storage.put(MailSetEntryTypeRef, storableOldSpamMailSetEntry)

				const storableTrashEntry = await toStorableInstance(
					createTestEntity(MailSetEntryTypeRef, {
						_id: trashMailSetEntryId,
						mail: trashMail._id,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
					}),
				)
				await storage.put(MailSetEntryTypeRef, storableTrashEntry)

				const storableSubEntry = await toStorableInstance(
					createTestEntity(MailSetEntryTypeRef, {
						_id: trashSubfolderMailSetEntryId,
						mail: trashSubfolderMail._id,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
					}),
				)
				await storage.put(MailSetEntryTypeRef, storableSubEntry)

				await storage.put(MailTypeRef, await toStorableInstance(spamMail))
				await storage.put(MailTypeRef, await toStorableInstance(oldSpamMail))
				await storage.put(MailTypeRef, await toStorableInstance(trashMail))
				await storage.put(MailTypeRef, await toStorableInstance(trashSubfolderMail))

				const storableSpamDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: spamDetailsId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					details: createTestEntity(MailDetailsTypeRef, {
						recipients: createTestEntity(RecipientsTypeRef, {}),
						body: createTestEntity(BodyTypeRef, {}),
					}),
				})
				await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(storableSpamDetails))

				const oldStorableSpamDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: oldSpamDetailsId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					details: createTestEntity(MailDetailsTypeRef, {
						recipients: createTestEntity(RecipientsTypeRef, {}),
						body: createTestEntity(BodyTypeRef, {}),
					}),
				})
				await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(oldStorableSpamDetails))

				const trashDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: trashDetailsId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					details: createTestEntity(MailDetailsTypeRef, {
						recipients: createTestEntity(RecipientsTypeRef, {}),
						body: createTestEntity(BodyTypeRef, {}),
					}),
				})
				await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(trashDetails))

				const trashSubDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: trashSubfolderDetailsId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					details: createTestEntity(MailDetailsTypeRef, {
						recipients: createTestEntity(RecipientsTypeRef, {}),
						body: createTestEntity(BodyTypeRef, {}),
					}),
				})
				await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(trashSubDetails))

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDate, userId)

				const mailSetEntryTypeModel = await typeModelResolver.resolveClientTypeReference(MailSetEntryTypeRef)
				const detailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsBlobTypeRef)

				// Ensure only data older than cutoff is cleared
				o.check(await getAllIdsForType(MailTypeRef)).deepEquals([spamMailId, trashMailId, trashSubfolderMailId])
				o.check(await getAllIdsForType(MailSetEntryTypeRef)).deepEquals([
					ensureBase64Ext(mailSetEntryTypeModel, spamMailSetEntryElementId),
					ensureBase64Ext(mailSetEntryTypeModel, trashMailSetEntryElementId),
					ensureBase64Ext(mailSetEntryTypeModel, trashSubfolderMailSetEntryElementId),
				])
				o.check(await getAllIdsForType(MailDetailsBlobTypeRef)).deepEquals([
					ensureBase64Ext(detailsBlobTypeModel, elementIdPart(spamDetailsId)),
					ensureBase64Ext(detailsBlobTypeModel, elementIdPart(trashDetailsId)),
					ensureBase64Ext(detailsBlobTypeModel, elementIdPart(trashSubfolderDetailsId)),
				])

				o.check(await getAllIdsForType(MailFolderTypeRef)).deepEquals([spamFolderId, trashFolderId, trashSubfolderId])
				const count = await dbFacade.get("SELECT COUNT(*) FROM list_entities", [])
				o.check(untagSqlObject(assertNotNull(count))["COUNT(*)"]).equals(9)
			})

			o.test("normal folder is partially cleared", async function () {
				const beforeMailDetailsId: IdTuple = ["detailsListId", "beforeDetailsId"]
				const afterMailDetailsId: IdTuple = ["detailsListId", "afterDetailsId"]

				const inboxFolderId = "inboxFolderId"
				const inboxFolderEntriesId: string = "inboxFolderEntriesId"

				const twoDaysAfterTimeRangeDays = 2
				const twoDaysBeforeTimeRangeDays = -2

				const twoDaysBeforeMailId = offsetId(twoDaysBeforeTimeRangeDays)
				const twoDaysBeforeMailSetEntryElementId = offsetMailSetEntryId(twoDaysBeforeTimeRangeDays, twoDaysBeforeMailId)
				const twoDaysBeforeMailSetEntryId: IdTuple = [inboxFolderEntriesId, twoDaysBeforeMailSetEntryElementId]

				const twoDaysAfterMailId = offsetId(twoDaysAfterTimeRangeDays)
				const twoDaysAfterMailSetEntryElementId = offsetMailSetEntryId(twoDaysAfterTimeRangeDays, twoDaysAfterMailId)
				const twoDaysAfterMailSetEntryId: IdTuple = [inboxFolderEntriesId, twoDaysAfterMailSetEntryElementId]

				const mailBefore = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, offsetId(twoDaysBeforeTimeRangeDays)],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mailDetails: beforeMailDetailsId,
					sender: createTestEntity(MailAddressTypeRef, {
						name: "some name",
						address: "address@tuta.com",
					}),
					conversationEntry: ["listId", "listElementId"],
				})

				const mailAfter = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, offsetId(twoDaysAfterTimeRangeDays)],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mailDetails: afterMailDetailsId,
					sender: createTestEntity(MailAddressTypeRef, {
						name: "some name",
						address: "address@tuta.com",
					}),
					conversationEntry: ["listId", "listElementId"],
				})
				const mailSetEntryBefore = createTestEntity(MailSetEntryTypeRef, {
					_id: twoDaysBeforeMailSetEntryId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mail: mailBefore._id,
				})
				const mailSetEntryAfter = createTestEntity(MailSetEntryTypeRef, {
					_id: twoDaysAfterMailSetEntryId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mail: mailAfter._id,
				})
				const beforeMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: beforeMailDetailsId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					details: createTestEntity(MailDetailsTypeRef, {
						recipients: createTestEntity(RecipientsTypeRef, {}),
						body: createTestEntity(BodyTypeRef, {}),
					}),
				})
				const afterMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: afterMailDetailsId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					details: createTestEntity(MailDetailsTypeRef, {
						recipients: createTestEntity(RecipientsTypeRef, {}),
						body: createTestEntity(BodyTypeRef, {}),
					}),
				})

				const inboxFolder = createTestEntity(MailFolderTypeRef, {
					_id: ["mailFolderList", inboxFolderId],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					folderType: MailSetKind.INBOX,
					entries: inboxFolderEntriesId,
				})
				await storage.put(MailFolderTypeRef, await toStorableInstance(inboxFolder))
				await storage.put(MailTypeRef, await toStorableInstance(mailBefore))
				await storage.put(MailTypeRef, await toStorableInstance(mailAfter))
				await storage.put(MailSetEntryTypeRef, await toStorableInstance(mailSetEntryBefore))
				await storage.put(MailSetEntryTypeRef, await toStorableInstance(mailSetEntryAfter))
				await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(beforeMailDetails))
				await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(afterMailDetails))

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDate, userId)
				const mailSetEntryTypeModel = await typeModelResolver.resolveClientTypeReference(MailSetEntryTypeRef)

				o.check(await getAllIdsForType(MailFolderTypeRef)).deepEquals([inboxFolderId, spamFolderId, trashFolderId])
				const allMailSetEntryIds = await getAllIdsForType(MailSetEntryTypeRef)
				o.check(allMailSetEntryIds).deepEquals([ensureBase64Ext(mailSetEntryTypeModel, twoDaysAfterMailSetEntryElementId)])
				o.check(await getAllIdsForType(MailTypeRef)).deepEquals([twoDaysAfterMailId])
				o.check(await getAllIdsForType(MailDetailsBlobTypeRef)).deepEquals([afterMailDetailsId].map(elementIdPart))
			})

			o.test("normal folder is completely cleared", async function () {
				const oneDayBeforeDetailsId: IdTuple = ["detailsListId", "oneDayBeforeDetailsId"]
				const twoDaysBeforeDetailsId: IdTuple = ["detailsListId", "twoDaysBeforeDetailsId"]

				const inboxFolderId = "inboxFolderId"
				const inboxFolderEntriesId: string = "inboxFolderEntriesId"

				const oneDayBeforeTimeRangeDays = -1
				const twoDaysBeforeTimeRangeDays = -2

				const oneDayBeforeMailId = offsetId(oneDayBeforeTimeRangeDays)
				const oneDayBeforeMailSetEntryElementId = offsetMailSetEntryId(oneDayBeforeTimeRangeDays, oneDayBeforeMailId)
				const oneDayBeforeMailSetEntryId: IdTuple = [inboxFolderEntriesId, oneDayBeforeMailSetEntryElementId]

				const twoDaysBeforeMailId = offsetId(twoDaysBeforeTimeRangeDays)
				const twoDaysBeforeMailSetEntryElementId = offsetMailSetEntryId(twoDaysBeforeTimeRangeDays, twoDaysBeforeMailId)
				const twoDaysBeforeMailSetEntryId: IdTuple = [inboxFolderEntriesId, twoDaysBeforeMailSetEntryElementId]

				const mailOneDayBefore = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, oneDayBeforeMailId],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mailDetails: oneDayBeforeDetailsId,
					sender: createTestEntity(MailAddressTypeRef, {
						name: "some name",
						address: "address@tuta.com",
					}),
					conversationEntry: ["listId", "listElementId"],
				})

				const mailTwoDaysBefore = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, twoDaysBeforeMailId],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mailDetails: twoDaysBeforeDetailsId,
					sender: createTestEntity(MailAddressTypeRef, {
						name: "some name",
						address: "address@tuta.com",
					}),
					conversationEntry: ["listId", "listElementId"],
				})

				const mailSetEntryTwoDaysBefore = createTestEntity(MailSetEntryTypeRef, {
					_id: twoDaysBeforeMailSetEntryId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mail: mailTwoDaysBefore._id,
				})
				const mailSetEntryOneDayBefore = createTestEntity(MailSetEntryTypeRef, {
					_id: oneDayBeforeMailSetEntryId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mail: mailOneDayBefore._id,
				})
				const oneDayBeforeMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: oneDayBeforeDetailsId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					details: createTestEntity(MailDetailsTypeRef, {
						recipients: createTestEntity(RecipientsTypeRef, {}),
						body: createTestEntity(BodyTypeRef, {}),
					}),
				})
				const twoDaysBeforeMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: twoDaysBeforeDetailsId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					details: createTestEntity(MailDetailsTypeRef, {
						recipients: createTestEntity(RecipientsTypeRef, {}),
						body: createTestEntity(BodyTypeRef, {}),
					}),
				})

				const inboxFolder = createTestEntity(MailFolderTypeRef, {
					_id: ["mailFolderList", inboxFolderId],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					folderType: MailSetKind.INBOX,
					entries: inboxFolderEntriesId,
				})
				await storage.put(MailFolderTypeRef, await toStorableInstance(inboxFolder))
				await storage.put(MailTypeRef, await toStorableInstance(mailOneDayBefore))
				await storage.put(MailTypeRef, await toStorableInstance(mailTwoDaysBefore))
				await storage.put(MailSetEntryTypeRef, await toStorableInstance(mailSetEntryTwoDaysBefore))
				await storage.put(MailSetEntryTypeRef, await toStorableInstance(mailSetEntryOneDayBefore))
				await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(oneDayBeforeMailDetails))
				await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(twoDaysBeforeMailDetails))

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDate, userId)

				o.check(await getAllIdsForType(MailFolderTypeRef)).deepEquals([inboxFolderId, spamFolderId, trashFolderId])
				const allMailSetEntryIds = await getAllIdsForType(MailSetEntryTypeRef)
				o.check(allMailSetEntryIds).deepEquals([])
				o.check(await getAllIdsForType(MailTypeRef)).deepEquals([])
				o.check(await getAllIdsForType(MailDetailsBlobTypeRef)).deepEquals([])
			})

			o.test("when mail is deleted, attachment is also deleted", async function () {
				const fileListId = "fileListId"

				const beforeMailDetailsId: IdTuple = ["detailsListId", "beforeDetailsId"]
				const afterMailDetailsId: IdTuple = ["detailsListId", "afterDetailsId"]

				const inboxFolderId = "inboxFolderId"
				const inboxFolderEntriesId: string = "inboxFolderEntriesId"

				const twoDaysAfterTimeRangeDays = 2
				const twoDaysBeforeTimeRangeDays = -2

				const twoDaysBeforeMailId = offsetId(twoDaysBeforeTimeRangeDays)
				const twoDaysBeforeMailSetEntryElementId = offsetMailSetEntryId(twoDaysBeforeTimeRangeDays, twoDaysBeforeMailId)
				const twoDaysBeforeMailSetEntryId: IdTuple = [inboxFolderEntriesId, twoDaysBeforeMailSetEntryElementId]

				const twoDaysAfterMailId = offsetId(twoDaysAfterTimeRangeDays)
				const twoDaysAfterMailSetEntryElementId = offsetMailSetEntryId(twoDaysAfterTimeRangeDays, twoDaysAfterMailId)
				const twoDaysAfterMailSetEntryId: IdTuple = [inboxFolderEntriesId, twoDaysAfterMailSetEntryElementId]

				const fileBefore = createTestEntity(FileTypeRef, {
					_id: [fileListId, "fileBefore"],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
				})
				const fileAfter = createTestEntity(FileTypeRef, {
					_id: [fileListId, "fileAfter"],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
				})

				const mailBefore = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, offsetId(twoDaysBeforeTimeRangeDays)],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mailDetails: beforeMailDetailsId,
					attachments: [fileBefore._id],
					sender: createTestEntity(MailAddressTypeRef, {
						name: "some name",
						address: "address@tuta.com",
					}),
					conversationEntry: ["listId", "listElementId"],
				})
				const mailAfter = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, offsetId(twoDaysAfterTimeRangeDays)],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mailDetails: afterMailDetailsId,
					attachments: [fileAfter._id],
					sender: createTestEntity(MailAddressTypeRef, {
						name: "some name",
						address: "address@tuta.com",
					}),
					conversationEntry: ["listId", "listElementId"],
				})
				const mailSetEntryBefore = createTestEntity(MailSetEntryTypeRef, {
					_id: twoDaysBeforeMailSetEntryId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mail: mailBefore._id,
				})
				const mailSetEntryAfter = createTestEntity(MailSetEntryTypeRef, {
					_id: twoDaysAfterMailSetEntryId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mail: mailAfter._id,
				})
				const beforeMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: beforeMailDetailsId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					details: createTestEntity(MailDetailsTypeRef, {
						recipients: createTestEntity(RecipientsTypeRef, {}),
						body: createTestEntity(BodyTypeRef, {}),
					}),
				})
				const afterMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: afterMailDetailsId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					details: createTestEntity(MailDetailsTypeRef, {
						recipients: createTestEntity(RecipientsTypeRef, {}),
						body: createTestEntity(BodyTypeRef, {}),
					}),
				})

				const inboxFolder = createTestEntity(MailFolderTypeRef, {
					_id: ["mailFolderList", inboxFolderId],
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					folderType: MailSetKind.INBOX,
					entries: inboxFolderEntriesId,
				})
				await storage.put(MailFolderTypeRef, await toStorableInstance(inboxFolder))
				await storage.put(MailSetEntryTypeRef, await toStorableInstance(mailSetEntryBefore))
				await storage.put(MailSetEntryTypeRef, await toStorableInstance(mailSetEntryAfter))
				await storage.put(MailTypeRef, await toStorableInstance(mailBefore))
				await storage.put(MailTypeRef, await toStorableInstance(mailAfter))
				await storage.put(FileTypeRef, await toStorableInstance(fileBefore))
				await storage.put(FileTypeRef, await toStorableInstance(fileAfter))
				await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(beforeMailDetails))
				await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(afterMailDetails))

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDate, userId)

				o.check(await getAllIdsForType(MailTypeRef)).deepEquals([getElementId(mailAfter)])
				o.check(await getAllIdsForType(FileTypeRef)).deepEquals([getElementId(fileAfter)])
			})
		})
	})

	o.spec("Integration", function () {
		const mailBagMailListId = "mailBagMailListId"

		function createMailList(
			numMails: number,
			idGenerator: IdGenerator,
			mailSetEntryIdGenerator: MailSetEntryIdGenerator,
			getSubject: (i: number) => string,
			getBody: (i: number) => string,
			folder: MailFolder,
		): { mailSetEntries: Array<MailSetEntry>; mails: Array<Mail>; mailDetailsBlobs: Array<MailDetailsBlob> } {
			const mailSetEntries: Array<MailSetEntry> = []
			const mails: Array<Mail> = []
			const mailDetailsBlobs: Array<MailDetailsBlob> = []
			for (let i = 0; i < numMails; ++i) {
				const mailId = idGenerator.getNext()
				const mailDetailsId = idGenerator.getNext()
				const mailSetEntryElementId = mailSetEntryIdGenerator.getNext(mailId)
				const mailSetEntryId: IdTuple = [folder.entries, mailSetEntryElementId]
				mailSetEntries.push(
					createTestEntity(MailSetEntryTypeRef, {
						_id: mailSetEntryId,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						mail: [mailBagMailListId, mailId],
					}),
				)
				mails.push(
					createTestEntity(MailTypeRef, {
						_id: [mailBagMailListId, mailId],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						subject: getSubject(i),
						sets: [folder._id],
						mailDetails: ["detailsListId", mailDetailsId],
						sender: createTestEntity(MailAddressTypeRef, {
							name: "some name",
							address: "address@tuta.com",
						}),
						conversationEntry: ["listId", "listElementId"],
					}),
				)
				mailDetailsBlobs.push(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: ["detailsListId", mailDetailsId],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						details: createTestEntity(MailDetailsTypeRef, {
							body: createTestEntity(BodyTypeRef, { text: getBody(i) }),
							recipients: createTestEntity(RecipientsTypeRef, {}),
						}),
					}),
				)
			}
			return { mailSetEntries, mails, mailDetailsBlobs }
		}

		o.test("cleanup works as expected", async function () {
			// Time range is five days
			const oldIds = new IdGenerator(offsetId(-5))
			const newIds = new IdGenerator(offsetId(5))
			const oldMailSetEntryIds = new MailSetEntryIdGenerator(offsetMailSetEntryId(-5, GENERATED_MIN_ID))
			const newMailSetEntryNewIds = new MailSetEntryIdGenerator(offsetMailSetEntryId(5, GENERATED_MIN_ID))

			const userMailbox = createTestEntity(MailBoxTypeRef, {
				_id: "mailboxId",
				_ownerGroup: "ownerGroup",
				_permissions: "permissions",
				currentMailBag: createTestEntity(MailBagTypeRef, { mails: mailBagMailListId }),
				folders: createMailFolderRef({ folders: "mailFolderList" }),
				sentAttachments: "sentAttachments",
				receivedAttachments: "receivedAttachments",
				importedAttachments: "importedAttachments",
				mailImportStates: "mailImportStates",
			})

			const inboxFolder = createTestEntity(MailFolderTypeRef, {
				_id: ["mailFolderList", oldIds.getNext()],
				_ownerGroup: "ownerGroup",
				_permissions: "permissions",
				folderType: MailSetKind.INBOX,
				entries: "inboxEntriesListId",
			})
			const {
				mailSetEntries: oldInboxMailSetEntries,
				mails: oldInboxMails,
				mailDetailsBlobs: oldInboxMailDetailsBlobs,
			} = createMailList(
				3,
				oldIds,
				oldMailSetEntryIds,
				(i) => `old subject ${i}`,
				(i) => `old body ${i}`,
				inboxFolder,
			)

			const {
				mailSetEntries: newInboxMailSetEntries,
				mails: newInboxMails,
				mailDetailsBlobs: newInboxMailDetailsBlobs,
			} = createMailList(
				3,
				newIds,
				newMailSetEntryNewIds,
				(i) => `new subject ${i}`,
				(i) => `new body ${i}`,
				inboxFolder,
			)

			const trashFolder = createTestEntity(MailFolderTypeRef, {
				_id: ["mailFolderList", oldIds.getNext()],
				_ownerGroup: "ownerGroup",
				_permissions: "permissions",
				folderType: MailSetKind.TRASH,
				entries: "trashEntriesListId",
			})
			const {
				mailSetEntries: oldTrashMailSetEntries,
				mails: oldTrashMails,
				mailDetailsBlobs: oldTrashMailDetailsBlobs,
			} = createMailList(
				3,
				oldIds,
				oldMailSetEntryIds,
				(i) => `old trash subject ${i}`,
				(i) => `old trash body ${i}`,
				trashFolder,
			)
			const {
				mailSetEntries: newTrashMailSetEntries,
				mails: newTrashMails,
				mailDetailsBlobs: newTrashMailDetailsBlobs,
			} = createMailList(
				3,
				newIds,
				newMailSetEntryNewIds,
				(i) => `new trash subject ${i}`,
				(i) => `new trash body ${i}`,
				trashFolder,
			)

			const spamFolder = createTestEntity(MailFolderTypeRef, {
				_id: ["mailFolderList", oldIds.getNext()],
				_ownerGroup: "ownerGroup",
				_permissions: "permissions",
				folderType: MailSetKind.SPAM,
				entries: "spamEntriesListId",
			})
			const {
				mailSetEntries: oldSpamMailSetEntries,
				mails: oldSpamMails,
				mailDetailsBlobs: oldSpamMailDetailsBlobs,
			} = createMailList(
				2,
				oldIds,
				oldMailSetEntryIds,
				(i) => `old spam subject ${i}`,
				(i) => `old spam body ${i}`,
				spamFolder,
			)
			const {
				mailSetEntries: newSpamMailSetEntries,
				mails: newSpamMails,
				mailDetailsBlobs: newSpamMailDetailsBlobs,
			} = createMailList(
				2,
				newIds,
				newMailSetEntryNewIds,
				(i) => `new spam subject ${i}`,
				(i) => `new spam body ${i}`,
				spamFolder,
			)

			let everyEntity: Array<SomeEntity> = [
				userMailbox,
				inboxFolder,
				trashFolder,
				spamFolder,
				...oldInboxMailSetEntries,
				...oldInboxMails,
				...oldInboxMailDetailsBlobs,
				...newInboxMailSetEntries,
				...newInboxMails,
				...newInboxMailDetailsBlobs,
				...oldTrashMailSetEntries,
				...oldTrashMails,
				...oldTrashMailDetailsBlobs,
				...newTrashMailSetEntries,
				...newTrashMails,
				...newTrashMailDetailsBlobs,
				...oldSpamMailSetEntries,
				...oldSpamMails,
				...oldSpamMailDetailsBlobs,
				...newSpamMailSetEntries,
				...newSpamMails,
				...newSpamMailDetailsBlobs,
			]

			await storage.init({ userId, databaseKey: offlineDatabaseTestKey, timeRangeDate, forceNewDatabase: false })

			for (const entity of everyEntity) {
				const storableInstance = await toStorableInstance(entity)
				await storage.put(entity._type, storableInstance)
			}

			await storage.setNewRangeForList(
				MailSetEntryTypeRef,
				inboxFolder.entries,
				elementIdPart(getFirstOrThrow(oldInboxMailSetEntries)._id),
				elementIdPart(lastThrow(newInboxMailSetEntries)._id),
			)
			await storage.setNewRangeForList(
				MailSetEntryTypeRef,
				trashFolder.entries,
				elementIdPart(getFirstOrThrow(oldTrashMailSetEntries)._id),
				elementIdPart(lastThrow(newTrashMailSetEntries)._id),
			)
			await storage.setNewRangeForList(
				MailSetEntryTypeRef,
				spamFolder.entries,
				elementIdPart(getFirstOrThrow(oldSpamMailSetEntries)._id),
				elementIdPart(lastThrow(newSpamMailSetEntries)._id),
			)

			// Here we clear the excluded data
			await storage.clearExcludedData(timeRangeDate, userId)

			const assertContents = async ({ _id, _type }, expected, msg) => {
				const { listId, elementId } = expandId(_id)
				let valueFromDb = await storage.get(_type, listId, elementId)
				if (valueFromDb !== null) {
					removeOriginals(valueFromDb)
				}
				return o.check(valueFromDb).deepEquals(expected)(msg)
			}

			await promiseMap(oldInboxMails, (mail) => assertContents(mail, null, `old mail ${mail._id} was deleted`))
			await promiseMap(oldInboxMailDetailsBlobs, (body) => assertContents(body, null, `old mailBody ${body._id} was deleted`))

			await promiseMap(newInboxMails, (mail) => assertContents(mail, mail, `new mail ${mail._id} was not deleted`))
			await promiseMap(newInboxMailDetailsBlobs, (body) => assertContents(body, body, `new mailBody ${body._id} was not deleted`))

			await promiseMap(oldTrashMails, (mail) => assertContents(mail, null, `old trash mail ${mail._id} was deleted`))
			await promiseMap(oldTrashMailDetailsBlobs, (body) => assertContents(body, null, `old trash mailBody ${body._id} was deleted`))

			await promiseMap(newTrashMails, (mail) => assertContents(mail, mail, `new trash mail ${mail._id} was not deleted`))
			await promiseMap(newTrashMailDetailsBlobs, (body) => assertContents(body, body, `new trash mailBody ${body._id} was not deleted`))

			await promiseMap(oldSpamMails, (mail) => assertContents(mail, null, `old spam mail ${mail._id} was deleted`))
			await promiseMap(oldSpamMailDetailsBlobs, (body) => assertContents(body, null, `old spam mailBody ${body._id} was deleted`))

			await promiseMap(newSpamMails, (mail) => assertContents(mail, mail, `new spam mail ${mail._id} was not deleted`))
			await promiseMap(newSpamMailDetailsBlobs, (body) => assertContents(body, body, `new spam mailBody ${body._id} was not deleted`))

			await assertContents(inboxFolder, inboxFolder, `inbox folder was not deleted`)
			await assertContents(trashFolder, trashFolder, `trash folder was not deleted`)
			await assertContents(spamFolder, spamFolder, `spam folder was not deleted`)

			// base64Ext encoding is not needed here, as storage.getRangeForList is returning custom elementIds in base64Url already
			o.check(await storage.getRangeForList(MailSetEntryTypeRef, inboxFolder.entries)).deepEquals({
				lower: cutoffMailSetEntryId,
				upper: elementIdPart(lastThrow(newInboxMailSetEntries)._id),
			})("lower range for inbox was set to cutoff")
			o.check(await storage.getRangeForList(MailSetEntryTypeRef, trashFolder.entries)).deepEquals({
				lower: cutoffMailSetEntryId,
				upper: elementIdPart(lastThrow(newTrashMailSetEntries)._id),
			})("lower range for trash was set to cutoff")
			o.check(await storage.getRangeForList(MailSetEntryTypeRef, spamFolder.entries)).deepEquals({
				lower: cutoffMailSetEntryId,
				upper: elementIdPart(lastThrow(newSpamMailSetEntries)._id),
			})("lower range for spam was set to cutoff")
		})
	})
})
