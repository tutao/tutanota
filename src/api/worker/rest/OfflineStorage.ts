import {TokenOrNestedTokens} from "cborg/types/interface.js"
import {ListElementEntity, SomeEntity} from "../../common/EntityTypes.js"
import {firstBiggerThanSecond} from "../../common/utils/EntityUtils.js"
import {CacheStorage, expandId, isUsingOfflineCache} from "./EntityRestCache.js"
import * as cborg from "cborg"
import {EncodeOptions, Token, Type} from "cborg"
import {assert, assertNotNull, TypeRef} from "@tutao/tutanota-utils"
import type {OfflineDbFacade} from "../../../desktop/db/OfflineDbFacade"
import {isTest} from "../../common/Env"

function dateEncoder(data: Date, typ: string, options: EncodeOptions): TokenOrNestedTokens | null {
	return [
		// https://datatracker.ietf.org/doc/rfc8943/
		new Token(Type.tag, 100),
		new Token(Type.uint, data.getTime())
	]
}

function dateDecoder(bytes: number): Date {
	return new Date(bytes)
}

export const customTypeEncoders: {[typeName: string]: typeof dateEncoder} = Object.freeze({
	"Date": dateEncoder
})

type TypeDecoder = (_: any) => any
export const customTypeDecoders: Array<TypeDecoder> = (() => {
	const tags: Array<TypeDecoder> = []
	tags[100] = dateDecoder
	return tags
})()

const LAST_UPDATE_TIME_META_KEY = "lastUpdateTime"

export class OfflineStorage implements CacheStorage {
	constructor(
		private readonly offlineDbFacade: OfflineDbFacade,
		private readonly userIdProvider: () => Id | null
	) {
		assert(isUsingOfflineCache() || isTest(), "Offline storage is not available.")
	}

	private get userId(): Id {
		return assertNotNull(this.userIdProvider())
	}

	async deleteIfExists(typeRef: TypeRef<SomeEntity>, listId: Id | null, id: Id): Promise<void> {
		return this.offlineDbFacade.delete(this.userId, this.getTypeId(typeRef), listId, id)
	}

	async get<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<T | null> {
		const userId = this.userIdProvider()
		if (userId == null) {
			return null
		}
		const loaded = await this.offlineDbFacade.get(userId, this.getTypeId(typeRef), listId, id)
		if (loaded) {
			return this.deserialize(typeRef, loaded)
		} else {
			return null
		}
	}

	async getIdsInRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<Id>> {
		return this.offlineDbFacade.getIdsInRange(this.userId, this.getTypeId(typeRef), listId)
	}

	async getRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<{lower: Id, upper: Id} | null> {
		return this.offlineDbFacade.getRange(this.userId, this.getTypeId(typeRef), listId)
	}

	async isElementIdInCacheRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<boolean> {
		const range = await this.getRangeForList(typeRef, listId)
		return range != null
			&& !firstBiggerThanSecond(id, range.upper)
			&& !firstBiggerThanSecond(range.lower, id)
	}

	async provideFromRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		const result = await this.offlineDbFacade.provideFromRange(this.userId, this.getTypeId(typeRef), listId, start, count, reverse)
		return result.map((str) => this.deserialize(typeRef, str))
	}

	async put(originalEntity: SomeEntity): Promise<void> {
		const userId = this.userIdProvider()
		if (userId == null) {
			return
		}
		const serializedEntity = this.serialize(originalEntity)
		const {listId, elementId} = expandId(originalEntity._id)
		return this.offlineDbFacade.put(this.userId, {type: this.getTypeId(originalEntity._type), listId, elementId, entity: serializedEntity})
	}

	async setLowerRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<void> {
		return this.offlineDbFacade.setLowerRange(this.userId, this.getTypeId(typeRef), listId, id)
	}

	async setUpperRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<void> {
		return this.offlineDbFacade.setUpperRange(this.userId, this.getTypeId(typeRef), listId, id)
	}

	async setNewRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lower: Id, upper: Id): Promise<void> {
		return this.offlineDbFacade.setNewRange(this.userId, this.getTypeId(typeRef), listId, lower, upper)
	}

	private getTypeId(typeRef: TypeRef<unknown>) {
		return typeRef.app + "/" + typeRef.type
	}

	private serialize(originalEntity: SomeEntity): Uint8Array {
		return cborg.encode(originalEntity, {typeEncoders: customTypeEncoders})
	}

	private deserialize<T extends SomeEntity>(typeRef: TypeRef<T>, loaded: Uint8Array): T {
		const deserialized = cborg.decode(loaded, {tags: customTypeDecoders})
		// TypeRef cannot be deserialized back automatically. We could write a codec for it but we don't actually
		// need to store it so we just "patch" it.
		// Some places rely on TypeRef being a class and not a plain object.
		deserialized._type = typeRef
		return deserialized
	}

	getLastBatchIdForGroup(groupId: Id): Promise<Id | null> {
		return this.offlineDbFacade.getLastBatchIdForGroup(this.userId, groupId)
	}

	async putLastBatchIdForGroup(groupId: Id, batchId: Id): Promise<void> {
		await this.offlineDbFacade.putLastBatchIdForGroup(this.userId, groupId, batchId)
	}

	async getLastUpdateTime(): Promise<number | null> {
		const metadata = await this.offlineDbFacade.getMetadata(this.userId, LAST_UPDATE_TIME_META_KEY)
		return metadata ? cborg.decode(metadata) : null
	}

	async putLastUpdateTime(value: number): Promise<void> {
		await this.offlineDbFacade.putMetadata(this.userId, LAST_UPDATE_TIME_META_KEY, cborg.encode(value))
	}

	async purgeStorage(): Promise<void> {
		await this.offlineDbFacade.deleteAll(this.userId)
	}
}