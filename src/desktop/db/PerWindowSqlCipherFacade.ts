import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import { TaggedSqlValue } from "../../api/worker/offline/SqlValue.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { log } from "../DesktopLog.js"
import { OfflineDbClosedError } from "../../api/common/error/OfflineDbClosedError.js"
import { OfflineDbRefCounter } from "./OfflineDbRefCounter.js"

export interface OfflineDbFactory {
	create(userid: string, key: Uint8Array, retry?: boolean): Promise<SqlCipherFacade>

	delete(userId: string): Promise<void>
}

export class PerWindowSqlCipherFacade implements SqlCipherFacade {
	private state: { userId: string; db: Promise<SqlCipherFacade> } | null = null

	constructor(private readonly refCounter: OfflineDbRefCounter) {}

	async openDb(userId: string, dbKey: Uint8Array): Promise<void> {
		if (this.state != null) {
			throw new ProgrammingError(`Already opened database for user ${this.state.userId} when trying to open db for ${userId}!`)
		}
		this.state = {
			userId,
			db: this.refCounter.getOrCreateDb(userId, dbKey),
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
				await this.refCounter.disposeDb(userId)
			} catch (e) {
				// we may or may not have released our reference, we'll just hope for the best.
				log.debug(`failed to dispose offline Db for user ${userId}`, e)
			}
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
		return this.refCounter.lockRangesDbAccess(listId)
	}

	/**
	 * This is the counterpart to the function "lockRangesDbAccess(listId)"
	 * @param listId the mail list that we want to unlock
	 */
	async unlockRangesDbAccess(listId: Id): Promise<void> {
		return this.refCounter.unlockRangesDbAccess(listId)
	}

	private async db(): Promise<SqlCipherFacade> {
		if (this.state == null) {
			throw new OfflineDbClosedError()
		}
		return await this.state.db
	}
}
