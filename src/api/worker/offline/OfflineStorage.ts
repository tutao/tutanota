import {ListElementEntity, SomeEntity} from "../../common/EntityTypes.js"
import {
	elementIdPart,
	firstBiggerThanSecond,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	getElementId,
	listIdPart,
	timestampToGeneratedId
} from "../../common/utils/EntityUtils.js"
import {CacheStorage, expandId, ExposedCacheStorage} from "../rest/DefaultEntityRestCache.js"
import * as cborg from "cborg"
import {EncodeOptions, Token, Type} from "cborg"
import {assert, DAY_IN_MILLIS, getTypeId, groupByAndMap, mapNullable, TypeRef} from "@tutao/tutanota-utils"
import type {OfflineDbFacade} from "../../../desktop/db/OfflineDbFacade.js"
import {isOfflineStorageAvailable, isTest} from "../../common/Env.js"
import {modelInfos} from "../../common/EntityFunctions.js"
import {AccountType, MailFolderType, OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS} from "../../common/TutanotaConstants.js"
import {DateProvider} from "../../common/DateProvider.js"
import {TokenOrNestedTokens} from "cborg/types/interface"
import {CalendarEventTypeRef, FileTypeRef, MailBodyTypeRef, MailFolderTypeRef, MailHeadersTypeRef, MailTypeRef} from "../../entities/tutanota/TypeRefs.js"
import {UserTypeRef} from "../../entities/sys/TypeRefs.js"
import {OfflineStorageMigrator} from "./OfflineStorageMigrator.js"
import {CustomCacheHandlerMap, CustomCalendarEventCacheHandler} from "../rest/CustomCacheHandler.js"
import {EntityRestClient} from "../rest/EntityRestClient.js"
import {OfflineStorageInitArgs} from "../rest/CacheStorageProxy.js"
import {uint8ArrayToKey} from "@tutao/tutanota-crypto"
import {InterWindowEventFacadeSendDispatcher} from "../../../native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import {OfflineDbClosedError} from "../../common/error/OfflineDbClosedError.js"

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

export type Apps = keyof typeof modelInfos

type AppMetadataEntries = {
	// Yes this is cursed, give me a break
	[P in Apps as `${P}-version`]: number
}

export interface OfflineDbMeta extends AppMetadataEntries {
	lastUpdateTime: number,
	timeRangeDays: number
}

export class OfflineStorage implements CacheStorage, ExposedCacheStorage {
	private _userId: Id | null = null
	private customCacheHandler: CustomCacheHandlerMap | null = null

	constructor(
		private readonly offlineDbFacade: OfflineDbFacade,
		private readonly interWindowEventSender: InterWindowEventFacadeSendDispatcher,
		private readonly dateProvider: DateProvider,
		private readonly migrator: OfflineStorageMigrator,
	) {
		assert(isOfflineStorageAvailable() || isTest(), "Offline storage is not available.")
	}

	/**
	 * @return {boolean} whether the database was newly created or not
	 */
	async init({userId, databaseKey, timeRangeDays, forceNewDatabase}: OfflineStorageInitArgs): Promise<boolean> {
		const key = uint8ArrayToKey(databaseKey)
		this._userId = userId

		if (forceNewDatabase) {
			await this.interWindowEventSender.localUserDataInvalidated(userId)
			await this.offlineDbFacade.deleteDatabaseForUser(userId)
		}
		// We open database here and it is closed in the native side when the window is closed or the page is reloaded
		await this.offlineDbFacade.openDatabaseForUser(userId, key)
		await this.migrator.migrate(this)
		// if nothing is written here, it means it's a new database
		const isNewOfflineDb = await this.getLastUpdateTime() == null
		await this.clearExcludedData(timeRangeDays)
		return isNewOfflineDb
	}

	async deinit() {
		this._userId && await this.offlineDbFacade.closeDatabaseForUser(this._userId)
		this._userId = null
	}

	private get userId(): Id {
		if (this._userId == null) {
			throw new OfflineDbClosedError("Offline storage not initialized")
		}

		return this._userId
	}

	async deleteIfExists(typeRef: TypeRef<SomeEntity>, listId: Id | null, id: Id): Promise<void> {
		return this.offlineDbFacade.delete(this.userId, getTypeId(typeRef), listId, id)
	}

	async get<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<T | null> {
		const loaded = await this.offlineDbFacade.get(this.userId, getTypeId(typeRef), listId, id) ?? null
		return loaded && this.deserialize(typeRef, loaded)
	}

	async getIdsInRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<Id>> {
		return this.offlineDbFacade.getIdsInRange(this.userId, getTypeId(typeRef), listId)
	}

	async getRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<{lower: Id, upper: Id} | null> {
		return this.offlineDbFacade.getRange(this.userId, getTypeId(typeRef), listId)
	}

	async isElementIdInCacheRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<boolean> {
		const range = await this.getRangeForList(typeRef, listId)
		return range != null
			&& !firstBiggerThanSecond(id, range.upper)
			&& !firstBiggerThanSecond(range.lower, id)
	}

	async provideFromRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		return this.deserializeList(typeRef, await this.offlineDbFacade.provideFromRange(this.userId, getTypeId(typeRef), listId, start, count, reverse))
	}

	async put(originalEntity: SomeEntity): Promise<void> {
		const serializedEntity = this.serialize(originalEntity)
		const {listId, elementId} = expandId(originalEntity._id)
		return this.offlineDbFacade.put(this.userId, {type: getTypeId(originalEntity._type), listId, elementId, entity: serializedEntity})
	}

	async setLowerRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<void> {
		return this.offlineDbFacade.setLowerRange(this.userId, getTypeId(typeRef), listId, id)
	}

	async setUpperRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<void> {
		return this.offlineDbFacade.setUpperRange(this.userId, getTypeId(typeRef), listId, id)
	}

	async setNewRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lower: Id, upper: Id): Promise<void> {
		return this.offlineDbFacade.setNewRange(this.userId, getTypeId(typeRef), listId, lower, upper)
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

	private deserializeList<T extends SomeEntity>(typeRef: TypeRef<T>, loaded: Array<Uint8Array>): Array<T> {
		return loaded.map(entity => this.deserialize(typeRef, entity))
	}

	getLastBatchIdForGroup(groupId: Id): Promise<Id | null> {
		return this.offlineDbFacade.getLastBatchIdForGroup(this.userId, groupId)
	}

	async putLastBatchIdForGroup(groupId: Id, batchId: Id): Promise<void> {
		await this.offlineDbFacade.putLastBatchIdForGroup(this.userId, groupId, batchId)
	}

	async getLastUpdateTime(): Promise<number | null> {
		return this.getMetadata("lastUpdateTime")
	}

	async putLastUpdateTime(ms: number): Promise<void> {
		await this.putMetadata("lastUpdateTime", ms)
	}

	private async putMetadata<K extends keyof OfflineDbMeta>(key: K, value: OfflineDbMeta[K]): Promise<void> {
		await this.offlineDbFacade.putMetadata(this.userId, key, cborg.encode(value))
	}

	private async getMetadata<K extends keyof OfflineDbMeta>(key: K): Promise<OfflineDbMeta[K] | null> {
		const encoded = await this.offlineDbFacade.getMetadata(this.userId, key)
		return encoded && cborg.decode(encoded)
	}

	async purgeStorage(): Promise<void> {
		await this.offlineDbFacade.deleteAll(this.userId)
	}

	/**
	 * Clear out unneeded data from the offline database (i.e. trash and spam lists, old data)
	 * @param timeRangeDays: the maxiumum age of days that mails should be to be kept in the database. if null, will use a default value
	 */
	private async clearExcludedData(timeRangeDays: number | null): Promise<void> {

		const user = await this.get(UserTypeRef, null, this.userId)

		// Free users always have default time range regardless of what is stored
		const isFreeUser = user?.accountType === AccountType.FREE
		const timeRange = isFreeUser || timeRangeDays == null ? OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS : timeRangeDays
		const cutoffTimestamp = this.dateProvider.now() - timeRange * DAY_IN_MILLIS
		const cutoffId = timestampToGeneratedId(cutoffTimestamp)

		const folders = await this.getListElementsOfType(MailFolderTypeRef)
		for (const folder of folders) {
			if (folder.folderType === MailFolderType.TRASH || folder.folderType === MailFolderType.SPAM) {
				await this.deleteMailList(folder.mails, GENERATED_MAX_ID)
			} else {
				await this.deleteMailList(folder.mails, cutoffId)
			}
		}

		await this.offlineDbFacade.compactDatabase(this.userId)
	}

	/**
	 * This method deletes mails from {@param listId} what are older than {@param cutoffId}. as well as associated data
	 *
	 * For each mail we delete its body, headers, and all referenced attachments.
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
	private async deleteMailList(listId: Id, cutoffId: Id): Promise<void> {

		// This must be done before deleting mails to know what the new range has to be
		await this.updateRangeForList(MailTypeRef, listId, cutoffId)

		const mailsToDelete: IdTuple[] = []
		const headersToDelete: Id[] = []
		const attachmentsTodelete: IdTuple[] = []
		const mailbodiesToDelete: Id[] = []

		const mails = await this.getWholeList(MailTypeRef, listId)
		for (let mail of mails) {
			if (firstBiggerThanSecond(cutoffId, getElementId(mail))) {
				mailsToDelete.push(mail._id)
				mailbodiesToDelete.push(mail.body)

				if (mail.headers) {
					headersToDelete.push(mail.headers)
				}

				for (const id of mail.attachments) {
					attachmentsTodelete.push(id)
				}
			}
		}
		await this.offlineDbFacade.deleteIn(this.userId, getTypeId(MailBodyTypeRef), null, mailbodiesToDelete)
		await this.offlineDbFacade.deleteIn(this.userId, getTypeId(MailHeadersTypeRef), null, headersToDelete)
		for (let [listId, elementIds] of groupByAndMap(attachmentsTodelete, listIdPart, elementIdPart).entries()) {
			await this.offlineDbFacade.deleteIn(this.userId, getTypeId(FileTypeRef), listId, elementIds)
			await this.offlineDbFacade.deleteRange(this.userId, getTypeId(FileTypeRef), listId)
		}

		await this.offlineDbFacade.deleteIn(this.userId, getTypeId(MailTypeRef), listId, mailsToDelete.map(elementIdPart))
	}

	private async updateRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, cutoffId: Id): Promise<void> {
		const type = getTypeId(typeRef)

		const range = await this.offlineDbFacade.getRange(this.userId, type, listId)
		if (range == null) {
			return
		}

		// If the range for a given list is complete from the beginning (starts at GENERATED_MIN_ID), then we only want to actually modify the
		// saved range if we would be removing elements from the list, in order to not lose the information that the range is complete in storage.
		// So we have to check how old the oldest element in said range is. If it is newer than cutoffId, then we will not modify the range,
		// otherwise we will just modify it normally
		if (range.lower === GENERATED_MIN_ID) {
			const entities = await this.provideFromRange(typeRef, listId, GENERATED_MIN_ID, 1, false)
			const id = mapNullable(entities[0], getElementId)
			const rangeWontBeModified = id == null || firstBiggerThanSecond(id, cutoffId) || id === cutoffId
			if (rangeWontBeModified) {
				return
			}
		}

		if (firstBiggerThanSecond(cutoffId, range.lower)) {
			// If the upper id of the range is below the cutoff, then the entire range will be deleted from the storage
			// so we just delete the range as well
			// Otherwise, we only want to modify
			if (firstBiggerThanSecond(cutoffId, range.upper)) {
				await this.offlineDbFacade.deleteRange(this.userId, type, listId)
			} else {
				await this.offlineDbFacade.setLowerRange(this.userId, type, listId, cutoffId)
			}
		}
	}

	async getListElementsOfType<T extends ListElementEntity>(typeRef: TypeRef<T>): Promise<Array<T>> {
		return this.deserializeList(typeRef, await this.offlineDbFacade.getListElementsOfType(this.userId, getTypeId(typeRef)))
	}

	async getWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<T>> {
		return this.deserializeList(typeRef, await this.offlineDbFacade.getWholeList(this.userId, getTypeId(typeRef), listId))
	}

	async dumpMetadata(): Promise<Partial<OfflineDbMeta>> {
		const stored = await this.offlineDbFacade.dumpMetadata(this.userId)
		return Object.fromEntries(stored.map(([key, value]) => [key, cborg.decode(value)])) as OfflineDbMeta
	}

	async setStoredModelVersion(model: keyof typeof modelInfos, version: number) {
		return this.putMetadata(`${model}-version`, version)
	}

	getCustomCacheHandlerMap(entityRestClient: EntityRestClient): CustomCacheHandlerMap {
		if (this.customCacheHandler == null) {
			this.customCacheHandler = new CustomCacheHandlerMap({ref: CalendarEventTypeRef, handler: new CustomCalendarEventCacheHandler(entityRestClient)})
		}
		return this.customCacheHandler
	}
}
