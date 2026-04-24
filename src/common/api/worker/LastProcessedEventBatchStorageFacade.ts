import { IndexerCore } from "../../../mail-app/workerUtils/index/IndexerCore"
import { SqlCipherFacade } from "@tutao/native-bridge"
import { sql } from "./offline/Sql"
import { TaggedSqlValue } from "../../../typerefs/SqlValue"
import { lazyAsync, noOp } from "@tutao/utils"
import { EphemeralCacheStorage } from "./rest/EphemeralCacheStorage"
import { IndexingNotSupportedError } from "../common/error/IndexingNotSupportedError"
import { InvalidDatabaseStateError } from "../common/error/InvalidDatabaseStateError"
import { MailIndexer } from "../../../mail-app/workerUtils/index/MailIndexer"
import { OfflineDbClosedError } from "../common/error/OfflineDbClosedError"

export interface LastProcessedEventBatchStorageFacade {
	getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null>

	/**
	 * Saved the batch id of the most recently processed batch manually.`
	 *
	 * Is needed when the cache is new but we want to make sure that the next time we will download from this moment, even if we don't receive any events.
	 */
	putLastEntityEventBatchForGroup(groupId: Id, batchId: Id): Promise<void>
}

export class IndexedDbLastProcessedEventBatchStorageFacade implements LastProcessedEventBatchStorageFacade {
	constructor(
		private readonly core: lazyAsync<IndexerCore>,
		private readonly ephemeralCacheStorage: lazyAsync<EphemeralCacheStorage>,
		private readonly mailIndexer: lazyAsync<MailIndexer>,
	) {}

	async getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null> {
		const mailIndexer = await this.mailIndexer()
		const ephemeralCache = await this.ephemeralCacheStorage()
		if (!mailIndexer.mailIndexingEnabled) {
			return null
		}

		const core = await this.core()
		let batchIdFromIndexedDb: Id | null = null
		try {
			batchIdFromIndexedDb = await core.getLastProcessedEventBatchIdForGroup(groupId)
		} catch (e) {
			if (!(e instanceof IndexingNotSupportedError || e instanceof InvalidDatabaseStateError)) {
				throw e
			}
		}
		const batchIdFromEphemeralCache = await ephemeralCache.getLastBatchIdForGroup(groupId)
		return batchIdFromIndexedDb ?? batchIdFromEphemeralCache ?? null
	}

	async putLastEntityEventBatchForGroup(groupId: Id, batchId: Id): Promise<void> {
		const mailIndexer = await this.mailIndexer()
		if (!mailIndexer.mailIndexingEnabled) {
			return
		}

		const core = await this.core()
		const ephemeralCache = await this.ephemeralCacheStorage()
		await ephemeralCache.putLastBatchIdForGroup(groupId, batchId)
		try {
			await core.putLastBatchIdForGroup(groupId, batchId)
		} catch (e) {
			if (!(e instanceof IndexingNotSupportedError || e instanceof InvalidDatabaseStateError)) {
				throw e
			}
		}
	}
}

export class OfflineStorageLastProcessedEventBatchStorageFacade implements LastProcessedEventBatchStorageFacade {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {}

	async getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null> {
		try {
			const { query, params } = sql`SELECT batchId
									  from lastUpdateBatchIdPerGroupId
									  WHERE groupId = ${groupId}`
			const row = (await this.sqlCipherFacade.get(query, params)) as { batchId: TaggedSqlValue } | null
			return (row?.batchId?.value ?? null) as Id | null
		} catch (e) {
			if (e instanceof OfflineDbClosedError) {
				return null
			} else {
				throw e
			}
		}
	}

	async putLastEntityEventBatchForGroup(groupId: Id, batchId: Id): Promise<void> {
		try {
			const { query, params } = sql`INSERT
        	OR REPLACE INTO lastUpdateBatchIdPerGroupId VALUES (
        	${groupId},
			${batchId}
        	)`
			await this.sqlCipherFacade.run(query, params)
		} catch (e) {
			if (e instanceof OfflineDbClosedError) {
				// We do nothing if we get an OfflineDbClosedError. This is a valid case when creating an account.
				// We do not want to stop the PayPal hook and the general registration flow from working by throwing an error here.
				// After the user has logged in, they would anyway receive updates for the applicable groups
				// and save a correct last processed batch id for them into the offline storage.
			} else {
				throw e
			}
		}
	}
}

export class NoOpLastProcessedEventBatchStorageFacade implements LastProcessedEventBatchStorageFacade {
	constructor() {}

	async getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null> {
		return null
	}

	async putLastEntityEventBatchForGroup(groupId: Id, batchId: Id): Promise<void> {
		noOp()
	}
}
