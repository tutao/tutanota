import o from "@tutao/otest"
import { BulkMailLoader, MAIL_INDEXER_CHUNK, MailSetListData, TimeRange } from "../../../../../src/mail-app/workerUtils/index/BulkMailLoader"
import { object, when } from "testdouble"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { MailSetEntry, MailSetEntryTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { constructMailSetEntryId, GENERATED_MAX_ID, getElementId } from "../../../../../src/common/api/common/utils/EntityUtils"
import { createTestEntity, equalToArray } from "../../../TestUtils"
import { lastThrow } from "@tutao/tutanota-utils"

o.spec("BulkMailLoader", () => {
	let mailEntityClient: EntityClient
	let mailDataEntityClient: EntityClient = object()
	let mailSetListData: MailSetListData
	let timeRange: TimeRange
	let bulkMailLoader: BulkMailLoader
	o.beforeEach(() => {
		mailEntityClient = object()
		mailDataEntityClient = object()
		bulkMailLoader = new BulkMailLoader(mailEntityClient, mailDataEntityClient)
	})
	o.spec("loadMailSetEntriesForTimeRange", () => {
		function setUpTestData(startRange: number = 100, rangeEnd: number = 0) {
			const mailSetEntries: MailSetEntry[] = []
			if (startRange > rangeEnd) {
				for (let i = startRange; i > rangeEnd; i--) {
					mailSetEntries.push(
						createTestEntity(MailSetEntryTypeRef, {
							_id: ["my list", constructMailSetEntryId(new Date(i * 1024), "1234")],
						}),
					)
				}
			} else {
				throw new Error("Range start should be greater than range end")
			}

			return mailSetEntries
		}

		o.test("when nothing was loaded and nothing is returned entityClient it returns nothing and sets loadedCompletely", async () => {
			mailSetListData = {
				listId: "listId",
				lastLoadedId: null,
				loadedButUnusedEntries: [],
				loadedCompletely: true,
			}
			timeRange = [200, 100]

			const startId = constructMailSetEntryId(new Date(timeRange[0]), GENERATED_MAX_ID)
			when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, startId, MAIL_INDEXER_CHUNK, true)).thenResolve([])

			const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)
			o(result).deepEquals([])
		})

		o.test("when nothing was loaded and part returned by entityClient is in the range it returns some items and keeps the rest", async () => {
			let startRange = 100
			let batchEnd = 81
			timeRange = [startRange * 1024, batchEnd * 1024]
			mailSetListData = {
				listId: "listId",
				lastLoadedId: null,
				loadedButUnusedEntries: [],
				loadedCompletely: false,
			}
			const returnedItems = setUpTestData(100, 0)
			const startId = constructMailSetEntryId(new Date(timeRange[0]), GENERATED_MAX_ID)
			when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, startId, MAIL_INDEXER_CHUNK, true)).thenResolve(returnedItems)

			const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)

			o(result).satisfies(equalToArray(returnedItems.slice(0, 20)))
			o(mailSetListData.loadedButUnusedEntries).satisfies(equalToArray(returnedItems.slice(20)))
		})
		o.test("when the whole range is in loaded entries it returns some items and keeps the rest", async () => {
			let startRange = 100
			let batchEnd = 81
			timeRange = [startRange * 1024, batchEnd * 1024]

			const loadedButUnusedEntries = setUpTestData(100, 0)

			mailSetListData = {
				listId: "listId",
				lastLoadedId: constructMailSetEntryId(new Date(50 * 1024), "1234"),
				loadedButUnusedEntries: loadedButUnusedEntries.slice(),
				loadedCompletely: false,
			}

			const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)

			o(result).deepEquals(loadedButUnusedEntries.slice(0, 20))
			o(mailSetListData.loadedButUnusedEntries).deepEquals(loadedButUnusedEntries.slice(20))
		})
		o.test("when something was loaded but all was used it loads and returns the items", async () => {
			mailSetListData = {
				listId: "listId",
				lastLoadedId: "testLoadedId",
				loadedButUnusedEntries: [],
				loadedCompletely: false,
			}

			// For this test we need to return exactly 100 items to not have another service call.
			// At least one item must be outside of the range, otherwise there will be another service call to exhaust the range.
			let startRange = 100
			let rangeEnd = 81
			timeRange = [startRange * 1024, rangeEnd * 1024]
			const startId = "testLoadedId"
			const returnedItems = setUpTestData(startRange, 0)
			when(await mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, startId, MAIL_INDEXER_CHUNK, true)).thenReturn(returnedItems)
			const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)
			o(result).deepEquals(returnedItems.slice(0, 20))
		})

		o.test("when all returned items are in the range it requests more and returns them", async () => {
			let startRange = 200
			let batchEnd = 51
			timeRange = [startRange * 1024, batchEnd * 1024]

			const loadedData = setUpTestData(200, 0)

			mailSetListData = {
				listId: "listId",
				lastLoadedId: null,
				loadedButUnusedEntries: [],
				loadedCompletely: false,
			}
			const startId = constructMailSetEntryId(new Date(startRange * 1024), GENERATED_MAX_ID)
			when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, startId, MAIL_INDEXER_CHUNK, true)).thenResolve(
				loadedData.slice(0, 100),
			)
			const resumeFirstLoadingId = getElementId(loadedData[99])

			when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, resumeFirstLoadingId, MAIL_INDEXER_CHUNK, true)).thenResolve(
				loadedData.slice(100, 200),
			)

			const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)

			const expectedResult = loadedData.slice(0, 150)
			o(result).satisfies(equalToArray(expectedResult))
			const expectedLoaded = loadedData.slice(150)
			o(mailSetListData.loadedButUnusedEntries).satisfies(equalToArray(expectedLoaded))
		})

		o.test("when returning fewer items than requested and all are in the range it returns them all", async () => {
			// Will load:
			// +------------------------+
			// 100                      20
			// Will return
			// 100          50
			// Will keep
			//                51       20
			let startRange = 100
			let batchEnd = 0
			timeRange = [startRange * 1024, batchEnd * 1024]

			// Must be smaller than MAIL_INDEXER_CHUNK
			const loadedData = setUpTestData(100, 20)

			mailSetListData = {
				listId: "listId",
				lastLoadedId: null,
				loadedButUnusedEntries: [],
				loadedCompletely: false,
			}
			const startId = constructMailSetEntryId(new Date(startRange * 1024), GENERATED_MAX_ID)
			when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, startId, MAIL_INDEXER_CHUNK, true)).thenResolve(loadedData)

			const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)

			const expectedResult = loadedData.slice()
			o(result).satisfies(equalToArray(expectedResult))
			o(mailSetListData.loadedButUnusedEntries).satisfies(equalToArray([]))
			o(mailSetListData.loadedCompletely).equals(true)
		})
		o.test(
			"when returning fewer items than requested but some are not in the range it returns those in the range and keeps the rest in loadedButUnusedEntries",
			async () => {
				// Will load:
				// +------------------------+
				// 100                      20
				// Will return
				// 100          50
				// Will keep
				//                51       20
				let startRange = 100
				let batchEnd = 51
				timeRange = [startRange * 1024, batchEnd * 1024]

				// Must be smaller than MAIL_INDEXER_CHUNK
				const loadedData = setUpTestData(100, 20)

				mailSetListData = {
					listId: "listId",
					lastLoadedId: null,
					loadedButUnusedEntries: [],
					loadedCompletely: false,
				}
				const startId = constructMailSetEntryId(new Date(startRange * 1024), GENERATED_MAX_ID)
				when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, startId, MAIL_INDEXER_CHUNK, true)).thenResolve(loadedData)

				const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)

				const expectedResult = loadedData.slice(0, 50)
				o(result).satisfies(equalToArray(expectedResult))
				const expectedLoaded = loadedData.slice(50)
				o(mailSetListData.loadedButUnusedEntries).satisfies(equalToArray(expectedLoaded))
				o(mailSetListData.loadedCompletely).equals(true)
			},
		)

		o.test("when loading starting from within the loaded items it throws away everything newer", async () => {
			// Will load:
			// +------------------------+
			// 100                      20
			// Will return
			// 100          50
			// Will keep
			//                51       20
			let startRange = 150
			let batchEnd = 51
			timeRange = [startRange * 1024, batchEnd * 1024]

			// Must be smaller than MAIL_INDEXER_CHUNK
			const loadedData = setUpTestData(200, 100)

			const lastLoadedId = getElementId(lastThrow(loadedData))
			mailSetListData = {
				listId: "listId",
				lastLoadedId: lastLoadedId,
				loadedButUnusedEntries: loadedData.slice(),
				loadedCompletely: false,
			}
			const newLoadedChunk = setUpTestData(100, 0)
			when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, lastLoadedId, MAIL_INDEXER_CHUNK, true)).thenResolve(newLoadedChunk)

			const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)

			const expectedResult = loadedData.slice(50).concat(newLoadedChunk.slice(0, 50))
			o(result).satisfies(equalToArray(expectedResult))
			const expectedLoaded = newLoadedChunk.slice(50)
			o(mailSetListData.loadedButUnusedEntries).satisfies(equalToArray(expectedLoaded))
		})

		o.test("when loading with start older than the last loaded it throws away everything", async () => {
			// Unused:
			// +------------------------+--------+
			// 200                      100      |
			//                                   50          0 Loading range
			// Will return
			// 50 0
			let startRange = 50
			let batchEnd = 0
			timeRange = [startRange * 1024, batchEnd * 1024]

			// Must be smaller than MAIL_INDEXER_CHUNK
			const loadedData = setUpTestData(200, 100)

			const lastLoadedId = getElementId(lastThrow(loadedData))
			mailSetListData = {
				listId: "listId",
				lastLoadedId: lastLoadedId,
				loadedButUnusedEntries: loadedData.slice(),
				loadedCompletely: false,
			}
			const newLoadedChunk = setUpTestData(99, 0)
			when(mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, lastLoadedId, MAIL_INDEXER_CHUNK, true)).thenResolve(newLoadedChunk)

			const result = await bulkMailLoader.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)

			const expectedResult = newLoadedChunk.slice(-50)
			o(result).satisfies(equalToArray(expectedResult))
			o(mailSetListData.loadedButUnusedEntries).satisfies(equalToArray([]))
			o(mailSetListData.loadedCompletely).equals(true)
		})
	})
})
