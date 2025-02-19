import o from "@tutao/otest"
import { BulkMailLoader, MAIL_INDEXER_CHUNK, MailSetListData, TimeRange } from "../../../../../src/mail-app/workerUtils/index/BulkMailLoader"
import { object, when } from "testdouble"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { ExposedCacheStorage } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache"
import { MailSetEntry, MailSetEntryTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { constructMailSetEntryId, GENERATED_MAX_ID } from "../../../../../src/common/api/common/utils/EntityUtils"
import { createTestEntity } from "../../../TestUtils"

function setUpTestData(count: number) {
	const mailSetEntries: MailSetEntry[] = []
	for (let i = 0; i < count; i++) {
		mailSetEntries.push(
			createTestEntity(MailSetEntryTypeRef, {
				_id: ["my list", constructMailSetEntryId(new Date(i * 1024), "1234")],
			}),
		)
	}
	return mailSetEntries
}

o.spec("BulkMailLoader", () => {
	let mailEntityClient: EntityClient
	let mailDataEntityClient: EntityClient = object()
	let cachedStorage: ExposedCacheStorage = object()
	let mailSetListData: MailSetListData
	let timeRange: TimeRange
	o.beforeEach(() => {
		mailEntityClient = object()
		mailDataEntityClient = object()
		cachedStorage = object()
	})
	o.spec("loadMailSetEntriesForTimeRange", () => {
		o.test("when nothing was loaded and everything returned by entityClient is in the range it returns all items", async () => {
			mailSetListData = {
				listId: "listId",
				lastLoadedId: null,
				loadedButUnusedEntries: [],
				loadedCompletely: false,
			}
			timeRange = [100, 200]

			const startId = constructMailSetEntryId(new Date(timeRange[0]), GENERATED_MAX_ID)
			when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, startId, MAIL_INDEXER_CHUNK, true)).thenResolve([])

			let bulkMailLoader = new BulkMailLoader(mailEntityClient, mailDataEntityClient, cachedStorage)
			const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)
			o(result).deepEquals([])
		})
		o.test("when nothing was loaded and part returned by entityClient is in the range it returns some items and keeps the rest", async () => {
			mailSetListData = {
				listId: "listId",
				lastLoadedId: constructMailSetEntryId(new Date(50 * 1024), "1234"),
				loadedButUnusedEntries: [],
				loadedCompletely: false,
			}
			let startRange = 60
			let endRange = 80
			timeRange = [startRange * 1024, endRange * 1024]
			mailSetListData.loadedButUnusedEntries = setUpTestData(100)
			const expected = mailSetListData.loadedButUnusedEntries.slice(0, endRange + 1)

			let bulkMailLoader = new BulkMailLoader(mailEntityClient, mailDataEntityClient, cachedStorage)
			const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)

			o(result).deepEquals(expected)
		})
		// o.test("when something was loaded but all was used it loads and returns the items", async () => {
		// 	timeRange = [100, 200]
		//
		// 	const startId = constructMailSetEntryId(new Date(timeRange[0]), GENERATED_MAX_ID)
		// 	when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, startId, MAIL_INDEXER_CHUNK, true)).thenResolve([])
		//
		// 	let bulkMailLoader = new BulkMailLoader(mailEntityClient, mailDataEntityClient, cachedStorage)
		// 	const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)
		// 	o(result).deepEquals([])
		// })
		// o.test("when it loads less items than requested it returns the items and sets loadedCompletely", async () => {
		// 	timeRange = [100, 200]
		//
		// 	const startId = constructMailSetEntryId(new Date(timeRange[0]), GENERATED_MAX_ID)
		// 	when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, startId, MAIL_INDEXER_CHUNK, true)).thenResolve([])
		//
		// 	let bulkMailLoader = new BulkMailLoader(mailEntityClient, mailDataEntityClient, cachedStorage)
		// 	const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)
		// 	o(result).deepEquals([])
		// })
		// o.test("when all returned items are in the range it requests more and returns them", async () => {
		// 	timeRange = [100, 200]
		//
		// 	const startId = constructMailSetEntryId(new Date(timeRange[0]), GENERATED_MAX_ID)
		// 	when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, startId, MAIL_INDEXER_CHUNK, true)).thenResolve([])
		//
		// 	let bulkMailLoader = new BulkMailLoader(mailEntityClient, mailDataEntityClient, cachedStorage)
		// 	const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)
		// 	o(result).deepEquals([])
		// })
		// o.test("when nothing was loaded load from entityClient", async () => {
		// 	timeRange = [100, 200]
		// 	const startId = constructMailSetEntryId(new Date(timeRange[0]), GENERATED_MAX_ID)
		// 	when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, startId, MAIL_INDEXER_CHUNK, true)).thenResolve([])
		//
		// 	let bulkMailLoader = new BulkMailLoader(mailEntityClient, mailDataEntityClient, cachedStorage)
		// 	const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)
		// 	o(result).deepEquals([])
		// })
	})
})
