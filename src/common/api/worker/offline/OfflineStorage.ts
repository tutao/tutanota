import { BlobElementEntity, ElementEntity, Entity, ListElementEntity, ServerModelParsedInstance, SomeEntity, TypeModel } from "../../common/EntityTypes.js"
import {
	CUSTOM_MIN_ID,
	customIdToBase64Url,
	elementIdPart,
	ensureBase64Ext,
	firstBiggerThanSecond,
	GENERATED_MIN_ID,
	getElementId,
	isCustomIdType,
	listIdPart,
} from "../../common/utils/EntityUtils.js"
import type { CacheStorage, LastUpdateTime } from "../rest/DefaultEntityRestCache.js"
import * as cborg from "cborg"
import { EncodeOptions, Token, Type } from "cborg"
import {
	assert,
	assertNotNull,
	Base64Ext,
	getFirstOrThrow,
	getTypeString,
	groupBy,
	groupByAndMap,
	isEmpty,
	mapNullable,
	Nullable,
	parseTypeString,
	splitInChunks,
	typedEntries,
	typedValues,
	TypeRef,
} from "@tutao/tutanota-utils"
import { isDesktop, isOfflineStorageAvailable, isTest } from "../../common/Env.js"
import { DateProvider } from "../../common/DateProvider.js"
import { TokenOrNestedTokens } from "cborg/interface"
import { OfflineStorageMigrator } from "./OfflineStorageMigrator.js"
import { CustomCacheHandlerMap } from "../rest/cacheHandler/CustomCacheHandler.js"
import { InterWindowEventFacadeSendDispatcher } from "../../../native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { SqlCipherFacade } from "../../../native/common/generatedipc/SqlCipherFacade.js"
import { FormattedQuery, SqlValue, TaggedSqlValue, tagSqlValue, untagSqlObject, untagSqlValue } from "./SqlValue.js"
import { Type as TypeId } from "../../common/EntityConstants.js"
import { OutOfSyncError } from "../../common/error/OutOfSyncError.js"
import { sql, SqlFragment } from "./Sql.js"
import { ModelMapper } from "../crypto/ModelMapper"
import { AttributeModel } from "../../common/AttributeModel"
import { TypeModelResolver } from "../../common/EntityFunctions"
import { collapseId, expandId } from "../rest/RestClientIdUtils"
import { Category, syncMetrics } from "../utils/SyncMetrics"
import { SpamClassificationModel } from "../../../../mail-app/workerUtils/spamClassification/SpamClassifier"

/**
 * this is the value of SQLITE_MAX_VARIABLE_NUMBER in sqlite3.c
 * it may change if the sqlite version is updated.
 * */
const MAX_SAFE_SQL_VARS = 32766

type StorableInstance = {
	typeString: string
	table: string
	rowId: Nullable<string>
	listId: Nullable<Id>
	elementId: Id
	encodedElementId: Base64Ext
	ownerGroup: Id
	serializedInstance: Uint8Array
	instance: ServerModelParsedInstance
}

const tableNameByTypeId: Map<string, string> = new Map([
	[TypeId.Element, "element_entities"],
	[TypeId.ListElement, "list_entities"],
	[TypeId.BlobElement, "blob_element_entities"],
])

function dateEncoder(data: Date, typ: string, options: EncodeOptions): TokenOrNestedTokens | null {
	const time = data.getTime()
	return [
		// https://datatracker.ietf.org/doc/rfc8943/
		new Token(Type.tag, 100),
		new Token(time < 0 ? Type.negint : Type.uint, time),
	]
}

function dateDecoder(bytes: number): Date {
	return new Date(bytes)
}

export const customTypeEncoders: { [typeName: string]: typeof dateEncoder } = Object.freeze({
	Date: dateEncoder,
})

type TypeDecoder = (_: any) => any
export const customTypeDecoders: Array<TypeDecoder> = (() => {
	const tags: Array<TypeDecoder> = []
	tags[100] = dateDecoder
	return tags
})()

export interface OfflineDbMeta {
	lastUpdateTime: number
	timeRangeDays: number
	// offline db schema version
	"offline-version": number
	lastTrainedTime: number
	lastTrainedFromScratchTime: number
	lastTrainingDataId: Id
}

export const TableDefinitions = Object.freeze({
	// plus ownerGroup added in a migration
	list_entities: {
		definition:
			"CREATE TABLE IF NOT EXISTS list_entities (type TEXT NOT NULL, listId TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, listId, elementId))",
		purgedWithCache: true,
	},
	// plus ownerGroup added in a migration
	element_entities: {
		definition:
			"CREATE TABLE IF NOT EXISTS element_entities (type TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, elementId))",
		purgedWithCache: true,
	},
	ranges: {
		definition:
			"CREATE TABLE IF NOT EXISTS ranges (type TEXT NOT NULL, listId TEXT NOT NULL, lower TEXT NOT NULL, upper TEXT NOT NULL, PRIMARY KEY (type, listId))",
		purgedWithCache: true,
	},
	lastUpdateBatchIdPerGroupId: {
		definition: "CREATE TABLE IF NOT EXISTS lastUpdateBatchIdPerGroupId (groupId TEXT NOT NULL, batchId TEXT NOT NULL, PRIMARY KEY (groupId))",
		purgedWithCache: true,
	},
	metadata: {
		definition: "CREATE TABLE IF NOT EXISTS metadata (key TEXT NOT NULL, value BLOB, PRIMARY KEY (key))",
		purgedWithCache: false,
		onBeforePurged: async (sqlCipherFacade: SqlCipherFacade) => {
			if (await tableExists(sqlCipherFacade, "metadata")) {
				await sqlCipherFacade.run("DELETE FROM metadata WHERE key = 'lastUpdateTime'", [])
			}
		},
	},
	blob_element_entities: {
		definition:
			"CREATE TABLE IF NOT EXISTS blob_element_entities (type TEXT NOT NULL, listId TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, listId, elementId))",
		purgedWithCache: true,
	},
	spam_classification_model: {
		definition:
			"CREATE TABLE IF NOT EXISTS spam_classification_model (version NUMBER NOT NULL, ownerGroup TEXT NOT NULL, modelTopology TEXT NOT NULL, weightSpecs TEXT NOT NULL, weightData BLOB NOT NULL, hamCount NUMBER NOT NULL, spamCount NUMBER NOT NULL, PRIMARY KEY(version, ownerGroup))",
		purgedWithCache: true,
	},
} as const) satisfies Record<string, OfflineStorageTable>

type Range = { lower: Id; upper: Id }

export interface OfflineStorageInitArgs {
	userId: Id
	databaseKey: Uint8Array
	timeRangeDate: Date | null
	forceNewDatabase: boolean
}

/**
 * Describes an externally-defined table to be stored in offline storage.
 *
 * Table definitions should be passed into the additionalTables record of OfflineStorage's constructor, setting the key
 * to the name of the table (as written in the {@link definition} statement).
 */
export interface OfflineStorageTable {
	/**
	 * Initialization statement for the table.
	 *
	 * This will always be run even if the table exists, thus it should be a statement that won't error if run multiple
	 * times (e.g. the "CREATE TABLE" command should use the "IF NOT EXISTS" clause).
	 */
	definition: string

	/**
	 * Set this to true if the table should be dropped whenever the cache is dropped.
	 *
	 * It is recommended to only set this to true if the contents of the table are dependent on the cache being in sync.
	 *
	 * If true, then the table is dropped whenever purgeStorage is called, such as due to an out-of-sync error
	 *
	 * If false, this will only be deleted if the offline database is completely deleted, such as when credentials are
	 * deleted.
	 */
	purgedWithCache: boolean

	/**
	 * Action to perform before the table is dropped
	 *
	 * Could also be used to perform an action **instead** of dropping the table when {@link purgedWithStorage} is false
	 */
	onBeforePurged?: (sqlCipherFacade: SqlCipherFacade) => Promise<void>
}

export class OfflineStorage implements CacheStorage {
	private userId: Id | null = null
	private databaseKey: Uint8Array | null = null
	private timeRangeDate: Date | null = null
	private readonly allTables: Record<string, OfflineStorageTable>

	constructor(
		private readonly sqlCipherFacade: SqlCipherFacade,
		private readonly interWindowEventSender: InterWindowEventFacadeSendDispatcher,
		private readonly dateProvider: DateProvider,
		private readonly migrator: OfflineStorageMigrator,
		private readonly cleaner: OfflineStorageCleaner,
		private readonly modelMapper: ModelMapper,
		private readonly typeModelResolver: TypeModelResolver,
		private readonly customCacheHandler: CustomCacheHandlerMap,
		additionalTables: Record<string, OfflineStorageTable>,
	) {
		assert(isOfflineStorageAvailable() || isTest(), "Offline storage is not available.")
		this.allTables = Object.freeze(Object.assign({}, additionalTables, TableDefinitions))
	}

	async getWholeListParsed(typeRef: TypeRef<unknown>, listId: string): Promise<ServerModelParsedInstance[]> {
		const { query, params } = sql`SELECT entity
                                    FROM list_entities
                                    WHERE type = ${getTypeString(typeRef)}
                                      AND listId = ${listId}`
		const items = (await this.sqlCipherFacade.all(query, params)) ?? []

		const instanceBytes = items.map((row) => row.entity.value as Uint8Array)
		return await this.deserializeList(instanceBytes)
	}

	async get<T extends Entity>(typeRef: TypeRef<T>, listId: string | null, id: string): Promise<T | null> {
		const parsedInstance = await this.getParsed(typeRef, listId, id)
		if (parsedInstance == null) {
			return null
		}
		return await this.modelMapper.mapToInstance<T>(typeRef, parsedInstance)
	}

	async provideMultiple<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: string, elementIds: string[]): Promise<T[]> {
		const parsedInstances = await this.provideMultipleParsed(typeRef, listId, elementIds)
		return await this.modelMapper.mapToInstances(typeRef, parsedInstances)
	}

	/**
	 * @return {boolean} whether the database was newly created or not
	 */
	async init({ userId, databaseKey, timeRangeDate, forceNewDatabase }: OfflineStorageInitArgs): Promise<boolean> {
		this.userId = userId
		this.databaseKey = databaseKey
		this.timeRangeDate = timeRangeDate
		if (forceNewDatabase) {
			if (isDesktop()) {
				await this.interWindowEventSender.localUserDataInvalidated(userId)
			}
			await this.sqlCipherFacade.deleteDb(userId)
		}
		// We open database here, and it is closed in the native side when the window is closed or the page is reloaded
		await this.sqlCipherFacade.openDb(userId, databaseKey)
		await this.createTables()

		try {
			await this.migrator.migrate(this, this.sqlCipherFacade)
		} catch (e) {
			if (e instanceof OutOfSyncError) {
				console.warn("Offline db is out of sync!", e)
				await this.recreateDbFile(userId, databaseKey)
				await this.migrator.migrate(this, this.sqlCipherFacade)
			} else {
				throw e
			}
		}
		// We createTables again in case they were purged in a migration
		await this.createTables()

		// if nothing is written here, it means it's a new database
		return (await this.getLastUpdateTime()).type === "never"
	}

	private async recreateDbFile(userId: string, databaseKey: Uint8Array): Promise<void> {
		console.log(`recreating DB file for userId ${userId}`)
		await this.sqlCipherFacade.closeDb()
		await this.sqlCipherFacade.deleteDb(userId)
		await this.sqlCipherFacade.openDb(userId, databaseKey)
		await this.createTables()
	}

	/**
	 * currently, we close DBs from the native side (mainly on things like reload and on android's onDestroy)
	 */
	async deinit() {
		this.userId = null
		this.databaseKey = null
		await this.sqlCipherFacade.closeDb()
	}

	async deleteIfExists<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: T extends ListElementEntity | BlobElementEntity ? Id : null,
		elementId: Id,
	): Promise<void> {
		const fullId: T["_id"] = listId == null ? elementId : [listId, elementId]
		await this.deleteByIds(typeRef, [fullId])
	}

	async deleteAllOfType(typeRef: TypeRef<SomeEntity>): Promise<void> {
		const type = getTypeString(typeRef)
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		let formattedQuery
		switch (typeModel.type) {
			case TypeId.Element:
				formattedQuery = sql`SELECT elementId
                                     FROM element_entities
                                     WHERE type = ${type}`
				break
			case TypeId.ListElement:
				formattedQuery = sql`SELECT listId, elementId
                                     FROM list_entities
                                     WHERE type = ${type}`
				await this.deleteAllRangesForType(type)
				break
			case TypeId.BlobElement:
				formattedQuery = sql`SELECT listId, elementId
                                     FROM blob_element_entities
                                     WHERE type = ${type}`
				break
			default:
				throw new Error("must be a persistent type")
		}
		const taggedRows = await this.sqlCipherFacade.all(formattedQuery.query, formattedQuery.params)
		const rows = taggedRows.map(untagSqlObject) as { listId?: Id; elementId: Id }[]
		const ids = rows.map((row) => collapseId(row.listId ?? null, customIdToBase64Url(typeModel, row.elementId)))
		await this.deleteByIds(typeRef, ids)
	}

	/**
	 * Remove all ranges (and only ranges, without associated data) for the specified {@param typeRef}.
	 */
	async deleteAllRangesOfType(typeRef: TypeRef<SomeEntity>): Promise<void> {
		const type = getTypeString(typeRef)
		await this.deleteAllRangesForType(type)
	}

	private async deleteAllRangesForType(type: string): Promise<void> {
		const { query, params } = sql`DELETE
                                    FROM ranges
                                    WHERE type = ${type}`
		await this.sqlCipherFacade.run(query, params)
	}

	async getParsed(typeRef: TypeRef<unknown>, listId: Id | null, id: Id): Promise<ServerModelParsedInstance | null> {
		const tm = syncMetrics?.beginMeasurement(Category.GetDb)
		const type = getTypeString(typeRef)
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		const encodedElementId = ensureBase64Ext(typeModel, id)
		let formattedQuery
		switch (typeModel.type) {
			case TypeId.Element:
				formattedQuery = sql`SELECT entity
                                     from element_entities
                                     WHERE type = ${type}
                                       AND elementId = ${encodedElementId}`
				break
			case TypeId.ListElement:
				formattedQuery = sql`SELECT entity
                                     from list_entities
                                     WHERE type = ${type}
                                       AND listId = ${listId}
                                       AND elementId = ${encodedElementId}`
				break
			case TypeId.BlobElement:
				formattedQuery = sql`SELECT entity
                                     from blob_element_entities
                                     WHERE type = ${type}
                                       AND listId = ${listId}
                                       AND elementId = ${encodedElementId}`
				break
			default:
				throw new Error("must be a persistent type")
		}
		const dbResult = await this.sqlCipherFacade.get(formattedQuery.query, formattedQuery.params)
		const result = dbResult?.entity ? await this.deserialize(dbResult.entity.value as Uint8Array) : null
		tm?.endMeasurement()
		return result
	}

	async provideMultipleParsed<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, elementIds: Id[]): Promise<Array<ServerModelParsedInstance>> {
		const tm = syncMetrics?.beginMeasurement(Category.ProvideMultipleDb)

		if (elementIds.length === 0) return []
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		const encodedElementIds = elementIds.map((elementId) => ensureBase64Ext(typeModel, elementId))

		const type = getTypeString(typeRef)
		const serializedList: ReadonlyArray<Record<string, TaggedSqlValue>> = await this.allChunked(1000, encodedElementIds, (c) => {
			if (typeModel.type === TypeId.Element) {
				return sql`SELECT entity
                           FROM element_entities
                           WHERE type = ${type}
                             AND elementId IN ${paramList(c)}`
			} else if (typeModel.type === TypeId.ListElement) {
				return sql`SELECT entity
                           FROM list_entities
                           WHERE type = ${type}
                             AND listId = ${listId}
                             AND elementId IN ${paramList(c)}`
			} else if (typeModel.type === TypeId.BlobElement) {
				return sql`SELECT entity
                           FROM blob_element_entities
                           WHERE type = ${type}
                             AND listId = ${listId}
                             AND elementId IN ${paramList(c)}`
			} else {
				throw new Error(`can't provideMultipleParsed for ${JSON.stringify(typeRef)}`)
			}
		})

		const result = await this.deserializeList(serializedList.map((r) => r.entity.value as Uint8Array))
		tm?.endMeasurement()
		return result
	}

	async getIdsInRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<Id>> {
		const type = getTypeString(typeRef)
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		const range = await this.getRange(typeRef, listId)
		if (range == null) {
			throw new Error(`no range exists for ${type} and list ${listId}`)
		}
		const { query, params } = sql`SELECT elementId
                                    FROM list_entities
                                    WHERE type = ${type}
                                      AND listId = ${listId}
                                      AND (elementId = ${range.lower}
                                        OR ${firstIdBigger("elementId", range.lower)})
                                      AND NOT (${firstIdBigger("elementId", range.upper)})`
		const rows = await this.sqlCipherFacade.all(query, params)
		return rows.map((row) => customIdToBase64Url(typeModel, row.elementId.value as string))
	}

	/** don't use this internally in this class, use OfflineStorage::getRange instead. OfflineStorage is
	 * using converted custom IDs internally which is undone when using this to access the range.
	 */
	async getRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Range | null> {
		let range = await this.getRange(typeRef, listId)
		if (range == null) return range
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		return {
			lower: customIdToBase64Url(typeModel, range.lower),
			upper: customIdToBase64Url(typeModel, range.upper),
		}
	}

	async isElementIdInCacheRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, elementId: Id): Promise<boolean> {
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		const encodedElementId = ensureBase64Ext(typeModel, elementId)

		const range = await this.getRange(typeRef, listId)
		return range != null && !firstBiggerThanSecond(encodedElementId, range.upper) && !firstBiggerThanSecond(range.lower, encodedElementId)
	}

	async provideFromRangeParsed<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
	): Promise<ServerModelParsedInstance[]> {
		const tm = syncMetrics?.beginMeasurement(Category.ProvideRangeDb)
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		const encodedStartId = ensureBase64Ext(typeModel, start)
		const type = getTypeString(typeRef)
		let formattedQuery
		if (reverse) {
			formattedQuery = sql`SELECT entity
                                 FROM list_entities
                                 WHERE type = ${type}
                                   AND listId = ${listId}
                                   AND ${firstIdBigger(encodedStartId, "elementId")}
                                 ORDER BY LENGTH(elementId) DESC, elementId DESC LIMIT ${count}`
		} else {
			formattedQuery = sql`SELECT entity
                                 FROM list_entities
                                 WHERE type = ${type}
                                   AND listId = ${listId}
                                   AND ${firstIdBigger("elementId", encodedStartId)}
                                 ORDER BY LENGTH(elementId) ASC, elementId ASC LIMIT ${count}`
		}
		const { query, params } = formattedQuery
		const serializedList: ReadonlyArray<Record<string, TaggedSqlValue>> = await this.sqlCipherFacade.all(query, params)
		const result = await this.deserializeList(serializedList.map((r) => r.entity.value as Uint8Array))
		tm?.endMeasurement()
		return result
	}

	async provideFromRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<Array<T>> {
		const parsed = await this.provideFromRangeParsed(typeRef, listId, start, count, reverse)
		return await this.modelMapper.mapToInstances(typeRef, parsed)
	}

	async put(typeRef: TypeRef<SomeEntity>, instance: ServerModelParsedInstance): Promise<void> {
		const tm = syncMetrics?.beginMeasurement(Category.PutDb)
		await this.putMultiple(typeRef, [instance])
		tm?.endMeasurement()
	}

	async putMultiple(typeRef: TypeRef<SomeEntity>, instances: ServerModelParsedInstance[]): Promise<void> {
		const tm = instances.length > 1 ? syncMetrics?.beginMeasurement(Category.PutMultipleDb) : null
		const handler = this.getCustomCacheHandlerMap().get(typeRef)
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		const typeString = getTypeString(typeRef)

		if (typeModel.type === TypeId.Aggregated || typeModel.type === TypeId.DataTransfer) {
			throw new Error("must be a persistent type")
		}

		const type = typeModel.type
		const table = assertNotNull(tableNameByTypeId.get(type))
		const storables = await this.toStorables(instances, typeModel, typeString, table)

		const groupedByListId = groupBy(storables, (dbRef) => dbRef.listId)
		for (const [listId, storableInstances] of groupedByListId) {
			await this.fetchRowIds(typeModel, table, typeString, listId, storableInstances)
		}

		for (const [listId, storableInstances] of groupedByListId) {
			for (const storable of storableInstances) {
				if (handler?.onBeforeCacheUpdate) {
					const typedInstance = await this.modelMapper.mapToInstance(typeRef, storable.instance)
					await handler.onBeforeCacheUpdate(typedInstance as SomeEntity)
				}
			}

			const chunks = splitInChunks(1000, storableInstances) // respect MAX_SAFE_SQL_VARS
			for (const chunk of chunks) {
				let formattedQuery: FormattedQuery

				// Note that we have to also select and re-insert the rowid or else it will not match search index.
				//
				// A null rowid (i.e. not found) is fine if this is an insertion.
				if (typeModel.type === TypeId.Element) {
					const nestedlistOfParams: Array<Array<SqlValue>> = chunk.map((storable) => {
						const { rowId, typeString, encodedElementId, ownerGroup, serializedInstance } = storable
						return [rowId, typeString, encodedElementId, ownerGroup, serializedInstance] satisfies Array<SqlValue>
					})
					formattedQuery = this.insertMultipleFormattedQuery(
						"INSERT OR REPLACE INTO element_entities (rowid, type, elementId, ownerGroup, entity) VALUES ",
						nestedlistOfParams,
					)
				} else if (typeModel.type === TypeId.ListElement) {
					const nestedlistOfParams: Array<Array<SqlValue>> = chunk.map((storable) => {
						const { rowId, typeString, encodedElementId, ownerGroup, serializedInstance } = storable
						return [rowId, typeString, listId, encodedElementId, ownerGroup, serializedInstance] as Array<SqlValue>
					})
					formattedQuery = this.insertMultipleFormattedQuery(
						"INSERT OR REPLACE INTO list_entities (rowid, type, listId, elementId, ownerGroup, entity) VALUES ",
						nestedlistOfParams,
					)
				} else if (typeModel.type === TypeId.BlobElement) {
					const nestedlistOfParams: Array<Array<SqlValue>> = chunk.map((storable) => {
						const { rowId, typeString, encodedElementId, ownerGroup, serializedInstance } = storable
						return [rowId, typeString, listId, encodedElementId, ownerGroup, serializedInstance] as Array<SqlValue>
					})
					formattedQuery = this.insertMultipleFormattedQuery(
						"INSERT OR REPLACE INTO blob_element_entities (rowid, type, listId, elementId, ownerGroup, entity) VALUES ",
						nestedlistOfParams,
					)
				} else {
					throw new Error("must be a persistent type")
				}
				await this.sqlCipherFacade.run(formattedQuery.query, formattedQuery.params)
			}
		}
		tm?.endMeasurement()
	}

	private insertMultipleFormattedQuery(query: string, nestedlistOfParams: Array<Array<SqlValue>>): FormattedQuery {
		const paramLists = nestedlistOfParams.map((param) => paramList(param))
		let params: TaggedSqlValue[] = []
		query += paramLists
			.map((p) => {
				params.push(...p.params.map(tagSqlValue))
				return p.text
			})
			.join(",")
		return {
			query,
			params,
		}
	}

	private async toStorables(
		instances: Array<ServerModelParsedInstance>,
		typeModel: TypeModel,
		typeString: string,
		table: string,
	): Promise<Array<StorableInstance>> {
		const storables = await Promise.all(
			instances.map(async (instance): Promise<Nullable<StorableInstance>> => {
				const { listId, elementId } = expandId(AttributeModel.getAttribute<IdTuple | Id>(instance, "_id", typeModel))
				const ownerGroup = AttributeModel.getAttribute<Id>(instance, "_ownerGroup", typeModel)
				const serializedInstance = await this.serialize(instance)
				return {
					typeString,
					table,
					rowId: null,
					listId,
					elementId,
					encodedElementId: ensureBase64Ext(typeModel, elementId),
					ownerGroup,
					serializedInstance,
					instance,
				}
			}),
		)
		return storables.filter((storable) => storable !== null)
	}

	private async fetchRowIds(
		typeModel: TypeModel,
		table: string,
		typeString: string,
		listId: Nullable<Id>,
		storableInstances: StorableInstance[],
	): Promise<void> {
		const ids = storableInstances.map((dbRefs) => dbRefs.encodedElementId)
		let formattedQuery: FormattedQuery
		if (typeModel.type === TypeId.Element) {
			formattedQuery = sql`SELECT elementId, rowid
                                 FROM element_entities
                                 WHERE type = ${typeString}
                                   and elementId IN ${paramList(ids)}`
		} else if (typeModel.type === TypeId.ListElement) {
			formattedQuery = sql`SELECT elementId, listId, rowid
                                 FROM list_entities
                                 WHERE type = ${typeString}
                                   and listId = ${listId}
                                   and elementId IN ${paramList(ids)}`
		} else if (typeModel.type === TypeId.BlobElement) {
			formattedQuery = sql`SELECT elementId, listId, rowid
                                 FROM blob_element_entities
                                 WHERE type = ${typeString}
                                   and listId = ${listId}
                                   and elementId IN ${paramList(ids)}`
		} else {
			throw new Error("Can't fetch row ids for invalid type")
		}
		const resultRows = await this.sqlCipherFacade.all(formattedQuery.query, formattedQuery.params)
		// important: rowid is all-lowercase how SQLite names it. It is important that it is consistent with the query.
		type Row = { elementId: Id; listId: Id; rowid: Id }
		const rows = resultRows.map((row) => untagSqlObject(row) as Row)

		for (const row of rows) {
			const storable = storableInstances.find(
				(storableInstance) =>
					(storableInstance.listId != null ? storableInstance.listId === row.listId : true) && storableInstance.encodedElementId === row.elementId,
			)
			assertNotNull(storable).rowId = assertNotNull(row.rowid)
		}
	}

	async setLowerRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lowerId: Id): Promise<void> {
		let typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		lowerId = ensureBase64Ext(typeModel, lowerId)
		const type = getTypeString(typeRef)
		const { query, params } = sql`UPDATE ranges
                                    SET lower = ${lowerId}
                                    WHERE type = ${type}
                                      AND listId = ${listId}`
		await this.sqlCipherFacade.run(query, params)
	}

	async setUpperRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, upperId: Id): Promise<void> {
		upperId = ensureBase64Ext(await this.typeModelResolver.resolveClientTypeReference(typeRef), upperId)
		const type = getTypeString(typeRef)
		const { query, params } = sql`UPDATE ranges
                                    SET upper = ${upperId}
                                    WHERE type = ${type}
                                      AND listId = ${listId}`
		await this.sqlCipherFacade.run(query, params)
	}

	async setNewRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lower: Id, upper: Id): Promise<void> {
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		lower = ensureBase64Ext(typeModel, lower)
		upper = ensureBase64Ext(typeModel, upper)

		const type = getTypeString(typeRef)
		const { query, params } = sql`INSERT
        OR REPLACE INTO ranges VALUES (
        ${type},
        ${listId},
        ${lower},
        ${upper}
        )`
		return this.sqlCipherFacade.run(query, params)
	}

	async getLastBatchIdForGroup(groupId: Id): Promise<Id | null> {
		const { query, params } = sql`SELECT batchId
                                    from lastUpdateBatchIdPerGroupId
                                    WHERE groupId = ${groupId}`
		const row = (await this.sqlCipherFacade.get(query, params)) as { batchId: TaggedSqlValue } | null
		return (row?.batchId?.value ?? null) as Id | null
	}

	async putLastBatchIdForGroup(groupId: Id, batchId: Id): Promise<void> {
		const { query, params } = sql`INSERT
        OR REPLACE INTO lastUpdateBatchIdPerGroupId VALUES (
        ${groupId},
        ${batchId}
        )`
		await this.sqlCipherFacade.run(query, params)
	}

	async getLastUpdateTime(): Promise<LastUpdateTime> {
		const time = await this.getMetadata("lastUpdateTime")
		return time ? { type: "recorded", time } : { type: "never" }
	}

	async putLastUpdateTime(ms: number): Promise<void> {
		await this.putMetadata("lastUpdateTime", ms)
	}

	async getLastTrainingDataIndexId(): Promise<Id> {
		return (await this.getMetadata("lastTrainingDataId")) ?? GENERATED_MIN_ID
	}

	async setLastTrainingDataIndexId(id: Id): Promise<void> {
		await this.putMetadata("lastTrainingDataId", id)
	}

	async getLastTrainedFromScratchTime(): Promise<number> {
		return (await this.getMetadata("lastTrainedFromScratchTime")) ?? Date.now()
	}

	async setLastTrainedFromScratchTime(ms: number): Promise<void> {
		await this.putMetadata("lastTrainedFromScratchTime", ms)
	}

	async setSpamClassificationModel(model: SpamClassificationModel) {
		const { query, params } = sql`INSERT
		OR REPLACE INTO
									spam_classification_model VALUES (
      						 		${1},
		${model.ownerGroup},
		${model.modelTopology},
		${model.weightSpecs},
		${model.weightData},
		${model.hamCount},
		${model.spamCount}
		)`
		await this.sqlCipherFacade.run(query, params)
	}

	async getSpamClassificationModel(ownerGroup: Id): Promise<Nullable<SpamClassificationModel>> {
		const { query, params } = sql`SELECT modelTopology, weightSpecs, weightData, ownerGroup, hamCount, spamCount
                                    FROM spam_classification_model
                                    WHERE version = ${1}
                                      AND ownerGroup = ${ownerGroup}`
		const resultRows = await this.sqlCipherFacade.get(query, params)
		if (resultRows !== null) {
			const untaggedValue = untagSqlObject(resultRows)
			return {
				modelTopology: untaggedValue.modelTopology,
				weightSpecs: untaggedValue.weightSpecs,
				weightData: untaggedValue.weightData,
				ownerGroup: untaggedValue.ownerGroup,
				hamCount: untaggedValue.hamCount,
				spamCount: untaggedValue.spamCount,
			} as SpamClassificationModel
		}
		return null
	}

	async purgeStorage(): Promise<void> {
		if (this.userId == null || this.databaseKey == null) {
			console.warn("not purging storage since we don't have an open db")
			return
		}

		for (const [tableName, { purgedWithCache, onBeforePurged }] of typedEntries(this.allTables)) {
			if (onBeforePurged != null) {
				await onBeforePurged(this.sqlCipherFacade)
			}
			if (purgedWithCache) {
				await this.sqlCipherFacade.run(`DROP TABLE IF EXISTS ${tableName}`, [])
			}
		}
	}

	async deleteRange(typeRef: TypeRef<unknown>, listId: string): Promise<void> {
		const { query, params } = sql`DELETE
                                    FROM ranges
                                    WHERE type = ${getTypeString(typeRef)}
                                      AND listId = ${listId}`
		await this.sqlCipherFacade.run(query, params)
	}

	async getElementsOfType<T extends ElementEntity>(typeRef: TypeRef<T>): Promise<Array<T>> {
		const { query, params } = sql`SELECT entity
                                    from element_entities
                                    WHERE type = ${getTypeString(typeRef)}`
		const items = (await this.sqlCipherFacade.all(query, params)) ?? []

		const instanceBytes = items.map((row) => row.entity.value as Uint8Array)
		const parsedInstances = await this.deserializeList(instanceBytes)
		return await this.modelMapper.mapToInstances(typeRef, parsedInstances)
	}

	async getWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<T>> {
		const parsedInstances = await this.getWholeListParsed(typeRef, listId)
		return await this.modelMapper.mapToInstances(typeRef, parsedInstances)
	}

	async dumpMetadata(): Promise<Partial<OfflineDbMeta>> {
		const query = "SELECT * from metadata"
		const stored = (await this.sqlCipherFacade.all(query, [])).map((row) => [row.key.value as string, row.value.value as Uint8Array] as const)
		return Object.fromEntries(stored.map(([key, value]) => [key, cborg.decode(value)])) as OfflineDbMeta
	}

	async setCurrentOfflineSchemaVersion(version: number) {
		return this.putMetadata("offline-version", version)
	}

	getCustomCacheHandlerMap(): CustomCacheHandlerMap {
		return this.customCacheHandler
	}

	getUserId(): Id {
		return assertNotNull(this.userId, "No user id, not initialized?")
	}

	async deleteAllOwnedBy(owner: Id): Promise<void> {
		await this.deleteAllElementTypesOwnedBy(owner)
		await this.deleteAllListElementTypesOwnedBy(owner)
		await this.deleteAllBlobElementTypesOwnedBy(owner)
		{
			const { query, params } = sql`DELETE
                                        FROM lastUpdateBatchIdPerGroupId
                                        WHERE groupId = ${owner}`
			await this.sqlCipherFacade.run(query, params)
		}
	}

	private async deleteAllBlobElementTypesOwnedBy(owner: Id) {
		const { query, params } = sql`SELECT listId, elementId, type
                                    FROM blob_element_entities
                                    WHERE ownerGroup = ${owner}`
		const taggedRows = await this.sqlCipherFacade.all(query, params)
		const rows = taggedRows.map(untagSqlObject) as { listId: Id; elementId: Id; type: string }[]
		const groupedByType = groupBy(rows, (row) => row.type)
		for (const [type, rows] of groupedByType) {
			const typeRef = parseTypeString(type) as TypeRef<BlobElementEntity>
			await this.deleteByIds(
				typeRef,
				rows.map((row) => [row.listId, row.elementId]),
			)
		}
	}

	private async deleteAllListElementTypesOwnedBy(owner: Id) {
		// first, check which list Ids contain entities owned by the lost group
		const { query, params } = sql`SELECT elementId, listId, type
                                    FROM list_entities
                                    WHERE ownerGroup = ${owner}`
		const rangeRows = await this.sqlCipherFacade.all(query, params)
		type Row = { elementId: Id; listId: Id; type: string }
		const rows = rangeRows.map((row) => untagSqlObject(row) as Row)
		const listIdsByType: Map<string, Array<Row>> = groupByAndMap(
			rows,
			(row) => row.type + row.listId,
			(row) => row,
		)

		// delete the ranges for those listIds
		for (const [_, rows] of listIdsByType.entries()) {
			const { type } = getFirstOrThrow(rows)
			const typeRef = parseTypeString(type) as TypeRef<ListElementEntity>
			// this particular query uses one other SQL var for the type.
			const safeChunkSize = MAX_SAFE_SQL_VARS - 1
			const listIdArr = rows.map((row) => row.listId)
			await this.runChunked(
				safeChunkSize,
				listIdArr,
				(c) => sql`DELETE
                           FROM ranges
                           WHERE type = ${type}
                             AND listId IN ${paramList(c)}`,
			)
			await this.deleteByIds(
				typeRef,
				rows.map((row) => [row.listId, row.elementId]),
			)
		}
	}

	private async deleteAllElementTypesOwnedBy(owner: Id) {
		const { query, params } = sql`SELECT elementId, type
                                    FROM element_entities
                                    WHERE ownerGroup = ${owner}`
		const taggedRows = await this.sqlCipherFacade.all(query, params)
		const rows = taggedRows.map(untagSqlObject) as { elementId: Id; type: string }[]
		const groupedByType = groupByAndMap(
			rows,
			(row) => row.type,
			(row) => row.elementId,
		)
		for (const [type, ids] of groupedByType) {
			const typeRef = parseTypeString(type) as TypeRef<ElementEntity>
			await this.deleteByIds(typeRef, ids)
		}
	}

	private async putMetadata<K extends keyof OfflineDbMeta>(key: K, value: OfflineDbMeta[K]): Promise<void> {
		let encodedValue
		try {
			encodedValue = cborg.encode(value)
		} catch (e) {
			console.log("[OfflineStorage] failed to encode metadata for key", key, "with value", value)
			throw e
		}
		const { query, params } = sql`INSERT
        OR REPLACE INTO metadata VALUES (
        ${key},
        ${encodedValue}
        )`
		await this.sqlCipherFacade.run(query, params)
	}

	private async getMetadata<K extends keyof OfflineDbMeta>(key: K): Promise<OfflineDbMeta[K] | null> {
		const { query, params } = sql`SELECT value
                                    from metadata
                                    WHERE key = ${key}`
		const encoded = await this.sqlCipherFacade.get(query, params)
		return encoded && cborg.decode(encoded.value.value as Uint8Array)
	}

	/**
	 * Clear out unneeded data from the offline database (i.e. old data).
	 * This will be called after login (CachePostLoginActions.ts) to ensure fast login time.
	 * @param timeRangeDate the maximum age that mails should be to be kept in the database
	 * @param userId id of the current user. default, last stored userId
	 */
	async clearExcludedData(timeRangeDate: Date | null = this.timeRangeDate, userId: Id = this.getUserId()): Promise<void> {
		await this.cleaner.cleanOfflineDb(this, timeRangeDate, userId, this.dateProvider.now())
	}

	private async createTables() {
		for (const { definition } of typedValues(this.allTables)) {
			await this.sqlCipherFacade.run(definition, [])
		}
	}

	private async getRange(typeRef: TypeRef<ElementEntity | ListElementEntity>, listId: Id): Promise<Range | null> {
		const type = getTypeString(typeRef)
		const { query, params } = sql`SELECT upper, lower
                                    FROM ranges
                                    WHERE type = ${type}
                                      AND listId = ${listId}`
		const row = (await this.sqlCipherFacade.get(query, params)) ?? null

		return mapNullable(row, untagSqlObject) as Range | null
	}

	/**
	 * A neat helper which can delete types in any lists as long as they belong to the same type.
	 * Will invoke {@link CustomCacheHandler#onBeforeCacheDeletion}.
	 */
	private async deleteByIds<T extends SomeEntity>(typeRef: TypeRef<T>, ids: T["_id"][]) {
		if (isEmpty(ids)) {
			return
		}

		const type = getTypeString(typeRef)
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)

		const handler = this.getCustomCacheHandlerMap().get(typeRef)
		if (handler && handler.onBeforeCacheDeletion) {
			for (const id of ids) {
				await handler.onBeforeCacheDeletion(id)
			}
		}
		switch (typeModel.type) {
			case TypeId.Element:
				await this.runChunked(
					MAX_SAFE_SQL_VARS - 1,
					(ids as Id[]).map((id) => ensureBase64Ext(typeModel, id)),
					(c) => sql`DELETE
                               FROM element_entities
                               WHERE type = ${type}
                                 AND elementId IN ${paramList(c)}`,
				)
				break
			case TypeId.ListElement:
				{
					const byListId = groupByAndMap(ids as IdTuple[], listIdPart, (id) => ensureBase64Ext(typeModel, elementIdPart(id)))
					for (const [listId, elementIds] of byListId) {
						await this.runChunked(
							MAX_SAFE_SQL_VARS - 2,
							elementIds,
							(c) => sql`DELETE
                                   FROM list_entities
                                   WHERE type = ${type}
                                     AND listId = ${listId}
                                     AND elementId IN ${paramList(c)}`,
						)
					}
				}
				break
			case TypeId.BlobElement:
				{
					const byListId = groupByAndMap(ids as IdTuple[], listIdPart, (id) => ensureBase64Ext(typeModel, elementIdPart(id)))
					for (const [listId, elementIds] of byListId) {
						await this.runChunked(
							MAX_SAFE_SQL_VARS - 2,
							elementIds,
							(c) => sql`DELETE
                                   FROM blob_element_entities
                                   WHERE type = ${type}
                                     AND listId = ${listId}
                                     AND elementId IN ${paramList(c)}`,
						)
					}
				}
				break
			default:
				throw new Error("must be a persistent type")
		}
	}

	async deleteIn<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: T extends ListElementEntity | BlobElementEntity ? Id : null,
		elementIds: Id[],
	): Promise<void> {
		if (isEmpty(elementIds)) return

		const fullIds: T["_id"][] = listId == null ? elementIds : elementIds.map((id) => [listId, id])
		await this.deleteByIds(typeRef, fullIds)
	}

	async updateRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, rawCutoffId: Id): Promise<void> {
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		const isCustomId = isCustomIdType(typeModel)
		const encodedCutoffId = ensureBase64Ext(typeModel, rawCutoffId)

		const range = await this.getRange(typeRef, listId)
		if (range == null) {
			return
		}

		// If the range for a given list is complete from the beginning (starts at GENERATED_MIN_ID or CUSTOM_MIN_ID), then we only want to actually modify the
		// saved range if we would be removing elements from the list, in order to not lose the information that the range is complete in storage.
		// So we have to check how old the oldest element in said range is. If it is newer than cutoffId, then we will not modify the range,
		// otherwise we will just modify it normally
		const expectedMinId = isCustomId ? CUSTOM_MIN_ID : GENERATED_MIN_ID
		if (range.lower === expectedMinId) {
			const entities = await this.provideFromRange(typeRef, listId, expectedMinId, 1, false)
			const id = mapNullable(entities[0], getElementId)
			// !!IMPORTANT!!
			// Ids on entities with a customId are always base64Url encoded,
			// !!however ids for entities with a customId used to QUERY the offline database
			// MUST always be base64Ext encoded
			// Therefore, we need to compare against the rawCutoffId here!
			const rangeWontBeModified = id != null && (firstBiggerThanSecond(id, rawCutoffId) || id === rawCutoffId)
			if (rangeWontBeModified) {
				return
			}
		}

		if (firstBiggerThanSecond(encodedCutoffId, range.lower)) {
			// If the upper id of the range is below the cutoff, then the entire range will be deleted from the storage
			// so we just delete the range as well
			// Otherwise, we only want to modify
			if (firstBiggerThanSecond(encodedCutoffId, range.upper)) {
				await this.deleteRange(typeRef, listId)
			} else {
				await this.setLowerRangeForList(typeRef, listId, rawCutoffId)
			}
		}
	}

	private async serialize(parsedInstance: ServerModelParsedInstance): Promise<Uint8Array> {
		try {
			return cborg.encode(parsedInstance, { typeEncoders: customTypeEncoders })
		} catch (e) {
			console.log("[OfflineStorage] failed to encode entity with attribute ids: " + Object.keys(parsedInstance))
			throw e
		}
	}

	/**
	 * Convert the type from CBOR representation to the runtime type
	 */
	private async deserialize(loaded: Uint8Array): Promise<ServerModelParsedInstance | null> {
		try {
			return cborg.decode(loaded, { tags: customTypeDecoders })
		} catch (e) {
			console.log(`Error with CBOR decode. Trying to decode (of type: ${typeof loaded}): ${loaded}`)
			return null
		}
	}

	private async deserializeList(loaded: Array<Uint8Array>): Promise<Array<ServerModelParsedInstance>> {
		// manually reimplementing promiseMap to make sure we don't hit the scheduler since there's nothing actually async happening
		const result: Array<ServerModelParsedInstance> = []
		for (const entity of loaded) {
			const deserialized = await this.deserialize(entity)
			if (deserialized != null) {
				result.push(deserialized)
			}
		}
		return result
	}

	/**
	 * convenience method to run a potentially too large query over several chunks.
	 * chunkSize must be chosen such that the total number of SQL variables in the final query does not exceed MAX_SAFE_SQL_VARS
	 * */
	private async runChunked(chunkSize: number, originalList: SqlValue[], formatter: (chunk: SqlValue[]) => FormattedQuery): Promise<void> {
		for (const chunk of splitInChunks(chunkSize, originalList)) {
			const formattedQuery = formatter(chunk)
			await this.sqlCipherFacade.run(formattedQuery.query, formattedQuery.params)
		}
	}

	/**
	 * convenience method to execute a potentially too large query over several chunks.
	 * chunkSize must be chosen such that the total number of SQL variables in the final query does not exceed MAX_SAFE_SQL_VARS
	 * */
	private async allChunked(
		chunkSize: number,
		originalList: SqlValue[],
		formatter: (chunk: SqlValue[]) => FormattedQuery,
	): Promise<Array<Record<string, TaggedSqlValue>>> {
		const result: Array<Record<string, TaggedSqlValue>> = []
		for (const chunk of splitInChunks(chunkSize, originalList)) {
			const formattedQuery = formatter(chunk)
			result.push(...(await this.sqlCipherFacade.all(formattedQuery.query, formattedQuery.params)))
		}
		return result
	}
}

/*
 * used to automatically create the right amount of SQL variables for selecting ids from a dynamic list.
 * must be used within sql`<query>` template string to inline the logic into the query.
 *
 * It is very important that params is kept to a size such that the total amount of SQL variables is
 * less than MAX_SAFE_SQL_VARS.
 */
function paramList(params: SqlValue[]): SqlFragment {
	const qs = params.map(() => "?").join(",")
	return new SqlFragment(`(${qs})`, params)
}

/**
 * comparison to select ids that are bigger or smaller than a parameter id
 * must be used within sql`<query>` template string to inline the logic into the query.
 *
 * will always insert 3 constants and 3 SQL variables into the query.
 */
function firstIdBigger(...args: [string, "elementId"] | ["elementId", string]): SqlFragment {
	let [l, r]: [string, string] = args
	let v
	if (l === "elementId") {
		v = r
		r = "?"
	} else {
		v = l
		l = "?"
	}
	return new SqlFragment(`(CASE WHEN length(${l}) > length(${r}) THEN 1 WHEN length(${l}) < length(${r}) THEN 0 ELSE ${l} > ${r} END)`, [v, v, v])
}

export interface OfflineStorageCleaner {
	/**
	 * Delete instances from db that are older than timeRangeDays.
	 */
	cleanOfflineDb(offlineStorage: OfflineStorage, timeRangeDate: Date | null, userId: Id, now: number): Promise<void>
}

export async function tableExists(sqlCipherFacade: SqlCipherFacade, table: string): Promise<boolean> {
	// Read the schema for the table https://sqlite.org/schematab.html
	const { query, params } = sql`SELECT COUNT(*) as metadata_exists
                                FROM sqlite_schema
                                WHERE name = ${table}`
	const result = assertNotNull(await sqlCipherFacade.get(query, params))
	return untagSqlValue(result["metadata_exists"]) === 1
}
