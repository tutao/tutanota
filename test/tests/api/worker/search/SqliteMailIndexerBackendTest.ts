import o from "@tutao/otest"
import { SqliteMailIndexerBackend } from "../../../../../src/mail-app/workerUtils/index/SqliteMailIndexerBackend"
import { OfflineStoragePersistence } from "../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { matchers, object, verify, when } from "testdouble"
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

	o.spec("truncateAllCurrentIndexTimestamps", () => {
		o.test("truncates if less", async function () {
			const contactGroupId = "contactGroupId"
			when(persistence.getIndexedGroups()).thenResolve([
				{
					groupId: contactGroupId,
					type: GroupType.Contact,
					indexedTimestamp: FULL_INDEXED_TIMESTAMP,
				},
			])

			await backend.truncateAllCurrentIndexTimestamps(123400)

			verify(await persistence.updateIndexingTimestamp(contactGroupId, 123400), { times: 1 })
		})
		o.test("no-op if greater", async function () {
			const mailGroupId = "mailGroupId"
			when(persistence.getIndexedGroups()).thenResolve([
				{
					groupId: mailGroupId,
					type: GroupType.Mail,
					indexedTimestamp: 123456,
				},
			])

			await backend.truncateAllCurrentIndexTimestamps(123400)

			verify(await persistence.updateIndexingTimestamp(mailGroupId, matchers.anything()), { times: 0 })
		})
		o.test("no-op if equal", async function () {
			const mailGroupId = "mailGroupId"
			when(persistence.getIndexedGroups()).thenResolve([
				{
					groupId: mailGroupId,
					type: GroupType.Mail,
					indexedTimestamp: 123400,
				},
			])

			await backend.truncateAllCurrentIndexTimestamps(123400)

			verify(await persistence.updateIndexingTimestamp(mailGroupId, matchers.anything()), { times: 0 })
		})
		o.test("multiple groups", async function () {
			when(persistence.getIndexedGroups()).thenResolve([
				{
					groupId: "greater",
					type: GroupType.Mail,
					indexedTimestamp: 123456,
				},
				{
					groupId: "equal",
					type: GroupType.Mail,
					indexedTimestamp: 123400,
				},
				{
					groupId: "less",
					type: GroupType.Mail,
					indexedTimestamp: FULL_INDEXED_TIMESTAMP,
				},
			])

			await backend.truncateAllCurrentIndexTimestamps(123400)

			// This is the only call that should've been made
			verify(await persistence.updateIndexingTimestamp("less", 123400), { times: 1 })
			verify(await persistence.updateIndexingTimestamp(matchers.anything(), matchers.anything()), { times: 1 })
		})
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
