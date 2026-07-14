import o, { verify } from "@tutao/otest"
import { OfflineStorage, TableDefinitions } from "../../../../src/app-kit/local-store/OfflineStorage.js"
import { instance, matchers, object, when } from "testdouble"
import {
	constructMailSetEntryId,
	deconstructMailSetEntryId,
	elementIdPart,
	Entity,
	GENERATED_MAX_ID,
	getTypeString,
	listIdPart,
	timestampToGeneratedId,
	Type as TypeId,
	TypeRef,
} from "../../../../src/platform-kit/meta"
import { assertNotNull, getDayShifted, typedKeys } from "../../../../src/platform-kit/utils"
import { DateProvider } from "../../../../src/platform-kit/utils/DateProvider.js"
import { OfflineStorageMigrator } from "../../../../src/app-kit/local-store/OfflineStorageMigrator.js"
import { DesktopSqlCipher } from "../../../../src/applications/common/desktop/db/DesktopSqlCipher.js"
import {
	clientInitializedTypeModelResolver,
	createTestEntity,
	modelMapperFromTypeModelResolver,
	offlineMapperFromTypeModelResolver,
	removeOriginals,
} from "../../TestUtils.js"
import { sql } from "../../../../src/app-kit/local-store/Sql.js"
import { CustomCacheHandler, CustomCacheHandlerMap } from "../../../../src/app-kit/local-store/CustomCacheHandler"
import { DecryptedParsedInstance, ModelMapper, TypeModelResolver } from "../../../../src/platform-kit/instance-pipeline"

import { ApplicationTypesFacade } from "../../../../src/platform-kit/instance-pipeline/ApplicationTypesFacade"
import {
	OfflineStorageLastProcessedEventBatchStorageFacade
} from "../../../../src/applications/common/api/worker/LastProcessedEventBatchStorageFacade"
import {
	InterWindowEventFacadeSendDispatcher
} from "../../../../src/app-kit/native-bridge/common/generatedipc/dispatchers/InterWindowEventFacadeSendDispatcher.js"
import { SqlCipherFacade } from "../../../../src/app-kit/native-bridge/common/generatedipc/types/SqlCipherFacade.js"
import {
	BodyTypeRef,
	Contact,
	ContactListTypeRef,
	ContactTypeRef,
	Mail,
	MailAddressTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "@tutao/entities/tutanota"
import { BlobArchiveRefTypeRef } from "@tutao/entities/storage"
import { SqlType } from "../../../../src/app-kit/local-store/Types.js"

import { GroupMembershipTypeRef, User, UserTypeRef } from "@tutao/entities/sys"
import { OfflineMapper } from "../../../../src/platform-kit/instance-pipeline/OfflineMapper"
import { InstanceDirection } from "../../../../src/platform-kit/instance-pipeline/ParsedValue"
import { changeInstanceDirection } from "../../instance-pipeline/InstancePipelineTestUtils"
import { OfflineStorageArgs } from "../../../../src/platform-kit/base/facades/CacheStorageLateInitializer"

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

o.spec("OfflineStorageDbTest", function () {
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
	let interWindowEventSenderMock: InterWindowEventFacadeSendDispatcher
	let typeModelResolver: TypeModelResolver
	let modelMapper: ModelMapper
	let offlineMapper: OfflineMapper
	let customCacheHandlerMap: CustomCacheHandlerMap
	let applicationTypesFacadeMock: ApplicationTypesFacade

	o.beforeEach(async function () {
		// integrity checks do not work with in-memory databases
		dbFacade = new DesktopSqlCipher(databasePath, false)
		applicationTypesFacadeMock = object<ApplicationTypesFacade>()
		dateProviderMock = object<DateProvider>()
		migratorMock = instance(OfflineStorageMigrator)
		interWindowEventSenderMock = instance(InterWindowEventFacadeSendDispatcher)
		typeModelResolver = clientInitializedTypeModelResolver()
		modelMapper = modelMapperFromTypeModelResolver(typeModelResolver)
		offlineMapper = offlineMapperFromTypeModelResolver(typeModelResolver)
		when(dateProviderMock.now()).thenReturn(now.getTime())
		customCacheHandlerMap = object()

		storage = new OfflineStorage(
			dbFacade,
			interWindowEventSenderMock,
			migratorMock,
			modelMapper,
			typeModelResolver,
			offlineMapper,
			customCacheHandlerMap,
			{},
		)
	})

	o.afterEach(async function () {
		await dbFacade.closeDb()
	})

	async function toStorableInstance(entity: Entity): Promise<DecryptedParsedInstance> {
		const decryptedInstance = await modelMapper.mapToDecryptedInstance(entity)
		changeInstanceDirection(decryptedInstance, InstanceDirection.IncomingFromServer)
		return decryptedInstance
	}

	o.spec("additionalTables", () => {
		let sqlMock: SqlCipherFacade

		o.beforeEach(async () => {
			sqlMock = object()
			// to satisfy the external o.afterEach()
			// we won't actually use this storage instance for these tests, since we don't want to test with real facades
			await storage.init(new OfflineStorageArgs(userId, databaseKey, false))
		})

		o.test("init calls createTables which initializes all tables", async () => {
			const storageWithMockedSql = new OfflineStorage(sqlMock, object(), object(), object(), object(), object(), object(), {
				some_table: {
					definition: "some statement will be run here",
					purgedWithCache: false,
				},
				another_table: {
					definition: "another statement will be run here",
					purgedWithCache: true,
				},
			})
			await storageWithMockedSql.init(new OfflineStorageArgs(userId, databaseKey, false))
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

			const storageWithMockedSql = new OfflineStorage(sqlMock, object(), object(), object(), object(), object(), object(), {
				some_table: {
					definition: "some statement will be run here",
					purgedWithCache: false,
				},
				another_table: {
					definition: "another statement will be run here",
					purgedWithCache: true,
				},
			})
			await storageWithMockedSql.init(new OfflineStorageArgs(userId, databaseKey, false))
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

			const storageWithMockedSql = new OfflineStorage(sqlMock, object(), object(), object(), object(), object(), object(), {
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
			await storageWithMockedSql.init(new OfflineStorageArgs(userId, databaseKey, false))
			await storageWithMockedSql.purgeStorage()
			verify(sqlMock.run("onBeforePurged was called", []), { times: 1 })
		})

		o.test("tables are created after migration", async function () {
			when(sqlMock.get(matchers.contains("SELECT COUNT(*) as metadata_exists"), matchers.anything())).thenResolve({
				metadata_exists: { type: SqlType.Number, value: 1 },
			})

			const storageWithMockedSql = new OfflineStorage(sqlMock, object(), object(), object(), object(), object(), object(), {
				some_table: {
					definition: "some statement will be run here",
					purgedWithCache: false,
				},
			})

			when(migratorMock.migrate(storageWithMockedSql)).thenDo(() => {
				verify(sqlMock.run("some statement will be run here", []), { times: 1 })
			})
			await storageWithMockedSql.init(new OfflineStorageArgs(userId, databaseKey, false))
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
			await storage.init(new OfflineStorageArgs(userId, databaseKey, false))
			verify(migratorMock.migrate(storage))
		})

		o.spec("custom cache handlers", function () {
			const userId = "userId1"

			o.beforeEach(async function () {
				await storage.init(new OfflineStorageArgs(userId, databaseKey, false))
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

					await storage.init(new OfflineStorageArgs(userId, databaseKey, false))

					await storage.put(UserTypeRef, storableUser)

					await storage.deleteAllOfType(UserTypeRef)
					verify(userCacheHandler.onBeforeCacheDeletion?.(userId))
				})

				o.spec("calls the cache handler for list element types", function () {
					o.test("Mail ListElementType", async function () {
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

					o.test("Contact ListElementType", async function () {
						const id: IdTuple = ["listId", "id1"]
						const entityToStore = createTestEntity(
							ContactTypeRef,
							{
								_id: id,
								_ownerGroup: "ownerGroup",
							},
							{ populateAggregates: true },
						)
						const storableContact = await toStorableInstance(entityToStore)

						const customCacheHandler: CustomCacheHandler<Contact> = object()
						when(customCacheHandlerMap.get(ContactTypeRef)).thenReturn(customCacheHandler)

						await storage.put(ContactTypeRef, storableContact)

						await storage.deleteAllOfType(ContactTypeRef)
						verify(customCacheHandler.onBeforeCacheDeletion?.(id))
					})
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

				o.spec("calls the cache handler for list element types", function () {
					o.test("Mail ListElementType", async function () {
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

					o.test("Contact ListElementType", async function () {
						const id: IdTuple = ["listId", "id1"]
						const entityToStore = createTestEntity(
							ContactTypeRef,
							{
								_id: id,
								_ownerGroup: groupId,
							},
							{ populateAggregates: true },
						)
						const storableContact = await toStorableInstance(entityToStore)

						const customCacheHandler: CustomCacheHandler<Contact> = object()
						when(customCacheHandlerMap.get(ContactTypeRef)).thenReturn(customCacheHandler)

						await storage.put(ContactTypeRef, storableContact)

						await storage.deleteAllOwnedBy(groupId)
						verify(customCacheHandler.onBeforeCacheDeletion?.(id))
					})
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

					await storage.init(new OfflineStorageArgs(userId, databaseKey, false))

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

					await storage.init(new OfflineStorageArgs(userId1, databaseKey, false))

					let storedUsers = [await storage.get(UserTypeRef, null, userId1), await storage.get(UserTypeRef, null, userId2)].filter((u) => u != null)
					o(storedUsers).deepEquals([])

					await storage.putMultiple(UserTypeRef, await Promise.all(storableUsers.map(async (u) => await toStorableInstance(u))))

					storedUsers = [assertNotNull(await storage.get(UserTypeRef, null, userId1)), assertNotNull(await storage.get(UserTypeRef, null, userId2))]
					o(storedUsers.map(removeOriginals)).deepEquals(storableUsers)
				})
			})

			o.spec("put", function () {
				o.test("when updating element types the rowid is preserved", async function () {
					await storage.init(new OfflineStorageArgs(userId, databaseKey, false))
					const id = "id1"
					const ownerGroup = "ownerGroup1"

					const entity = createTestEntity(ContactListTypeRef, {
						_id: id,
						_ownerGroup: ownerGroup,
						_permissions: "permissions",
						_ownerEncSessionKey: null,
						_ownerKeyVersion: null,
						_kdfNonce: null,
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
					await storage.init(new OfflineStorageArgs(userId, databaseKey, false))
					const id: IdTuple = ["id1", "idPart2"]
					const ownerGroup = "ownerGroup1"

					const entity = createTestEntity(BlobArchiveRefTypeRef, {
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
					await storage.init(new OfflineStorageArgs(userId, databaseKey, false))
					const id: IdTuple = ["id1", "idPart2"]
					const ownerGroup = "ownerGroup1"

					const entity = createTestEntity(
						MailDetailsBlobTypeRef,
						{
							_id: id,
							_ownerGroup: ownerGroup,
						},
						{ populateAggregates: true },
					)

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

					await storage.init(new OfflineStorageArgs(elementId, databaseKey, false))

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

				o.test("deleteRange", async function () {
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

					const otherListId = "listId2"
					const otherElementId = "id2"
					const otherStorableMail = await toStorableInstance(
						createTestEntity(MailTypeRef, {
							_id: [otherListId, otherElementId],
							_ownerGroup: "ownerGroup",
							_permissions: "permissions",
							sender: createTestEntity(MailAddressTypeRef, {
								name: "other name",
								address: "other@tuta.com",
							}),
							conversationEntry: ["listId", "listElementId"],
						}),
					)

					await storage.init(new OfflineStorageArgs(elementId, databaseKey, false))

					let mail = await storage.get(MailTypeRef, listId, elementId)
					o.check(mail).equals(null)

					await storage.put(MailTypeRef, storableMail)
					await storage.setNewRangeForList(MailTypeRef, listId, elementId, elementId)

					await storage.put(MailTypeRef, otherStorableMail)
					await storage.setNewRangeForList(MailTypeRef, otherListId, otherElementId, otherElementId)

					mail = await storage.get(MailTypeRef, listId, elementId)
					o.check(mail!._id).deepEquals([listId, elementId])
					mail = await storage.get(MailTypeRef, otherListId, otherElementId)
					o.check(mail!._id).deepEquals([otherListId, otherElementId])

					let rangeBefore = await storage.getRangeForList(MailTypeRef, listId)
					o.check(rangeBefore).deepEquals({ upper: elementId, lower: elementId })
					rangeBefore = await storage.getRangeForList(MailTypeRef, otherListId)
					o.check(rangeBefore).deepEquals({ upper: otherElementId, lower: otherElementId })

					await storage.deleteRange(MailTypeRef, listId)

					//Check that entities are still in cache and only range is deleted
					mail = await storage.get(MailTypeRef, listId, elementId)
					o.check(mail!._id).deepEquals([listId, elementId])
					mail = await storage.get(MailTypeRef, otherListId, otherElementId)
					o.check(mail!._id).deepEquals([otherListId, otherElementId])

					let rangeAfter = await storage.getRangeForList(MailTypeRef, listId)
					o.check(rangeAfter).equals(null)
					rangeAfter = await storage.getRangeForList(MailTypeRef, otherListId)
					o.check(rangeAfter).deepEquals({ upper: otherElementId, lower: otherElementId })
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

					await storage.init(new OfflineStorageArgs(elementId1, databaseKey, false))

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

					await storage.init(new OfflineStorageArgs(elementId, databaseKey, false))

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

					await storage.init(new OfflineStorageArgs(elementId1, databaseKey, false))

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

					await storage.init(new OfflineStorageArgs(userId, databaseKey, false))

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

					await storage.init(new OfflineStorageArgs(userId, databaseKey, false))

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

					await storage.init(new OfflineStorageArgs(userId, databaseKey, false))

					await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(storableMailDetails))

					await storage.deleteAllOwnedBy(_ownerGroup)

					const mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
					o.check(mailDetailsBlob).equals(null)
				})
			})
		})
	})

	o.spec("OfflineStorageLastProcessedEventBatchStorageFacade tests", function () {
		let offlineStorageLastProcessedEventBatchStorageFacade: OfflineStorageLastProcessedEventBatchStorageFacade
		const groupId1 = "groupId1"
		const lastProcessedEventBatchId1 = "lastProcessedEventBatchId1"
		o.beforeEach(async function () {
			await storage.init(new OfflineStorageArgs(userId, databaseKey, false))
			offlineStorageLastProcessedEventBatchStorageFacade = new OfflineStorageLastProcessedEventBatchStorageFacade(dbFacade)
		})
		o.test("getLastEntityEventBatchForGroup roundtrip works", async () => {
			await offlineStorageLastProcessedEventBatchStorageFacade.putLastEntityEventBatchForGroup(groupId1, lastProcessedEventBatchId1)
			const lastProcessedEventBatchIdFromDb = await offlineStorageLastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(groupId1)
			o.check(lastProcessedEventBatchIdFromDb).equals(lastProcessedEventBatchId1)
		})
		o.test("getLastEntityEventBatchForGroup returns null when there is no entry", async () => {
			const lastProcessedEventBatchIdFromDb = await offlineStorageLastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(groupId1)
			o.check(lastProcessedEventBatchIdFromDb).equals(null)
		})
	})
})
