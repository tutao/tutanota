import o from "@tutao/otest"
import { object, verify, when } from "testdouble"
import { IndexerCore } from "../../../../src/mail-app/workerUtils/index/IndexerCore"
import { EphemeralCacheStorage } from "../../../../src/common/api/worker/rest/EphemeralCacheStorage"
import { IndexedDbLastProcessedEventBatchStorageFacade } from "../../../../src/common/api/worker/LastProcessedEventBatchStorageFacade"
import { IndexingNotSupportedError } from "../../../../src/common/api/common/error/IndexingNotSupportedError"
import { MailIndexer } from "../../../../src/mail-app/workerUtils/index/MailIndexer"

o.spec("LastProcessedEventBatchStorageFacadeTest", () => {
	o.spec("IndexedDbLastProcessedEventBatchStorageFacade", () => {
		let coreMock: IndexerCore
		let ephemeralCacheMock: EphemeralCacheStorage
		let mailIndexerMock: MailIndexer
		let indexedDbLastProcessedEventBatchStorageFacade: IndexedDbLastProcessedEventBatchStorageFacade
		const groupId1 = "groupId1"
		const lastProcessedEventBatchId1 = "lastProcessedEventBatchId1"
		o.beforeEach(function () {
			coreMock = object()
			ephemeralCacheMock = object()
			mailIndexerMock = {
				_mailIndexingEnabled: true,
				get mailIndexingEnabled() {
					return this._mailIndexingEnabled
				},
			} as unknown as MailIndexer
			indexedDbLastProcessedEventBatchStorageFacade = new IndexedDbLastProcessedEventBatchStorageFacade(
				() => Promise.resolve(coreMock),
				() => Promise.resolve(ephemeralCacheMock),
				() => Promise.resolve(mailIndexerMock),
			)
		})

		o.test("getLastEntityEventBatchForGroup doesn't do anything when mail indexing is disabled", async () => {
			mailIndexerMock._mailIndexingEnabled = false
			o.check(await indexedDbLastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(groupId1)).equals(null)
			verify(coreMock.getLastProcessedEventBatchIdForGroup(groupId1), { times: 0 })
			verify(ephemeralCacheMock.getLastBatchIdForGroup(groupId1), { times: 0 })
		})
		o.test("putLastEntityEventBatchForGroup doesn't do anything when mail indexing is disabled", async () => {
			mailIndexerMock._mailIndexingEnabled = false
			await indexedDbLastProcessedEventBatchStorageFacade.putLastEntityEventBatchForGroup(groupId1, lastProcessedEventBatchId1)
			verify(ephemeralCacheMock.putLastBatchIdForGroup(groupId1, lastProcessedEventBatchId1), { times: 0 })
			verify(coreMock.putLastBatchIdForGroup(groupId1, lastProcessedEventBatchId1), { times: 0 })
		})
		o.test("getLastEntityEventBatchForGroup works when indexedDb is enabled", async () => {
			when(coreMock.getLastProcessedEventBatchIdForGroup(groupId1)).thenResolve(lastProcessedEventBatchId1)
			o.check(await indexedDbLastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(groupId1)).equals(lastProcessedEventBatchId1)
		})
		o.test("getLastEntityEventBatchForGroup works when indexedDb is disabled", async () => {
			when(coreMock.getLastProcessedEventBatchIdForGroup(groupId1)).thenReject(new IndexingNotSupportedError(":("))
			when(ephemeralCacheMock.getLastBatchIdForGroup(groupId1)).thenResolve(lastProcessedEventBatchId1)
			o.check(await indexedDbLastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(groupId1)).equals(lastProcessedEventBatchId1)
		})
		o.test("putLastEntityEventBatchForGroup works when indexedDb is enabled", async () => {
			await indexedDbLastProcessedEventBatchStorageFacade.putLastEntityEventBatchForGroup(groupId1, lastProcessedEventBatchId1)
			verify(ephemeralCacheMock.putLastBatchIdForGroup(groupId1, lastProcessedEventBatchId1))
			verify(coreMock.putLastBatchIdForGroup(groupId1, lastProcessedEventBatchId1))
		})
		o.test("putLastEntityEventBatchForGroup works when indexedDb is disabled", async () => {
			when(coreMock.putLastBatchIdForGroup(groupId1, lastProcessedEventBatchId1)).thenReject(new IndexingNotSupportedError(":("))
			await indexedDbLastProcessedEventBatchStorageFacade.putLastEntityEventBatchForGroup(groupId1, lastProcessedEventBatchId1)
			verify(ephemeralCacheMock.putLastBatchIdForGroup(groupId1, lastProcessedEventBatchId1))
			verify(coreMock.putLastBatchIdForGroup(groupId1, lastProcessedEventBatchId1))
		})
	})
})
