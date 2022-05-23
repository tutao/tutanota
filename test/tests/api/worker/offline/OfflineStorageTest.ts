import o from "ospec"
import {verify} from "@tutao/tutanota-test-utils"
import {customTypeEncoders, OfflineStorage} from "../../../../../src/api/worker/offline/OfflineStorage.js"
import {OfflineDbFacade, OfflineDbFactory} from "../../../../../src/desktop/db/OfflineDbFacade.js"
import {instance, matchers, object, when} from "testdouble"
import * as cborg from "cborg"
import {GENERATED_MIN_ID, generatedIdToTimestamp, getElementId, getListId, timestampToGeneratedId} from "../../../../../src/api/common/utils/EntityUtils.js"
import {firstThrow, getDayShifted, lastThrow, promiseMap, getTypeId} from "@tutao/tutanota-utils"
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
import {MailFolderType} from "../../../../../src/api/common/TutanotaConstants.js"
import {OfflineDb} from "../../../../../src/desktop/db/OfflineDb.js"
import {aes256RandomKey} from "@tutao/tutanota-crypto"
import {expandId} from "../../../../../src/api/worker/rest/EntityRestCache.js"
import {OfflineStorageMigrator} from "../../../../../src/api/worker/offline/OfflineStorageMigrator.js"

const {anything} = matchers

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

o.spec("OfflineStorage", function () {

	const now = new Date("2022-01-01 00:00:00 UTC")
	const timeRangeDays = 10
	const userId = "userId"
	const databaseKey = [0, 1, 2, 3, 4, 5, 6, 7]

	/** get an id based on a timestamp that is {@param days} days away from the time range cutoff */
	const offsetId = days => timestampToGeneratedId(getDayShifted(now, 0 - timeRangeDays + days).getTime())
	const cutoffId = offsetId(0)


	o.spec("Unit test", function () {

		let storage: OfflineStorage
		let dbFacadeMock: OfflineDbFacade
		let dateProviderMock: DateProvider
		let migratorMock: OfflineStorageMigrator

		o.beforeEach(async function () {
			dbFacadeMock = instance(OfflineDbFacade)
			// These need to be mocked for any call of `init` to succeed
			// More specific mock calls will override
			when(dbFacadeMock.getListElementsOfType(userId, anything())).thenResolve([])
			when(dbFacadeMock.getWholeList(userId, anything(), anything())).thenResolve([])
			when(dbFacadeMock.getRange(userId, anything(), anything())).thenResolve(null)

			dateProviderMock = object<DateProvider>()
			migratorMock = instance(OfflineStorageMigrator)
			when(dateProviderMock.now()).thenReturn(now.getTime())
			storage = new OfflineStorage(dbFacadeMock, dateProviderMock, migratorMock)
		})

		o("migrations are run", async function () {
			await storage.init(userId, databaseKey, timeRangeDays)
			verify(migratorMock.migrate(storage))
		})

		o.spec("Clearing excluded data", function () {
			const listId = "listId"
			const mailType = getTypeId(MailTypeRef)
			const mailFolderType = getTypeId(MailFolderTypeRef)
			const mailBodyType = getTypeId(MailBodyTypeRef)

			o("old ranges will be deleted", async function () {
				const upper = offsetId(-1)
				const lower = offsetId(-2)

				when(dbFacadeMock.getListElementsOfType(userId, mailFolderType)).thenResolve([
					encode(createMailFolder({mails: listId}))
				])
				when(dbFacadeMock.getWholeList(userId, mailType, anything())).thenResolve([])
				when(dbFacadeMock.getRange(userId, mailType, listId)).thenResolve({upper, lower})

				await storage.init(userId, databaseKey, timeRangeDays)

				verify(dbFacadeMock.deleteRange(userId, mailType, listId))
			})

			o("modified ranges will be shrunk", async function () {
				const upper = offsetId(2)
				const lower = offsetId(-2)

				when(dbFacadeMock.getListElementsOfType(userId, mailFolderType)).thenResolve([
					encode(createMailFolder({mails: listId}))
				])
				when(dbFacadeMock.getWholeList(userId, mailType, anything())).thenResolve([])
				when(dbFacadeMock.getRange(userId, mailType, listId)).thenResolve({upper, lower})

				await storage.init(userId, databaseKey, timeRangeDays)

				verify(dbFacadeMock.setLowerRange(userId, mailType, listId, cutoffId))
			})

			o("unmodified ranges will not be deleted or shrunk", async function () {
				const upper = offsetId(2)
				const lower = offsetId(1)

				when(dbFacadeMock.getListElementsOfType(userId, mailFolderType)).thenResolve([
					encode(createMailFolder({mails: listId}))
				])
				when(dbFacadeMock.getWholeList(userId, mailType, anything())).thenResolve([])
				when(dbFacadeMock.getRange(userId, mailType, listId)).thenResolve({upper, lower})

				await storage.init(userId, databaseKey, timeRangeDays)

				verify(dbFacadeMock.setLowerRange(userId, mailType, listId, anything()), {times: 0})
				verify(dbFacadeMock.deleteRange(userId, mailType, listId), {times: 0})
			})

			o("complete ranges won't be lost if entities are all newer than cutoff", async function () {
				const upper = offsetId(2)
				const lower = GENERATED_MIN_ID
				when(dbFacadeMock.getRange(userId, mailType, listId)).thenResolve({upper, lower})
				when(dbFacadeMock.getListElementsOfType(userId, mailFolderType)).thenResolve([])
				when(dbFacadeMock.provideFromRange(userId, mailType, listId, GENERATED_MIN_ID, 1, false)).thenResolve([
					encode({_id: [listId, offsetId(1)]})
				])

				await storage.init(userId, databaseKey, timeRangeDays)

				verify(dbFacadeMock.setLowerRange(userId, mailType, listId, anything()), {times: 0})
				verify(dbFacadeMock.deleteRange(userId, mailType, listId), {times: 0})
			})

			o("trash and spam is cleared", async function () {
				const spamListId = "spamList"
				const trashListId = "trashList"
				const spamMailBodyId = "spamMailBodyId"
				const trashMailBodyId = "trashMailBodyId"

				when(dbFacadeMock.getListElementsOfType(userId, mailFolderType)).thenResolve([
					encode(createMailFolder({mails: spamListId, folderType: MailFolderType.SPAM})),
					encode(createMailFolder({mails: trashListId, folderType: MailFolderType.TRASH})),
				])
				const spamMail = createMail({_id: [spamListId, offsetId(2)], body: spamMailBodyId})
				when(dbFacadeMock.getWholeList(userId, mailType, spamListId)).thenResolve([
					encode(spamMail)
				])

				const trashMail = createMail({_id: [trashListId, offsetId(2)], body: trashMailBodyId})
				when(dbFacadeMock.getWholeList(userId, mailType, trashListId)).thenResolve([
					encode(trashMail)
				])

				await storage.init(userId, databaseKey, timeRangeDays)

				// Spam mail was deleted even though it's after the cutoff
				verify(dbFacadeMock.deleteIn(userId, mailType, getListId(spamMail), [getElementId(spamMail)]))
				// Trash mail was deleted even though it's after the cutoff
				verify(dbFacadeMock.deleteIn(userId, mailType, getListId(trashMail), [getElementId(trashMail)]))
				verify(dbFacadeMock.deleteIn(
					userId,
					mailBodyType,
					null,
					[spamMailBodyId]
				))
				verify(dbFacadeMock.deleteIn(
					userId,
					mailBodyType,
					null,
					[trashMailBodyId]
				))

			})

			o("normal folder is partially cleared", async function () {
				const inboxMailList = "inboxMailList"
				const beforeMailBodyId = "beforeMailBodyId"
				const afterMailBodyId = "afterMailBodyId"

				when(dbFacadeMock.getListElementsOfType(userId, mailFolderType)).thenResolve([
					encode(createMailFolder({mails: inboxMailList, folderType: MailFolderType.INBOX})),
				])
				const mailBefore = createMail({_id: [inboxMailList, offsetId(-2)], body: beforeMailBodyId})
				const mailAfter = createMail({_id: [inboxMailList, offsetId(2)], body: afterMailBodyId})
				when(dbFacadeMock.getWholeList(userId, mailType, inboxMailList)).thenResolve([
					encode(mailBefore),
					encode(mailAfter),
				])

				await storage.init(userId, databaseKey, timeRangeDays)

				verify(dbFacadeMock.deleteIn(userId, mailType, inboxMailList, [getElementId(mailBefore)]))
				verify(dbFacadeMock.deleteIn(userId, mailType, inboxMailList, [getElementId(mailAfter)]), {times: 0})
				verify(dbFacadeMock.deleteIn(userId, mailBodyType, null, [beforeMailBodyId]))
			})

			o("normal folder is completely cleared", async function () {
				const inboxMailList = "inboxMailList"
				const mailBodyId1 = "mailBodyId1"
				const mailBodyId2 = "afterMailBodyId"

				when(dbFacadeMock.getListElementsOfType(userId, mailFolderType)).thenResolve([
					encode(createMailFolder({mails: inboxMailList, folderType: MailFolderType.INBOX})),
				])
				const mail1 = createMail({_id: [inboxMailList, offsetId(-2)], body: mailBodyId1})
				const mail2 = createMail({_id: [inboxMailList, offsetId(-3)], body: mailBodyId2})
				when(dbFacadeMock.getWholeList(userId, mailType, inboxMailList)).thenResolve([
					encode(mail1),
					encode(mail2),
				])

				await storage.init(userId, databaseKey, timeRangeDays)

				verify(dbFacadeMock.deleteIn(userId, mailType, inboxMailList, [getElementId(mail1), getElementId(mail2)]))
				verify(dbFacadeMock.deleteIn(userId, mailBodyType, null, [mailBodyId1, mailBodyId2]))
			})

			o("when mail is deleted, attachment is also deleted", async function () {
				const inboxMailList = "inboxMailList"
				const beforeMailBodyId = "beforeMailBodyId"
				const afterMailBodyId = "afterMailBodyId"
				const fileListId = "fileListId"

				when(dbFacadeMock.getListElementsOfType(userId, mailFolderType)).thenResolve([
					encode(createMailFolder({mails: inboxMailList, folderType: MailFolderType.INBOX})),
				])
				const fileBefore = createFile({_id: [fileListId, "fileBefore"]})
				const fileAfter = createFile({_id: [fileListId, "fileAfter"]})
				const mailBefore = createMail({_id: [inboxMailList, offsetId(-2)], body: beforeMailBodyId, attachments: [fileBefore._id]})
				const mailAfter = createMail({_id: [inboxMailList, offsetId(2)], body: afterMailBodyId, attachments: [fileAfter._id]})
				when(dbFacadeMock.getWholeList(userId, mailType, inboxMailList)).thenResolve([
					encode(mailBefore),
					encode(mailAfter),
				])

				await storage.init(userId, databaseKey, timeRangeDays)
				verify(dbFacadeMock.deleteIn(userId, mailType, inboxMailList, [getElementId(mailBefore)]))
				verify(dbFacadeMock.deleteIn(userId, getTypeId(FileTypeRef), fileListId, [getElementId(fileBefore)]))
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
		): {
			mails: Array<Mail>,
			mailBodies: Array<MailBody>
		} {

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

			let db
			const factory: OfflineDbFactory = {
				async create(userId, key) {
					if (!db) {
						db = new OfflineDb(buildOptions.sqliteNativePath)
						await db.init(":memory:", key, false)
					}
					return db
				},
				async delete() {
					throw new Error("Stub no implemented, whoopsie!")
				}
			}

			const offlineDbFacade = new OfflineDbFacade(factory)

			const dateProvider = {
				now: () => now.getTime(),
				timeZone: () => {
					throw new Error()
				}
			}

			const migratorMock = instance(OfflineStorageMigrator)

			let offlineStorage = new OfflineStorage(offlineDbFacade, dateProvider, migratorMock)

			await offlineStorage.init(userId, aes256RandomKey(), timeRangeDays)

			for (let entity of everyEntity) {
				await offlineStorage.put(entity)
			}

			await offlineStorage.setNewRangeForList(MailTypeRef, inboxListId, firstThrow(oldInboxMails)._id[1], lastThrow(newInboxMails)._id[1])
			await offlineStorage.setNewRangeForList(MailTypeRef, trashListId, firstThrow(trashMails)._id[1], lastThrow(trashMails)._id[1])


			// We need to create a new OfflineStorage because clearExcludedData gets run in `init`,
			// And the easiest way to put data in the database is to create an OfflineStorage
			offlineStorage = new OfflineStorage(offlineDbFacade, dateProvider, migratorMock)
			await offlineStorage.init(userId, aes256RandomKey(), timeRangeDays)

			const assertContents = async ({_id, _type}, expected, msg) => {
				const {listId, elementId} = expandId(_id)
				return o(await offlineStorage.get(_type, listId, elementId)).deepEquals(expected)(msg)
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

			o(await offlineStorage.getRangeForList(MailTypeRef, inboxListId)).deepEquals({
				lower: cutoffId,
				upper: lastThrow(newInboxMails)._id[1]
			})("lower range for inbox was set to cutoff")
			o(await offlineStorage.getRangeForList(MailTypeRef, trashListId)).equals(null)("range for trash was deleted")

		})
	})
})