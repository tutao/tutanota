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
import { assertNotNull, downcast, getDayShifted, getFirstOrThrow, getTypeString, lastThrow, mapNullable, promiseMap, TypeRef } from "@tutao/tutanota-utils"
import { DateProvider } from "../../../../../src/common/api/common/DateProvider.js"
import {
	BodyTypeRef,
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
import { untagSqlObject } from "../../../../../src/common/api/worker/offline/SqlValue.js"
import { MailSetKind } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { Type as TypeId } from "../../../../../src/common/api/common/EntityConstants.js"
import { expandId } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache.js"
import { GroupMembershipTypeRef, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { DesktopSqlCipher } from "../../../../../src/common/desktop/db/DesktopSqlCipher.js"
import { clientInitializedTypeModelResolver, createTestEntity, modelMapperFromTypeModelResolver } from "../../../TestUtils.js"
import { sql } from "../../../../../src/common/api/worker/offline/Sql.js"
import { MailOfflineCleaner } from "../../../../../src/mail-app/workerUtils/offline/MailOfflineCleaner.js"
import Id from "../../../../../src/mail-app/translations/id.js"
import { ModelMapper } from "../../../../../src/common/api/worker/crypto/ModelMapper"
import { Entity, ServerModelParsedInstance } from "../../../../../src/common/api/common/EntityTypes"
import { TypeModelResolver } from "../../../../../src/common/api/common/EntityFunctions"

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

/**
 * remove fields from mails that are added by the model mapper in order to allow comparing mails
 */
function cleanFieldsFromMail(mail: Mail) {
	downcast(mail.sender)._id = null
	return mail
}

/**
 * remove fields from mailDetailsBlobs that are added by the model mapper in order to allow comparing mailDetailsBlobs
 */
function clearFieldsFromMailDetailsBlob(mailDetailsBlob: MailDetailsBlob) {
	downcast(mailDetailsBlob).details._id = null
	downcast(mailDetailsBlob).details.body._id = null
	downcast(mailDetailsBlob).details.recipients._id = null
	return mailDetailsBlob
}

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
	let typeModelResolver: TypeModelResolver
	let modelMapper: ModelMapper

	o.beforeEach(async function () {
		// integrity checks do not work with in-memory databases
		dbFacade = new DesktopSqlCipher(nativePath, databasePath, false)

		dateProviderMock = object<DateProvider>()
		migratorMock = instance(OfflineStorageMigrator)
		interWindowEventSenderMock = instance(InterWindowEventFacadeSendDispatcher)
		offlineStorageCleanerMock = new MailOfflineCleaner()
		typeModelResolver = clientInitializedTypeModelResolver()
		modelMapper = modelMapperFromTypeModelResolver(typeModelResolver)
		when(dateProviderMock.now()).thenReturn(now.getTime())
		storage = new OfflineStorage(
			dbFacade,
			interWindowEventSenderMock,
			dateProviderMock,
			migratorMock,
			offlineStorageCleanerMock,
			modelMapper,
			typeModelResolver,
		)
	})

	o.afterEach(async function () {
		await dbFacade.closeDb()
	})

	async function toStorableInstance(entity: Entity): Promise<ServerModelParsedInstance> {
		return downcast<ServerModelParsedInstance>(await modelMapper.mapToClientModelParsedInstance(entity._type, entity))
	}

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
			await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })
			verify(migratorMock.migrate(storage, dbFacade))
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

					await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })

					let storedUser = await storage.get(UserTypeRef, null, userId)
					o(storedUser).equals(null)

					await storage.put(UserTypeRef, storableUser)

					storedUser = await storage.get(UserTypeRef, null, userId)
					o(storedUser!._id).equals(user._id)

					await storage.deleteAllOfType(UserTypeRef)

					storedUser = await storage.get(UserTypeRef, null, userId)
					o(storedUser).equals(null)
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

					await storage.init({ userId: elementId, databaseKey, timeRangeDays, forceNewDatabase: false })

					let mail = await storage.get(MailTypeRef, listId, elementId)
					o(mail).equals(null)

					await storage.put(MailTypeRef, storableMail)
					await storage.setNewRangeForList(MailTypeRef, listId, elementId, elementId)

					mail = await storage.get(MailTypeRef, listId, elementId)
					o(mail!._id).deepEquals([listId, elementId])
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

					const listOneMailOne = createTestEntity(MailTypeRef, {
						_id: [listOne, "id1"],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						sender: createTestEntity(MailAddressTypeRef, {
							name: "some name",
							address: "address@tuta.com",
						}),
						conversationEntry: ["listId", "listElementId"],
					})
					const listOneMailTwo = createTestEntity(MailTypeRef, {
						_id: [listOne, "id2"],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						sender: createTestEntity(MailAddressTypeRef, {
							name: "some name",
							address: "address@tuta.com",
						}),
						conversationEntry: ["listId", "listElementId"],
					})
					const listTwoMail = createTestEntity(MailTypeRef, {
						_id: [listTwo, "id3"],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						sender: createTestEntity(MailAddressTypeRef, {
							name: "some name",
							address: "address@tuta.com",
						}),
						conversationEntry: ["listId", "listElementId"],
					})
					await storage.put(MailTypeRef, await toStorableInstance(listOneMailOne))
					await storage.put(MailTypeRef, await toStorableInstance(listOneMailTwo))
					await storage.put(MailTypeRef, await toStorableInstance(listTwoMail))
					await storage.setNewRangeForList(MailTypeRef, listOne, "id1", "id2")
					await storage.setNewRangeForList(MailTypeRef, listTwo, "id3", "id3")

					await storage.deleteWholeList(MailTypeRef, listOne)

					const mailsInListOne = await storage.getWholeList(MailTypeRef, listOne)
					const mailsInListTwo = await storage.getWholeList(MailTypeRef, listTwo)
					cleanFieldsFromMail(mailsInListTwo[0])
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

					await storage.init({ userId: elementId1, databaseKey, timeRangeDays, forceNewDatabase: false })

					let mails = await storage.provideMultiple(MailTypeRef, listId, [elementId1])
					o(mails).deepEquals([])

					await storage.put(MailTypeRef, await toStorableInstance(storableMail1))

					mails = await storage.provideMultiple(MailTypeRef, listId, [elementId1, elementId2])
					cleanFieldsFromMail(mails[0])
					o(mails).deepEquals([storableMail1])

					await storage.put(MailTypeRef, await toStorableInstance(storableMail2))

					mails = await storage.provideMultiple(MailTypeRef, listId, [elementId1, elementId2])
					cleanFieldsFromMail(mails[0])
					cleanFieldsFromMail(mails[1])
					o(mails).deepEquals([storableMail1, storableMail2])
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

					await storage.init({ userId: elementId, databaseKey, timeRangeDays, forceNewDatabase: false })

					let mailSetEntry = await storage.get(MailSetEntryTypeRef, listId, elementId)
					o(mailSetEntry).equals(null)

					await storage.put(MailSetEntryTypeRef, await toStorableInstance(storableMailSetEntry))
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
					const storableMailSetEntry1 = createTestEntity(MailSetEntryTypeRef, {
						_id: [listId, elementId1],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						mail: ["mailListId", "mailId"],
					})
					const storableMailSetEntry2 = createTestEntity(MailSetEntryTypeRef, {
						_id: [listId, elementId2],
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						mail: ["mailListId", "mailId"],
					})

					await storage.init({ userId: elementId1, databaseKey, timeRangeDays, forceNewDatabase: false })

					let mails = await storage.provideMultiple(MailSetEntryTypeRef, listId, [elementId1])
					o(mails).deepEquals([])

					await storage.put(MailSetEntryTypeRef, await toStorableInstance(storableMailSetEntry1))

					mails = await storage.provideMultiple(MailSetEntryTypeRef, listId, [elementId1, elementId2])
					o(mails).deepEquals([storableMailSetEntry1])

					await storage.put(MailSetEntryTypeRef, await toStorableInstance(storableMailSetEntry2))

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
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
						details: createTestEntity(MailDetailsTypeRef, {
							recipients: createTestEntity(RecipientsTypeRef, {}),
							body: createTestEntity(BodyTypeRef, {}),
						}),
					})

					await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })

					let mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
					o(mailDetailsBlob).equals(null)

					await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(storableMailDetails))

					mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
					clearFieldsFromMailDetailsBlob(assertNotNull(mailDetailsBlob))

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
						_permissions: "permissions",
						details: createTestEntity(MailDetailsTypeRef, {
							recipients: createTestEntity(RecipientsTypeRef, {}),
							body: createTestEntity(BodyTypeRef, {}),
						}),
					})

					await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })

					await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(storableMailDetails))

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

			const mailSetEntryType = getTypeString(MailSetEntryTypeRef)

			o.beforeEach(async function () {
				await storage.init({ userId, databaseKey, timeRangeDays, forceNewDatabase: false })

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
				await storage.clearExcludedData(timeRangeDays, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				const mailSetEntryTypeModel = await typeModelResolver.resolveClientTypeReference(MailSetEntryTypeRef)
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
				await storage.clearExcludedData(timeRangeDays, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				const mailSetEntryTypeModel = await typeModelResolver.resolveClientTypeReference(MailSetEntryTypeRef)
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
				await storage.clearExcludedData(timeRangeDays, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				const mailSetEntryTypeModel = await typeModelResolver.resolveClientTypeReference(MailSetEntryTypeRef)
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
				await storage.clearExcludedData(timeRangeDays, userId)

				const newRange = await dbFacade.get("select * from ranges", [])
				const mailSetEntryTypeModel = await typeModelResolver.resolveClientTypeReference(MailSetEntryTypeRef)
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
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mailDetails: spamDetailsId,
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
				const trashSubfolderMailId = offsetId(fourDaysBeforeTimeRangeDays)
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
				const trashMailSetEntryElementId = offsetMailSetEntryId(threeDaysAfterTimeRangeDays, trashMailId)
				const trashSubfolderMailSetEntryElementId = offsetMailSetEntryId(fourDaysBeforeTimeRangeDays, trashSubfolderMailId)
				const spamMailSetEntryId: IdTuple = [spamFolderEntriesId, spamMailSetEntryElementId]
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

				const storableEntry = await toStorableInstance(
					createTestEntity(MailSetEntryTypeRef, {
						_id: spamMailSetEntryId,
						mail: spamMail._id,
						_ownerGroup: "ownerGroup",
						_permissions: "permissions",
					}),
				)
				await storage.put(MailSetEntryTypeRef, storableEntry)
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
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mailDetails: spamDetailsId,
					sender: createTestEntity(MailAddressTypeRef, {
						name: "some name",
						address: "address@tuta.com",
					}),
					conversationEntry: ["listId", "listElementId"],
				})
				const trashMailId = offsetId(threeDaysBeforeTimeRangeDays)
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

				const spamMailSetEntryElementId = offsetMailSetEntryId(twoDaysAfterTimeRangeDays, spamMailId)
				const trashMailSetEntryElementId = offsetMailSetEntryId(threeDaysBeforeTimeRangeDays, trashMailId)
				const spamMailSetEntryId: IdTuple = [spamFolderEntriesId, spamMailSetEntryElementId]
				const trashMailSetEntryId: IdTuple = [trashFolderEntriesId, trashMailSetEntryElementId]

				const spamEntry = createTestEntity(MailSetEntryTypeRef, {
					_id: spamMailSetEntryId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mail: spamMail._id,
				})
				await storage.put(MailSetEntryTypeRef, await toStorableInstance(spamEntry))
				const trashEntry = createTestEntity(MailSetEntryTypeRef, {
					_id: trashMailSetEntryId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					mail: trashMail._id,
				})
				await storage.put(MailSetEntryTypeRef, await toStorableInstance(trashEntry))

				await storage.put(MailTypeRef, await toStorableInstance(spamMail))
				await storage.put(MailTypeRef, await toStorableInstance(trashMail))
				const spamDetails = createTestEntity(MailDetailsBlobTypeRef, {
					_id: spamDetailsId,
					_ownerGroup: "ownerGroup",
					_permissions: "permissions",
					details: createTestEntity(MailDetailsTypeRef, {
						recipients: createTestEntity(RecipientsTypeRef, {}),
						body: createTestEntity(BodyTypeRef, {}),
					}),
				})
				await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(spamDetails))
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
				await storage.clearExcludedData(timeRangeDays, userId)
				const mailSetEntryTypeModel = await typeModelResolver.resolveClientTypeReference(MailSetEntryTypeRef)

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
				_ownerGroup: "ownerGroup",
				_permissions: "permissions",
				folderType: MailSetKind.SPAM,
				entries: "spamEntriesListId",
			})

			const everyEntity: Array<Entity> = [
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
				elementIdPart(getFirstOrThrow(trashMailSetEntries)._id),
				elementIdPart(lastThrow(trashMailSetEntries)._id),
			)

			// Here we clear the excluded data
			await storage.clearExcludedData(timeRangeDays, userId)

			const assertContents = async ({ _id, _type }, expected, msg) => {
				const { listId, elementId } = expandId(_id)
				let valueFromDb = await storage.get(_type, listId, elementId)
				if (valueFromDb && _type === MailTypeRef) {
					cleanFieldsFromMail(valueFromDb as Mail)
				} else if (valueFromDb && _type === MailDetailsBlobTypeRef) {
					clearFieldsFromMailDetailsBlob(valueFromDb as MailDetailsBlob)
				}
				return o(valueFromDb).deepEquals(expected)(msg)
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
