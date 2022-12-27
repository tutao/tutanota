import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import { TaggedSqlValue } from "../../api/worker/offline/SqlValue.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { defer, DeferredObject, delay } from "@tutao/tutanota-utils"
import { log } from "../DesktopLog.js"
import { OfflineDbClosedError } from "../../api/common/error/OfflineDbClosedError.js"

const MAX_WAIT_FOR_DB_CLOSE_MS = 1000

export class PerWindowSqlCipherFacade implements SqlCipherFacade {
	private state: { userId: string; db: SqlCipherFacade } | null = null

	constructor(private readonly manager: OfflineDbManager) {}

	async openDb(userId: string, dbKey: Uint8Array): Promise<void> {
		if (this.state != null) {
			throw new ProgrammingError("Already opened database!")
		}
		this.state = {
			userId,
			db: await this.manager.getOrCreateDb(userId, dbKey),
		}
	}

	async closeDb(): Promise<void> {
		if (this.state) {
			await this.manager.disposeDb(this.state.userId)
			this.state = null
		}
	}

	async deleteDb(userId: string): Promise<void> {
		await this.manager.deleteDb(userId)
	}

	get(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<Record<string, TaggedSqlValue> | null> {
		return this.db().get(query, params)
	}

	all(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<ReadonlyArray<Record<string, TaggedSqlValue>>> {
		return this.db().all(query, params)
	}

	run(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<void> {
		return this.db().run(query, params)
	}

	/**
	 * We want to lock the access to the "ranges" db when updating / reading the
	 * offline available mail list ranges for each mail list (referenced using the listId)
	 * @param listId the mail list that we want to lock
	 */
	async lockRangesDbAccess(listId: Id): Promise<void> {
		return this.manager.lockRangesDbAccess(listId)
	}

	/**
	 * This is the counterpart to the function "lockRangesDbAccess(listId)"
	 * @param listId the mail list that we want to unlock
	 */
	async unlockRangesDbAccess(listId: Id): Promise<void> {
		return this.manager.unlockRangesDbAccess(listId)
	}

	private db(): SqlCipherFacade {
		if (this.state == null) {
			throw new OfflineDbClosedError()
		}
		return this.state.db
	}
}

interface CacheEntry {
	readonly db: SqlCipherFacade
	/** Reference counting for db in case multiple windows open it. */
	counter: number
}

export interface OfflineDbFactory {
	create(userid: string, key: Uint8Array, retry?: boolean): Promise<SqlCipherFacade>

	delete(userId: string): Promise<void>
}

export class OfflineDbManager {
	private readonly cache: Map<Id, CacheEntry> = new Map()

	/**
	 * We want to lock the access to the "ranges" db when updating / reading the
	 * offline available mail list ranges for each mail list (referenced using the listId).
	 * We store locks with their corresponding listId in this Map.
	 */
	private readonly listIdLocks: Map<Id, DeferredObject<void>> = new Map()

	constructor(private readonly offlineDbFactory: OfflineDbFactory) {}

	async getOrCreateDb(userId: Id, dbKey: Uint8Array): Promise<SqlCipherFacade> {
		let entry: CacheEntry | undefined = this.cache.get(userId)
		if (entry) {
			entry.counter += 1
			return entry.db
		} else {
			const db = await this.offlineDbFactory.create(userId, dbKey)
			entry = { db, counter: 1 }
			this.cache.set(userId, entry)
			return entry.db
		}
	}

	async disposeDb(userId: Id) {
		const entry = this.cache.get(userId)
		if (entry == null) {
			return
		}
		entry.counter -= 1
		if (entry.counter === 0) {
			await entry.db.closeDb()
			this.cache.delete(userId)
		}
	}

	async deleteDb(userId: string): Promise<void> {
		const entry = this.cache.get(userId)
		const waitUntilMax = Date.now() + MAX_WAIT_FOR_DB_CLOSE_MS
		if (entry != null) {
			while (this.cache.has(userId) && Date.now() < waitUntilMax) {
				log.debug(`waiting for other windows to close db before deleting it for user ${userId}`)
				await delay(100)
			}
			await this.disposeDb(userId)
		}

		await this.offlineDbFactory.delete(userId)
	}

	/**
	 * We want to lock the access to the "ranges" db when updating / reading the
	 * offline available mail list ranges for each mail list (referenced using the listId).
	 * @param listId the mail list that we want to lock
	 */
	async lockRangesDbAccess(listId: Id): Promise<void> {
		if (this.listIdLocks.get(listId)) {
			await this.listIdLocks.get(listId)?.promise
			this.listIdLocks.set(listId, defer())
		} else {
			this.listIdLocks.set(listId, defer())
		}
	}

	/**
	 * This is the counterpart to the function "lockRangesDbAccess(listId)".
	 * @param listId the mail list that we want to unlock
	 */
	async unlockRangesDbAccess(listId: Id): Promise<void> {
		this.listIdLocks.get(listId)?.resolve()
		this.listIdLocks.delete(listId)
	}
}
