import { assertNotNull, groupBy, groupByAndMap, neverNull, promiseMap, splitInChunks, TypeRef } from "@tutao/tutanota-utils"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { ExposedCacheStorage } from "../../../common/api/worker/rest/DefaultEntityRestCache.js"
import { elementIdPart, isSameId, listIdPart, timestampToGeneratedId } from "../../../common/api/common/utils/EntityUtils.js"
import { CacheMode, EntityRestClientLoadOptions, OwnerEncSessionKeyProvider } from "../../../common/api/worker/rest/EntityRestClient.js"
import { isDraft } from "../../mail/model/MailChecks.js"
import {
	File as TutanotaFile,
	FileTypeRef,
	Mail,
	MailDetails,
	MailDetailsBlobTypeRef,
	MailDetailsDraftTypeRef,
	MailTypeRef,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { SomeEntity } from "../../../common/api/common/EntityTypes.js"
import { parseKeyVersion } from "../../../common/api/worker/facades/KeyLoaderFacade.js"

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

	loadMailsInRangeWithCache(
		mailListId: Id,
		[rangeStart, rangeEnd]: TimeRange,
	): Promise<{
		elements: Array<Mail>
		loadedCompletely: boolean
	}> {
		return this.mailEntityClient.loadReverseRangeBetween(
			MailTypeRef,
			mailListId,
			timestampToGeneratedId(rangeStart),
			timestampToGeneratedId(rangeEnd),
			MAIL_INDEXER_CHUNK,
		)
	}

	loadFixedNumberOfMailsWithCache(mailLIstId: Id, startId: Id, options: EntityRestClientLoadOptions = {}): Promise<Mail[]> {
		return this.mailEntityClient.loadRange(MailTypeRef, mailLIstId, startId, MAIL_INDEXER_CHUNK, true, { ...options, cacheMode: CacheMode.ReadOnly })
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
					? this.mailDataEntityClient.loadMultiple(typeRef, listId, chunk, ownerEncSessionKeyProvider, { ...options, cacheMode: CacheMode.ReadOnly })
					: Promise.resolve([])
			},
			{
				concurrency: 2,
			},
		)
		return entityResults.flat()
	}
}
