import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import { TaggedSqlValue } from "../../api/worker/offline/SqlValue.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { log } from "../DesktopLog.js"
import { OfflineDbClosedError } from "../../api/common/error/OfflineDbClosedError.js"
import { OfflineDbRefCounter } from "./OfflineDbRefCounter.js"

const TAG = "[PerWindowSqlCipherFacade]"

export interface OfflineDbFactory {
	create(userid: string, key: Uint8Array, retry?: boolean): Promise<SqlCipherFacade>

	delete(userId: string): Promise<void>
}

/** class that holds the offlinedb reference for a single window. does not get recreated after logout.
 *
 * this works closely with the OfflineDbReferenceCounter to make sure that there's only one database connection
 * open for a given userId / database file.
 *
 * to ensure database integrity, there's also the locking of list ranges, which must be released before
 * dereferencing the database connection.
 * since the reference counter currently has no way of associating locks or references with windows,
 * this association is tracked in this class.
 *  */
export class PerWindowSqlCipherFacade implements SqlCipherFacade {
	/**
	 * information about our db reference: which user it belongs to, the db itself, the currently held locks.
	 * if this is not present, we hold no locks, are not waiting on locks and hold no db reference.
	 * */
	private state: {
		userId: string
		db: Promise<SqlCipherFacade>
		/** the list of listIdRange locks that this window currently holds or is trying to acquire */
		locks: Set<string>
	} | null = null

	constructor(private readonly refCounter: OfflineDbRefCounter) {}

	async openDb(userId: string, dbKey: Uint8Array): Promise<void> {
		log.debug(TAG, "open db for", userId)
		if (this.state != null) {
			if (this.state.userId != userId) {
				throw new ProgrammingError(`Already opened database for user ${this.state.userId} when trying to open db for ${userId}!`)
			} else {
				console.warn(`trying to open already opened db for ${userId}!`)
				return
			}
		}
		this.state = {
			userId,
			db: this.refCounter.getOrCreateDb(userId, dbKey),
			locks: new Set(),
		}
	}

	async closeDb(): Promise<void> {
		log.debug(TAG, "close db for", this.state?.userId)
		if (this.state == null) return

		// if this method is called, we certainly don't want anything
		// to do anymore with this db connection.
		// so set the state to null before actually calling disposeDb()
		// otherwise, an error might prevent us from resetting the state.
		const { userId, locks } = this.state
		this.state = null
		// we can just unlock the locks now because there will not be coming any writes anymore
		for (const lockedList of locks) {
			console.log(TAG, "unlocking list before dereffing db", lockedList)
			await this.refCounter.unlockRangesDbAccess(userId, lockedList)
		}
		try {
			await this.refCounter.disposeDb(userId)
		} catch (e) {
			// we may or may not have released our reference, we'll just hope for the best.
			log.debug(`failed to dispose offline Db for user ${userId}`, e)
		}
	}

	async deleteDb(userId: string): Promise<void> {
		await this.refCounter.deleteDb(userId)
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
		if (this.state == null) return
		const { userId, locks } = this.state
		if (locks.has(listId)) {
			console.log(TAG, "tried to acquire lock twice!")
			return
		}
		/*
		 * it's possible that we're waiting for a lock and then the window gets closed or reloads due to logout,
		 * causing us to release our DB ref.
		 * if the lock is then released by whoever holds it, we would acquire it but never release it.
		 */
		await this.refCounter.lockRangesDbAccess(userId, listId)
		locks.add(listId)
		if (this.state == null) {
			console.log(TAG, "ref was released while we were waiting for lock, unlocking.")
			await this.refCounter.unlockRangesDbAccess(userId, listId)
			locks.delete(listId)
		}
	}

	/**
	 * This is the counterpart to the function "lockRangesDbAccess(listId)"
	 * @param listId the mail list that we want to unlock
	 */
	async unlockRangesDbAccess(listId: Id): Promise<void> {
		if (this.state == null) return
		const { userId, locks } = this.state
		if (!locks.has(listId)) {
			console.log(TAG, "tried to release lock that was not acquired!")
			return
		}
		locks.delete(listId)
		await this.refCounter.unlockRangesDbAccess(userId, listId)
	}

	private async db(): Promise<SqlCipherFacade> {
		if (this.state == null) {
			throw new OfflineDbClosedError()
		}
		return await this.state.db
	}
}
