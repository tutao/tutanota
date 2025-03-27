import {
	FULL_INDEXED_TIMESTAMP,
	ImportStatus,
	isFolder,
	MailState,
	NOTHING_INDEXED_TIMESTAMP,
	OperationType,
} from "../../../common/api/common/TutanotaConstants"
import {
	File as TutanotaFile,
	ImportedMailTypeRef,
	ImportMailStateTypeRef,
	Mail,
	MailBox,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetails,
	MailDetailsBlobTypeRef,
	MailDetailsDraftTypeRef,
	MailFolderTypeRef,
	MailSetEntry,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { ConnectionError, NotAuthorizedError, NotFoundError } from "../../../common/api/common/error/RestError.js"
import { assertNotNull, clamp, DAY_IN_MILLIS, findAllAndRemove, first, isEmpty, isNotNull, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { deconstructMailSetEntryId, elementIdPart, getElementId, isSameId, listIdPart } from "../../../common/api/common/utils/EntityUtils.js"
import { benchmarkFunction, filterMailMemberships } from "../../../common/api/worker/search/IndexUtils.js"
import { IndexingErrorReason } from "../../../common/api/worker/search/SearchTypes.js"
import { CancelledError } from "../../../common/api/common/error/CancelledError.js"
import type { DateProvider } from "../../../common/api/worker/DateProvider.js"
import type { User } from "../../../common/api/entities/sys/TypeRefs.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { ProgressMonitor } from "../../../common/api/common/utils/ProgressMonitor.js"
import { InfoMessageHandler } from "../../../common/gui/InfoMessageHandler.js"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { hasError } from "../../../common/api/common/utils/ErrorUtils.js"
import { isDraft } from "../../mail/model/MailChecks.js"
import { BulkMailLoader, MAIL_INDEXER_CHUNK } from "./BulkMailLoader.js"
import { parseKeyVersion } from "../../../common/api/worker/facades/KeyLoaderFacade.js"
import { MailIndexerBackend, MailWithDetailsAndAttachments } from "./MailIndexerBackend"

export const INITIAL_MAIL_INDEX_INTERVAL_DAYS = 28
const MAIL_INDEX_BATCH_INTERVAL = DAY_IN_MILLIS // one day

const TAG = "MailIndexer"

export class MailIndexer {
	// {@link currentIndexTimestamp}: the **oldest** timestamp that has been indexed for all mail lists
	// There are two scenarios in which new mails are indexed:
	// a) a new mail (internal/external) is received from our mail server
	// 	  * mail timestamp is guaranteed to be newer than the currentIndexTimestamp
	//    	=> mail will be indexed
	// b) an old mail is imported to our tutadb server
	// 	  * mail timestamp is newer than currentIndexTimestamp
	//    	=> mail will be indexed
	//    * mail timestamp is older than currentIndexTimestamp
	//    	=> mail will not be indexed
	currentIndexTimestamp: number

	private _mailIndexingEnabled: boolean

	get mailIndexingEnabled(): boolean {
		return this._mailIndexingEnabled
	}

	mailboxIndexingPromise: Promise<void>
	isIndexing: boolean = false
	_indexingCancelled: boolean
	_dateProvider: DateProvider
	_backend: MailIndexerBackend | null = null

	constructor(
		private readonly infoMessageHandler: InfoMessageHandler,
		private readonly bulkLoaderFactory: () => BulkMailLoader,
		private readonly entityClient: EntityClient,
		dateProvider: DateProvider,
		private readonly mailFacade: MailFacade,
		private readonly backendFactory: (user: Id) => MailIndexerBackend,
	) {
		this.currentIndexTimestamp = NOTHING_INDEXED_TIMESTAMP
		this._mailIndexingEnabled = false
		this.mailboxIndexingPromise = Promise.resolve()
		this._indexingCancelled = false
		this._dateProvider = dateProvider
	}

	async init(userId: Id): Promise<void> {
		this._backend = this.backendFactory(userId)
		await this.backend.init()
		this._mailIndexingEnabled = await this.backend.isMailIndexingEnabled()
	}

	/** @private visibleForTesting */
	async downloadNewMailData(mailId: IdTuple): Promise<MailWithDetailsAndAttachments | null> {
		try {
			const mail = await this.entityClient.load(MailTypeRef, mailId)
			// Will be always there, if it was not updated yet, it will still be set by CryptoFacade
			const mailOwnerEncSessionKey = assertNotNull(mail._ownerEncSessionKey)
			let mailDetails: MailDetails
			if (isDraft(mail)) {
				const mailDetailsDraftId = assertNotNull(mail.mailDetailsDraft)
				mailDetails = await this.entityClient
					.loadMultiple(MailDetailsDraftTypeRef, listIdPart(mailDetailsDraftId), [elementIdPart(mailDetailsDraftId)], async () => ({
						key: mailOwnerEncSessionKey,
						encryptingKeyVersion: parseKeyVersion(mail._ownerKeyVersion ?? "0"),
					}))
					.then((d) => {
						const draft = first(d)
						if (draft == null) {
							throw new NotFoundError(`MailDetailsDraft ${mailDetailsDraftId}`)
						}
						return draft.details
					})
			} else {
				const mailDetailsBlobId = assertNotNull(mail.mailDetails)
				mailDetails = await this.entityClient
					.loadMultiple(MailDetailsBlobTypeRef, listIdPart(mailDetailsBlobId), [elementIdPart(mailDetailsBlobId)], async () => ({
						key: mailOwnerEncSessionKey,
						encryptingKeyVersion: parseKeyVersion(mail._ownerKeyVersion ?? "0"),
					}))
					.then((d) => {
						const blob = first(d)
						if (blob == null) {
							throw new NotFoundError(`MailDetailsBlob ${mailDetailsBlobId}`)
						}
						return blob.details
					})
			}
			const attachments = await this.mailFacade.loadAttachments(mail)
			return {
				mail,
				mailDetails,
				attachments,
			}
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("tried to index non existing mail", e)
				return null
			} else if (e instanceof NotAuthorizedError) {
				console.log("tried to index mail without permission", e)
				return null
			} else {
				throw e
			}
		}
	}

	async enableMailIndexing(user: User): Promise<void> {
		const wasEnabled = await this.backend.enableIndexing()
		this._mailIndexingEnabled = true
		if (!wasEnabled) {
			// create index in background, termination is handled in Indexer.enableMailIndexing
			const oldestTimestamp = this._dateProvider.getStartOfDayShiftedBy(-INITIAL_MAIL_INDEX_INTERVAL_DAYS).getTime()

			this.indexMailboxes(user, oldestTimestamp).catch(
				ofClass(CancelledError, (e) => {
					console.log("cancelled initial indexing", e)
				}),
			)
		}
	}

	async disableMailIndexing(): Promise<void> {
		this._mailIndexingEnabled = false
		this._indexingCancelled = true
		await this.backend.deleteIndex()
	}

	cancelMailIndexing() {
		this._indexingCancelled = true
	}

	/**
	 * Extend mail index if not indexed this range yet.
	 * newOldestTimestamp should be aligned to the start of the day up until which you want to index, we don't do rounding inside here.
	 */
	async extendIndexIfNeeded(user: User, newOldestTimestamp: number): Promise<void> {
		if (this.currentIndexTimestamp > FULL_INDEXED_TIMESTAMP && this.currentIndexTimestamp > newOldestTimestamp) {
			this.mailboxIndexingPromise = this.mailboxIndexingPromise
				.then(() => this.indexMailboxes(user, newOldestTimestamp))
				.catch(
					ofClass(CancelledError, (e) => {
						console.log("extend mail index has been cancelled", e)
					}),
				)
			return this.mailboxIndexingPromise
		}
	}

	/**
	 * Indexes all mailboxes of the given user up to the endIndexTimestamp if mail indexing is enabled.
	 * If the mailboxes are already fully indexed, they are not indexed again.
	 */
	async indexMailboxes(user: User, oldestTimestamp: number): Promise<void> {
		if (!this._mailIndexingEnabled) {
			return
		}

		this.isIndexing = true
		this._indexingCancelled = false

		// FIXME
		// this._core.resetStats()

		await this.infoMessageHandler.onSearchIndexStateUpdate({
			initializing: false,
			mailIndexEnabled: this._mailIndexingEnabled,
			progress: 1,
			currentMailIndexTimestamp: this.currentIndexTimestamp,
			aimedMailIndexTimestamp: oldestTimestamp,
			indexedMailCount: 0,
			failedIndexingUpTo: null,
		})

		const memberships = filterMailMemberships(user)

		// FIXME
		// this._core.queue.pause()

		try {
			const mailBoxes: Array<{ mbox: MailBox; newestTimestamp: number }> = []
			const timestamps = await this.backend.getCurrentIndexTimestamps(memberships.map((ship) => ship.group))

			for (let mailGroupMembership of memberships) {
				const mailGroupId = mailGroupMembership.group

				// FIXME: check that it will be added
				// group data is not available if group has been added. group will be indexed after login.
				const groupTimestamp = timestamps.get(mailGroupId)
				if (groupTimestamp) {
					const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)
					const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
					const newestTimestamp =
						groupTimestamp === NOTHING_INDEXED_TIMESTAMP ? this._dateProvider.getStartOfDayShiftedBy(1).getTime() : groupTimestamp

					if (newestTimestamp > oldestTimestamp) {
						mailBoxes.push({
							mbox: mailbox,
							newestTimestamp,
						})
					}
				}
			}

			if (mailBoxes.length > 0) {
				await this._indexMailLists(mailBoxes, oldestTimestamp)
			}

			// FIXME
			// this._core.printStatus()

			await this.updateCurrentIndexTimestamp(user)

			await this.infoMessageHandler.onSearchIndexStateUpdate({
				initializing: false,
				mailIndexEnabled: this._mailIndexingEnabled,
				progress: 0,
				currentMailIndexTimestamp: this.currentIndexTimestamp,
				aimedMailIndexTimestamp: oldestTimestamp,
				// FIXME
				indexedMailCount: 0,
				// indexedMailCount: this._core._stats.mailcount,
				failedIndexingUpTo: null,
			})
		} catch (e) {
			console.warn("Mail indexing failed: ", e)
			// avoid that a rejected promise is stored
			this.mailboxIndexingPromise = Promise.resolve()
			await this.updateCurrentIndexTimestamp(user)

			// FIXME
			const success = true
			// const success = this._core.isStoppedProcessing() || e instanceof CancelledError

			const failedIndexingUpTo = success ? null : oldestTimestamp

			const error = success ? null : e instanceof ConnectionError ? IndexingErrorReason.ConnectionLost : IndexingErrorReason.Unknown

			await this.infoMessageHandler.onSearchIndexStateUpdate({
				initializing: false,
				mailIndexEnabled: this._mailIndexingEnabled,
				progress: 0,
				currentMailIndexTimestamp: this.currentIndexTimestamp,
				aimedMailIndexTimestamp: oldestTimestamp,
				// FIXME
				indexedMailCount: 0, //this._core._stats.mailcount,
				failedIndexingUpTo,
				error,
			})
		} finally {
			// FIXME
			// this._core.queue.resume()
			this.isIndexing = false
		}
	}

	/** @private visibleForTesting */
	async _indexMailLists(
		mailBoxes: Array<{
			mbox: MailBox
			newestTimestamp: number
		}>,
		oldestTimestamp: number,
	): Promise<void> {
		const newestTimestamp = mailBoxes.reduce((acc, data) => Math.max(acc, data.newestTimestamp), 0)
		const progress = new ProgressMonitor(newestTimestamp - oldestTimestamp, (progress) => {
			this.infoMessageHandler.onSearchIndexStateUpdate({
				initializing: false,
				mailIndexEnabled: this._mailIndexingEnabled,
				progress,
				currentMailIndexTimestamp: this.currentIndexTimestamp,
				aimedMailIndexTimestamp: oldestTimestamp,
				// FIXME
				indexedMailCount: 0, //this._core._stats.mailcount,
				failedIndexingUpTo: null,
			})
		})

		const indexLoader = this.bulkLoaderFactory()

		const mailboxIndexDatas: Array<MboxIndexData> = await promiseMap(mailBoxes, async (mailboxData) => {
			const mailSetListIds = await this.loadMailFolderListIds(mailboxData.mbox)
			return {
				mailSetListDatas: mailSetListIds.map((listId) => {
					return { loadedCompletely: false, lastLoadedId: null, loadedButUnusedEntries: [], listId }
				}),
				newestTimestamp: mailboxData.newestTimestamp,
				ownerGroup: assertNotNull(mailboxData.mbox._ownerGroup),
			}
		})
		return this._indexMailListsInTimeBatches(mailboxIndexDatas, [newestTimestamp, oldestTimestamp], progress, indexLoader)
	}

	// @VisibleForTesting
	async _indexMailListsInTimeBatches(
		mailboxIndexDatas: readonly MboxIndexData[],
		[rangeStart, rangeEnd]: TimeRange,
		progress: ProgressMonitor,
		indexLoader: BulkMailLoader,
	): Promise<void> {
		const mailboxesToWrite = mailboxIndexDatas.filter((mboxData) => rangeEnd < mboxData.newestTimestamp)

		let mailSetEntriesToProcess: MailSetEntry[] = []
		let batchStart = rangeStart

		while (batchStart > rangeEnd && !isEmpty(mailboxesToWrite)) {
			// Make sure that we index up until aligned date and not more, otherwise it stays misaligned for user after changing the time zone once
			const batchEnd = clamp(batchStart - MAIL_INDEX_BATCH_INTERVAL, rangeEnd, batchStart)
			const timeRange: TimeRange = [batchStart, batchEnd]
			const finalIteration = batchEnd <= rangeEnd

			const mailsetLoadTime = await benchmarkFunction(async () => {
				const allMails: MailSetEntry[] = (
					await promiseMap(
						mailboxesToWrite,
						async (mailbox: MboxIndexData) => {
							const mails = await promiseMap(mailbox.mailSetListDatas, (data) => indexLoader.loadMailSetEntriesForTimeRange(data, timeRange), {
								concurrency: 5,
							})
							return mails.flat()
						},
						{ concurrency: 2 },
					)
				).flat()
				mailSetEntriesToProcess.push(...allMails)
			})
			// this._core._stats.preparingTime += mailsetLoadTime

			// If we've reached critical mass (MAIL_INDEXER_CHUNK) or it's the last iteration, process mails.
			if (finalIteration || mailSetEntriesToProcess.length >= MAIL_INDEXER_CHUNK) {
				// const processTime = await benchmarkFunction(async () => {
				// 	const mailData = await this.processIndexMails(mailSetEntriesToProcess, indexLoader)
				// 	// this._core._stats.mailcount += mailData.length
				// })
				const mailData = await this.processIndexMails(mailSetEntriesToProcess, indexLoader)
				// this._core._stats.preparingTime += processTime

				// only write to database if we have collected enough entities, or it's the last iteration
				const indexTimestampPerGroup = new Map(
					mailboxesToWrite.map((data) => [data.ownerGroup, this.isMailboxLoadedCompletely(data) ? FULL_INDEXED_TIMESTAMP : batchEnd]),
				)
				await this.backend.indexMails(indexTimestampPerGroup, mailData)

				mailSetEntriesToProcess = []

				// If there aren't any more mails in a mailbox that we can retrieve, we're done with those.
				findAllAndRemove(mailboxesToWrite, (data) => this.isMailboxLoadedCompletely(data))
			} else {
				// We don't want to keep going if we've cancelled before reaching our threshold
				this.assertNotCancelled("indexMailListsInTimeBatches")
			}

			progress.workDone(batchStart - batchEnd)
			batchStart = batchEnd
		}
	}

	private isMailboxLoadedCompletely(data: MboxIndexData): boolean {
		return data.mailSetListDatas.every((data) => data.loadedCompletely && isEmpty(data.loadedButUnusedEntries))
	}

	private async processIndexMails(
		mailSetEntries: Array<MailSetEntry>,
		indexLoader: BulkMailLoader,
	): Promise<{ mail: Mail; mailDetails: MailDetails; attachments: TutanotaFile[] }[]> {
		this.assertNotCancelled("processIndexMails")
		const mails = await indexLoader.loadMailsFromMultipleLists(mailSetEntries.map((entry) => entry.mail))
		let mailsWithoutErros = mails.filter((m) => !hasError(m))
		console.log(TAG, `processIndexMails ${mails.at(0)?._id.at(0)} ${mails.length}`)
		const mailsWithMailDetails = await indexLoader.loadMailDetails(mailsWithoutErros)
		const files = await indexLoader.loadAttachments(mailsWithoutErros)
		const mailsWithMailDetailsAndFiles = mailsWithMailDetails
			.map((mailTuples) => {
				return {
					mail: mailTuples.mail,
					mailDetails: mailTuples.mailDetails,
					attachments: files.filter((file) => mailTuples.mail.attachments.find((a) => isSameId(a, file._id))),
				}
			})
			.filter(isNotNull)
		console.log(TAG, `processIndexMails done ${mails.at(0)?._id.at(0)} ${mails.length}`)
		return mailsWithMailDetailsAndFiles
	}

	private assertNotCancelled(where: string) {
		if (this._indexingCancelled) throw new CancelledError(`cancelled indexing in ${where}`)
	}

	async updateCurrentIndexTimestamp(user: User): Promise<void> {
		const backend = this.backendFactory(user._id)
		const mailMemberships = filterMailMemberships(user).map((ship) => ship.group)
		const timestamps = await backend.getCurrentIndexTimestamps(mailMemberships)
		this.currentIndexTimestamp = _getCurrentIndexTimestamp(Array.from(timestamps.values()))
	}

	/**
	 * Provides all mail set list ids of the given mailbox
	 */
	private async loadMailFolderListIds(mailbox: MailBox): Promise<Id[]> {
		const mailSets = await this.entityClient.loadAll(MailFolderTypeRef, assertNotNull(mailbox.folders).folders)
		return mailSets.filter(isFolder).map((set) => set.entries)
	}

	private async processImportStateEntityEvents(event: EntityUpdateData): Promise<void> {
		if (!this._mailIndexingEnabled) return
		// we can only process create and update events (create is because of EntityEvent optimization
		// (CREATE + UPDATE = CREATE) which requires us to process CREATE events with imported mails)
		if (event.operation === OperationType.CREATE || event.operation === OperationType.UPDATE) {
			const mailIds: IdTuple[] = await this.loadImportedMailIdsInIndexDateRange([event.instanceListId, event.instanceId])

			const mailData = await this.preloadMails(mailIds)
			for (const singleMailData of mailData) {
				await this.backend.onMailCreated(singleMailData)
			}
		}
	}

	/**
	 * We preload all mails and mail details into the cache in order to prevent loading mails one by one
	 * after importing lots of mails...
	 */
	private async preloadMails(mailIds: IdTuple[]): Promise<MailWithDetailsAndAttachments[]> {
		const indexLoader = this.bulkLoaderFactory()
		const mails = await indexLoader.loadMailsFromMultipleLists(mailIds)
		const mailsWithDetails = await indexLoader.loadMailDetails(mails)
		const attachments = await indexLoader.loadAttachments(mails)
		const attachmentsById = new Map(attachments.map((a) => [getElementId(a), a]))
		return mailsWithDetails.map(({ mail, mailDetails }) => {
			const mailAttachments = mail.attachments.map(([_, elementId]) => attachmentsById.get(elementId)).filter(isNotNull)
			return {
				mail,
				mailDetails,
				attachments: mailAttachments,
			}
		})
	}

	private async loadImportedMailIdsInIndexDateRange(importStateId: IdTuple): Promise<IdTuple[]> {
		const importMailState = await this.entityClient.load(ImportMailStateTypeRef, importStateId)
		const status = parseInt(importMailState.status) as ImportStatus
		if (status !== ImportStatus.Finished && status !== ImportStatus.Canceled) {
			return []
		}
		const importedMailEntries = await this.entityClient.loadAll(ImportedMailTypeRef, importMailState.importedMails)

		if (isEmpty(importedMailEntries)) {
			return []
		}

		const importedMailSetEntryListId = listIdPart(importedMailEntries[0].mailSetEntry)
		// we only want to index mails with a receivedDate newer than the currentIndexTimestamp
		const dateRangeFilteredMailSetEntryIds = importedMailEntries
			.map((importedMail) => elementIdPart(importedMail.mailSetEntry))
			.filter((importedEntry) => deconstructMailSetEntryId(importedEntry).receiveDate.getTime() >= this.currentIndexTimestamp)
		return this.entityClient
			.loadMultiple(MailSetEntryTypeRef, importedMailSetEntryListId, dateRangeFilteredMailSetEntryIds)
			.then((entries) => entries.map((entry) => entry.mail))
	}

	/**
	 * Prepare IndexUpdate in response to the new entity events.
	 */
	async processEntityEvents(events: readonly EntityUpdateData[], _groupId: Id, _batchId: Id): Promise<void> {
		if (!this._mailIndexingEnabled) return Promise.resolve()

		for (const event of events) {
			if (isUpdateForTypeRef(MailTypeRef, event)) {
				const mailId: IdTuple = [event.instanceListId, event.instanceId]
				if (event.operation === OperationType.CREATE) {
					const newMailData = await this.downloadNewMailData(mailId)
					if (newMailData) {
						await this.backend.onMailCreated(newMailData)
					}
				} else if (event.operation === OperationType.UPDATE) {
					const updatedMail = await this.entityClient.load(MailTypeRef, mailId)
					if (updatedMail.state === MailState.DRAFT) {
						const newMailData = await this.downloadNewMailData(mailId)
						if (newMailData) {
							await this.backend.onMailUpdated(newMailData)
						}
					}
				} else if (event.operation === OperationType.DELETE) {
					// FIXME: this should not be called from sqlite backend
					// await this.backend.onMailDeleted(mailId)
				}
			} else if (isUpdateForTypeRef(ImportMailStateTypeRef, event)) {
				await this.processImportStateEntityEvents(event)
			}
		}
	}

	async beforeMailDeleted(mailId: IdTuple) {
		await this.backend.onMailDeleted(mailId)
	}

	private get backend(): MailIndexerBackend {
		return assertNotNull(this._backend)
	}
}

// Given all index timestamps find a common denominator.
// It finds the oldest timestamp among all groups (roughly).
// visibleForTesting
export function _getCurrentIndexTimestamp(groupIndexTimestamps: number[]): number {
	let currentIndexTimestamp = NOTHING_INDEXED_TIMESTAMP
	for (const [index, t] of groupIndexTimestamps.entries()) {
		if (index === 0) {
			currentIndexTimestamp = t
		} else if (t === NOTHING_INDEXED_TIMESTAMP) {
			// skip new group memberships
		} else if (t === FULL_INDEXED_TIMESTAMP && currentIndexTimestamp !== FULL_INDEXED_TIMESTAMP && currentIndexTimestamp !== NOTHING_INDEXED_TIMESTAMP) {
			// skip full index timestamp if this is not the first mail group
		} else if (currentIndexTimestamp === FULL_INDEXED_TIMESTAMP && t !== currentIndexTimestamp) {
			// find the oldest timestamp
			// mail index ist not fully indexed if one of the mailboxes is not fully indexed
			currentIndexTimestamp = t
		} else if (t < currentIndexTimestamp) {
			// set the oldest index timestamp as current timestamp so all mailboxes can index to this timestamp during log in.
			currentIndexTimestamp = t
		}
	}
	return currentIndexTimestamp
}

type TimeRange = [number, number]

interface MailSetListData {
	listId: Id
	lastLoadedId: Id | null
	loadedButUnusedEntries: MailSetEntry[]
	loadedCompletely: boolean
}

export type MboxIndexData = {
	mailSetListDatas: MailSetListData[]
	newestTimestamp: number
	ownerGroup: Id
}
