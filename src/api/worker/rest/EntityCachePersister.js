//@flow

import type {ObjectStoreName} from "../search/DbFacade"
import {DbFacade} from "../search/DbFacade"
import {resolveTypeReference} from "../../common/EntityFunctions"
import {uint8ArrayToBitArray} from "../crypto/CryptoUtils"
import {getPerformanceTimestamp} from "../search/IndexUtils"
import {decryptAndMapToInstance, decryptKey, encryptAndMapToLiteral, encryptKey, resolveSessionKey} from "../crypto/CryptoFacade"
import type {ElementEntity, ListElementEntity} from "../../common/utils/EntityUtils"
import {isSameTypeRef, TypeRef} from "../../common/utils/TypeRef"
import {UserTypeRef} from "../../entities/sys/User"
import {clone, downcast} from "../../common/utils/Utils"
import type {User} from "../../entities/sys/User"
import {stringToUtf8Uint8Array, uint8ArrayToBase64} from "../../common/utils/Encoding"
import {hash} from "../crypto/Sha256"

const DB_VERSION = 1

export const EntityRestCacheOS: ObjectStoreName = "EntityRestCache"
export const EntityListInfoOS: ObjectStoreName = "EntityListInfo"

export type EntityCacheEntry = {[string]: any}

/** Key is type and list id */
export type EntityCacheListInfoEntry = {|
	upperRangeId: Id,
	lowerRangeId: Id,
|}

/**
 * Interface for entity cache persistence.
 */
export interface EntityCachePersister {
	init(userId: string): Promise<void>;

	loadListInfo<T: ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<?EntityCacheListInfoEntry>;

	saveListInfo(typeRef: TypeRef<*>, listId: Id, listInfo: EntityCacheListInfoEntry): Promise<void>;

	loadRange<T: ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<Array<T>>;

	loadSingle<T: ElementEntity | ListElementEntity>(typeRef: TypeRef<T>, listId: ?Id, id: Id): Promise<?T>;

	save<T: ElementEntity | ListElementEntity>(entity: T): Promise<void>;

	remove<T: ElementEntity | ListElementEntity>(typeRef: TypeRef<T>, listId: ?Id, id: Id): Promise<void>;
}

/**
 * IndexedDB-backed entity cache persistence.
 */
export class EntityCacheIdb implements EntityCachePersister {
	+_db: DbFacade;

	init(userId: string): Promise<void> {
		const dbId = uint8ArrayToBase64(hash(stringToUtf8Uint8Array(userId))) + "-cache"
		return this._db.open(dbId)
	}

	constructor() {
		this._db = new DbFacade(DB_VERSION, (_, db) => {
			db.createObjectStore(EntityRestCacheOS)
			// We include elementId in the index because when we do range requests we want to only have values which match typeAndListId but
			// we want to filter based on elementId
			// Basically we want to do
			// WHERE listId = X AND elementId > something
			// both listId and elementId must be part of the index key then so that we can specify things for N-dimensional selection
			// restCacheOS.createIndex(EntityListIdIndex, COMPOSITE_KEY, {unique: false})
			db.createObjectStore(EntityListInfoOS)
		})
	}

	_tempDbKey: Aes128Key = uint8ArrayToBitArray(
		new Uint8Array([196, 197, 17, 110, 240, 178, 69, 96, 121, 240, 231, 95, 83, 30, 149, 131])
	)

	async loadListInfo<T: ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<?EntityCacheListInfoEntry> {
		const transaction = await this._db.createTransaction(true, [EntityListInfoOS])
		return transaction.get(EntityListInfoOS, [typeRef.app, typeRef.type, listId])
	}

	async saveListInfo(typeRef: TypeRef<*>, listId: Id, listInfo: EntityCacheListInfoEntry): Promise<void> {
		const transaction = await this._db.createTransaction(false, [EntityListInfoOS])
		return transaction.put(EntityListInfoOS, [typeRef.app, typeRef.type, listId], listInfo)
	}

	async loadRange<T: ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<Array<T>> {
		const transaction = await this._db.createTransaction(true, [EntityRestCacheOS])
		const timeStart = getPerformanceTimestamp()
		const entries = await transaction.getRange(EntityRestCacheOS, [typeRef.app, typeRef.type, listId], start, count, reverse)
		perfLog(`reading ${typeRef.type} range (${entries.length})`, timeStart)
		const model = await resolveTypeReference(typeRef)
		return Promise.mapSeries(entries, async (e) => {
			// const sessionKey = await resolveSessionKey(model, e)
			const sessionKey = e._dbEncSessionKey ? decryptKey(this._tempDbKey, e._dbEncSessionKey) : null
			return decryptAndMapToInstance(model, e, sessionKey)
		})
	}

	async loadSingle<T: ElementEntity | ListElementEntity>(typeRef: TypeRef<T>, listId: ?Id, id: Id): Promise<?T> {
		const start = getPerformanceTimestamp()
		const transaction = await this._db.createTransaction(true, [EntityRestCacheOS])
		const data = await transaction.get(EntityRestCacheOS, [typeRef.app, typeRef.type, listId || "", id])
		perfLog(`reading ${typeRef.type}`, start)
		if (data) {
			const typeModel = await resolveTypeReference(typeRef)
			const sessionKey = await resolveSessionKey(await resolveTypeReference(typeRef), data)
			return decryptAndMapToInstance(typeModel, data, sessionKey)
		} else {
			return null
		}
	}

	async save<T: ElementEntity | ListElementEntity>(entity: T): Promise<void> {
		let elementId, listId
		if (entity._id instanceof Array) {
			[listId, elementId] = entity._id
		} else {
			listId = null
			elementId = entity._id
		}
		const typeModel = await resolveTypeReference(entity._type)
		const sessionKey = await resolveSessionKey(typeModel, entity)
		const entityClone = clone(entity)
		if (isSameTypeRef(entityClone._type, UserTypeRef)) {
			downcast<User>(entityClone).userGroup.symEncGKey = new Uint8Array([])
		}
		const data: EntityCacheEntry = await encryptAndMapToLiteral(typeModel, entityClone, sessionKey)
		// Instance might be unencrypted and not hae session key.
		if (sessionKey != null) {
			// we override encrypted version of the key so that it's not encrypted with owner key anymore but with our local key
			data._dbEncSessionKey = encryptKey(this._tempDbKey, sessionKey)
		}

		const transaction = await this._db.createTransaction(false, [EntityRestCacheOS, EntityListInfoOS])

		const typeRef = entity._type
		const timeStart = getPerformanceTimestamp()
		// noinspection ES6MissingAwait
		transaction.put(EntityRestCacheOS, [typeRef.app, typeRef.type, listId || "", elementId], data)


		// TODO: we probably don't need to do this. Either element is not in the range and we don't want to modify listInfo or it's a
		//  range request already and we will modify range anyway.
		// let withListInfo = ""
		// if (listId) {
		// 	const oldListInfo = await transaction.get(EntityListInfoOS, [typeRef.app, typeRef.type, listId])
		// 	if (!oldListInfo) {
		// 		const newListInfo: EntityCacheListInfoEntry = {upperRangeId: elementId, lowerRangeId: elementId}
		// 		withListInfo = "with listInfo"
		// 		// noinspection ES6MissingAwait
		// 		transaction.put(EntityListInfoOS, [typeRef.app, typeRef.type, listId || ""], newListInfo)
		// 	}
		// }

		await transaction.wait()
		perfLog(`writing ${typeRef.type}`, timeStart)
	}

	async remove<T: ElementEntity | ListElementEntity>(typeRef: TypeRef<T>, listId: ?Id, id: Id): Promise<void> {
		const transaction = await this._db.createTransaction(false, [EntityRestCacheOS])
		transaction.delete(EntityRestCacheOS, [typeRef.app, typeRef.type, listId || "", id])
		await transaction.wait()
	}
}

function perfLog(message: string, start: number) {
	// console.log(`${message} took ${getPerformanceTimestamp() - start}ms`)
}