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
import {CachedRangeLoader, CacheStorage, expandId} from "./EntityRestCache.js"
import * as cborg from "cborg"
import {EncodeOptions, Token, Type} from "cborg"
import {assert, DAY_IN_MILLIS, groupByAndMap, mapNullable, typedKeys, TypeRef} from "@tutao/tutanota-utils"
import type {OfflineDbFacade} from "../../../desktop/db/OfflineDbFacade"
import {isOfflineStorageAvailable, isTest} from "../../common/Env"
import {ProgrammingError} from "../../common/error/ProgrammingError"
import {modelInfos} from "../../common/EntityFunctions"
import {AccountType, MailFolderType, OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS} from "../../common/TutanotaConstants"
import {DateProvider} from "../../common/DateProvider"
import {TokenOrNestedTokens} from "cborg/types/interface"
import {FileTypeRef, MailBodyTypeRef, MailFolderTypeRef, MailHeadersTypeRef, MailTypeRef} from "../../entities/tutanota/TypeRefs"
import {UserTypeRef} from "../../entities/sys/TypeRefs"

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

type Apps = keyof typeof modelInfos

type AppMetadataEntries = {
	// Yes this is cursed, give me a break
	[P in Apps as `${P}-version`]: number
}

export interface OfflineDbMeta extends AppMetadataEntries {
	lastUpdateTime: number,
	timeRangeDays: number
}

export class OfflineStorage implements CacheStorage, CachedRangeLoader {
	private _userId: Id | null = null

	constructor(
		private readonly offlineDbFacade: OfflineDbFacade,
		private readonly dateProvider: DateProvider,
	) {
		assert(isOfflineStorageAvailable() || isTest(), "Offline storage is not available.")
	}

	async init(userId: Id, databaseKey: Aes256Key): Promise<void> {
		this._userId = userId

		// We open database here and it is closed in the native side when the window is closed or the page is reloaded
		await this.offlineDbFacade.openDatabaseForUser(userId, databaseKey)

		for (const app of typedKeys(modelInfos)) {
			const storedVersion = await this.getMetadata(`${app}-version`)
			const runtimeVersion = modelInfos[app].version
			if (storedVersion != null && storedVersion !== runtimeVersion) {
				console.log(`Detected incompatible model version for ${app}, stored: ${storedVersion}, runtime: ${runtimeVersion}, purging db for ${userId}`)
				await this.offlineDbFacade.deleteAll(userId)
				break
			}
		}

		for (const app of typedKeys(modelInfos)) {
			const runtimeVersion = modelInfos[app].version
			await this.putMetadata(`${app}-version`, runtimeVersion)
		}
	}

	private get userId(): Id {
		if (this._userId == null) {
			throw new ProgrammingError("Offline storage not initialized")
		}

		return this._userId
	}

	async deleteIfExists(typeRef: TypeRef<SomeEntity>, listId: Id | null, id: Id): Promise<void> {
		return this.offlineDbFacade.delete(this.userId, this.getTypeId(typeRef), listId, id)
	}

	async get<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<T | null> {
		const loaded = await this.offlineDbFacade.get(this.userId, this.getTypeId(typeRef), listId, id) ?? null
		return loaded && this.deserialize(typeRef, loaded)
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
		return this.deserializeList(typeRef, await this.offlineDbFacade.provideFromRange(this.userId, this.getTypeId(typeRef), listId, start, count, reverse))
	}

	async put(originalEntity: SomeEntity): Promise<void> {
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

	async clearExcludedData(): Promise<void> {

		// Reset the stored data time range to the default in case the user has downgraded
		const user = await this.get(UserTypeRef, null, this.userId)
		if (user?.accountType === AccountType.FREE) {
			await this.setTimeRangeDays(OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS)
		}

		const cutoffTimestamp = await this.getCutoffTimestamp()
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
		await this.offlineDbFacade.deleteIn(this.userId, this.getTypeId(MailBodyTypeRef), null, mailbodiesToDelete)
		await this.offlineDbFacade.deleteIn(this.userId, this.getTypeId(MailHeadersTypeRef), null, headersToDelete)
		for (let [listId, elementIds] of groupByAndMap(attachmentsTodelete, listIdPart, elementIdPart).entries()) {
			await this.offlineDbFacade.deleteIn(this.userId, this.getTypeId(FileTypeRef), listId, elementIds)
			await this.offlineDbFacade.deleteRange(this.userId, this.getTypeId(FileTypeRef), listId)
		}

		await this.offlineDbFacade.deleteIn(this.userId, this.getTypeId(MailTypeRef), listId, mailsToDelete.map(elementIdPart))
	}

	private async updateRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, cutoffId: Id): Promise<void> {
		const type = this.getTypeId(typeRef)

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

	async getTimeRangeDays(): Promise<number> {
		return await this.getMetadata("timeRangeDays") ?? OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS
	}

	async setTimeRangeDays(days: number): Promise<void> {
		await this.putMetadata("timeRangeDays", days)
	}

	async getCutoffTimestamp(): Promise<number> {
		return this.dateProvider.now() - (await this.getTimeRangeDays() * DAY_IN_MILLIS)
	}

	private async getListElementsOfType<T extends ListElementEntity>(typeRef: TypeRef<T>): Promise<Array<T>> {
		return this.deserializeList(typeRef, await this.offlineDbFacade.getListElementsOfType(this.userId, this.getTypeId(typeRef)))
	}

	private async getWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<T>> {
		return this.deserializeList(typeRef, await this.offlineDbFacade.getWholeList(this.userId, this.getTypeId(typeRef), listId))
	}
}
