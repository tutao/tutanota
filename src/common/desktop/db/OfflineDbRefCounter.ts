import { defer, DeferredObject, delay } from "@tutao/tutanota-utils"
import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import { log } from "../DesktopLog.js"
import { OfflineDbFactory } from "./PerWindowSqlCipherFacade.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"

const TAG = "[OfflineDbRefCounter]"
const MAX_WAIT_FOR_DB_CLOSE_MS = 1000

interface CacheEntry {
	readonly db: Promise<SqlCipherFacade>
	/** Reference counting for db in case multiple windows open it. */
	counter: number
	/**
	 * We want to lock the access to the "ranges" table when updating / reading the
	 * offline available mail list ranges for each mail list (referenced using the listId).
	 * We store locks with their corresponding listId in this Map.
	 */
	listIdLocks: Map<string, DeferredObject<void>>
}

/**
 * mainly for reference counting sqlcipher database connections coming from different windows.
 * keeps one opened database for each userId, independent of the number of windows logged
 * into that account (as long as it's bigger than 0)
 */
export class OfflineDbRefCounter {
	/**
	 * a map from userId to an instance of an offlineDb for that user and the number of references currently held to it.
	 * @private
	 */
	private readonly cache: Map<Id, CacheEntry> = new Map()

	constructor(private readonly offlineDbFactory: OfflineDbFactory) {}

	async getOrCreateDb(userId: Id, dbKey: Uint8Array): Promise<SqlCipherFacade> {
		let entry: CacheEntry | undefined = this.cache.get(userId)
		if (entry) {
			entry.counter += 1
			return await entry.db
		} else {
			const db = this.offlineDbFactory.create(userId, dbKey)
			entry = { db, counter: 1, listIdLocks: new Map() }
			this.cache.set(userId, entry)
			return await entry.db
		}

		// not returning from here makes for better stack traces.
	}

	/*
	 * de-reference the offline db belonging to the userId.
	 * will release the db connection if this is the last reference.
	 *
	 * must only be called directly from PerWindowSqlCipherFacade or from within this class.
	 *
	 **/
	async disposeDb(userId: Id) {
		let entry = this.cache.get(userId)
		if (entry == null) {
			return
		}
		entry.counter -= 1

		if (entry.counter === 0) {
			this.cache.delete(userId)
			const db = await entry.db
			await db.closeDb()
			console.log(TAG, "closed db for", userId)
		} else {
			console.log(TAG, "dispose done, still ref'd")
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
		log.debug(TAG, `Deleting db for user ${userId}`)
		await this.disposeDb(userId)
		const waitUntilMax = Date.now() + MAX_WAIT_FOR_DB_CLOSE_MS
		while (this.cache.has(userId) && Date.now() < waitUntilMax) {
			log.debug(`waiting for other windows to close db before deleting it for user ${userId}`)
			await delay(100)
		}
		this.cache.delete(userId)
		await this.offlineDbFactory.delete(userId)
		log.debug(TAG, `Deleted db for user ${userId}`)
	}

	/**
	 * We want to lock the access to the "ranges" table when updating / reading the
	 * offline available mail list ranges for each mail list (referenced using the listId).
	 * @param userId the user the mail list that we're locking belongs to
	 * @param listId the mail list that we want to lock
	 */
	async lockRangesDbAccess(userId: Id, listId: Id): Promise<void> {
		const entry = this.cache.get(userId)
		if (entry == null) {
			// should not happen because why would we lock a table that we do not hold a ref for.
			// the caller will probably run into a offlineDbClosedError very soon.
			throw new ProgrammingError("tried to lock a db that's not open.")
		}
		if (entry.listIdLocks.get(listId)) {
			await entry.listIdLocks.get(listId)?.promise
			entry.listIdLocks.set(listId, defer())
		} else {
			entry.listIdLocks.set(listId, defer())
		}
	}

	/**
	 * This is the counterpart to the function "lockRangesDbAccess(userId, listId)".
	 * @param userId the user the mail list that we're locking belongs to
	 * @param listId the mail list that we want to unlock
	 */
	async unlockRangesDbAccess(userId: Id, listId: Id): Promise<void> {
		const entry = this.cache.get(userId)
		if (entry == null) {
			// should not happen because why would we lock a table that we do not hold a ref for.
			// the caller will probably run into a offlineDbClosedError very soon.
			throw new ProgrammingError("tried to unlock a db that's not open.")
		}
		entry.listIdLocks.get(listId)?.resolve()
		entry.listIdLocks.delete(listId)
	}
}
