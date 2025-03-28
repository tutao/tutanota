import o from "@tutao/otest"
import { verify } from "@tutao/tutanota-test-utils"
import { customTypeEncoders, ensureBase64Ext, OfflineStorage, OfflineStorageCleaner } from "../../../../../src/common/api/worker/offline/OfflineStorage.js"
import { instance, object, when } from "testdouble"
import * as cborg from "cborg"
import {
	constructMailSetEntryId,
	CUSTOM_MAX_ID,
	CUSTOM_MIN_ID,
	deconstructMailSetEntryId,
	elementIdPart,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	generatedIdToTimestamp,
	getElementId,
	listIdPart,
	timestampToGeneratedId,
} from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { getDayShifted, getFirstOrThrow, getTypeId, lastThrow, mapNullable, promiseMap, TypeRef } from "@tutao/tutanota-utils"
import { DateProvider } from "../../../../../src/common/api/common/DateProvider.js"
import {
	BodyTypeRef,
	createMailFolderRef,
	FileTypeRef,
	Mail,
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
} from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { OfflineStorageMigrator } from "../../../../../src/common/api/worker/offline/OfflineStorageMigrator.js"
import { InterWindowEventFacadeSendDispatcher } from "../../../../../src/common/native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import * as fs from "node:fs"
import { untagSqlObject } from "../../../../../src/common/api/worker/offline/SqlValue.js"
import { MailSetKind } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { BlobElementEntity, ElementEntity, ListElementEntity, SomeEntity } from "../../../../../src/common/api/common/EntityTypes.js"
import { resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions.js"
import { Type as TypeId } from "../../../../../src/common/api/common/EntityConstants.js"
import { expandId } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache.js"
import { UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { DesktopSqlCipher } from "../../../../../src/common/desktop/db/DesktopSqlCipher.js"
import { createTestEntity } from "../../../TestUtils.js"
import { sql } from "../../../../../src/common/api/worker/offline/Sql.js"
import { MailOfflineCleaner } from "../../../../../src/mail-app/workerUtils/offline/MailOfflineCleaner.js"
import Id from "../../../../../src/mail-app/translations/id.js"

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

function encode(thing) {
	return cborg.encode(thing, { typeEncoders: customTypeEncoders })
}

const nativePath = __NODE_GYP_better_sqlite3
const databasePath = ":memory:"
export const offlineDatabaseTestKey = Uint8Array.from([3957386659, 354339016, 3786337319, 3366334248])

o.spec("OfflineStorageDb", function () {
	const now = new Date("2022-01-01 00:00:00 UTC")
	const timeRangeDays = 10
	const userId = "userId"
	const databaseKey = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])

	/** get an id based on a timestamp that is {@param days} days away from the time range cutoff */
	const offsetId = (days) => timestampToGeneratedId(getDayShifted(now, 0 - timeRangeDays + days).getTime())
	const offsetMailSetEntryId = (days, mailId) => constructMailSetEntryId(getDayShifted(now, 0 - timeRangeDays + days), mailId)
	const cuttoffMailSetEntryId = offsetMailSetEntryId(0, GENERATED_MAX_ID)

	let dbFacade: DesktopSqlCipher
	let dateProviderMock: DateProvider
	let storage: OfflineStorage
	let migratorMock: OfflineStorageMigrator
	let offlineStorageCleanerMock: OfflineStorageCleaner
	let interWindowEventSenderMock: InterWindowEventFacadeSendDispatcher

	o.beforeEach(async function () {
		// integrity checks do not work with in-memory databases
		dbFacade = new DesktopSqlCipher(nativePath, databasePath, false)

		dateProviderMock = object<DateProvider>()
		migratorMock = instance(OfflineStorageMigrator)
		interWindowEventSenderMock = instance(InterWindowEventFacadeSendDispatcher)
		offlineStorageCleanerMock = new MailOfflineCleaner()
		when(dateProviderMock.now()).thenReturn(now.getTime())
		storage = new OfflineStorage(dbFacade, interWindowEventSenderMock, dateProviderMock, migratorMock, offlineStorageCleanerMock)
	})

	o.afterEach(async function () {
		await dbFacade.closeDb()
	})

	o.spec("Unit test", function () {
		/**
		 * inserts an entity into the offline test database, and ensures
		 * that all customIds are **base64Ext** encoded before inserting.
		 * @param entity
		 */
		async function insertEntity(entity: SomeEntity) {
			const typeModel = await resolveTypeReference(entity._type)
			const type = getTypeId(entity._type)
			let preparedQuery
			switch (typeModel.type) {
				case TypeId.Element.valueOf(): {
					const elementId = (entity as ElementEntity)._id
					const encodedElementId = ensureBase64Ext(typeModel, elementId)
					preparedQuery = sql`insert into element_entities
                                        values (${type}, ${encodedElementId}, ${entity._ownerGroup},
                                                ${encode(entity)})`
					break
				}
				case TypeId.ListElement.valueOf(): {
					const [listId, elementId] = (entity as ListElementEntity)._id
					const encodedElementId = ensureBase64Ext(typeModel, elementId)
					preparedQuery = sql`INSERT INTO list_entities
                                        VALUES (${type}, ${listId}, ${encodedElementId}, ${entity._ownerGroup},
                                                ${encode(entity)})`
					break
				}
				case TypeId.BlobElement.valueOf(): {
					const [archiveId, blobElementId] = (entity as BlobElementEntity)._id
					preparedQuery = sql`INSERT INTO blob_element_entities
                                        VALUES (${type}, ${archiveId}, ${blobElementId}, ${entity._ownerGroup},
                                                ${encode(entity)})`
					break
				}
				default:
					throw new Error("must be a persistent type")
			}
			await dbFacade.run(preparedQuery.query, preparedQuery.params)
		}

		/**
		 * inserts a range (lower - upper) into the offline "ranges" test database, and ensures
		 * that all customId elementIds (used for lower and upper) are **base64Ext** encoded before inserting.
		 * @param typeRef
		 * @param listId
		 * @param lower
		 * @param upper
		 */
		async function insertRange(typeRef: TypeRef<unknown>, listId: string, lower: string, upper: string) {
			const typeModel = await resolveTypeReference(typeRef)
			const encodedLower = ensureBase64Ext(typeModel, lower)
			const encodedUpper = ensureBase64Ext(typeModel, upper)
			const { query, params } = sql`INSERT INTO ranges
                                        VALUES (${getTypeId(typeRef)}, ${listId}, ${encodedLower}, ${encodedUpper})`
			await dbFacade.run(query, params)
		}

		async function getAllIdsForType(typeRef: TypeRef<unknown>): Promise<Id[]> {
			const typeModel = await resolveTypeReference(typeRef)
			let preparedQuery
			switch (typeModel.type) {
				case TypeId.Element.valueOf():
					preparedQuery = sql`select *
                                        from element_entities
                                        where type = ${getTypeId(typeRef)}`
					break
				case TypeId.ListElement.valueOf():
					preparedQuery = sql`select *
                                        from list_entities
                                        where type = ${getTypeId(typeRef)}`
					break
				case TypeId.BlobElement.valueOf():
					preparedQuery = sql`select *
                                        from blob_element_entities
                                        where type = ${getTypeId(typeRef)}`
					break
				default:
					throw new Error("must be a persistent type")
			}
			return (await dbFacade.all(preparedQuery.query, preparedQuery.params)).map((r) => r.elementId.value as Id)
		}

		o.test("migrations are run", async function () {
			await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })
			verify(migratorMock.migrate(storage, dbFacade))
		})

		o.spec("Offline storage round trip", function () {
			o.spec("ElementType", function () {
				o.test("deleteAllOfType", async function () {
					const userId = "id1"
					const storableUser = createTestEntity(UserTypeRef, { _id: userId })

					await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })

					let user = await storage.get(UserTypeRef, null, userId)
					o(user).equals(null)

					await storage.put(storableUser)

					user = await storage.get(UserTypeRef, null, userId)
					o(user!._id).equals(storableUser._id)

					await storage.deleteAllOfType(UserTypeRef)

					user = await storage.get(UserTypeRef, null, userId)
					o(user).equals(null)
				})
			})

			o.spec("ListElementType generatedId", function () {
				o.test("deleteAllOfType", async function () {
					const listId = "listId1"
					const elementId = "id1"
					const storableMail = createTestEntity(MailTypeRef, { _id: [listId, elementId] })

					await storage.init({ userId: elementId, databaseKey, timeRangeDays, forceNewDatabase: false })

					let mail = await storage.get(MailTypeRef, listId, elementId)
					o(mail).equals(null)

					await storage.put(storableMail)
					await storage.setNewRangeForList(MailTypeRef, listId, elementId, elementId)

					mail = await storage.get(MailTypeRef, listId, elementId)
					o(mail!._id).deepEquals(storableMail._id)
					const rangeBefore = await storage.getRangeForList(MailTypeRef, listId)
					o(rangeBefore).deepEquals({ upper: elementId, lower: elementId })
					await storage.deleteAllOfType(MailTypeRef)

					mail = await storage.get(MailTypeRef, listId, elementId)
					o(mail).equals(null)
					const rangeAfter = await storage.getRangeForList(MailTypeRef, listId)
					o(rangeAfter).equals(null)
				})

				o.test("deleteWholeList", async function () {
					const listOne = "listId1"
					const listTwo = "listId2"
					await storage.init({ userId: "user", databaseKey, timeRangeDays, forceNewDatabase: false })

					const listOneMailOne = createTestEntity(MailTypeRef, { _id: [listOne, "id1"] })
					const listOneMailTwo = createTestEntity(MailTypeRef, { _id: [listOne, "id2"] })
					const listTwoMail = createTestEntity(MailTypeRef, { _id: [listTwo, "id3"] })
					await storage.put(listOneMailOne)
					await storage.put(listOneMailTwo)
					await storage.put(listTwoMail)
					await storage.setNewRangeForList(MailTypeRef, listOne, "id1", "id2")
					await storage.setNewRangeForList(MailTypeRef, listTwo, "id3", "id3")

					await storage.deleteWholeList(MailTypeRef, listOne)

					const mailsInListOne = await storage.getWholeList(MailTypeRef, listOne)
					const mailsInListTwo = await storage.getWholeList(MailTypeRef, listTwo)
					const rangeListOne = await storage.getRangeForList(MailTypeRef, listOne)
					const rangeListTwo = await storage.getRangeForList(MailTypeRef, listTwo)

					o(mailsInListOne).deepEquals([])
					o(mailsInListTwo).deepEquals([listTwoMail])
					o(rangeListOne).equals(null)
					o(rangeListTwo).deepEquals({ lower: "id3", upper: "id3" })
				})

				o.test("provideMultiple", async function () {
					const listId = "listId1"
					const elementId1 = "id1"
					const elementId2 = "id2"
					const storableMail1 = createTestEntity(MailTypeRef, { _id: [listId, elementId1] })
					const storableMail2 = createTestEntity(MailTypeRef, { _id: [listId, elementId2] })

					await storage.init({ userId: elementId1, databaseKey, timeRangeDays, forceNewDatabase: false })

					let mails = await storage.provideMultiple(MailTypeRef, listId, [elementId1])
					o(mails).deepEquals([])

					await storage.put(storableMail1)

					mails = await storage.provideMultiple(MailTypeRef, listId, [elementId1, elementId2])
					o(mails).deepEquals([storableMail1])

					await storage.put(storableMail2)

					mails = await storage.provideMultiple(MailTypeRef, listId, [elementId1, elementId2])
					o(mails).deepEquals([storableMail1, storableMail2])
				})
			})

			o.spec("ListElementType customId", function () {
				o.test("deleteAllOfType", async function () {
					const listId = "listId1"
					const elementId = constructMailSetEntryId(new Date(), "mailId")
					const storableMailSetEntry = createTestEntity(MailSetEntryTypeRef, { _id: [listId, elementId] })

					await storage.init({ userId: elementId, databaseKey, timeRangeDays, forceNewDatabase: false })

					let mailSetEntry = await storage.get(MailSetEntryTypeRef, listId, elementId)
					o(mailSetEntry).equals(null)

					await storage.put(storableMailSetEntry)
					await storage.setNewRangeForList(MailSetEntryTypeRef, listId, elementId, elementId)

					mailSetEntry = await storage.get(MailSetEntryTypeRef, listId, elementId)
					o(mailSetEntry!._id).deepEquals(storableMailSetEntry._id)
					const rangeBefore = await storage.getRangeForList(MailSetEntryTypeRef, listId)
					o(rangeBefore).deepEquals({ upper: elementId, lower: elementId })
					await storage.deleteAllOfType(MailSetEntryTypeRef)

					mailSetEntry = await storage.get(MailSetEntryTypeRef, listId, elementId)
					o(mailSetEntry).equals(null)
					const rangeAfter = await storage.getRangeForList(MailSetEntryTypeRef, listId)
					o(rangeAfter).equals(null)
				})

				o.test("provideMultiple", async function () {
					const listId = "listId1"
					const elementId1 = constructMailSetEntryId(new Date(1724675875113), "mailId1")
					const elementId2 = constructMailSetEntryId(new Date(1724675899978), "mailId2")
					const storableMailSetEntry1 = createTestEntity(MailSetEntryTypeRef, { _id: [listId, elementId1] })
					const storableMailSetEntry2 = createTestEntity(MailSetEntryTypeRef, { _id: [listId, elementId2] })

					await storage.init({ userId: elementId1, databaseKey, timeRangeDays, forceNewDatabase: false })

					let mails = await storage.provideMultiple(MailSetEntryTypeRef, listId, [elementId1])
					o(mails).deepEquals([])

					await storage.put(storableMailSetEntry1)

					mails = await storage.provideMultiple(MailSetEntryTypeRef, listId, [elementId1, elementId2])
					o(mails).deepEquals([storableMailSetEntry1])

					await storage.put(storableMailSetEntry2)

					mails = await storage.provideMultiple(MailSetEntryTypeRef, listId, [elementId1, elementId2])
					o(mails).deepEquals([storableMailSetEntry1, storableMailSetEntry2])
				})
			})

			o.spec("BlobElementType", function () {
				o.test("put, get and delete", async function () {
					const archiveId = "archiveId"
					const blobElementId = "id1"
					const storableMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
						_id: [archiveId, blobElementId],
						details: createTestEntity(MailDetailsTypeRef),
					})

					await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })

					let mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
					o(mailDetailsBlob).equals(null)

					await storage.put(storableMailDetails)

					mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
					mailDetailsBlob!.details._type = MailDetailsTypeRef // we do not set the proper typeRef class on nested aggregates, so we overwrite it here
					o(mailDetailsBlob).deepEquals(storableMailDetails)

					await storage.deleteIfExists(MailDetailsBlobTypeRef, archiveId, blobElementId)

					mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
					o(mailDetailsBlob).equals(null)
				})

				o.test("put, get and deleteAllOwnedBy", async function () {
					const archiveId = "archiveId"
					const blobElementId = "id1"
					const _ownerGroup = "ownerGroup"
					const storableMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
						_id: [archiveId, blobElementId],
						_ownerGroup,
						details: createTestEntity(MailDetailsTypeRef),
					})

					await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })

					await storage.put(storableMailDetails)

					await storage.deleteAllOwnedBy(_ownerGroup)

					const mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
					o(mailDetailsBlob).equals(null)
				})
			})
		})

		o.spec("Clearing excluded data for MailSet mailbox", function () {
			const spamFolderId = "spamFolder"
			const trashFolderId = "trashFolder"
			const spamFolderEntriesId = "spamFolderEntriesId"
			const trashFolderEntriesId = "trashFolderEntriesId"
			const mailBagMailListId = "mailBagMailListId"

			const mailSetEntryType = getTypeId(MailSetEntryTypeRef)

			o.beforeEach(async function () {
				await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })

				await insertEntity(
					createTestEntity(MailBoxTypeRef, {
						_id: "mailboxId",
						currentMailBag: createTestEntity(MailBagTypeRef, { _id: "mailBagId", mails: mailBagMailListId }),
						folders: createMailFolderRef({ folders: "mailFolderList" }),
					}),
				)
				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", spamFolderId],
						entries: spamFolderEntriesId,
						folderType: MailSetKind.SPAM,
					}),
				)
				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", trashFolderId],
						entries: trashFolderEntriesId,
						folderType: MailSetKind.TRASH,
					}),
				)
			})

			o.test("ranges before timeRangeDays will be deleted", async function () {
				const oneDayBeforeTimeRangeDays = -1
				const twoDaysBeforeTimeRangeDays = -2

				const mailId: IdTuple = [mailBagMailListId, "anything"]
				const mailSetEntryElementId = offsetMailSetEntryId(oneDayBeforeTimeRangeDays, elementIdPart(mailId))
				const mailSetEntryId: IdTuple = ["mailSetEntriesListId", mailSetEntryElementId]
				const mailDetailsBlobId: IdTuple = ["mailDetailsList", "mailDetailsBlobId"]

				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", "mailFolderId"],
						entries: listIdPart(mailSetEntryId),
					}),
				)
				await insertEntity(createTestEntity(MailSetEntryTypeRef, { _id: mailSetEntryId, mail: mailId }))
				await insertEntity(
					createTestEntity(MailTypeRef, {
						_id: mailId,
						mailDetails: mailDetailsBlobId,
						sets: [mailSetEntryId],
					}),
				)
				await insertEntity(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: mailDetailsBlobId,
						details: createTestEntity(MailDetailsTypeRef),
					}),
				)

				const lowerMailSetEntryIdForRange = offsetMailSetEntryId(twoDaysBeforeTimeRangeDays, GENERATED_MIN_ID)
				const upperMailSetEntryIdForRange = offsetMailSetEntryId(oneDayBeforeTimeRangeDays, GENERATED_MAX_ID)
				await insertRange(MailSetEntryTypeRef, listIdPart(mailSetEntryId), lowerMailSetEntryIdForRange, upperMailSetEntryIdForRange)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				const allRanges = await dbFacade.all("SELECT * FROM ranges", [])
				o(allRanges).deepEquals([])
				const allMails = await getAllIdsForType(MailTypeRef)
				o(allMails).deepEquals([])
				const allMailSetEntries = await getAllIdsForType(MailSetEntryTypeRef)
				o(allMailSetEntries).deepEquals([])
				const allBlobDetails = await getAllIdsForType(MailDetailsBlobTypeRef)
				o(allBlobDetails).deepEquals([])
			})
			o.test("modified ranges will be shrunk", async function () {
				const twoDaysBeforeTimeRangeDays = -2
				const twoDaysAfterTimeRangeDays = 2

				const entriesListId = "mailSetEntriesListIdRanges"
				const lowerMailSetEntryIdForRange = offsetMailSetEntryId(twoDaysBeforeTimeRangeDays, GENERATED_MIN_ID)
				const upperMailSetEntryIdForRange = offsetMailSetEntryId(twoDaysAfterTimeRangeDays, GENERATED_MAX_ID)
				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", "mailFolderId"],
						entries: entriesListId,
						folderType: MailSetKind.INBOX,
					}),
				)

				await insertRange(MailSetEntryTypeRef, entriesListId, lowerMailSetEntryIdForRange, upperMailSetEntryIdForRange)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				const mailSetEntryTypeModel = await resolveTypeReference(MailSetEntryTypeRef)
				o(mapNullable(newRange, untagSqlObject)).deepEquals({
					type: mailSetEntryType,
					listId: entriesListId,
					// we need to encode with base64Ext, as we read raw data from the database, which stores custom elementIds in base64Ext not base64Url
					lower: ensureBase64Ext(mailSetEntryTypeModel, cuttoffMailSetEntryId),
					upper: ensureBase64Ext(mailSetEntryTypeModel, upperMailSetEntryIdForRange),
				})
			})
			o.test("unmodified ranges will not be deleted or shrunk", async function () {
				const oneDayAfterTimeRangeDays = 1
				const twoDaysAfterTimeRangeDays = 2

				const entriesListId = "mailSetEntriesListIdRanges"
				const lowerMailSetEntryIdForRange = offsetMailSetEntryId(oneDayAfterTimeRangeDays, GENERATED_MIN_ID)
				const upperMailSetEntryIdForRange = offsetMailSetEntryId(twoDaysAfterTimeRangeDays, GENERATED_MAX_ID)
				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", "mailFolderId"],
						entries: entriesListId,
						folderType: MailSetKind.CUSTOM,
					}),
				)
				await insertRange(MailSetEntryTypeRef, entriesListId, lowerMailSetEntryIdForRange, upperMailSetEntryIdForRange)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				const mailSetEntryTypeModel = await resolveTypeReference(MailSetEntryTypeRef)
				o(mapNullable(newRange, untagSqlObject)).deepEquals({
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

				await insertRange(MailSetEntryTypeRef, listIdPart(mailSetEntryId), lowerMailSetEntryIdForRange, upperMailSetEntryIdForRange)

				const mail = createTestEntity(MailTypeRef, {
					_id: mailId,
					mailDetails: mailDetailsBlobId,
					sets: [mailSetEntryId],
				})
				const mailFolder = createTestEntity(MailFolderTypeRef, {
					_id: ["mailFolderList", "folderId"],
					entries: listIdPart(mailSetEntryId),
				})

				await insertEntity(mailFolder)
				await insertEntity(mail)
				await insertEntity(createTestEntity(MailSetEntryTypeRef, { _id: mailSetEntryId, mail: mailId }))
				await insertEntity(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: mailDetailsBlobId,
						details: createTestEntity(MailDetailsTypeRef),
					}),
				)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				const mailSetEntryTypeModel = await resolveTypeReference(MailSetEntryTypeRef)
				o(mapNullable(newRange, untagSqlObject)).deepEquals({
					type: mailSetEntryType,
					listId: listIdPart(mailSetEntryId),
					// we need to encode with base64Ext, as we read raw data from the database, which stores custom elementIds in base64Ext not base64Url
					lower: ensureBase64Ext(mailSetEntryTypeModel, lowerMailSetEntryIdForRange),
					upper: ensureBase64Ext(mailSetEntryTypeModel, upperMailSetEntryIdForRange),
				})

				const allFolderIds = await getAllIdsForType(MailFolderTypeRef)
				o(allFolderIds).deepEquals(["folderId", spamFolderId, trashFolderId])
				const allMailIds = await getAllIdsForType(MailTypeRef)
				o(allMailIds).deepEquals([elementIdPart(mailId)])
				const allMailSetEntries = await getAllIdsForType(MailSetEntryTypeRef)
				// we need to encode with base64Ext, as we read raw data from the database, which stores custom elementIds in base64Ext not base64Url
				o(allMailSetEntries).deepEquals([ensureBase64Ext(mailSetEntryTypeModel, mailSetEntryElementId)])
				const allBlobDetails = await getAllIdsForType(MailDetailsBlobTypeRef)
				o(allBlobDetails).deepEquals([elementIdPart(mailDetailsBlobId)])
			})
			o.test("complete ranges will be modified if some entities are older than cutoff", async function () {
				const twoDaysBeforeTimeRangeDays = -2

				const mailId: IdTuple = [mailBagMailListId, offsetId(twoDaysBeforeTimeRangeDays)]
				const mailSetEntryElementId = offsetMailSetEntryId(twoDaysBeforeTimeRangeDays, elementIdPart(mailId))
				const mailSetEntryId: IdTuple = ["mailSetEntriesListId", mailSetEntryElementId]
				const mailDetailsBlobId: IdTuple = ["mailDetailsList", "mailDetailsBlobId"]

				const lowerMailSetEntryIdForRange = CUSTOM_MIN_ID
				const upperMailSetEntryIdForRange = CUSTOM_MAX_ID

				await insertRange(MailSetEntryTypeRef, listIdPart(mailSetEntryId), lowerMailSetEntryIdForRange, upperMailSetEntryIdForRange)
				const upper = offsetId(twoDaysBeforeTimeRangeDays)
				const lower = GENERATED_MIN_ID
				await insertRange(MailTypeRef, mailBagMailListId, lower, upper)

				const mail = createTestEntity(MailTypeRef, {
					_id: mailId,
					mailDetails: mailDetailsBlobId,
					sets: [mailSetEntryId],
				})
				const mailFolder = createTestEntity(MailFolderTypeRef, {
					_id: ["mailFolderList", "folderId"],
					entries: listIdPart(mailSetEntryId),
				})

				await insertEntity(mailFolder)
				await insertEntity(mail)
				await insertEntity(createTestEntity(MailSetEntryTypeRef, { _id: mailSetEntryId, mail: mailId }))
				await insertEntity(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: mailDetailsBlobId,
						details: createTestEntity(MailDetailsTypeRef),
					}),
				)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				const mailSetEntryTypeModel = await resolveTypeReference(MailSetEntryTypeRef)
				o(mapNullable(newRange, untagSqlObject)).deepEquals({
					type: mailSetEntryType,
					listId: listIdPart(mailSetEntryId),
					// we need to encode with base64Ext, as we read raw data from the database, which stores custom elementIds in base64Ext not base64Url
					lower: ensureBase64Ext(mailSetEntryTypeModel, cuttoffMailSetEntryId),
					upper: ensureBase64Ext(mailSetEntryTypeModel, upperMailSetEntryIdForRange),
				})

				const allFolderIds = await getAllIdsForType(MailFolderTypeRef)
				o(allFolderIds).deepEquals(["folderId", spamFolderId, trashFolderId])
				const allMailIds = await getAllIdsForType(MailTypeRef)
				o(allMailIds).deepEquals([])
				const allMailSetEntries = await getAllIdsForType(MailSetEntryTypeRef)
				// we need to encode with base64Ext, as we read raw data from the database, which stores custom elementIds in base64Ext not base64Url
				o(allMailSetEntries).deepEquals([])
				const allBlobDetails = await getAllIdsForType(MailDetailsBlobTypeRef)
				o(allBlobDetails).deepEquals([])
			})

			o.test("trash and spam descendants are cleared but mails are only if before timeRangeDays", async function () {
				const twoDaysAfterTimeRangeDays = 2
				const threeDaysAfterTimeRangeDays = 3
				const fourDaysBeforeTimeRangeDays = -4
				const spamDetailsId: IdTuple = ["detailsListId", "spamDetailsId"]
				const trashDetailsId: IdTuple = ["detailsListId", "trashDetailsId"]
				const trashSubfolderDetailsId: IdTuple = ["detailsListId", "trashSubFolderDetailsId"]

				const trashSubfolderId = "trashSubfolderId"
				const trashSubfolderEntriesId = "trashSubfolderEntriesId"

				const spamMailId = offsetId(twoDaysAfterTimeRangeDays)
				const spamMail = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, spamMailId],
					mailDetails: spamDetailsId,
				})
				const trashMailId = offsetId(threeDaysAfterTimeRangeDays)
				const trashMail = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, trashMailId],
					mailDetails: trashDetailsId,
				})
				const trashSubfolderMailId = offsetId(fourDaysBeforeTimeRangeDays)
				const trashSubfolderMail = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, trashSubfolderMailId],
					mailDetails: trashSubfolderDetailsId,
				})

				const spamMailSetEntryElementId = offsetMailSetEntryId(twoDaysAfterTimeRangeDays, spamMailId)
				const trashMailSetEntryElementId = offsetMailSetEntryId(threeDaysAfterTimeRangeDays, trashMailId)
				const trashSubfolderMailSetEntryElementId = offsetMailSetEntryId(fourDaysBeforeTimeRangeDays, trashSubfolderMailId)
				const spamMailSetEntryId: IdTuple = [spamFolderEntriesId, spamMailSetEntryElementId]
				const trashMailSetEntryId: IdTuple = [trashFolderEntriesId, trashMailSetEntryElementId]
				const trashSubfolderMailSetEntryId: IdTuple = [trashSubfolderEntriesId, trashSubfolderMailSetEntryElementId]

				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", trashSubfolderId],
						parentFolder: ["mailFolderList", trashFolderId],
						entries: trashSubfolderEntriesId,
						folderType: MailSetKind.CUSTOM,
					}),
				)

				await insertEntity(
					createTestEntity(MailSetEntryTypeRef, {
						_id: spamMailSetEntryId,
						mail: spamMail._id,
					}),
				)
				await insertEntity(
					createTestEntity(MailSetEntryTypeRef, {
						_id: trashMailSetEntryId,
						mail: trashMail._id,
					}),
				)
				await insertEntity(
					createTestEntity(MailSetEntryTypeRef, {
						_id: trashSubfolderMailSetEntryId,
						mail: trashSubfolderMail._id,
					}),
				)

				await insertEntity(spamMail)
				await insertEntity(trashMail)
				await insertEntity(trashSubfolderMail)

				await insertEntity(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: spamDetailsId,
						details: createTestEntity(MailDetailsTypeRef),
					}),
				)
				await insertEntity(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: trashDetailsId,
						details: createTestEntity(MailDetailsTypeRef),
					}),
				)
				await insertEntity(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: trashSubfolderDetailsId,
						details: createTestEntity(MailDetailsTypeRef),
					}),
				)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				// Ensure everything except for the folders themselves is deleted
				o.check(await getAllIdsForType(MailTypeRef)).deepEquals([])
				o.check(await getAllIdsForType(MailSetEntryTypeRef)).deepEquals([])
				o.check(await getAllIdsForType(MailDetailsBlobTypeRef)).deepEquals([])
				o.check(await getAllIdsForType(MailFolderTypeRef)).deepEquals([spamFolderId, trashFolderId, trashSubfolderId])

				const allListEntities = await dbFacade.all("SELECT * FROM list_entities", [])
				o.check(allListEntities.map((r) => r.elementId.value)).deepEquals([spamFolderId, trashFolderId, trashSubfolderId])
			})

			o.test("trash and spam are cleared but mails are only if before timeRangeDays", async function () {
				const spamDetailsId: IdTuple = ["detailsListId", "spamDetailsId"]
				const trashDetailsId: IdTuple = ["detailsListId", "trashDetailsId"]
				const twoDaysAfterTimeRangeDays = 2
				const threeDaysBeforeTimeRangeDays = -3

				const spamMailId = offsetId(twoDaysAfterTimeRangeDays)
				const spamMail = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, spamMailId],
					mailDetails: spamDetailsId,
				})
				const trashMailId = offsetId(threeDaysBeforeTimeRangeDays)
				const trashMail = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, trashMailId],
					mailDetails: trashDetailsId,
				})

				const spamMailSetEntryElementId = offsetMailSetEntryId(twoDaysAfterTimeRangeDays, spamMailId)
				const trashMailSetEntryElementId = offsetMailSetEntryId(threeDaysBeforeTimeRangeDays, trashMailId)
				const spamMailSetEntryId: IdTuple = [spamFolderEntriesId, spamMailSetEntryElementId]
				const trashMailSetEntryId: IdTuple = [trashFolderEntriesId, trashMailSetEntryElementId]

				await insertEntity(
					createTestEntity(MailSetEntryTypeRef, {
						_id: spamMailSetEntryId,
						mail: spamMail._id,
					}),
				)
				await insertEntity(
					createTestEntity(MailSetEntryTypeRef, {
						_id: trashMailSetEntryId,
						mail: trashMail._id,
					}),
				)

				await insertEntity(spamMail)
				await insertEntity(trashMail)
				await insertEntity(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: spamDetailsId,
						details: createTestEntity(MailDetailsTypeRef),
					}),
				)
				await insertEntity(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: trashDetailsId,
						details: createTestEntity(MailDetailsTypeRef),
					}),
				)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				// Ensure everything except for the folders themselves is deleted
				const allEntities = await dbFacade.all("select * from list_entities", [])
				o.check(allEntities.map((r) => r.elementId.value)).deepEquals([spamFolderId, trashFolderId])

				o.check(await getAllIdsForType(MailFolderTypeRef)).deepEquals([spamFolderId, trashFolderId])
				o.check(await getAllIdsForType(MailSetEntryTypeRef)).deepEquals([])
				o.check(await getAllIdsForType(MailTypeRef)).deepEquals([])
				o.check(await getAllIdsForType(MailDetailsBlobTypeRef)).deepEquals([])
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
					mailDetails: beforeMailDetailsId,
				})

				const mailAfter = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, offsetId(twoDaysAfterTimeRangeDays)],
					mailDetails: afterMailDetailsId,
				})
				const mailSetEntryBefore = createTestEntity(MailSetEntryTypeRef, {
					_id: twoDaysBeforeMailSetEntryId,
					mail: mailBefore._id,
				})
				const mailSetEntryAfter = createTestEntity(MailSetEntryTypeRef, {
					_id: twoDaysAfterMailSetEntryId,
					mail: mailAfter._id,
				})
				const beforeMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: beforeMailDetailsId,
					details: createTestEntity(MailDetailsTypeRef),
				})
				const afterMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: afterMailDetailsId,
					details: createTestEntity(MailDetailsTypeRef),
				})

				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", inboxFolderId],
						folderType: MailSetKind.INBOX,
						entries: inboxFolderEntriesId,
					}),
				)
				await insertEntity(mailBefore)
				await insertEntity(mailAfter)
				await insertEntity(mailSetEntryBefore)
				await insertEntity(mailSetEntryAfter)
				await insertEntity(beforeMailDetails)
				await insertEntity(afterMailDetails)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)
				const mailSetEntryTypeModel = await resolveTypeReference(MailSetEntryTypeRef)

				o(await getAllIdsForType(MailFolderTypeRef)).deepEquals([inboxFolderId, spamFolderId, trashFolderId])
				const allMailSetEntryIds = await getAllIdsForType(MailSetEntryTypeRef)
				o(allMailSetEntryIds).deepEquals([ensureBase64Ext(mailSetEntryTypeModel, twoDaysAfterMailSetEntryElementId)])
				o(await getAllIdsForType(MailTypeRef)).deepEquals([twoDaysAfterMailId])
				o(await getAllIdsForType(MailDetailsBlobTypeRef)).deepEquals([afterMailDetailsId].map(elementIdPart))
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
					mailDetails: oneDayBeforeDetailsId,
				})

				const mailTwoDaysBefore = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, twoDaysBeforeMailId],
					mailDetails: twoDaysBeforeDetailsId,
				})

				const mailSetEntryTwoDaysBefore = createTestEntity(MailSetEntryTypeRef, {
					_id: twoDaysBeforeMailSetEntryId,
					mail: mailTwoDaysBefore._id,
				})
				const mailSetEntryOneDayBefore = createTestEntity(MailSetEntryTypeRef, {
					_id: oneDayBeforeMailSetEntryId,
					mail: mailOneDayBefore._id,
				})
				const oneDayBeforeMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: oneDayBeforeDetailsId,
					details: createTestEntity(MailDetailsTypeRef),
				})
				const twoDaysBeforeMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: twoDaysBeforeDetailsId,
					details: createTestEntity(MailDetailsTypeRef),
				})

				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", inboxFolderId],
						folderType: MailSetKind.INBOX,
						entries: inboxFolderEntriesId,
					}),
				)
				await insertEntity(mailOneDayBefore)
				await insertEntity(mailTwoDaysBefore)
				await insertEntity(mailSetEntryTwoDaysBefore)
				await insertEntity(mailSetEntryOneDayBefore)
				await insertEntity(oneDayBeforeMailDetails)
				await insertEntity(twoDaysBeforeMailDetails)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				o(await getAllIdsForType(MailFolderTypeRef)).deepEquals([inboxFolderId, spamFolderId, trashFolderId])
				const allMailSetEntryIds = await getAllIdsForType(MailSetEntryTypeRef)
				o(allMailSetEntryIds).deepEquals([])
				o(await getAllIdsForType(MailTypeRef)).deepEquals([])
				o(await getAllIdsForType(MailDetailsBlobTypeRef)).deepEquals([])
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

				const fileBefore = createTestEntity(FileTypeRef, { _id: [fileListId, "fileBefore"] })
				const fileAfter = createTestEntity(FileTypeRef, { _id: [fileListId, "fileAfter"] })

				const mailBefore = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, offsetId(twoDaysBeforeTimeRangeDays)],
					mailDetails: beforeMailDetailsId,
					attachments: [fileBefore._id],
				})
				const mailAfter = createTestEntity(MailTypeRef, {
					_id: [mailBagMailListId, offsetId(twoDaysAfterTimeRangeDays)],
					mailDetails: afterMailDetailsId,
					attachments: [fileAfter._id],
				})
				const mailSetEntryBefore = createTestEntity(MailSetEntryTypeRef, {
					_id: twoDaysBeforeMailSetEntryId,
					mail: mailBefore._id,
				})
				const mailSetEntryAfter = createTestEntity(MailSetEntryTypeRef, {
					_id: twoDaysAfterMailSetEntryId,
					mail: mailAfter._id,
				})
				const beforeMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: beforeMailDetailsId,
					details: createTestEntity(MailDetailsTypeRef),
				})
				const afterMailDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: afterMailDetailsId,
					details: createTestEntity(MailDetailsTypeRef),
				})

				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", inboxFolderId],
						folderType: MailSetKind.INBOX,
						entries: inboxFolderEntriesId,
					}),
				)
				await insertEntity(mailSetEntryBefore)
				await insertEntity(mailSetEntryAfter)
				await insertEntity(mailBefore)
				await insertEntity(mailAfter)
				await insertEntity(fileBefore)
				await insertEntity(fileAfter)
				await insertEntity(beforeMailDetails)
				await insertEntity(afterMailDetails)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				o(await getAllIdsForType(MailTypeRef)).deepEquals([getElementId(mailAfter)])
				o(await getAllIdsForType(FileTypeRef)).deepEquals([getElementId(fileAfter)])
			})
		})
	})

	o.spec("Integration test", function () {
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
						mail: [mailBagMailListId, mailId],
					}),
				)
				mails.push(
					createTestEntity(MailTypeRef, {
						_id: [mailBagMailListId, mailId],
						subject: getSubject(i),
						sets: [folder._id],
						mailDetails: ["detailsListId", mailDetailsId],
					}),
				)
				mailDetailsBlobs.push(
					createTestEntity(MailDetailsBlobTypeRef, {
						_id: ["detailsListId", mailDetailsId],
						details: createTestEntity(MailDetailsTypeRef, {
							_id: mailDetailsId,
							body: createTestEntity(BodyTypeRef, { text: getBody(i) }),
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
				currentMailBag: createTestEntity(MailBagTypeRef, { mails: mailBagMailListId }),
				folders: createMailFolderRef({ folders: "mailFolderList" }),
			})

			const inboxFolder = createTestEntity(MailFolderTypeRef, {
				_id: ["mailFolderList", oldIds.getNext()],
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
				folderType: MailSetKind.TRASH,
				entries: "trashEntriesListId",
			})
			const {
				mailSetEntries: trashMailSetEntries,
				mails: trashMails,
				mailDetailsBlobs: trashMailDetailsBlobs,
			} = createMailList(
				3,
				newIds,
				newMailSetEntryNewIds,
				(i) => `trash subject ${i}`,
				(i) => `trash body ${i}`,
				trashFolder,
			)

			const spamFolder = createTestEntity(MailFolderTypeRef, {
				_id: ["mailFolderList", oldIds.getNext()],
				folderType: MailSetKind.SPAM,
				entries: "spamEntriesListId",
			})

			const everyEntity = [
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
				...trashMailSetEntries,
				...trashMails,
				...trashMailDetailsBlobs,
			]

			await storage.init({ userId, databaseKey: offlineDatabaseTestKey, timeRangeDays, forceNewDatabase: false })

			for (let entity of everyEntity) {
				await storage.put(entity)
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
				elementIdPart(getFirstOrThrow(trashMailSetEntries)._id),
				elementIdPart(lastThrow(trashMailSetEntries)._id),
			)

			// Here we clear the excluded data
			await storage.clearExcludedData(timeRangeDays, userId)

			const assertContents = async ({ _id, _type }, expected, msg) => {
				const { listId, elementId } = expandId(_id)
				return o(await storage.get(_type, listId, elementId)).deepEquals(expected)(msg)
			}

			await promiseMap(oldInboxMails, (mail) => assertContents(mail, null, `old mail ${mail._id} was deleted`))
			await promiseMap(oldInboxMailDetailsBlobs, (body) => assertContents(body, null, `old mailBody ${body._id} was deleted`))

			await promiseMap(newInboxMails, (mail) => assertContents(mail, mail, `new mail ${mail._id} was not deleted`))
			await promiseMap(newInboxMailDetailsBlobs, (body) => assertContents(body, body, `new mailBody ${body._id} was not deleted`))

			await promiseMap(trashMails, (mail) => assertContents(mail, null, `trash mail ${mail._id} was deleted`))
			await promiseMap(trashMailDetailsBlobs, (body) => assertContents(body, null, `trash mailBody ${body._id} was deleted`))

			await assertContents(inboxFolder, inboxFolder, `inbox folder was not deleted`)
			await assertContents(trashFolder, trashFolder, `trash folder was not deleted`)

			o(await storage.getRangeForList(MailSetEntryTypeRef, inboxFolder.entries)).deepEquals({
				// base64Ext encoding is not needed here, as storage.getRangeForList is returning custom elementIds in base64Url already
				lower: cuttoffMailSetEntryId,
				upper: elementIdPart(lastThrow(newInboxMailSetEntries)._id),
			})("lower range for inbox was set to cutoff")
			o(await storage.getRangeForList(MailSetEntryTypeRef, trashFolder.entries)).equals(null)("range for trash was deleted")
		})
	})
})
