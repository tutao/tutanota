import o from "ospec"
import {verify} from "@tutao/tutanota-test-utils"
import {customTypeEncoders, OfflineStorage, sql} from "../../../../../src/api/worker/offline/OfflineStorage.js"
import {instance, object, when} from "testdouble"
import * as cborg from "cborg"
import {GENERATED_MIN_ID, generatedIdToTimestamp, getElementId, timestampToGeneratedId} from "../../../../../src/api/common/utils/EntityUtils.js"
import {firstThrow, getDayShifted, getTypeId, lastThrow, mapNullable, promiseMap, TypeRef} from "@tutao/tutanota-utils"
import {DateProvider} from "../../../../../src/api/common/DateProvider.js"
import {
	createFile,
	createMail,
	createMailBody,
	createMailFolder,
	FileTypeRef,
	Mail,
	MailBody,
	MailBodyTypeRef,
	MailFolderTypeRef,
	MailTypeRef
} from "../../../../../src/api/entities/tutanota/TypeRefs.js"
import {OfflineStorageMigrator} from "../../../../../src/api/worker/offline/OfflineStorageMigrator.js"
import {InterWindowEventFacadeSendDispatcher} from "../../../../../src/native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import {DesktopSqlCipher} from "../../../../../src/desktop/DesktopSqlCipher.js"
import * as fs from "fs"
import {untagSqlObject} from "../../../../../src/api/worker/offline/SqlValue.js"
import {MailFolderType} from "../../../../../src/api/common/TutanotaConstants.js"
import {ElementEntity, ListElementEntity, SomeEntity} from "../../../../../src/api/common/EntityTypes.js"
import {resolveTypeReference} from "../../../../../src/api/common/EntityFunctions.js"
import {Type} from "../../../../../src/api/common/EntityConstants.js"
import {expandId} from "../../../../../src/api/worker/rest/DefaultEntityRestCache.js"
import {WorkerImpl} from "../../../../../src/api/worker/WorkerImpl.js"

function incrementId(id: Id, ms: number) {
	const timestamp = generatedIdToTimestamp(id)
	return timestampToGeneratedId(timestamp + ms)
}

class IdGenerator {
	constructor(
		private currentId: Id
	) {
	}

	getNext(incrementByMs: number = 60000): Id {
		this.currentId = incrementId(this.currentId, incrementByMs)
		return this.currentId
	}
}

function encode(thing) {
	return cborg.encode(thing, {typeEncoders: customTypeEncoders})
}

const nativePath = buildOptions.sqliteNativePath
const database = "./testdatabase.sqlite"
export const offlineDatabaseTestKey = Uint8Array.from([3957386659, 354339016, 3786337319, 3366334248])

o.spec("OfflineStorage", function () {

	const now = new Date("2022-01-01 00:00:00 UTC")
	const timeRangeDays = 10
	const userId = "userId"
	const databaseKey = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])

	/** get an id based on a timestamp that is {@param days} days away from the time range cutoff */
	const offsetId = days => timestampToGeneratedId(getDayShifted(now, 0 - timeRangeDays + days).getTime())
	const cutoffId = offsetId(0)

	let dbFacade: DesktopSqlCipher
	let dateProviderMock: DateProvider
	let storage: OfflineStorage
	let migratorMock: OfflineStorageMigrator
	let interWindowEventSenderMock: InterWindowEventFacadeSendDispatcher
	let worker: WorkerImpl

	o.beforeEach(async function () {
		dbFacade = new DesktopSqlCipher(nativePath, database, false)

		dateProviderMock = object<DateProvider>()
		migratorMock = instance(OfflineStorageMigrator)
		interWindowEventSenderMock = instance(InterWindowEventFacadeSendDispatcher)
		when(dateProviderMock.now()).thenReturn(now.getTime())
		worker = instance(WorkerImpl)
		storage = new OfflineStorage(dbFacade, interWindowEventSenderMock, dateProviderMock, migratorMock, worker)
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
			if (typeModel.type === Type.Element) {
				preparedQuery = sql`insert into element_entities values (${type}, ${(entity as ElementEntity)._id}, ${entity._ownerGroup}, ${encode(entity)})`
			} else {
				const [listId, elementId] = (entity as ListElementEntity)._id
				preparedQuery = sql`INSERT INTO list_entities VALUES (${type}, ${listId}, ${elementId}, ${entity._ownerGroup}, ${encode(entity)})`
			}
			await dbFacade.run(preparedQuery.query, preparedQuery.params)
		}

		async function insertRange(type: TypeRef<unknown>, listId: string, lower: string, upper: string) {
			const {query, params} = sql`INSERT INTO ranges VALUES(${getTypeId(type)}, ${listId}, ${lower}, ${upper})`
			await dbFacade.run(query, params)
		}

		async function getAllIdsForType(typeRef: TypeRef<unknown>): Promise<Id[]> {
			const typeModel = await resolveTypeReference(typeRef)
			const {query, params} = typeModel.type === Type.Element
				? sql`select * from element_entities where type = ${getTypeId(typeRef)}`
				: sql`select * from list_entities where type = ${getTypeId(typeRef)}`
			return (await dbFacade.all(query, params)).map(r => r.elementId.value as Id)
		}

		o("migrations are run", async function () {
			await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})
			verify(migratorMock.migrate(storage, dbFacade))
		})

		o.spec("Clearing excluded data", function () {
			const listId = "listId"
			const mailType = getTypeId(MailTypeRef)
			const mailFolderType = getTypeId(MailFolderTypeRef)
			const mailBodyType = getTypeId(MailBodyTypeRef)

			o("old ranges will be deleted", async function () {
				// create tables
				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})

				const upper = offsetId(-1)
				const lower = offsetId(-2)
				await insertEntity(createMailFolder({_id: ["mailFolderList", "mailFolderId"], mails: listId}))
				await insertEntity(createMail({_id: [listId, "anything"]}))
				await insertRange(MailTypeRef, listId, lower, upper)
				await storage.deinit()

				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})
				const allRanges = await dbFacade.all("SELECT * FROM ranges", [])
				o(allRanges).deepEquals([])
				const allEntities = await getAllIdsForType(MailTypeRef)
				o(allEntities).deepEquals([])
			})

			o("modified ranges will be shrunk", async function () {
				const upper = offsetId(2)
				const lower = offsetId(-2)
				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})
				await insertEntity(createMailFolder({_id: ["mailFolderListId", "mailFolderId"], mails: listId}))
				await insertRange(MailTypeRef, listId, lower, upper)
				await storage.deinit()
				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})
				const newRange = await dbFacade.get("select * from ranges", [])
				o(mapNullable(newRange, untagSqlObject)).deepEquals({type: mailType, listId, lower: cutoffId, upper})
			})

			o("unmodified ranges will not be deleted or shrunk", async function () {
				const upper = offsetId(2)
				const lower = offsetId(1)

				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})
				await insertEntity(createMailFolder({_id: ["mailFolderList", "mailFolderId"], mails: listId}))
				await insertRange(MailTypeRef, listId, lower, upper)
				await storage.deinit()

				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})
				const newRange = await dbFacade.get("select * from ranges", [])
				o(mapNullable(newRange, untagSqlObject)).deepEquals({type: mailType, listId, lower, upper})
			})

			o("complete ranges won't be lost if entities are all newer than cutoff", async function () {
				const upper = offsetId(2)
				const lower = GENERATED_MIN_ID
				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})
				const mail = createMail({_id: [listId, offsetId(1)]})
				const mailFolder = createMailFolder({_id: ["mailFolderList", "folderId"], mails: listId})
				await insertEntity(mailFolder)
				await insertEntity(mail)
				await insertRange(MailTypeRef, listId, lower, upper)
				await storage.deinit()
				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})

				const newRange = await dbFacade.get("select * from ranges", [])
				o(mapNullable(newRange, untagSqlObject)).deepEquals({type: mailType, listId, lower, upper})

				const allFolderIds = await getAllIdsForType(MailFolderTypeRef)
				o(allFolderIds).deepEquals(["folderId"])
				const allMailIds = await getAllIdsForType(MailTypeRef)
				o(allMailIds).deepEquals([getElementId(mail)])
			})

			o("trash and spam is cleared", async function () {
				const spamFolderId = "spamFolder"
				const trashFolderId = "trashFolder"
				const spamListId = "spamList"
				const trashListId = "trashList"
				const spamMailBodyId = "spamMailBodyId"
				const trashMailBodyId = "trashMailBodyId"

				const spamMailId = offsetId(2)
				const spamMail = createMail({_id: [spamListId, spamMailId], body: spamMailBodyId})
				const trashMailId = offsetId(2)
				const trashMail = createMail({_id: [trashListId, trashMailId], body: trashMailBodyId})

				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})

				await insertEntity(createMailFolder({_id: ["mailFolderList", spamFolderId], mails: spamListId, folderType: MailFolderType.SPAM}))
				await insertEntity(createMailFolder({_id: ["mailFolderList", trashFolderId], mails: trashListId, folderType: MailFolderType.TRASH}))
				await insertEntity(spamMail)
				await insertEntity(trashMail)
				await insertEntity(createMailBody({_id: spamMailBodyId}))
				await insertEntity(createMailBody({_id: trashMailBodyId}))

				await storage.deinit()
				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})
				const allEntities = await dbFacade.all("select * from list_entities", [])
				o(allEntities.map(r => r.elementId.value)).deepEquals([spamFolderId, trashFolderId])

				o(await getAllIdsForType(MailFolderTypeRef)).deepEquals([spamFolderId, trashFolderId])
				o(await getAllIdsForType(MailTypeRef)).deepEquals([])
				o(await getAllIdsForType(MailBodyTypeRef)).deepEquals([])
			})

			o("normal folder is partially cleared", async function () {
				const inboxMailList = "inboxMailList"
				const beforeMailBodyId = "beforeMailBodyId"
				const afterMailBodyId = "afterMailBodyId"

				const mailBefore = createMail({_id: [inboxMailList, offsetId(-2)], body: beforeMailBodyId})
				const mailAfter = createMail({_id: [inboxMailList, offsetId(2)], body: afterMailBodyId})

				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})

				await insertEntity(createMailFolder({_id: ["mailFolderList", "folderId"], mails: inboxMailList, folderType: MailFolderType.INBOX}))
				await insertEntity(mailBefore)
				await insertEntity(mailAfter)
				await insertEntity(createMailBody({_id: beforeMailBodyId}))
				await insertEntity(createMailBody({_id: afterMailBodyId}))
				await storage.deinit()
				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})

				const allMailIds = await getAllIdsForType(MailTypeRef)
				o(allMailIds).deepEquals([getElementId(mailAfter)])
				const allMailBodyIds = await getAllIdsForType(MailBodyTypeRef)
				o(allMailBodyIds).deepEquals([afterMailBodyId])
			})

			o("normal folder is completely cleared", async function () {
				const inboxMailList = "inboxMailList"
				const mailBodyId1 = "mailBodyId1"
				const mailBodyId2 = "afterMailBodyId"

				const mail1 = createMail({_id: [inboxMailList, offsetId(-2)], body: mailBodyId1})
				const mail2 = createMail({_id: [inboxMailList, offsetId(-3)], body: mailBodyId2})

				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})

				await insertEntity(createMailFolder({_id: ["mailFolderList", "folderId"], mails: inboxMailList, folderType: MailFolderType.INBOX}))
				await insertEntity(mail1)
				await insertEntity(mail2)
				await insertEntity(createMailBody({_id: mailBodyId1}))
				await insertEntity(createMailBody({_id: mailBodyId2}))
				await storage.deinit()
				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})

				o(await getAllIdsForType(MailTypeRef)).deepEquals([])
				o(await getAllIdsForType(MailBodyTypeRef)).deepEquals([])
			})

			o("when mail is deleted, attachment is also deleted", async function () {
				const inboxMailList = "inboxMailList"
				const beforeMailBodyId = "beforeMailBodyId"
				const afterMailBodyId = "afterMailBodyId"
				const fileListId = "fileListId"

				const fileBefore = createFile({_id: [fileListId, "fileBefore"]})
				const fileAfter = createFile({_id: [fileListId, "fileAfter"]})
				const mailBefore = createMail({_id: [inboxMailList, offsetId(-2)], body: beforeMailBodyId, attachments: [fileBefore._id]})
				const mailAfter = createMail({_id: [inboxMailList, offsetId(2)], body: afterMailBodyId, attachments: [fileAfter._id]})

				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})

				await insertEntity(createMailFolder({_id: ["mailFolderList", "folderId"], mails: inboxMailList, folderType: MailFolderType.INBOX}))
				await insertEntity(mailBefore)
				await insertEntity(mailAfter)
				await insertEntity(fileBefore)
				await insertEntity(fileAfter)
				await insertEntity(createMailBody({_id: beforeMailBodyId}))
				await insertEntity(createMailBody({_id: afterMailBodyId}))
				await storage.deinit()

				await storage.init({userId, databaseKey, timeRangeDays, forceNewDatabase: false})
				o(await getAllIdsForType(MailTypeRef)).deepEquals([getElementId(mailAfter)])
				o(await getAllIdsForType(FileTypeRef)).deepEquals([getElementId(fileAfter)])
			})
		})
	})

	o.spec("Integration test", function () {
		function createMailList(
			numMails,
			listId,
			idGenerator,
			getSubject,
			getBody
		): {mails: Array<Mail>, mailBodies: Array<MailBody>} {

			const mails: Array<Mail> = []
			const mailBodies: Array<MailBody> = []
			for (let i = 0; i < numMails; ++i) {
				const mailId = idGenerator.getNext()
				const bodyId = idGenerator.getNext()
				mails.push(createMail({
					_id: [listId, mailId],
					subject: getSubject(i),
					body: bodyId
				}))
				mailBodies.push(createMailBody({
					_id: bodyId,
					text: getBody(i)
				}))
			}
			return {mails, mailBodies}
		}

		o("cleanup works as expected", async function () {

			// Time range is five days
			const oldIds = new IdGenerator(offsetId(-5))
			const newIds = new IdGenerator(offsetId(5))

			const inboxListId = oldIds.getNext()
			const inboxFolder = createMailFolder({
				_id: [userId, oldIds.getNext()],
				mails: inboxListId,
				folderType: MailFolderType.INBOX,
			})
			const {
				mails: oldInboxMails,
				mailBodies: oldInboxMailBodies
			} = createMailList(3, inboxListId, oldIds, i => `old subject ${i}`, i => `old body ${i}`)

			const {
				mails: newInboxMails,
				mailBodies: newInboxMailBodies
			} = createMailList(3, inboxListId, newIds, i => `new subject ${i}`, i => `new body ${i}`)


			const trashListId = oldIds.getNext()
			const trashFolder = createMailFolder({
				_id: [userId, oldIds.getNext()],
				mails: trashListId,
				folderType: MailFolderType.TRASH,
			})
			const {
				mails: trashMails,
				mailBodies: trashMailBodies
			} = createMailList(3, trashListId, newIds, i => `trash subject ${i}`, i => `trash body ${i}`)

			const everyEntity = [
				inboxFolder, trashFolder,
				...oldInboxMails, ...oldInboxMailBodies,
				...newInboxMails, ...newInboxMailBodies,
				...trashMails, ...trashMailBodies
			]

			await storage.init({userId, databaseKey: offlineDatabaseTestKey, timeRangeDays, forceNewDatabase: false})

			for (let entity of everyEntity) {
				await storage.put(entity)
			}

			await storage.setNewRangeForList(MailTypeRef, inboxListId, firstThrow(oldInboxMails)._id[1], lastThrow(newInboxMails)._id[1])
			await storage.setNewRangeForList(MailTypeRef, trashListId, firstThrow(trashMails)._id[1], lastThrow(trashMails)._id[1])

			await storage.deinit()

			// We need to create a new OfflineStorage because clearExcludedData gets run in `init`,
			// And the easiest way to put data in the database is to create an OfflineStorage
			await storage.init({userId, databaseKey: offlineDatabaseTestKey, timeRangeDays, forceNewDatabase: false})

			const assertContents = async ({_id, _type}, expected, msg) => {
				const {listId, elementId} = expandId(_id)
				return o(await storage.get(_type, listId, elementId)).deepEquals(expected)(msg)
			}

			await promiseMap(oldInboxMails, mail => assertContents(mail, null, `old mail ${mail._id} was deleted`))
			await promiseMap(oldInboxMailBodies, body => assertContents(body, null, `old mailBody ${body._id} was deleted`))

			await promiseMap(newInboxMails, mail => assertContents(mail, mail, `new mail ${mail._id} was not deleted`))
			await promiseMap(newInboxMailBodies, body => assertContents(body, body, `new mailBody ${body._id} was not deleted`))

			// All of trash should be cleared, even though the ids are old
			await promiseMap(trashMails, mail => assertContents(mail, null, `trash mail ${mail._id} was deleted`))
			await promiseMap(trashMailBodies, body => assertContents(body, null, `trash mailBody ${body._id} was deleted`))

			await assertContents(inboxFolder, inboxFolder, `inbox folder was not deleted`)
			await assertContents(trashFolder, trashFolder, `trash folder was not deleted`)

			o(await storage.getRangeForList(MailTypeRef, inboxListId)).deepEquals({
				lower: cutoffId,
				upper: lastThrow(newInboxMails)._id[1]
			})("lower range for inbox was set to cutoff")
			o(await storage.getRangeForList(MailTypeRef, trashListId)).equals(null)("range for trash was deleted")

		})
	})
})