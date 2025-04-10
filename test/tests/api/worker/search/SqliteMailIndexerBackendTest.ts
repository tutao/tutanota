import o from "@tutao/otest"
import { SqliteMailIndexerBackend } from "../../../../../src/mail-app/workerUtils/index/SqliteMailIndexerBackend"
import { OfflineStoragePersistence } from "../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { object, verify, when } from "testdouble"
import { FULL_INDEXED_TIMESTAMP, GroupType } from "../../../../../src/common/api/common/TutanotaConstants"
import { MailWithDetailsAndAttachments } from "../../../../../src/mail-app/workerUtils/index/MailIndexerBackend"
import { createTestEntity } from "../../../TestUtils"
import { FileTypeRef, MailDetailsTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs"

o.spec("SqliteMailIndexerBackend", function () {
	let persistence: OfflineStoragePersistence
	let backend: SqliteMailIndexerBackend

	o.beforeEach(function () {
		persistence = object()
		backend = new SqliteMailIndexerBackend(persistence)
	})

	o.test("getCurrentIndexTimestamps", async function () {
		const mailGroupId = "mailGroupId"
		const contactGroupId = "contactGroupId"
		when(persistence.getIndexedGroups()).thenResolve([
			{
				groupId: mailGroupId,
				type: GroupType.Mail,
				indexedTimestamp: 123456,
			},
			{
				groupId: contactGroupId,
				type: GroupType.Contact,
				indexedTimestamp: FULL_INDEXED_TIMESTAMP,
			},
		])

		o(await backend.getCurrentIndexTimestamps([mailGroupId, contactGroupId])).deepEquals(
			new Map([
				[mailGroupId, 123456],
				[contactGroupId, FULL_INDEXED_TIMESTAMP],
			]),
		)
	})

	function makeMailData(): MailWithDetailsAndAttachments {
		return {
			mail: createTestEntity(MailTypeRef),
			mailDetails: createTestEntity(MailDetailsTypeRef),
			attachments: [createTestEntity(FileTypeRef)],
		}
	}

	o.test("indexMails", async function () {
		const mailData: MailWithDetailsAndAttachments = makeMailData()
		const timestamps = new Map([["mailGroupId", 12345]])

		await backend.indexMails(timestamps, [mailData])

		verify(persistence.storeMailData([mailData]))
		verify(persistence.updateIndexingTimestamp("mailGroupId", 12345))
	})

	o.test("enableIndexing", async function () {
		await backend.enableIndexing()

		verify(persistence.setMailIndexingEnabled(true))
	})

	o.spec("isMailIndexingEnabled", function () {
		o.test("is enabled", async function () {
			when(persistence.isMailIndexingEnabled()).thenResolve(true)

			o.check(await backend.isMailIndexingEnabled()).equals(true)
		})

		o.test("is disabled", async function () {
			when(persistence.isMailIndexingEnabled()).thenResolve(false)

			o.check(await backend.isMailIndexingEnabled()).equals(false)
		})
	})

	o.test("onMailCreated", async function () {
		const mailData = makeMailData()

		await backend.onMailCreated(mailData)

		verify(persistence.storeMailData([mailData]))
	})

	o.test("onMailUpdates", async function () {
		const mailData = makeMailData()

		await backend.onMailUpdated(mailData)

		verify(persistence.storeMailData([mailData]))
	})

	o.test("onBeforeMailDeleted", async function () {
		const mailId: IdTuple = ["mailListId", "mailId"]

		await backend.onBeforeMailDeleted(mailId)

		verify(persistence.deleteMailData(mailId))
	})
})
