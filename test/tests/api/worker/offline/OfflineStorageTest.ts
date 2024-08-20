import o from "@tutao/otest"
import { verify } from "@tutao/tutanota-test-utils"
import { customTypeEncoders, ensureBase64Ext, OfflineStorage, OfflineStorageCleaner } from "../../../../../src/common/api/worker/offline/OfflineStorage.js"
import { instance, object, when } from "testdouble"
import * as cborg from "cborg"
import {
	constructMailSetEntryId,
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
	MailFolderTypeRef,
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

function encode(thing) {
	return cborg.encode(thing, { typeEncoders: customTypeEncoders })
}

const nativePath = buildOptions.sqliteNativePath
const database = "./testdatabase.sqlite"
export const offlineDatabaseTestKey = Uint8Array.from([3957386659, 354339016, 3786337319, 3366334248])

o.spec("OfflineStorageDb", function () {
	const now = new Date("2022-01-01 00:00:00 UTC")
	const timeRangeDays = 10
	const userId = "userId"
	const databaseKey = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])

	/** get an id based on a timestamp that is {@param days} days away from the time range cutoff */
	const offsetId = (days) => timestampToGeneratedId(getDayShifted(now, 0 - timeRangeDays + days).getTime())
	const cutoffId = offsetId(0)

	let dbFacade: DesktopSqlCipher
	let dateProviderMock: DateProvider
	let storage: OfflineStorage
	let migratorMock: OfflineStorageMigrator
	let offlineStorageCleanerMock: OfflineStorageCleaner
	let interWindowEventSenderMock: InterWindowEventFacadeSendDispatcher

	o.beforeEach(async function () {
		dbFacade = new DesktopSqlCipher(nativePath, database, false)

		dateProviderMock = object<DateProvider>()
		migratorMock = instance(OfflineStorageMigrator)
		interWindowEventSenderMock = instance(InterWindowEventFacadeSendDispatcher)
		offlineStorageCleanerMock = new MailOfflineCleaner()
		when(dateProviderMock.now()).thenReturn(now.getTime())
		storage = new OfflineStorage(dbFacade, interWindowEventSenderMock, dateProviderMock, migratorMock, offlineStorageCleanerMock)
	})

	o.afterEach(async function () {
		await dbFacade.closeDb()
		await fs.promises.unlink(database)
	})

	o.spec("Unit test", function () {
		async function insertEntity(entity: SomeEntity) {
			const typeModel = await resolveTypeReference(entity._type)
			const type = getTypeId(entity._type)
			let preparedQuery
			switch (typeModel.type) {
				case TypeId.Element.valueOf():
					preparedQuery = sql`insert into element_entities values (${type}, ${(entity as ElementEntity)._id}, ${entity._ownerGroup}, ${encode(
						entity,
					)})`
					break
				case TypeId.ListElement.valueOf():
					const [listId, elementId] = (entity as ListElementEntity)._id
					preparedQuery = sql`INSERT INTO list_entities VALUES (${type}, ${listId}, ${elementId}, ${entity._ownerGroup}, ${encode(entity)})`
					break
				case TypeId.BlobElement.valueOf():
					const [archiveId, blobElementId] = (entity as BlobElementEntity)._id
					preparedQuery = sql`INSERT INTO blob_element_entities VALUES (${type}, ${archiveId}, ${blobElementId}, ${entity._ownerGroup}, ${encode(
						entity,
					)})`
					break
				default:
					throw new Error("must be a persistent type")
			}
			await dbFacade.run(preparedQuery.query, preparedQuery.params)
		}

		async function insertRange(type: TypeRef<unknown>, listId: string, lower: string, upper: string) {
			const { query, params } = sql`INSERT INTO ranges VALUES(${getTypeId(type)}, ${listId}, ${lower}, ${upper})`
			await dbFacade.run(query, params)
		}

		async function getAllIdsForType(typeRef: TypeRef<unknown>): Promise<Id[]> {
			const typeModel = await resolveTypeReference(typeRef)
			let preparedQuery
			switch (typeModel.type) {
				case TypeId.Element.valueOf():
					preparedQuery = sql`select * from element_entities where type = ${getTypeId(typeRef)}`
					break
				case TypeId.ListElement.valueOf():
					preparedQuery = sql`select * from list_entities where type = ${getTypeId(typeRef)}`
					break
				case TypeId.BlobElement.valueOf():
					preparedQuery = sql`select * from blob_element_entities where type = ${getTypeId(typeRef)}`
					break
				default:
					throw new Error("must be a persistent type")
			}
			return (await dbFacade.all(preparedQuery.query, preparedQuery.params)).map((r) => r.elementId.value as Id)
		}

		o("migrations are run", async function () {
			await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })
			verify(migratorMock.migrate(storage, dbFacade))
		})

		o.spec("Offline storage round trip", function () {
			o.spec("ElementType", function () {
				o("deleteAllOfType", async function () {
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
				o("deleteAllOfType", async function () {
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

				o("deleteWholeList", async function () {
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

				o("provideMultiple", async function () {
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
				o("deleteAllOfType", async function () {
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

				o("provideMultiple", async function () {
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
				o("put, get and delete", async function () {
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

				o("put, get and deleteAllOwnedBy", async function () {
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
			const spamListId = "spamList"
			const trashListId = "trashList"
			const spamMailSetEntriesId = "spamMailSetEntriesId"
			const trashMailSetEntriesId = "trashMailSetEntriesId"
			const mailListId = "listId"
			const mailType = getTypeId(MailTypeRef)

			o.beforeEach(async function () {
				await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })

				await insertEntity(
					createTestEntity(MailBoxTypeRef, {
						_id: "mailboxId",
						currentMailBag: createTestEntity(MailBagTypeRef, { _id: "mailBagId", mails: mailListId }),
						folders: createMailFolderRef({ folders: "mailFolderList" }),
					}),
				)
				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", spamFolderId],
						mails: spamListId,
						entries: spamMailSetEntriesId,
						folderType: MailSetKind.SPAM,
					}),
				)
				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", trashFolderId],
						mails: trashListId,
						entries: trashMailSetEntriesId,
						folderType: MailSetKind.TRASH,
					}),
				)
			})

			o("ranges before timeRangeDays will be deleted", async function () {
				const upperBeforeTimeRangeDays = offsetId(-1)
				const lowerBeforeTimeRangeDays = offsetId(-2)
				const upperDate = getDayShifted(now, 0 - timeRangeDays - 1)
				const lowerDate = getDayShifted(now, 0 - timeRangeDays - 2)
				const mailSetEntryTypeModel = await resolveTypeReference(MailSetEntryTypeRef)
				const lowerMailSetEntryIdBeforeTimeRangeDays = ensureBase64Ext(mailSetEntryTypeModel, constructMailSetEntryId(lowerDate, GENERATED_MIN_ID))
				const upperMailSetEntryIdBeforeTimeRangeDays = ensureBase64Ext(mailSetEntryTypeModel, constructMailSetEntryId(upperDate, GENERATED_MAX_ID))
				const mailId: IdTuple = [mailListId, "anything"]
				const mailSetEntryId: IdTuple = ["mailSetEntriesListId", constructMailSetEntryId(upperDate, elementIdPart(mailId))]
				const mailDetailsBlobId: IdTuple = ["mailDetailsList", "mailDetailsBlobId"]
				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", "mailFolderId"],
						mails: mailListId,
						entries: listIdPart(mailSetEntryId),
					}),
				)
				await insertEntity(createTestEntity(MailSetEntryTypeRef, { _id: mailSetEntryId, mail: mailId }))
				await insertEntity(createTestEntity(MailTypeRef, { _id: mailId, mailDetails: mailDetailsBlobId, sets: [mailSetEntryId] }))
				await insertEntity(createTestEntity(MailDetailsBlobTypeRef, { _id: mailDetailsBlobId, details: createTestEntity(MailDetailsTypeRef) }))
				await insertRange(
					MailSetEntryTypeRef,
					listIdPart(mailSetEntryId),
					lowerMailSetEntryIdBeforeTimeRangeDays,
					upperMailSetEntryIdBeforeTimeRangeDays,
				)
				await insertRange(MailTypeRef, mailListId, lowerBeforeTimeRangeDays, upperBeforeTimeRangeDays)

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
		})

		// we should refactor these tests once all mailboxes are migrated to the new MailSet architecture
		o.spec("Clearing excluded data for Non-MailSet mailbox", function () {
			const spamFolderId = "spamFolder"
			const trashFolderId = "trashFolder"
			const spamListId = "spamList"
			const trashListId = "trashList"
			const listId = "listId"
			const mailType = getTypeId(MailTypeRef)

			o.beforeEach(async function () {
				await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })

				await insertEntity(
					createTestEntity(MailBoxTypeRef, { _id: "mailboxId", currentMailBag: null, folders: createMailFolderRef({ folders: "mailFolderList" }) }),
				)
				await insertEntity(
					createTestEntity(MailFolderTypeRef, { _id: ["mailFolderList", spamFolderId], mails: spamListId, folderType: MailSetKind.SPAM }),
				)
				await insertEntity(
					createTestEntity(MailFolderTypeRef, { _id: ["mailFolderList", trashFolderId], mails: trashListId, folderType: MailSetKind.TRASH }),
				)
			})

			o("ranges before timeRangeDays will be deleted", async function () {
				const upperBeforeTimeRangeDays = offsetId(-1)
				const lowerBeforeTimeRangeDays = offsetId(-2)
				const mailDetailsBlobId: IdTuple = ["mailDetailsList", "mailDetailsBlobId"]
				await insertEntity(createTestEntity(MailFolderTypeRef, { _id: ["mailFolderList", "mailFolderId"], mails: listId }))
				await insertEntity(createTestEntity(MailDetailsBlobTypeRef, { _id: mailDetailsBlobId, details: createTestEntity(MailDetailsTypeRef) }))
				await insertEntity(createTestEntity(MailTypeRef, { _id: [listId, "anything"], mailDetails: mailDetailsBlobId }))
				await insertRange(MailTypeRef, listId, lowerBeforeTimeRangeDays, upperBeforeTimeRangeDays)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				const allRanges = await dbFacade.all("SELECT * FROM ranges", [])
				o(allRanges).deepEquals([])
				const allMails = await getAllIdsForType(MailTypeRef)
				o(allMails).deepEquals([])
				const allBlobDetails = await getAllIdsForType(MailDetailsBlobTypeRef)
				o(allBlobDetails).deepEquals([])
			})

			o("modified ranges will be shrunk", async function () {
				const upper = offsetId(2)
				const lower = offsetId(-2)
				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", "mailFolderId"],
						folderType: MailSetKind.INBOX,
						mails: listId,
					}),
				)
				await insertRange(MailTypeRef, listId, lower, upper)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				o(mapNullable(newRange, untagSqlObject)).deepEquals({ type: mailType, listId, lower: cutoffId, upper })
			})

			o("unmodified ranges will not be deleted or shrunk", async function () {
				const upper = offsetId(2)
				const lower = offsetId(1)

				await insertEntity(createTestEntity(MailFolderTypeRef, { _id: ["mailFolderList", "mailFolderId"], mails: listId }))
				await insertRange(MailTypeRef, listId, lower, upper)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				o(mapNullable(newRange, untagSqlObject)).deepEquals({ type: mailType, listId, lower, upper })
			})

			o("complete ranges won't be lost if entities are all newer than cutoff", async function () {
				const upper = offsetId(2)
				const lower = GENERATED_MIN_ID
				const mail = createTestEntity(MailTypeRef, { _id: [listId, offsetId(1)] })
				const mailFolder = createTestEntity(MailFolderTypeRef, { _id: ["mailFolderList", "folderId"], mails: listId })
				await insertEntity(mailFolder)
				await insertEntity(mail)
				await insertRange(MailTypeRef, listId, lower, upper)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				o(mapNullable(newRange, untagSqlObject)).deepEquals({ type: mailType, listId, lower, upper })

				const allFolderIds = await getAllIdsForType(MailFolderTypeRef)
				o(allFolderIds).deepEquals(["folderId", spamFolderId, trashFolderId])
				const allMailIds = await getAllIdsForType(MailTypeRef)
				o(allMailIds).deepEquals([getElementId(mail)])
			})

			o("trash and spam descendants are cleared", async function () {
				const spamDetailsId: IdTuple = ["detailsListId", "spamDetailsId"]
				const trashDetailsId: IdTuple = ["detailsListId", "trashDetailsId"]
				const trashSubfolderDetailsId: IdTuple = ["detailsListId", "trashSubFolderDetailsId"]

				const trashSubfolderId = "trashSubfolderId"
				const trashSubfolderListId = "trashSubfolderListId"

				const spamMailId = offsetId(2)
				const spamMail = createTestEntity(MailTypeRef, { _id: [spamListId, spamMailId], mailDetails: spamDetailsId })
				const trashMailId = offsetId(2)
				const trashMail = createTestEntity(MailTypeRef, { _id: [trashListId, trashMailId], mailDetails: trashDetailsId })
				const trashSubfolderMailId = offsetId(2)
				const trashSubfolderMail = createTestEntity(MailTypeRef, {
					_id: [trashSubfolderListId, trashSubfolderMailId],
					mailDetails: trashSubfolderDetailsId,
				})

				await insertEntity(
					createTestEntity(MailFolderTypeRef, {
						_id: ["mailFolderList", trashSubfolderId],
						parentFolder: ["mailFolderList", trashFolderId],
						mails: trashSubfolderListId,
						folderType: MailSetKind.CUSTOM,
					}),
				)
				await insertEntity(spamMail)
				await insertEntity(trashMail)
				await insertEntity(trashSubfolderMail)
				await insertEntity(createTestEntity(MailDetailsBlobTypeRef, { _id: spamDetailsId, details: createTestEntity(MailDetailsTypeRef) }))
				await insertEntity(createTestEntity(MailDetailsBlobTypeRef, { _id: trashDetailsId, details: createTestEntity(MailDetailsTypeRef) }))
				await insertEntity(createTestEntity(MailDetailsBlobTypeRef, { _id: trashSubfolderDetailsId, details: createTestEntity(MailDetailsTypeRef) }))

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				const allEntities = await dbFacade.all("select * from list_entities", [])
				o(allEntities.map((r) => r.elementId.value)).deepEquals([spamFolderId, trashFolderId, trashSubfolderId])

				o(await getAllIdsForType(MailFolderTypeRef)).deepEquals([spamFolderId, trashFolderId, trashSubfolderId])
				o(await getAllIdsForType(MailTypeRef)).deepEquals([])
				o(await getAllIdsForType(MailDetailsBlobTypeRef)).deepEquals([])
			})

			o("trash and spam are cleared", async function () {
				const spamDetailsId: IdTuple = ["detailsListId", "spamDetailsId"]
				const trashDetailsId: IdTuple = ["detailsListId", "trashDetailsId"]

				const spamMailId = offsetId(2)
				const trashMailId = offsetId(2)
				const spamMail = createTestEntity(MailTypeRef, { _id: [spamListId, spamMailId], mailDetails: spamDetailsId })
				const trashMail = createTestEntity(MailTypeRef, { _id: [trashListId, trashMailId], mailDetails: trashDetailsId })

				await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })

				await insertEntity(spamMail)
				await insertEntity(trashMail)
				await insertEntity(createTestEntity(MailDetailsBlobTypeRef, { _id: spamDetailsId, details: createTestEntity(MailDetailsTypeRef) }))
				await insertEntity(createTestEntity(MailDetailsBlobTypeRef, { _id: trashDetailsId, details: createTestEntity(MailDetailsTypeRef) }))

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				const allEntities = await dbFacade.all("select * from list_entities", [])
				o(allEntities.map((r) => r.elementId.value)).deepEquals([spamFolderId, trashFolderId])

				o(await getAllIdsForType(MailFolderTypeRef)).deepEquals([spamFolderId, trashFolderId])
				o(await getAllIdsForType(MailTypeRef)).deepEquals([])
				o(await getAllIdsForType(MailDetailsBlobTypeRef)).deepEquals([])
			})

			o("normal folder is partially cleared", async function () {
				const beforeMailDetailsId: IdTuple = ["detailsListId", "beforeDetailsId"]
				const afterMailDetailsId: IdTuple = ["detailsListId", "afterDetailsId"]

				const inboxMailList = "inboxMailList"

				const mailBefore = createTestEntity(MailTypeRef, { _id: [inboxMailList, offsetId(-2)], mailDetails: beforeMailDetailsId })
				const mailAfter = createTestEntity(MailTypeRef, { _id: [inboxMailList, offsetId(2)], mailDetails: afterMailDetailsId })
				const beforeMailDetails = createTestEntity(MailDetailsBlobTypeRef, { _id: beforeMailDetailsId, details: createTestEntity(MailDetailsTypeRef) })
				const afterMailDetails = createTestEntity(MailDetailsBlobTypeRef, { _id: afterMailDetailsId, details: createTestEntity(MailDetailsTypeRef) })

				await insertEntity(
					createTestEntity(MailFolderTypeRef, { _id: ["mailFolderList", "folderId"], mails: inboxMailList, folderType: MailSetKind.INBOX }),
				)
				await insertEntity(mailBefore)
				await insertEntity(mailAfter)
				await insertEntity(beforeMailDetails)
				await insertEntity(afterMailDetails)

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				const allMailIds = await getAllIdsForType(MailTypeRef)
				o(allMailIds).deepEquals([getElementId(mailAfter)])
				const allMailDetailsIds = await getAllIdsForType(MailDetailsBlobTypeRef)
				o(allMailDetailsIds).deepEquals([getElementId(afterMailDetails)])
			})

			o("normal folder is completely cleared", async function () {
				const mailDetailsId1: IdTuple = ["detailsListId", "mailDetailsId1"]
				const mailDetailsId2: IdTuple = ["detailsListId", "mailDetailsId2"]

				const inboxMailList = "inboxMailList"

				const mail1 = createTestEntity(MailTypeRef, { _id: [inboxMailList, offsetId(-2)], mailDetails: mailDetailsId1 })
				const mail2 = createTestEntity(MailTypeRef, { _id: [inboxMailList, offsetId(-3)], mailDetails: mailDetailsId2 })

				await insertEntity(
					createTestEntity(MailFolderTypeRef, { _id: ["mailFolderList", "folderId"], mails: inboxMailList, folderType: MailSetKind.INBOX }),
				)
				await insertEntity(mail1)
				await insertEntity(mail2)
				await insertEntity(createTestEntity(MailDetailsBlobTypeRef, { _id: mailDetailsId1, details: createTestEntity(MailDetailsTypeRef) }))
				await insertEntity(createTestEntity(MailDetailsBlobTypeRef, { _id: mailDetailsId2, details: createTestEntity(MailDetailsTypeRef) }))

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				o(await getAllIdsForType(MailTypeRef)).deepEquals([])
				o(await getAllIdsForType(MailDetailsBlobTypeRef)).deepEquals([])
			})

			o("when mail is deleted, attachment is also deleted", async function () {
				const inboxMailList = "inboxMailList"
				const beforeMailDetailsId: IdTuple = ["detailsListId", "beforeDetailsId"]
				const afterMailDetailsId: IdTuple = ["detailsListId", "afterDetailsId"]
				const fileListId = "fileListId"

				const fileBefore = createTestEntity(FileTypeRef, { _id: [fileListId, "fileBefore"] })
				const fileAfter = createTestEntity(FileTypeRef, { _id: [fileListId, "fileAfter"] })
				const mailBefore = createTestEntity(MailTypeRef, {
					_id: [inboxMailList, offsetId(-2)],
					mailDetails: beforeMailDetailsId,
					attachments: [fileBefore._id],
				})
				const mailAfter = createTestEntity(MailTypeRef, {
					_id: [inboxMailList, offsetId(2)],
					mailDetails: afterMailDetailsId,
					attachments: [fileAfter._id],
				})

				await insertEntity(
					createTestEntity(MailFolderTypeRef, { _id: ["mailFolderList", "folderId"], mails: inboxMailList, folderType: MailSetKind.INBOX }),
				)
				await insertEntity(mailBefore)
				await insertEntity(mailAfter)
				await insertEntity(fileBefore)
				await insertEntity(fileAfter)
				await insertEntity(createTestEntity(MailDetailsBlobTypeRef, { _id: beforeMailDetailsId }))
				await insertEntity(createTestEntity(MailDetailsBlobTypeRef, { _id: afterMailDetailsId }))

				// Here we clear the excluded data
				await storage.clearExcludedData(timeRangeDays, userId)

				o(await getAllIdsForType(MailTypeRef)).deepEquals([getElementId(mailAfter)])
				o(await getAllIdsForType(FileTypeRef)).deepEquals([getElementId(fileAfter)])
			})
		})
	})

	o.spec("Integration test", function () {
		function createMailList(numMails, listId, idGenerator, getSubject, getBody): { mails: Array<Mail>; mailDetailsBlobs: Array<MailDetailsBlob> } {
			const mails: Array<Mail> = []
			const mailDetailsBlobs: Array<MailDetailsBlob> = []
			for (let i = 0; i < numMails; ++i) {
				const mailId = idGenerator.getNext()
				const mailDetailsId = idGenerator.getNext()
				mails.push(
					createTestEntity(MailTypeRef, {
						_id: [listId, mailId],
						subject: getSubject(i),
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
			return { mails, mailDetailsBlobs: mailDetailsBlobs }
		}

		o("cleanup works as expected", async function () {
			// Time range is five days
			const oldIds = new IdGenerator(offsetId(-5))
			const newIds = new IdGenerator(offsetId(5))

			const userMailbox = createTestEntity(MailBoxTypeRef, {
				_id: "mailboxId",
				currentMailBag: null,
				folders: createMailFolderRef({ folders: "mailFolderList" }),
			})

			const inboxListId = oldIds.getNext()
			const inboxFolder = createTestEntity(MailFolderTypeRef, {
				_id: ["mailFolderList", oldIds.getNext()],
				mails: inboxListId,
				folderType: MailSetKind.INBOX,
			})
			const { mails: oldInboxMails, mailDetailsBlobs: oldInboxMailDetailsBlobs } = createMailList(
				3,
				inboxListId,
				oldIds,
				(i) => `old subject ${i}`,
				(i) => `old body ${i}`,
			)

			const { mails: newInboxMails, mailDetailsBlobs: newInboxMailDetailsBlobs } = createMailList(
				3,
				inboxListId,
				newIds,
				(i) => `new subject ${i}`,
				(i) => `new body ${i}`,
			)

			const trashListId = oldIds.getNext()
			const trashFolder = createTestEntity(MailFolderTypeRef, {
				_id: ["mailFolderList", oldIds.getNext()],
				mails: trashListId,
				folderType: MailSetKind.TRASH,
			})
			const { mails: trashMails, mailDetailsBlobs: trashMailDetailsBlobs } = createMailList(
				3,
				trashListId,
				newIds,
				(i) => `trash subject ${i}`,
				(i) => `trash body ${i}`,
			)

			const spamListId = oldIds.getNext()
			const spamFolder = createTestEntity(MailFolderTypeRef, {
				_id: ["mailFolderList", oldIds.getNext()],
				mails: spamListId,
				folderType: MailSetKind.SPAM,
			})

			const everyEntity = [
				userMailbox,
				inboxFolder,
				trashFolder,
				spamFolder,
				...oldInboxMails,
				...oldInboxMailDetailsBlobs,
				...newInboxMails,
				...newInboxMailDetailsBlobs,
				...trashMails,
				...trashMailDetailsBlobs,
			]

			await storage.init({ userId, databaseKey: offlineDatabaseTestKey, timeRangeDays, forceNewDatabase: false })

			for (let entity of everyEntity) {
				await storage.put(entity)
			}

			await storage.setNewRangeForList(MailTypeRef, inboxListId, getFirstOrThrow(oldInboxMails)._id[1], lastThrow(newInboxMails)._id[1])
			await storage.setNewRangeForList(MailTypeRef, trashListId, getFirstOrThrow(trashMails)._id[1], lastThrow(trashMails)._id[1])

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

			// All of trash should be cleared, even though the ids are old
			await promiseMap(trashMails, (mail) => assertContents(mail, null, `trash mail ${mail._id} was deleted`))
			await promiseMap(trashMailDetailsBlobs, (body) => assertContents(body, null, `trash mailBody ${body._id} was deleted`))

			await assertContents(inboxFolder, inboxFolder, `inbox folder was not deleted`)
			await assertContents(trashFolder, trashFolder, `trash folder was not deleted`)

			o(await storage.getRangeForList(MailTypeRef, inboxListId)).deepEquals({
				lower: cutoffId,
				upper: lastThrow(newInboxMails)._id[1],
			})("lower range for inbox was set to cutoff")
			o(await storage.getRangeForList(MailTypeRef, trashListId)).equals(null)("range for trash was deleted")
		})
	})
})
