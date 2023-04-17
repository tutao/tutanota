import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import { TaggedSqlValue } from "../../api/worker/offline/SqlValue.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { defer, DeferredObject, delay } from "@tutao/tutanota-utils"
import { log } from "../DesktopLog.js"
import { OfflineDbClosedError } from "../../api/common/error/OfflineDbClosedError.js"

const MAX_WAIT_FOR_DB_CLOSE_MS = 1000

export class PerWindowSqlCipherFacade implements SqlCipherFacade {
	private state: { userId: string; db: Promise<SqlCipherFacade> } | null = null

	constructor(private readonly manager: OfflineDbManager) {}

	async openDb(userId: string, dbKey: Uint8Array): Promise<void> {
		if (this.state != null) {
			throw new ProgrammingError(`Already opened database for user ${this.state.userId} when trying to open db for ${userId}!`)
		}
		this.state = {
			userId,
			db: this.manager.getOrCreateDb(userId, dbKey),
		}
	}

	async closeDb(): Promise<void> {
		if (this.state) {
			// if this method is called, we certainly don't want anything
			// to do anymore with this db connection.
			// so set the state to null before actually calling disposeDb()
			// otherwise, an error might prevent us from resetting the state.
			const { userId } = this.state
			this.state = null
			try {
				await this.manager.disposeDb(userId)
			} catch (e) {
				// we may or may not have released our reference, we'll just hope for the best.
				log.debug(`failed to dispose offline Db for user ${userId}`, e)
			}
		}
	}

	async deleteDb(userId: string): Promise<void> {
		await this.manager.deleteDb(userId)
	}

	async get(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<Record<string, TaggedSqlValue> | null> {
		return (await this.db()).get(query, params)
	}

	async all(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<ReadonlyArray<Record<string, TaggedSqlValue>>> {
		return (await this.db()).all(query, params)
	}

	async run(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<void> {
		return (await this.db()).run(query, params)
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

	private async db(): Promise<SqlCipherFacade> {
		if (this.state == null) {
			throw new OfflineDbClosedError()
		}
		return await this.state.db
	}
}

interface CacheEntry {
	readonly db: Promise<SqlCipherFacade>
	/** Reference counting for db in case multiple windows open it. */
	counter: number
}

export interface OfflineDbFactory {
	create(userid: string, key: Uint8Array, retry?: boolean): Promise<SqlCipherFacade>

	delete(userId: string): Promise<void>
}

/**
 * mainly for reference counting sqlcipher database connections coming from different windows.
 * keeps one opened database for each userId, independent of the number of windows logged
 * into that account (as long as it's bigger than 0)
 */
export class OfflineDbManager {
	/**
	 * a map from userId to an instance of an offlineDb for that user and the number of references currently held to it.
	 * @private
	 */
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
			return await entry.db
		} else {
			const db = this.offlineDbFactory.create(userId, dbKey)
			entry = { db, counter: 1 }
			this.cache.set(userId, entry)
			return await entry.db
		}

		// not returning from here makes for better stack traces.
	}

	async disposeDb(userId: Id) {
		const entry = this.cache.get(userId)
		if (entry == null) {
			return
		}
		entry.counter -= 1
		if (entry.counter === 0) {
			this.cache.delete(userId)
			const db = await entry.db
			await db.closeDb()
		}
	}

	/**
	 * deletes the offline DB file from the disk, making a best-effort attempt to let all
	 * windows close the connection before removing it.
	 *
	 * should be used when:
	 * * the offline DB is out of sync
	 * * the credentials are deleted from the app
	 * * the user logs in with a userId that is already stored in the app (internal and external users)
	 * * there was an error during session creation that could cause us to have a new database but no new credentials.
	 *
	 * the database is not necessarily open or in the cache; it may be deleted directly from the login screen.
	 */
	async deleteDb(userId: string): Promise<void> {
		await this.disposeDb(userId)
		const waitUntilMax = Date.now() + MAX_WAIT_FOR_DB_CLOSE_MS
		while (this.cache.has(userId) && Date.now() < waitUntilMax) {
			log.debug(`waiting for other windows to close db before deleting it for user ${userId}`)
			await delay(100)
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
