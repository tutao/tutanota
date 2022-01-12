import {OfflineDb, PersistedEntity} from "./OfflineDb"
import {assertNotNull, getFromMap} from "@tutao/tutanota-utils"

export class OfflineDbFacade {
	constructor(private readonly offlineDbFactory: (userid: string) => Promise<OfflineDb>) {
	}

	private readonly cache: Map<Id, Promise<OfflineDb>> = new Map()

	async get(userId: Id, type: string, listId: string | null, elementId: string): Promise<Uint8Array | undefined> {
		return (await this.getDbForUserId(userId)).get(type, listId, elementId)
	}

	async put(userId: Id, persistedEntity: PersistedEntity): Promise<void> {
		return (await this.getDbForUserId(userId)).put(persistedEntity)
	}

	async setNewRange(userId: Id, type: string, listId: Id, lower: Id, upper: Id): Promise<void> {
		return (await this.getDbForUserId(userId)).setNewRange(type, listId, lower, upper)
	}

	async setUpperRange(userId: Id, type: string, listId: Id, upper: Id): Promise<void> {
		return (await this.getDbForUserId(userId)).setUpperRange(type, listId, upper)
	}

	async setLowerRange(userId: Id, type: string, listId: Id, lower: Id): Promise<void> {
		return (await this.getDbForUserId(userId)).setLowerRange(type, listId, lower)

	}

	async getRange(userId: Id, type: string, listId: Id): Promise<{lower: string, upper: string} | null> {
		return (await this.getDbForUserId(userId)).getRange(type, listId)

	}

	async getIdsInRange(userId: Id, type: string, listId: Id): Promise<Array<Id>> {
		return (await this.getDbForUserId(userId)).getIdsInRange(type, listId)
	}

	async provideFromRange(userId: Id, type: string, listId: Id, start: Id, count: number, reverse: boolean): Promise<Uint8Array[]> {
		return (await this.getDbForUserId(userId)).provideFromRange(type, listId, start, count, reverse)

	}

	async delete(userId: Id, type: string, listId: string | null, elementId: string): Promise<void> {
		return (await this.getDbForUserId(userId)).delete(type, listId, elementId)
	}

	async deleteAll(userId: Id): Promise<void> {
		return (await this.getDbForUserId(userId)).deleteAll()

	}

	async getLastBatchIdForGroup(userId: Id, groupId: Id): Promise<string | null> {
		return (await this.getDbForUserId(userId)).getLastBatchIdForGroup(groupId)
	}

	async putLastBatchIdForGroup(userId: Id, groupId: Id, batchId: Id): Promise<void> {
		return (await this.getDbForUserId(userId)).putLastBatchIdForGroup(groupId, batchId)
	}

	async getMetadata(userId: Id, key: string): Promise<Uint8Array | null> {
		return (await this.getDbForUserId(userId)).getMetadata(key)
	}

	async putMetadata(userId: Id, key: string, value: Uint8Array): Promise<void> {
		return (await this.getDbForUserId(userId)).putMetadata(key, value)
	}


	private async getDbForUserId(userId: Id): Promise<OfflineDb> {
		assertNotNull(userId, "userId is not defined")

		return getFromMap(this.cache, userId, () => this.offlineDbFactory(userId))
	}
}