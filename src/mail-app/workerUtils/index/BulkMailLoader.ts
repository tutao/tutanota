import { assertNotNull, findLastIndex, groupBy, groupByAndMap, last, lastThrow, neverNull, promiseMap, splitInChunks, TypeRef } from "@tutao/tutanota-utils"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { ExposedCacheStorage } from "../../../common/api/worker/rest/DefaultEntityRestCache.js"
import {
	constructMailSetEntryId,
	deconstructMailSetEntryId,
	elementIdPart,
	GENERATED_MAX_ID,
	getElementId,
	isSameId,
	listIdPart,
	timeRangeToString,
	timestampToGeneratedId,
} from "../../../common/api/common/utils/EntityUtils.js"
import { CacheMode, EntityRestClientLoadOptions, OwnerEncSessionKeyProvider } from "../../../common/api/worker/rest/EntityRestClient.js"
import { isDraft } from "../../mail/model/MailChecks.js"
import {
	File as TutanotaFile,
	FileTypeRef,
	Mail,
	MailDetails,
	MailDetailsBlobTypeRef,
	MailDetailsDraftTypeRef,
	MailSetEntry,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { SomeEntity } from "../../../common/api/common/EntityTypes.js"
import { parseKeyVersion } from "../../../common/api/worker/facades/KeyLoaderFacade.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"

export const ENTITY_INDEXER_CHUNK = 20
export const MAIL_INDEXER_CHUNK = 100

export type TimeRange = [number, number]

export interface MailWithMailDetails {
	mail: Mail
	mailDetails: MailDetails
}

export class BulkMailLoader {
	constructor(
		private readonly mailEntityClient: EntityClient,
		private readonly mailDataEntityClient: EntityClient,
		private readonly cachedStorage: ExposedCacheStorage | null,
	) {}

	async loadMailsInRangeWithCache(
		mailListId: Id,
		[rangeStart, rangeEnd]: TimeRange,
	): Promise<{
		elements: Array<Mail>
		loadedCompletely: boolean
	}> {
		const startId = timestampToGeneratedId(rangeStart)
		const endId = timestampToGeneratedId(rangeEnd)
		console.log("BulkMailLoader", `loading ${mailListId}`, timeRangeToString([rangeStart, rangeEnd]), `[${startId}-${endId}]`)
		const result = await this.mailEntityClient.loadReverseRangeBetween(MailTypeRef, mailListId, startId, endId, MAIL_INDEXER_CHUNK)
		console.log("BulkMailLoader", `downloaded ${mailListId}`, timeRangeToString([rangeStart, rangeEnd]), `[${startId}-${endId}]`, result.elements.length)
		return result
	}

	loadFixedNumberOfMailsWithCache(mailLIstId: Id, startId: Id, options: EntityRestClientLoadOptions = {}): Promise<Mail[]> {
		return this.mailEntityClient.loadRange(MailTypeRef, mailLIstId, startId, MAIL_INDEXER_CHUNK, true, {
			...options,
			cacheMode: CacheMode.ReadOnly,
		})
	}

	async removeFromCache(id: IdTuple): Promise<void> {
		return this.cachedStorage?.deleteIfExists(MailTypeRef, listIdPart(id), elementIdPart(id))
	}

	async loadMailDetails(mails: readonly Mail[], options: EntityRestClientLoadOptions = {}): Promise<MailWithMailDetails[]> {
		const result: Array<MailWithMailDetails> = []
		// mailDetails stored as blob
		let mailDetailsBlobMails = mails.filter((m) => !isDraft(m))
		const listIdToMailDetailsBlobIds: Map<Id, Array<Id>> = groupByAndMap(
			mailDetailsBlobMails,
			(m) => assertNotNull(m.mailDetails)[0],
			(m) => neverNull(m.mailDetails)[1],
		)
		for (let [listId, ids] of listIdToMailDetailsBlobIds) {
			const ownerEncSessionKeyProvider: OwnerEncSessionKeyProvider = async (instanceElementId: Id) => {
				const mail = assertNotNull(mailDetailsBlobMails.find((m) => elementIdPart(assertNotNull(m.mailDetails)) === instanceElementId))
				return {
					key: assertNotNull(mail._ownerEncSessionKey),
					encryptingKeyVersion: parseKeyVersion(mail._ownerKeyVersion ?? "0"),
				}
			}
			const mailDetailsBlobs = await this.loadInChunks(MailDetailsBlobTypeRef, listId, ids, ownerEncSessionKeyProvider, options)
			result.push(
				...mailDetailsBlobs.map((mailDetailsBlob) => {
					const mail = assertNotNull(mailDetailsBlobMails.find((m) => isSameId(m.mailDetails, mailDetailsBlob._id)))
					return { mail, mailDetails: mailDetailsBlob.details }
				}),
			)
		}
		// mailDetails stored in db (draft)
		let mailDetailsDraftMails = mails.filter((m) => isDraft(m))
		const listIdToMailDetailsDraftIds: Map<Id, Array<Id>> = groupByAndMap(
			mailDetailsDraftMails,
			(m) => assertNotNull(m.mailDetailsDraft)[0],
			(m) => neverNull(m.mailDetailsDraft)[1],
		)
		for (let [listId, ids] of listIdToMailDetailsDraftIds) {
			const ownerEncSessionKeyProvider: OwnerEncSessionKeyProvider = async (instanceElementId: Id) => {
				const mail = assertNotNull(mailDetailsDraftMails.find((m) => elementIdPart(assertNotNull(m.mailDetailsDraft)) === instanceElementId))
				return {
					key: assertNotNull(mail._ownerEncSessionKey),
					encryptingKeyVersion: parseKeyVersion(mail._ownerKeyVersion ?? "0"),
				}
			}
			const mailDetailsDrafts = await this.loadInChunks(MailDetailsDraftTypeRef, listId, ids, ownerEncSessionKeyProvider, options)
			result.push(
				...mailDetailsDrafts.map((draftDetails) => {
					const mail = assertNotNull(mailDetailsDraftMails.find((m) => isSameId(m.mailDetailsDraft, draftDetails._id)))
					return { mail, mailDetails: draftDetails.details }
				}),
			)
		}
		return result
	}

	async loadAttachments(mails: readonly Mail[], options: EntityRestClientLoadOptions = {}): Promise<TutanotaFile[]> {
		const attachmentIds: IdTuple[] = []
		for (const mail of mails) {
			attachmentIds.push(...mail.attachments)
		}
		const filesByList = groupBy(attachmentIds, (a) => a[0])
		const fileLoadingPromises: Array<Promise<Array<TutanotaFile>>> = []
		for (const [listId, fileIds] of filesByList.entries()) {
			fileLoadingPromises.push(
				this.loadInChunks(
					FileTypeRef,
					listId,
					fileIds.map((f) => f[1]),
					undefined,
					options,
				),
			)
		}
		const filesResults = await Promise.all(fileLoadingPromises)
		return filesResults.flat()
	}

	private async loadInChunks<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		ids: Id[],
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
		options: EntityRestClientLoadOptions = {},
	): Promise<T[]> {
		const byChunk = splitInChunks(ENTITY_INDEXER_CHUNK, ids)
		const entityResults = await promiseMap(
			byChunk,
			(chunk) => {
				return chunk.length > 0
					? this.mailDataEntityClient.loadMultiple(typeRef, listId, chunk, ownerEncSessionKeyProvider, {
							...options,
							cacheMode: CacheMode.ReadOnly,
					  })
					: Promise.resolve([])
			},
			{
				concurrency: 2,
			},
		)
		return entityResults.flat()
	}

	async loadMailSetEntriesForTimeRange(mailSetListData: MailSetListData, timeRange: TimeRange): Promise<MailSetEntry[]> {
		const [rangeStart, rangeEnd] = timeRange
		if (rangeStart < rangeEnd) {
			throw new ProgrammingError("Range start must be bigger (after) the range end")
		}
		// FIXME what if the range start is newer than what we have?
		// if (mailSetListData.lastLoadedId)

		// Do we have an item that's newer than the start of the range? If yes, throw everything that's newer
		// +--------------------+
		// newest loaded  |      oldest loaded
		//                rangeStart
		const lastNewerThanStartIndex = findLastIndex(
			mailSetListData.loadedButUnusedEntries,
			(entry) => deconstructMailSetEntryId(getElementId(entry)).receiveDate.getTime() > rangeStart,
		)
		if (lastNewerThanStartIndex != -1) {
			const removed = mailSetListData.loadedButUnusedEntries.splice(0, lastNewerThanStartIndex + 1)
			const lastRemovedItem = last(removed)
			const lastRemovedDate = lastRemovedItem != null ? deconstructMailSetEntryId(getElementId(lastRemovedItem)).receiveDate : null
			console.warn(
				`Possibly not using loadMailSetEntriesForTimeRange correctly. Requested items from ${new Date(
					rangeStart,
				)} but previously items until ${lastRemovedDate}. Throwing away ${removed.length} items.`,
			)
		}

		// Look for an element that's older than end of the range in the list.
		// If it is there it means that we have loaded all the items for this time range, and we can return the part
		// that is within the range.
		const olderThanEndIndex = mailSetListData.loadedButUnusedEntries.findIndex(
			(entry) => deconstructMailSetEntryId(getElementId(entry)).receiveDate.getTime() < rangeEnd,
		)
		// If there is one we can just use everything that's older than the item outside of range. We take out the
		// part that we are going to use.
		if (mailSetListData.lastLoadedId != null && olderThanEndIndex !== -1) {
			// +-----------------|--------+
			//                   index
			// ^----------------^ <- what we can use
			return mailSetListData.loadedButUnusedEntries.splice(0, olderThanEndIndex - 1)
		} else if (mailSetListData.loadedCompletely) {
			// At this point we know that all the items are within the range and there's nothing else to load.
			// Return them and remove them.
			return mailSetListData.loadedButUnusedEntries.splice(0, mailSetListData.loadedButUnusedEntries.length)
		} else {
			// There are no items outside the end range, we need to load more to ensure that we have everything.
			// Load from the last loaded element and always load MAIL_INDEXER_CHUNK items to avoid doing small requests.
			// We would rather do few bigger requests than a lot of small ones.
			// If start id is not there the indexing might have been just started or restarted. Approximate the start id.
			const startId = mailSetListData.lastLoadedId ?? constructMailSetEntryId(new Date(rangeStart), GENERATED_MAX_ID)
			const newItems = await this.mailEntityClient.loadRange(MailSetEntryTypeRef, mailSetListData.listId, startId, MAIL_INDEXER_CHUNK, true)
			if (newItems.length > 0) {
				mailSetListData.lastLoadedId = getElementId(lastThrow(newItems))
			}

			// If we exhausted the list return everything that we've got so far
			if (newItems.length < MAIL_INDEXER_CHUNK) {
				mailSetListData.loadedCompletely = true
				mailSetListData.loadedButUnusedEntries.push(...newItems)
				return this.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)
				// return [...items, ...newItems]
			} else {
				// add loaded items again and try to provide the range again
				mailSetListData.loadedButUnusedEntries.push(...newItems)
				return this.loadMailSetEntriesForTimeRange(mailSetListData, timeRange)
			}
		}
	}

	async loadMailsFromMultipleLists(mailSetEntries: readonly MailSetEntry[]): Promise<Mail[]> {
		const mailIdsByFolder = groupByAndMap(
			mailSetEntries,
			(entry) => listIdPart(entry.mail),
			(entry) => elementIdPart(entry.mail),
		)
		const mails = await promiseMap(mailIdsByFolder, ([listId, mailIds]) => this.mailEntityClient.loadMultiple(MailTypeRef, listId, mailIds))
		return mails.flat()
	}
}

export interface MailSetListData {
	listId: Id
	lastLoadedId: Id | null
	loadedButUnusedEntries: MailSetEntry[]
	loadedCompletely: boolean
}
