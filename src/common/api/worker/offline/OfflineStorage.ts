import { ElementEntity, ListElementEntity, SomeEntity, TypeModel } from "../../common/EntityTypes.js"
import {
	constructMailSetEntryId,
	CUSTOM_MIN_ID,
	DEFAULT_MAILSET_ENTRY_CUSTOM_CUTOFF_TIMESTAMP,
	elementIdPart,
	firstBiggerThanSecond,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	getElementId,
	listIdPart,
	timestampToGeneratedId,
} from "../../common/utils/EntityUtils.js"
import { CacheStorage, expandId, ExposedCacheStorage, LastUpdateTime } from "../rest/DefaultEntityRestCache.js"
import * as cborg from "cborg"
import { EncodeOptions, Token, Type } from "cborg"
import {
	assert,
	assertNotNull,
	base64ExtToBase64,
	base64ToBase64Ext,
	base64ToBase64Url,
	base64UrlToBase64,
	DAY_IN_MILLIS,
	getTypeId,
	groupByAndMap,
	groupByAndMapUniquely,
	mapNullable,
	splitInChunks,
	TypeRef,
} from "@tutao/tutanota-utils"
import { isDesktop, isOfflineStorageAvailable, isTest } from "../../common/Env.js"
import { modelInfos, resolveTypeReference } from "../../common/EntityFunctions.js"
import { AccountType, OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS } from "../../common/TutanotaConstants.js"
import { DateProvider } from "../../common/DateProvider.js"
import { TokenOrNestedTokens } from "cborg/interface"
import {
	CalendarEventTypeRef,
	FileTypeRef,
	MailBoxTypeRef,
	MailDetailsBlobTypeRef,
	MailDetailsDraftTypeRef,
	MailFolderTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../../entities/tutanota/TypeRefs.js"
import { UserTypeRef } from "../../entities/sys/TypeRefs.js"
import { OfflineStorageMigrator } from "./OfflineStorageMigrator.js"
import { CustomCacheHandlerMap, CustomCalendarEventCacheHandler } from "../rest/CustomCacheHandler.js"
import { EntityRestClient } from "../rest/EntityRestClient.js"
import { InterWindowEventFacadeSendDispatcher } from "../../../native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { SqlCipherFacade } from "../../../native/common/generatedipc/SqlCipherFacade.js"
import { FormattedQuery, SqlValue, TaggedSqlValue, untagSqlObject } from "./SqlValue.js"
import { FolderSystem } from "../../common/mail/FolderSystem.js"
import { AssociationType, Cardinality, Type as TypeId, ValueType } from "../../common/EntityConstants.js"
import { OutOfSyncError } from "../../common/error/OutOfSyncError.js"
import { sql, SqlFragment } from "./Sql.js"
import { isDraft, isSpamOrTrashFolder } from "../../common/CommonMailUtils.js"

/**
 * this is the value of SQLITE_MAX_VARIABLE_NUMBER in sqlite3.c
 * it may change if the sqlite version is updated.
 * */
const MAX_SAFE_SQL_VARS = 32766

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

/**
 * For each of these keys we track the current version in the database.
 * The keys are different model versions (because we need to migrate the data with certain model version changes) and "offline" key which is used to track
 * migrations that are needed for other reasons e.g. if DB structure changes or if we need to invalidate some tables.
 */
export type VersionMetadataBaseKey = keyof typeof modelInfos | "offline"

type VersionMetadataEntries = {
	// Yes this is cursed, give me a break
	[P in VersionMetadataBaseKey as `${P}-version`]: number
}

export interface OfflineDbMeta extends VersionMetadataEntries {
	lastUpdateTime: number
	timeRangeDays: number
}

const TableDefinitions = Object.freeze({
	// plus ownerGroup added in a migration
	list_entities:
		"type TEXT NOT NULL, listId TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, listId, elementId)",
	// plus ownerGroup added in a migration
	element_entities: "type TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, elementId)",
	ranges: "type TEXT NOT NULL, listId TEXT NOT NULL, lower TEXT NOT NULL, upper TEXT NOT NULL, PRIMARY KEY (type, listId)",
	lastUpdateBatchIdPerGroupId: "groupId TEXT NOT NULL, batchId TEXT NOT NULL, PRIMARY KEY (groupId)",
	metadata: "key TEXT NOT NULL, value BLOB, PRIMARY KEY (key)",
	blob_element_entities:
		"type TEXT NOT NULL, listId TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, listId, elementId)",
} as const)

type Range = { lower: Id; upper: Id }

export interface OfflineStorageInitArgs {
	userId: Id
	databaseKey: Uint8Array
	timeRangeDays: number | null
	forceNewDatabase: boolean
}

export class OfflineStorage implements CacheStorage, ExposedCacheStorage {
	private customCacheHandler: CustomCacheHandlerMap | null = null
	private userId: Id | null = null
	private timeRangeDays: number | null = null

	constructor(
		private readonly sqlCipherFacade: SqlCipherFacade,
		private readonly interWindowEventSender: InterWindowEventFacadeSendDispatcher,
		private readonly dateProvider: DateProvider,
		private readonly migrator: OfflineStorageMigrator,
	) {
		assert(isOfflineStorageAvailable() || isTest(), "Offline storage is not available.")
	}

	/**
	 * @return {boolean} whether the database was newly created or not
	 */
	async init({ userId, databaseKey, timeRangeDays, forceNewDatabase }: OfflineStorageInitArgs): Promise<boolean> {
		this.userId = userId
		this.timeRangeDays = timeRangeDays
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
		await this.sqlCipherFacade.closeDb()
	}

	async deleteIfExists(typeRef: TypeRef<SomeEntity>, listId: Id | null, elementId: Id): Promise<void> {
		const type = getTypeId(typeRef)
		let typeModel: TypeModel
		typeModel = await resolveTypeReference(typeRef)
		elementId = ensureBase64Ext(typeModel, elementId)
		let formattedQuery
		switch (typeModel.type) {
			case TypeId.Element:
				formattedQuery = sql`DELETE FROM element_entities WHERE type = ${type} AND elementId = ${elementId}`
				break
			case TypeId.ListElement:
				formattedQuery = sql`DELETE FROM list_entities WHERE type = ${type} AND listId = ${listId} AND elementId = ${elementId}`
				break
			case TypeId.BlobElement:
				formattedQuery = sql`DELETE FROM blob_element_entities WHERE type = ${type} AND listId = ${listId} AND elementId = ${elementId}`
				break
			default:
				throw new Error("must be a persistent type")
		}
		await this.sqlCipherFacade.run(formattedQuery.query, formattedQuery.params)
	}

	async deleteAllOfType(typeRef: TypeRef<SomeEntity>): Promise<void> {
		const type = getTypeId(typeRef)
		let typeModel: TypeModel
		typeModel = await resolveTypeReference(typeRef)
		let formattedQuery
		switch (typeModel.type) {
			case TypeId.Element:
				formattedQuery = sql`DELETE FROM element_entities WHERE type = ${type}`
				break
			case TypeId.ListElement:
				formattedQuery = sql`DELETE FROM list_entities WHERE type = ${type}`
				await this.sqlCipherFacade.run(formattedQuery.query, formattedQuery.params)
				await this.deleteAllRangesForType(type)
				return
			case TypeId.BlobElement:
				formattedQuery = sql`DELETE FROM blob_element_entities WHERE type = ${type}`
				break
			default:
				throw new Error("must be a persistent type")
		}
		await this.sqlCipherFacade.run(formattedQuery.query, formattedQuery.params)
	}

	private async deleteAllRangesForType(type: string): Promise<void> {
		const { query, params } = sql`DELETE FROM ranges WHERE type = ${type}`
		await this.sqlCipherFacade.run(query, params)
	}

	async get<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementId: Id): Promise<T | null> {
		const type = getTypeId(typeRef)
		const typeModel = await resolveTypeReference(typeRef)
		elementId = ensureBase64Ext(typeModel, elementId)
		let formattedQuery
		switch (typeModel.type) {
			case TypeId.Element:
				formattedQuery = sql`SELECT entity from element_entities WHERE type = ${type} AND elementId = ${elementId}`
				break
			case TypeId.ListElement:
				formattedQuery = sql`SELECT entity from list_entities WHERE type = ${type} AND listId = ${listId} AND elementId = ${elementId}`
				break
			case TypeId.BlobElement:
				formattedQuery = sql`SELECT entity from blob_element_entities WHERE type = ${type} AND listId = ${listId} AND elementId = ${elementId}`
				break
			default:
				throw new Error("must be a persistent type")
		}
		const result = await this.sqlCipherFacade.get(formattedQuery.query, formattedQuery.params)
		return result?.entity ? await this.deserialize(typeRef, result.entity.value as Uint8Array) : null
	}

	async provideMultiple<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, elementIds: Id[]): Promise<Array<T>> {
		if (elementIds.length === 0) return []
		const typeModel = await resolveTypeReference(typeRef)
		elementIds = elementIds.map((el) => ensureBase64Ext(typeModel, el))

		const type = getTypeId(typeRef)
		const serializedList: ReadonlyArray<Record<string, TaggedSqlValue>> = await this.allChunked(
			MAX_SAFE_SQL_VARS - 2,
			elementIds,
			(c) => sql`SELECT entity FROM list_entities WHERE type = ${type} AND listId = ${listId} AND elementId IN ${paramList(c)}`,
		)
		return await this.deserializeList(
			typeRef,
			serializedList.map((r) => r.entity.value as Uint8Array),
		)
	}

	async getIdsInRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<Id>> {
		const type = getTypeId(typeRef)
		const typeModel = await resolveTypeReference(typeRef)
		const range = await this.getRange(typeRef, listId)
		if (range == null) {
			throw new Error(`no range exists for ${type} and list ${listId}`)
		}
		const { query, params } = sql`SELECT elementId FROM list_entities
WHERE type = ${type}
AND listId = ${listId}
AND (elementId = ${range.lower}
OR ${firstIdBigger("elementId", range.lower)})
AND NOT(${firstIdBigger("elementId", range.upper)})`
		const rows = await this.sqlCipherFacade.all(query, params)
		return rows.map((row) => customIdToBase64Url(typeModel, row.elementId.value as string))
	}

	/** don't use this internally in this class, use OfflineStorage::getRange instead. OfflineStorage is
	 * using converted custom IDs internally which is undone when using this to access the range.
	 */
	async getRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Range | null> {
		let range = await this.getRange(typeRef, listId)
		if (range == null) return range
		const typeModel = await resolveTypeReference(typeRef)
		return {
			lower: customIdToBase64Url(typeModel, range.lower),
			upper: customIdToBase64Url(typeModel, range.upper),
		}
	}

	async isElementIdInCacheRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, elementId: Id): Promise<boolean> {
		const typeModel = await resolveTypeReference(typeRef)
		elementId = ensureBase64Ext(typeModel, elementId)

		const range = await this.getRange(typeRef, listId)
		return range != null && !firstBiggerThanSecond(elementId, range.upper) && !firstBiggerThanSecond(range.lower, elementId)
	}

	async provideFromRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		const typeModel = await resolveTypeReference(typeRef)
		start = ensureBase64Ext(typeModel, start)
		const type = getTypeId(typeRef)
		let formattedQuery
		if (reverse) {
			formattedQuery = sql`SELECT entity FROM list_entities WHERE type = ${type} AND listId = ${listId} AND ${firstIdBigger(
				start,
				"elementId",
			)} ORDER BY LENGTH(elementId) DESC, elementId DESC LIMIT ${count}`
		} else {
			formattedQuery = sql`SELECT entity FROM list_entities WHERE type = ${type} AND listId = ${listId} AND ${firstIdBigger(
				"elementId",
				start,
			)} ORDER BY LENGTH(elementId) ASC, elementId ASC LIMIT ${count}`
		}
		const { query, params } = formattedQuery
		const serializedList: ReadonlyArray<Record<string, TaggedSqlValue>> = await this.sqlCipherFacade.all(query, params)
		return await this.deserializeList(
			typeRef,
			serializedList.map((r) => r.entity.value as Uint8Array),
		)
	}

	async put(originalEntity: SomeEntity): Promise<void> {
		const serializedEntity = this.serialize(originalEntity)
		let { listId, elementId } = expandId(originalEntity._id)
		const type = getTypeId(originalEntity._type)
		const ownerGroup = originalEntity._ownerGroup
		const typeModel = await resolveTypeReference(originalEntity._type)
		elementId = ensureBase64Ext(typeModel, elementId)
		let formattedQuery: FormattedQuery
		switch (typeModel.type) {
			case TypeId.Element:
				formattedQuery = sql`INSERT OR REPLACE INTO element_entities (type, elementId, ownerGroup, entity) VALUES (${type}, ${elementId}, ${ownerGroup}, ${serializedEntity})`
				break
			case TypeId.ListElement:
				formattedQuery = sql`INSERT OR REPLACE INTO list_entities (type, listId, elementId, ownerGroup, entity) VALUES (${type}, ${listId}, ${elementId}, ${ownerGroup}, ${serializedEntity})`
				break
			case TypeId.BlobElement:
				formattedQuery = sql`INSERT OR REPLACE INTO blob_element_entities (type, listId, elementId, ownerGroup, entity) VALUES (${type}, ${listId}, ${elementId}, ${ownerGroup}, ${serializedEntity})`
				break
			default:
				throw new Error("must be a persistent type")
		}
		await this.sqlCipherFacade.run(formattedQuery.query, formattedQuery.params)
	}

	async setLowerRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lowerId: Id): Promise<void> {
		lowerId = ensureBase64Ext(await resolveTypeReference(typeRef), lowerId)
		const type = getTypeId(typeRef)
		const { query, params } = sql`UPDATE ranges SET lower = ${lowerId} WHERE type = ${type} AND listId = ${listId}`
		await this.sqlCipherFacade.run(query, params)
	}

	async setUpperRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, upperId: Id): Promise<void> {
		upperId = ensureBase64Ext(await resolveTypeReference(typeRef), upperId)
		const type = getTypeId(typeRef)
		const { query, params } = sql`UPDATE ranges SET upper = ${upperId} WHERE type = ${type} AND listId = ${listId}`
		await this.sqlCipherFacade.run(query, params)
	}

	async setNewRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lower: Id, upper: Id): Promise<void> {
		const typeModel = await resolveTypeReference(typeRef)
		lower = ensureBase64Ext(typeModel, lower)
		upper = ensureBase64Ext(typeModel, upper)

		const type = getTypeId(typeRef)
		const { query, params } = sql`INSERT OR REPLACE INTO ranges VALUES (${type}, ${listId}, ${lower}, ${upper})`
		return this.sqlCipherFacade.run(query, params)
	}

	async getLastBatchIdForGroup(groupId: Id): Promise<Id | null> {
		const { query, params } = sql`SELECT batchId from lastUpdateBatchIdPerGroupId WHERE groupId = ${groupId}`
		const row = (await this.sqlCipherFacade.get(query, params)) as { batchId: TaggedSqlValue } | null
		return (row?.batchId?.value ?? null) as Id | null
	}

	async putLastBatchIdForGroup(groupId: Id, batchId: Id): Promise<void> {
		const { query, params } = sql`INSERT OR REPLACE INTO lastUpdateBatchIdPerGroupId VALUES (${groupId}, ${batchId})`
		await this.sqlCipherFacade.run(query, params)
	}

	async getLastUpdateTime(): Promise<LastUpdateTime> {
		const time = await this.getMetadata("lastUpdateTime")
		return time ? { type: "recorded", time } : { type: "never" }
	}

	async putLastUpdateTime(ms: number): Promise<void> {
		await this.putMetadata("lastUpdateTime", ms)
	}

	async purgeStorage(): Promise<void> {
		for (let name of Object.keys(TableDefinitions)) {
			await this.sqlCipherFacade.run(`DELETE FROM ${name}`, [])
		}
	}

	async deleteRange(typeRef: TypeRef<unknown>, listId: string): Promise<void> {
		const { query, params } = sql`DELETE FROM ranges WHERE type = ${getTypeId(typeRef)} AND listId = ${listId}`
		await this.sqlCipherFacade.run(query, params)
	}

	async getListElementsOfType<T extends ListElementEntity>(typeRef: TypeRef<T>): Promise<Array<T>> {
		const { query, params } = sql`SELECT entity from list_entities WHERE type = ${getTypeId(typeRef)}`
		const items = (await this.sqlCipherFacade.all(query, params)) ?? []
		return await this.deserializeList(
			typeRef,
			items.map((row) => row.entity.value as Uint8Array),
		)
	}

	async getElementsOfType<T extends ElementEntity>(typeRef: TypeRef<T>): Promise<Array<T>> {
		const { query, params } = sql`SELECT entity from element_entities WHERE type = ${getTypeId(typeRef)}`
		const items = (await this.sqlCipherFacade.all(query, params)) ?? []
		return await this.deserializeList(
			typeRef,
			items.map((row) => row.entity.value as Uint8Array),
		)
	}

	async getWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<T>> {
		const { query, params } = sql`SELECT entity FROM list_entities WHERE type = ${getTypeId(typeRef)} AND listId = ${listId}`
		const items = (await this.sqlCipherFacade.all(query, params)) ?? []
		return await this.deserializeList(
			typeRef,
			items.map((row) => row.entity.value as Uint8Array),
		)
	}

	async dumpMetadata(): Promise<Partial<OfflineDbMeta>> {
		const query = "SELECT * from metadata"
		const stored = (await this.sqlCipherFacade.all(query, [])).map((row) => [row.key.value as string, row.value.value as Uint8Array] as const)
		return Object.fromEntries(stored.map(([key, value]) => [key, cborg.decode(value)])) as OfflineDbMeta
	}

	async setStoredModelVersion(model: VersionMetadataBaseKey, version: number) {
		return this.putMetadata(`${model}-version`, version)
	}

	getCustomCacheHandlerMap(entityRestClient: EntityRestClient): CustomCacheHandlerMap {
		if (this.customCacheHandler == null) {
			this.customCacheHandler = new CustomCacheHandlerMap({ ref: CalendarEventTypeRef, handler: new CustomCalendarEventCacheHandler(entityRestClient) })
		}
		return this.customCacheHandler
	}

	getUserId(): Id {
		return assertNotNull(this.userId, "No user id, not initialized?")
	}

	async deleteAllOwnedBy(owner: Id): Promise<void> {
		{
			const { query, params } = sql`DELETE FROM element_entities WHERE ownerGroup = ${owner}`
			await this.sqlCipherFacade.run(query, params)
		}
		{
			// first, check which list Ids contain entities owned by the lost group
			const { query, params } = sql`SELECT listId, type FROM list_entities WHERE ownerGroup = ${owner}`
			const rangeRows = await this.sqlCipherFacade.all(query, params)
			const rows = rangeRows.map((row) => untagSqlObject(row) as { listId: string; type: string })
			const listIdsByType: Map<string, Set<Id>> = groupByAndMapUniquely(
				rows,
				(row) => row.type,
				(row) => row.listId,
			)
			// delete the ranges for those listIds
			for (const [type, listIds] of listIdsByType.entries()) {
				// this particular query uses one other SQL var for the type.
				const safeChunkSize = MAX_SAFE_SQL_VARS - 1
				const listIdArr = Array.from(listIds)
				await this.runChunked(safeChunkSize, listIdArr, (c) => sql`DELETE FROM ranges WHERE type = ${type} AND listId IN ${paramList(c)}`)
				await this.runChunked(safeChunkSize, listIdArr, (c) => sql`DELETE FROM list_entities WHERE type = ${type} AND listId IN ${paramList(c)}`)
			}
		}
		{
			const { query, params } = sql`DELETE FROM blob_element_entities WHERE ownerGroup = ${owner}`
			await this.sqlCipherFacade.run(query, params)
		}
		{
			const { query, params } = sql`DELETE FROM lastUpdateBatchIdPerGroupId WHERE groupId = ${owner}`
			await this.sqlCipherFacade.run(query, params)
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
		const { query, params } = sql`INSERT OR REPLACE INTO metadata VALUES (${key}, ${encodedValue})`
		await this.sqlCipherFacade.run(query, params)
	}

	private async getMetadata<K extends keyof OfflineDbMeta>(key: K): Promise<OfflineDbMeta[K] | null> {
		const { query, params } = sql`SELECT value from metadata WHERE key = ${key}`
		const encoded = await this.sqlCipherFacade.get(query, params)
		return encoded && cborg.decode(encoded.value.value as Uint8Array)
	}

	/**
	 * Clear out unneeded data from the offline database (i.e. trash and spam lists, old data).
	 * This will be called after login (CachePostLoginActions.ts) to ensure fast login time.
	 * @param timeRangeDays: the maximum age of days that mails should be to be kept in the database. if null, will use a default value
	 * @param userId id of the current user. default, last stored userId
	 */
	async clearExcludedData(timeRangeDays: number | null = this.timeRangeDays, userId: Id = this.getUserId()): Promise<void> {
		const user = await this.get(UserTypeRef, null, userId)

		// Free users always have default time range regardless of what is stored
		const isFreeUser = user?.accountType === AccountType.FREE
		const timeRange = isFreeUser || timeRangeDays == null ? OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS : timeRangeDays
		const now = this.dateProvider.now()
		const daysSinceDayAfterEpoch = now / DAY_IN_MILLIS - 1
		const timeRangeMillisSafe = Math.min(daysSinceDayAfterEpoch, timeRange) * DAY_IN_MILLIS
		// from May 15th 2109 onward, exceeding daysSinceDayAfterEpoch in the time range setting will
		// lead to an overflow in our 42 bit timestamp in the id.
		const cutoffTimestamp = now - timeRangeMillisSafe

		const mailBoxes = await this.getElementsOfType(MailBoxTypeRef)
		const cutoffId = timestampToGeneratedId(cutoffTimestamp)
		for (const mailBox of mailBoxes) {
			const isMailsetMigrated = mailBox.currentMailBag != null
			const folders = await this.getWholeList(MailFolderTypeRef, mailBox.folders!.folders)
			if (isMailsetMigrated) {
				// deleting mailsetentries first to make sure that once we start deleting mail
				// we don't have any entries that reference that mail
				const folderSystem = new FolderSystem(folders)
				for (const mailSet of folders) {
					if (isSpamOrTrashFolder(folderSystem, mailSet)) {
						await this.deleteMailSetEntries(mailSet.entries, DEFAULT_MAILSET_ENTRY_CUSTOM_CUTOFF_TIMESTAMP)
					} else {
						await this.deleteMailSetEntries(mailSet.entries, cutoffTimestamp)
					}
				}

				const mailListIds = [mailBox.currentMailBag!, ...mailBox.archivedMailBags].map((mailbag) => mailbag.mails)
				for (const mailListId of mailListIds) {
					await this.deleteMailListLegacy(mailListId, cutoffId)
				}
			} else {
				const folderSystem = new FolderSystem(folders)
				for (const folder of folders) {
					if (isSpamOrTrashFolder(folderSystem, folder)) {
						await this.deleteMailListLegacy(folder.mails, GENERATED_MAX_ID)
					} else {
						await this.deleteMailListLegacy(folder.mails, cutoffId)
					}
				}
			}
		}
	}

	private async createTables() {
		for (let [name, definition] of Object.entries(TableDefinitions)) {
			await this.sqlCipherFacade.run(`CREATE TABLE IF NOT EXISTS ${name} (${definition})`, [])
		}
	}

	private async getRange(typeRef: TypeRef<ElementEntity | ListElementEntity>, listId: Id): Promise<Range | null> {
		const type = getTypeId(typeRef)

		const { query, params } = sql`SELECT upper, lower FROM ranges WHERE type = ${type} AND listId = ${listId}`
		const row = (await this.sqlCipherFacade.get(query, params)) ?? null

		return mapNullable(row, untagSqlObject) as Range | null
	}

	/**
	 * This method deletes mails from {@param listId} what are older than {@param cutoffId} as well as associated data.
	 *
	 * it's considered legacy because once we start importing mail into mail bags, maintaining mail list ranges doesn't make
	 * sense anymore - mail order in a list is arbitrary at that point.
	 *
	 * For each mail we delete the mail, its body, headers, all references mail set entries and all referenced attachments.
	 *
	 * When we delete the Files, we also delete the whole range for the user's File list. We need to delete the whole
	 * range because we only have one file list per mailbox, so if we delete something from the middle of it, the range
	 * will no longer be valid. (this is future proofing, because as of now there is not going to be a Range set for the
	 * File list anyway, since we currently do not do range requests for Files.
	 *
	 * 	We do not delete ConversationEntries because:
	 * 	1. They are in the same list for the whole conversation so we can't adjust the range
	 * 	2. We might need them in the future for showing the whole thread
	 */
	private async deleteMailListLegacy(listId: Id, cutoffId: Id): Promise<void> {
		// We lock access to the "ranges" db here in order to prevent race conditions when accessing the "ranges" database.
		await this.lockRangesDbAccess(listId)
		try {
			// This must be done before deleting mails to know what the new range has to be
			await this.updateRangeForListAndDeleteObsoleteData(MailTypeRef, listId, cutoffId)
		} finally {
			// We unlock access to the "ranges" db here. We lock it in order to prevent race conditions when accessing the "ranges" database.
			await this.unlockRangesDbAccess(listId)
		}

		const mailsToDelete: IdTuple[] = []
		const attachmentsToDelete: IdTuple[] = []
		const mailDetailsBlobToDelete: IdTuple[] = []
		const mailDetailsDraftToDelete: IdTuple[] = []

		const mails = await this.getWholeList(MailTypeRef, listId)
		for (let mail of mails) {
			if (firstBiggerThanSecond(cutoffId, getElementId(mail))) {
				mailsToDelete.push(mail._id)
				for (const id of mail.attachments) {
					attachmentsToDelete.push(id)
				}

				if (isDraft(mail)) {
					const mailDetailsId = assertNotNull(mail.mailDetailsDraft)
					mailDetailsDraftToDelete.push(mailDetailsId)
				} else {
					// mailDetailsBlob
					const mailDetailsId = assertNotNull(mail.mailDetails)
					mailDetailsBlobToDelete.push(mailDetailsId)
				}
			}
		}
		for (let [listId, elementIds] of groupByAndMap(mailDetailsBlobToDelete, listIdPart, elementIdPart).entries()) {
			await this.deleteIn(MailDetailsBlobTypeRef, listId, elementIds)
		}
		for (let [listId, elementIds] of groupByAndMap(mailDetailsDraftToDelete, listIdPart, elementIdPart).entries()) {
			await this.deleteIn(MailDetailsDraftTypeRef, listId, elementIds)
		}
		for (let [listId, elementIds] of groupByAndMap(attachmentsToDelete, listIdPart, elementIdPart).entries()) {
			await this.deleteIn(FileTypeRef, listId, elementIds)
			await this.deleteRange(FileTypeRef, listId)
		}

		await this.deleteIn(MailTypeRef, listId, mailsToDelete.map(elementIdPart))
	}

	/**
	 * delete all mail set entries of a mail set that reference some mail with a receivedDate older than
	 * cutoffTimestamp. this doesn't clean up mails or their associated data because we could be breaking the
	 * offline list range invariant by deleting data from the middle of a mail range. cleaning up mails is done
	 * the legacy way currently even for mailset users.
	 */
	private async deleteMailSetEntries(entriesListId: Id, cutoffTimestamp: number) {
		const cutoffId = constructMailSetEntryId(new Date(cutoffTimestamp), GENERATED_MAX_ID)
		await this.lockRangesDbAccess(entriesListId)
		try {
			await this.updateRangeForListAndDeleteObsoleteData(MailSetEntryTypeRef, entriesListId, cutoffId)
		} finally {
			// We unlock access to the "ranges" db here. We lock it in order to prevent race conditions when accessing the "ranges" database.
			await this.unlockRangesDbAccess(entriesListId)
		}

		const mailSetEntriesToDelete: IdTuple[] = []
		const mailSetEntries = await this.getWholeList(MailSetEntryTypeRef, entriesListId)
		for (let mailSetEntry of mailSetEntries) {
			if (firstBiggerThanSecond(cutoffId, getElementId(mailSetEntry))) {
				mailSetEntriesToDelete.push(mailSetEntry._id)
			}
		}
		await this.deleteIn(MailSetEntryTypeRef, entriesListId, mailSetEntriesToDelete.map(elementIdPart))
	}

	private async deleteIn(typeRef: TypeRef<unknown>, listId: Id | null, elementIds: Id[]): Promise<void> {
		if (elementIds.length === 0) return
		const typeModel = await resolveTypeReference(typeRef)
		switch (typeModel.type) {
			case TypeId.Element:
				return await this.runChunked(
					MAX_SAFE_SQL_VARS - 1,
					elementIds,
					(c) => sql`DELETE FROM element_entities WHERE type = ${getTypeId(typeRef)} AND elementId IN ${paramList(c)}`,
				)
			case TypeId.ListElement:
				return await this.runChunked(
					MAX_SAFE_SQL_VARS - 2,
					elementIds,
					(c) => sql`DELETE FROM list_entities WHERE type = ${getTypeId(typeRef)} AND listId = ${listId} AND elementId IN ${paramList(c)}`,
				)
			case TypeId.BlobElement:
				return await this.runChunked(
					MAX_SAFE_SQL_VARS - 2,
					elementIds,
					(c) => sql`DELETE FROM blob_element_entities WHERE type = ${getTypeId(typeRef)} AND listId = ${listId} AND elementId IN ${paramList(c)}`,
				)
			default:
				throw new Error("must be a persistent type")
		}
	}

	/**
	 * We want to lock the access to the "ranges" db when updating / reading the
	 * offline available mail list / mailset ranges for each mail list (referenced using the listId).
	 * @param listId the mail list or mail set entry list that we want to lock
	 */
	async lockRangesDbAccess(listId: Id) {
		await this.sqlCipherFacade.lockRangesDbAccess(listId)
	}

	/**
	 * This is the counterpart to the function "lockRangesDbAccess(listId)".
	 * @param listId the mail list that we want to unlock
	 */
	async unlockRangesDbAccess(listId: Id) {
		await this.sqlCipherFacade.unlockRangesDbAccess(listId)
	}

	private async updateRangeForListAndDeleteObsoleteData<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, rawCutoffId: Id): Promise<void> {
		const typeModel = await resolveTypeReference(typeRef)
		const isCustomId = isCustomIdType(typeModel)
		const convertedCutoffId = ensureBase64Ext(typeModel, rawCutoffId)

		const range = await this.getRange(typeRef, listId)
		if (range == null) {
			return
		}

		// If the range for a given list is complete from the beginning (starts at GENERATED_MIN_ID), then we only want to actually modify the
		// saved range if we would be removing elements from the list, in order to not lose the information that the range is complete in storage.
		// So we have to check how old the oldest element in said range is. If it is newer than cutoffId, then we will not modify the range,
		// otherwise we will just modify it normally
		const expectedMinId = isCustomId ? CUSTOM_MIN_ID : GENERATED_MIN_ID
		if (range.lower === expectedMinId) {
			const entities = await this.provideFromRange(typeRef, listId, expectedMinId, 1, false)
			const id = mapNullable(entities[0], getElementId)
			const rangeWontBeModified = id == null || firstBiggerThanSecond(id, convertedCutoffId) || id === convertedCutoffId
			if (rangeWontBeModified) {
				return
			}
		}

		if (firstBiggerThanSecond(convertedCutoffId, range.lower)) {
			// If the upper id of the range is below the cutoff, then the entire range will be deleted from the storage
			// so we just delete the range as well
			// Otherwise, we only want to modify
			if (firstBiggerThanSecond(convertedCutoffId, range.upper)) {
				await this.deleteRange(typeRef, listId)
			} else {
				await this.setLowerRangeForList(typeRef, listId, rawCutoffId)
			}
		}
	}

	private serialize(originalEntity: SomeEntity): Uint8Array {
		try {
			return cborg.encode(originalEntity, { typeEncoders: customTypeEncoders })
		} catch (e) {
			console.log("[OfflineStorage] failed to encode entity of type", originalEntity._type, "with id", originalEntity._id)
			throw e
		}
	}

	/**
	 * Convert the type from CBOR representation to the runtime type
	 */
	private async deserialize<T extends SomeEntity>(typeRef: TypeRef<T>, loaded: Uint8Array): Promise<T> {
		const deserialized = cborg.decode(loaded, { tags: customTypeDecoders })

		const typeModel = await resolveTypeReference(typeRef)
		return (await this.fixupTypeRefs(typeModel, deserialized)) as T
	}

	private async fixupTypeRefs(typeModel: TypeModel, deserialized: any): Promise<unknown> {
		// TypeRef cannot be deserialized back automatically. We could write a codec for it but we don't actually need to store it so we just "patch" it.
		// Some places rely on TypeRef being a class and not a plain object.
		// We also have to update all aggregates, recursively.
		deserialized._type = new TypeRef(typeModel.app, typeModel.name)
		for (const [associationName, associationModel] of Object.entries(typeModel.associations)) {
			if (associationModel.type === AssociationType.Aggregation) {
				const aggregateTypeRef = new TypeRef(associationModel.dependency ?? typeModel.app, associationModel.refType)
				const aggregateTypeModel = await resolveTypeReference(aggregateTypeRef)
				switch (associationModel.cardinality) {
					case Cardinality.One:
					case Cardinality.ZeroOrOne:
						const aggregate = deserialized[associationName]
						if (aggregate) {
							await this.fixupTypeRefs(aggregateTypeModel, aggregate)
						}
						break
					case Cardinality.Any:
						const aggregateList = deserialized[associationName]
						for (const aggregate of aggregateList) {
							await this.fixupTypeRefs(aggregateTypeModel, aggregate)
						}
						break
				}
			}
		}
		return deserialized
	}

	private async deserializeList<T extends SomeEntity>(typeRef: TypeRef<T>, loaded: Array<Uint8Array>): Promise<Array<T>> {
		// manually reimplementing promiseMap to make sure we don't hit the scheduler since there's nothing actually async happening
		const result = []
		for (const entity of loaded) {
			result.push(await this.deserialize(typeRef, entity))
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

export function isCustomIdType(typeModel: TypeModel): boolean {
	return typeModel.values._id.type === ValueType.CustomId
}

/**
 * We store customIds as base64ext in the db to make them sortable, but we get them as base64url from the server.
 */
export function ensureBase64Ext(typeModel: TypeModel, elementId: Id): Id {
	if (isCustomIdType(typeModel)) {
		return base64ToBase64Ext(base64UrlToBase64(elementId))
	}
	return elementId
}

export function customIdToBase64Url(typeModel: TypeModel, elementId: Id): Id {
	if (isCustomIdType(typeModel)) {
		return base64ToBase64Url(base64ExtToBase64(elementId))
	}
	return elementId
}
