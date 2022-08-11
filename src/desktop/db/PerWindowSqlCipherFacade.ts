import {SqlCipherFacade} from "../../native/common/generatedipc/SqlCipherFacade.js"
import {TaggedSqlValue} from "../../api/worker/offline/SqlValue.js"
import {ProgrammingError} from "../../api/common/error/ProgrammingError.js"
import {delay} from "@tutao/tutanota-utils"
import {log} from "../DesktopLog.js"

export class PerWindowSqlCipherFacade implements SqlCipherFacade {
	private state: {userId: string, db: SqlCipherFacade} | null = null

	constructor(
		private readonly manager: OfflineDbManager,
	) {
	}

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

	private db(): SqlCipherFacade {
		if (this.state == null) {
			throw new ProgrammingError("Db is not open!")
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

	constructor(
		private readonly offlineDbFactory: OfflineDbFactory,
	) {
	}

	async getOrCreateDb(userId: Id, dbKey: Uint8Array): Promise<SqlCipherFacade> {
		let entry: CacheEntry | undefined = this.cache.get(userId)
		if (entry) {
			entry.counter += 1
			return entry.db
		} else {
			const db = await this.offlineDbFactory.create(userId, dbKey)
			entry = {db, counter: 1}
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
		if (entry != null) {
			while (this.cache.has(userId)) {
				log.debug(`waiting for other windows to close db before deleting it for user ${userId}`)
				await delay(100)
			}
			await this.disposeDb(userId)
		}

		await this.offlineDbFactory.delete(userId)
	}
}