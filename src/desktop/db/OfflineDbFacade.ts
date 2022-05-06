import {OfflineDb, PersistedEntity} from "./OfflineDb"
import {OfflineDbMeta} from "../../api/worker/rest/OfflineStorage"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"

export interface OfflineDbFactory {
	create(userid: string, key: Aes256Key): Promise<OfflineDb>

	delete(userId: string): Promise<void>
}

type CacheEntry = {
	readonly db: OfflineDb,
	/** Reference counting for db in case multiple windows open it. */
	counter: number,
}

export class OfflineDbFacade {
	constructor(
		private readonly offlineDbFactory: OfflineDbFactory,
	) {
	}

	private readonly cache: Map<Id, CacheEntry> = new Map()

	/**
	 * Open up a OfflineDb for the given user
	 * Must be called before any queries for that user can be made
	 */
	async openDatabaseForUser(userId: Id, databaseKey: Aes256Key): Promise<void> {
		let entry: CacheEntry | undefined = this.cache.get(userId)
		if (entry) {
			entry.counter += 1
		} else {
			const db = await this.offlineDbFactory.create(userId, databaseKey)
			entry = {db, counter: 1}
			this.cache.set(userId, entry)
		}
	}

	async closeDatabaseForUser(userId: Id): Promise<void> {
		const entry = this.cache.get(userId)
		if (entry == null) {
			return
		}
		entry.counter -= 1
		if (entry.counter === 0) {
			await entry.db.close()
			this.cache.delete(userId)
		}
	}

	async deleteDatabaseForUser(userId: Id): Promise<void> {
		const entry = this.cache.get(userId)
		if (entry != null) {
			if (entry.counter != 1) {
				throw new ProgrammingError(`Trying to delete database that is opened ${entry.counter} times`)
			}
			await this.closeDatabaseForUser(userId)
		}

		await this.offlineDbFactory.delete(userId)
	}

	async isDatabaseOpen(userId: Id): Promise<boolean> {
		return this.cache.has(userId)
	}

	async get(userId: Id, type: string, listId: string | null, elementId: string): Promise<Uint8Array | null> {
		return this.getDbForUserId(userId).get(type, listId, elementId)
	}

	async put(userId: Id, persistedEntity: PersistedEntity): Promise<void> {
		return this.getDbForUserId(userId).put(persistedEntity)
	}

	async setNewRange(userId: Id, type: string, listId: Id, lower: Id, upper: Id): Promise<void> {
		return this.getDbForUserId(userId).setNewRange(type, listId, lower, upper)
	}

	async setUpperRange(userId: Id, type: string, listId: Id, upper: Id): Promise<void> {
		return this.getDbForUserId(userId).setUpperRange(type, listId, upper)
	}

	async setLowerRange(userId: Id, type: string, listId: Id, lower: Id): Promise<void> {
		return this.getDbForUserId(userId).setLowerRange(type, listId, lower)
	}

	async getRange(userId: Id, type: string, listId: Id): Promise<{lower: string, upper: string} | null> {
		return this.getDbForUserId(userId).getRange(type, listId)
	}

	async getIdsInRange(userId: Id, type: string, listId: Id): Promise<Array<Id>> {
		return this.getDbForUserId(userId).getIdsInRange(type, listId)
	}

	async provideFromRange(userId: Id, type: string, listId: Id, start: Id, count: number, reverse: boolean): Promise<Uint8Array[]> {
		return this.getDbForUserId(userId).provideFromRange(type, listId, start, count, reverse)
	}

	async delete(userId: Id, type: string, listId: Id | null, elementId: Id): Promise<void> {
		return this.getDbForUserId(userId).delete(type, listId, elementId)
	}

	async deleteIn(userId: Id, type: string, listId: Id | null, elementIds: Id[]): Promise<void> {
		this.getDbForUserId(userId).deleteIn(type, listId, elementIds)
	}

	async deleteAll(userId: Id): Promise<void> {
		return this.getDbForUserId(userId).purge()
	}

	async getLastBatchIdForGroup(userId: Id, groupId: Id): Promise<string | null> {
		return this.getDbForUserId(userId).getLastBatchIdForGroup(groupId)
	}

	async putLastBatchIdForGroup(userId: Id, groupId: Id, batchId: Id): Promise<void> {
		return this.getDbForUserId(userId).putLastBatchIdForGroup(groupId, batchId)
	}

	async getMetadata<K extends keyof OfflineDbMeta>(userId: Id, key: K): Promise<Uint8Array | null> {
		return this.getDbForUserId(userId).getMetadata(key)
	}

	async putMetadata<K extends keyof OfflineDbMeta>(userId: Id, key: K, value: Uint8Array): Promise<void> {
		return this.getDbForUserId(userId).putMetadata(key, value)
	}

	async deleteRange(userId: Id, type: string, listId: string) {
		return this.getDbForUserId(userId).deleteRange(type, listId)
	}

	async getListElementsOfType(userId: Id, typeId: string): Promise<Array<Uint8Array>> {
		return this.getDbForUserId(userId).getListElementsOfType(typeId)
	}

	async getWholeList(userId: Id, typeId: string, listId: Id): Promise<Array<Uint8Array>> {
		return this.getDbForUserId(userId).getWholeList(typeId, listId)
	}

	async compactDatabase(userId: Id): Promise<void> {
		await this.getDbForUserId(userId).compactDatabase()
	}

	private getDbForUserId(userId: Id): OfflineDb {
		const entry = this.cache.get(userId)

		if (!entry) {
			throw new ProgrammingError(`Db for user ${userId} is not open. must call openDataBaseForUser first :)`)
		}

		return entry.db
	}
}

