import {
	FULL_INDEXED_TIMESTAMP,
	ImportStatus,
	MailSetKind,
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
	MailFolder,
	MailFolderTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { ConnectionError, NotAuthorizedError, NotFoundError } from "../../../common/api/common/error/RestError.js"
import { typeModels } from "../../../common/api/entities/tutanota/TypeModels.js"
import { assertNotNull, first, groupBy, isEmpty, isNotNull, neverNull, noOp, ofClass, promiseMap } from "@tutao/tutanota-utils"
import {
	deconstructMailSetEntryId,
	elementIdPart,
	isSameId,
	LEGACY_BCC_RECIPIENTS_ID,
	LEGACY_BODY_ID,
	LEGACY_CC_RECIPIENTS_ID,
	LEGACY_TO_RECIPIENTS_ID,
	listIdPart,
} from "../../../common/api/common/utils/EntityUtils.js"
import {
	_createNewIndexUpdate,
	encryptIndexKeyBase64,
	filterMailMemberships,
	getPerformanceTimestamp,
	htmlToText,
	typeRefToTypeInfo,
} from "../../../common/api/worker/search/IndexUtils.js"
import { Db, GroupData, IndexingErrorReason, IndexUpdate, SearchIndexEntry } from "../../../common/api/worker/search/SearchTypes.js"
import { CancelledError } from "../../../common/api/common/error/CancelledError.js"
import { IndexerCore } from "./IndexerCore.js"
import { DbError } from "../../../common/api/common/error/DbError.js"
import type { DateProvider } from "../../../common/api/worker/DateProvider.js"
import type { EntityUpdate, GroupMembership, User } from "../../../common/api/entities/sys/TypeRefs.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { ProgressMonitor } from "../../../common/api/common/utils/ProgressMonitor.js"
import { InfoMessageHandler } from "../../../common/gui/InfoMessageHandler.js"
import { ElementDataOS, GroupDataOS, Metadata, MetaDataOS } from "../../../common/api/worker/search/IndexTables.js"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { containsEventOfType, EntityUpdateData } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { b64UserIdHash } from "../../../common/api/worker/search/DbFacade.js"
import { hasError } from "../../../common/api/common/utils/ErrorUtils.js"
import { getDisplayedSender, getMailBodyText, MailAddressAndName } from "../../../common/api/common/CommonMailUtils.js"
import { isDraft } from "../../mail/model/MailChecks.js"
import { BulkMailLoader } from "./BulkMailLoader.js"
import { parseKeyVersion } from "../../../common/api/worker/facades/KeyLoaderFacade.js"

export const INITIAL_MAIL_INDEX_INTERVAL_DAYS = 28
const MAIL_INDEX_BATCH_INTERVAL = 1000 * 60 * 60 * 24 // one day

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

	mailIndexingEnabled: boolean
	mailboxIndexingPromise: Promise<void>
	isIndexing: boolean = false
	_indexingCancelled: boolean
	_core: IndexerCore
	_db: Db
	_dateProvider: DateProvider

	constructor(
		core: IndexerCore,
		db: Db,
		private readonly infoMessageHandler: InfoMessageHandler,
		private readonly bulkLoaderFactory: () => BulkMailLoader,
		private readonly entityClient: EntityClient,
		dateProvider: DateProvider,
		private readonly mailFacade: MailFacade,
	) {
		this._core = core
		this._db = db
		this.currentIndexTimestamp = NOTHING_INDEXED_TIMESTAMP
		this.mailIndexingEnabled = false
		this.mailboxIndexingPromise = Promise.resolve()
		this._indexingCancelled = false
		this._dateProvider = dateProvider
	}

	createMailIndexEntries(mail: Mail, mailDetails: MailDetails, files: TutanotaFile[]): Map<string, SearchIndexEntry[]> {
		let startTimeIndex = getPerformanceTimestamp()

		// avoid caching system@tutanota.de since the user wouldn't be searching for this
		let senderToIndex: MailAddressAndName

		const hasSender = mail.sender != null
		if (hasSender) senderToIndex = getDisplayedSender(mail)

		const MailModel = typeModels.Mail
		const MailDetailsModel = typeModels.MailDetails
		const RecipientModel = typeModels.Recipients
		let keyToIndexEntries = this._core.createIndexEntriesForAttributes(mail, [
			{
				attribute: MailModel.values["subject"],
				value: () => mail.subject,
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				attribute: Object.assign({}, RecipientModel.associations["toRecipients"], { id: LEGACY_TO_RECIPIENTS_ID }),
				value: () => mailDetails.recipients.toRecipients.map((r) => r.name + " <" + r.address + ">").join(","),
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				attribute: Object.assign({}, RecipientModel.associations["ccRecipients"], { id: LEGACY_CC_RECIPIENTS_ID }),
				value: () => mailDetails.recipients.ccRecipients.map((r) => r.name + " <" + r.address + ">").join(","),
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				attribute: Object.assign({}, RecipientModel.associations["bccRecipients"], { id: LEGACY_BCC_RECIPIENTS_ID }),
				value: () => mailDetails.recipients.bccRecipients.map((r) => r.name + " <" + r.address + ">").join(","),
			},
			{
				attribute: MailModel.associations["sender"],
				value: () => (hasSender ? senderToIndex.name + " <" + senderToIndex.address + ">" : ""),
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				attribute: Object.assign({}, MailDetailsModel.associations["body"], { id: LEGACY_BODY_ID }),
				value: () => htmlToText(getMailBodyText(mailDetails.body)),
			},
			{
				attribute: MailModel.associations["attachments"],
				value: () => files.map((file) => file.name).join(" "),
			},
		])

		this._core._stats.indexingTime += getPerformanceTimestamp() - startTimeIndex
		return keyToIndexEntries
	}

	processNewMail(mailId: IdTuple): Promise<{
		mail: Mail
		keyToIndexEntries: Map<string, SearchIndexEntry[]>
	} | null> {
		return this.entityClient
			.load(MailTypeRef, mailId)
			.then(async (mail) => {
				let mailDetails: MailDetails
				if (isDraft(mail)) {
					// Will be always there, if it was not updated yet, it will still be set by CryptoFacade
					const mailOwnerEncSessionKey = assertNotNull(mail._ownerEncSessionKey)
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
					// Will be always there, if it was not updated yet it will still be set by CryptoFacade
					const mailOwnerEncSessionKey = assertNotNull(mail._ownerEncSessionKey)
					const mailDetailsBlobId = neverNull(mail.mailDetails)
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
				const files = await this.mailFacade.loadAttachments(mail)
				let keyToIndexEntries = this.createMailIndexEntries(mail, mailDetails, files)
				return {
					mail,
					keyToIndexEntries,
				}
			})
			.catch(
				ofClass(NotFoundError, () => {
					console.log("tried to index non existing mail")
					return null
				}),
			)
			.catch(
				ofClass(NotAuthorizedError, () => {
					console.log("tried to index contact without permission")
					return null
				}),
			)
	}

	processMovedMail(event: EntityUpdate, indexUpdate: IndexUpdate): Promise<void> {
		let encInstanceId = encryptIndexKeyBase64(this._db.key, event.instanceId, this._db.iv)
		return this._db.dbFacade.createTransaction(true, [ElementDataOS]).then((transaction) => {
			return transaction.get(ElementDataOS, encInstanceId).then((elementData) => {
				if (elementData) {
					indexUpdate.move.push({
						encInstanceId,
						newListId: event.instanceListId,
					})
				} else {
					// instance is moved but not yet indexed: handle as new for example moving a mail from non indexed folder like spam to indexed folder
					return this.processNewMail([event.instanceListId, event.instanceId]).then((result) => {
						if (result) {
							this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries, indexUpdate)
						}
					})
				}
			})
		})
	}

	async enableMailIndexing(user: User): Promise<void> {
		const t = await this._db.dbFacade.createTransaction(true, [MetaDataOS])
		const enabled = await t.get(MetaDataOS, Metadata.mailIndexingEnabled)
		if (!enabled) {
			this.mailIndexingEnabled = true
			const t2 = await this._db.dbFacade.createTransaction(false, [MetaDataOS])
			t2.put(MetaDataOS, Metadata.mailIndexingEnabled, true)
			t2.put(MetaDataOS, Metadata.excludedListIds, [])

			// create index in background, termination is handled in Indexer.enableMailIndexing
			const oldestTimestamp = this._dateProvider.getStartOfDayShiftedBy(-INITIAL_MAIL_INDEX_INTERVAL_DAYS).getTime()

			this.indexMailboxes(user, oldestTimestamp).catch(
				ofClass(CancelledError, (e) => {
					console.log("cancelled initial indexing", e)
				}),
			)
			return t2.wait()
		} else {
			return t.get(MetaDataOS, Metadata.excludedListIds).then((excludedListIds) => {
				this.mailIndexingEnabled = true
			})
		}
	}

	disableMailIndexing(userId: Id): Promise<void> {
		this.mailIndexingEnabled = false
		this._indexingCancelled = true
		return this._db.dbFacade.deleteDatabase(b64UserIdHash(userId))
	}

	cancelMailIndexing(): Promise<void> {
		this._indexingCancelled = true
		return Promise.resolve()
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
		if (!this.mailIndexingEnabled) {
			return Promise.resolve()
		}

		this.isIndexing = true
		this._indexingCancelled = false

		this._core.resetStats()

		await this.infoMessageHandler.onSearchIndexStateUpdate({
			initializing: false,
			mailIndexEnabled: this.mailIndexingEnabled,
			progress: 1,
			currentMailIndexTimestamp: this.currentIndexTimestamp,
			aimedMailIndexTimestamp: oldestTimestamp,
			indexedMailCount: 0,
			failedIndexingUpTo: null,
		})

		let memberships = filterMailMemberships(user)

		this._core.queue.pause()

		try {
			const mailBoxes: Array<{ mbox: MailBox; newestTimestamp: number }> = []

			for (let mailGroupMembership of memberships) {
				let mailGroupId = mailGroupMembership.group
				const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)
				const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)

				const transaction = await this._db.dbFacade.createTransaction(true, [GroupDataOS])
				const groupData = await transaction.get(GroupDataOS, mailGroupId)

				// group data is not available if group has been added. group will be indexed after login.
				if (groupData) {
					const newestTimestamp =
						groupData.indexTimestamp === NOTHING_INDEXED_TIMESTAMP
							? this._dateProvider.getStartOfDayShiftedBy(1).getTime()
							: groupData.indexTimestamp

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

			this._core.printStatus()

			await this.updateCurrentIndexTimestamp(user)

			await this.infoMessageHandler.onSearchIndexStateUpdate({
				initializing: false,
				mailIndexEnabled: this.mailIndexingEnabled,
				progress: 0,
				currentMailIndexTimestamp: this.currentIndexTimestamp,
				aimedMailIndexTimestamp: oldestTimestamp,
				indexedMailCount: this._core._stats.mailcount,
				failedIndexingUpTo: null,
			})
		} catch (e) {
			console.warn("Mail indexing failed: ", e)
			// avoid that a rejected promise is stored
			this.mailboxIndexingPromise = Promise.resolve()
			await this.updateCurrentIndexTimestamp(user)

			const success = this._core.isStoppedProcessing() || e instanceof CancelledError

			const failedIndexingUpTo = success ? null : oldestTimestamp

			const error = success ? null : e instanceof ConnectionError ? IndexingErrorReason.ConnectionLost : IndexingErrorReason.Unknown

			await this.infoMessageHandler.onSearchIndexStateUpdate({
				initializing: false,
				mailIndexEnabled: this.mailIndexingEnabled,
				progress: 0,
				currentMailIndexTimestamp: this.currentIndexTimestamp,
				aimedMailIndexTimestamp: oldestTimestamp,
				indexedMailCount: this._core._stats.mailcount,
				failedIndexingUpTo,
				error,
			})
		} finally {
			this._core.queue.resume()
			this.isIndexing = false
		}
	}

	_indexMailLists(
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
				mailIndexEnabled: this.mailIndexingEnabled,
				progress,
				currentMailIndexTimestamp: this.currentIndexTimestamp,
				aimedMailIndexTimestamp: oldestTimestamp,
				indexedMailCount: this._core._stats.mailcount,
				failedIndexingUpTo: null,
			})
		})

		const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))

		const indexLoader = this.bulkLoaderFactory()

		return promiseMap(mailBoxes, (mBoxData) => {
			return this._loadMailListIds(mBoxData.mbox).then((mailListIds) => {
				return {
					mailListIds,
					newestTimestamp: mBoxData.newestTimestamp,
					ownerGroup: neverNull(mBoxData.mbox._ownerGroup),
				}
			})
		}).then((mailboxData) => this._indexMailListsInTimeBatches(mailboxData, [newestTimestamp, oldestTimestamp], indexUpdate, progress, indexLoader))
	}

	_processedEnough(indexUpdate: IndexUpdate): boolean {
		return indexUpdate.create.encInstanceIdToElementData.size > 500
	}

	_indexMailListsInTimeBatches(
		dataPerMailbox: Array<MboxIndexData>,
		timeRange: TimeRange,
		indexUpdate: IndexUpdate,
		progress: ProgressMonitor,
		indexLoader: BulkMailLoader,
	): Promise<void> {
		const [rangeStart, rangeEnd] = timeRange
		let batchEnd = rangeStart - MAIL_INDEX_BATCH_INTERVAL

		// Make sure that we index up until aligned date and not more, otherwise it stays misaligned for user after changing the time zone once
		if (batchEnd < rangeEnd) {
			batchEnd = rangeEnd
		}

		const mailboxesToWrite = dataPerMailbox.filter((mboxData) => batchEnd < mboxData.newestTimestamp)
		const batchRange = [rangeStart, batchEnd] as TimeRange

		// rangeStart is what we have indexed at the previous step. If it's equals to rangeEnd then we're done.
		// If it's less then we overdid a little bit but we've covered the range and we will write down rangeStart so
		// we will continue from it next time.
		if (rangeStart <= rangeEnd) {
			// all ranges have been processed
			const indexTimestampPerGroup = mailboxesToWrite.map((data) => ({
				groupId: data.ownerGroup,
				indexTimestamp: data.mailListIds.length === 0 ? FULL_INDEXED_TIMESTAMP : rangeStart,
			}))
			return this._writeIndexUpdate(indexTimestampPerGroup, indexUpdate).then(() => {
				progress.workDone(rangeStart - batchEnd)
			})
		}

		return this._prepareMailDataForTimeBatch(mailboxesToWrite, batchRange, indexUpdate, indexLoader).then(() => {
			const nextRange = [batchEnd, rangeEnd] as TimeRange

			if (this._processedEnough(indexUpdate)) {
				// only write to database if we have collected enough entities
				const indexTimestampPerGroup = mailboxesToWrite.map((data) => ({
					groupId: data.ownerGroup,
					indexTimestamp: data.mailListIds.length === 0 ? FULL_INDEXED_TIMESTAMP : batchEnd,
				}))
				return this._writeIndexUpdate(indexTimestampPerGroup, indexUpdate).then(() => {
					progress.workDone(rangeStart - batchEnd)

					const newIndexUpdate = _createNewIndexUpdate(indexUpdate.typeInfo)

					return this._indexMailListsInTimeBatches(dataPerMailbox, nextRange, newIndexUpdate, progress, indexLoader)
				})
			} else {
				progress.workDone(rangeStart - batchEnd)
				return this._indexMailListsInTimeBatches(dataPerMailbox, nextRange, indexUpdate, progress, indexLoader)
			}
		})
	}

	/**
	 * @return Number of processed emails?
	 * @private
	 */
	async _prepareMailDataForTimeBatch(
		mboxDataList: Array<MboxIndexData>,
		timeRange: TimeRange,
		indexUpdate: IndexUpdate,
		indexLoader: BulkMailLoader,
	): Promise<void> {
		const startTimeLoad = getPerformanceTimestamp()
		return promiseMap(
			mboxDataList,
			(mboxData) => {
				return promiseMap(
					mboxData.mailListIds.slice(),
					async (listId) => {
						// We use caching here because we may load same emails twice
						const { elements: mails, loadedCompletely } = await indexLoader.loadMailsInRangeWithCache(listId, timeRange)
						// If we loaded mail list completely, don't try to load from it anymore
						if (loadedCompletely) {
							mboxData.mailListIds.splice(mboxData.mailListIds.indexOf(listId), 1)
						}

						this._core._stats.mailcount += mails.length
						// Remove all processed entities from cache
						await Promise.all(mails.map((m) => indexLoader.removeFromCache(m._id)))
						return this._processIndexMails(mails, indexUpdate, indexLoader)
					},
					{
						concurrency: 2,
					},
				)
			},
			{
				concurrency: 5,
			},
		).then(() => {
			this._core._stats.preparingTime += getPerformanceTimestamp() - startTimeLoad
		})
	}

	async _processIndexMails(mails: Array<Mail>, indexUpdate: IndexUpdate, indexLoader: BulkMailLoader): Promise<number> {
		if (this._indexingCancelled) throw new CancelledError("cancelled indexing in processing index mails")
		let mailsWithoutErros = mails.filter((m) => !hasError(m))
		const mailsWithMailDetails = await indexLoader.loadMailDetails(mailsWithoutErros)
		const files = await indexLoader.loadAttachments(mailsWithoutErros)
		const mailsWithMailDetailsAndFiles = mailsWithMailDetails
			.map((mailTuples) => {
				return {
					mail: mailTuples.mail,
					mailDetails: mailTuples.mailDetails,
					files: files.filter((file) => mailTuples.mail.attachments.find((a) => isSameId(a, file._id))),
				}
			})
			.filter(isNotNull)
		for (const element of mailsWithMailDetailsAndFiles) {
			let keyToIndexEntries = this.createMailIndexEntries(element.mail, element.mailDetails, element.files)

			this._core.encryptSearchIndexEntries(element.mail._id, neverNull(element.mail._ownerGroup), keyToIndexEntries, indexUpdate)
		}
		return mailsWithMailDetailsAndFiles.length
	}

	_writeIndexUpdate(
		dataPerGroup: Array<{
			groupId: Id
			indexTimestamp: number
		}>,
		indexUpdate: IndexUpdate,
	): Promise<void> {
		return this._core.writeIndexUpdate(dataPerGroup, indexUpdate)
	}

	updateCurrentIndexTimestamp(user: User): Promise<void> {
		return this._db.dbFacade
			.createTransaction(true, [GroupDataOS])
			.then((t) => {
				return Promise.all(
					filterMailMemberships(user).map((mailGroupMembership) => {
						return t.get(GroupDataOS, mailGroupMembership.group).then((groupData: GroupData | null) => {
							if (!groupData) {
								return NOTHING_INDEXED_TIMESTAMP
							} else {
								return groupData.indexTimestamp
							}
						})
					}),
				).then((groupIndexTimestamps) => {
					this.currentIndexTimestamp = _getCurrentIndexTimestamp(groupIndexTimestamps)
				})
			})
			.catch((err) => {
				if (err instanceof DbError && this._core.isStoppedProcessing()) {
					console.log("The database was closed, do not write currentIndexTimestamp")
				}
			})
	}

	/**
	 * Provides all mail list ids of the given mailbox
	 */
	async _loadMailListIds(mailbox: MailBox): Promise<Id[]> {
		const isMailsetMigrated = mailbox.currentMailBag != null
		if (isMailsetMigrated) {
			return [mailbox.currentMailBag!, ...mailbox.archivedMailBags].map((mailbag) => mailbag.mails)
		} else {
			const folders = await this.entityClient.loadAll(MailFolderTypeRef, neverNull(mailbox.folders).folders)
			return folders.map((f) => f.mails)
		}
	}

	_getSpamFolder(mailGroup: GroupMembership): Promise<MailFolder> {
		return this.entityClient
			.load(MailboxGroupRootTypeRef, mailGroup.group)
			.then((mailGroupRoot) => this.entityClient.load(MailBoxTypeRef, mailGroupRoot.mailbox))
			.then((mbox) => {
				return this.entityClient
					.loadAll(MailFolderTypeRef, neverNull(mbox.folders).folders)
					.then((folders) => neverNull(folders.find((folder) => folder.folderType === MailSetKind.SPAM)))
			})
	}

	async processImportStateEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id, indexUpdate: IndexUpdate): Promise<void> {
		if (!this.mailIndexingEnabled) return Promise.resolve()
		await promiseMap(events, async (event) => {
			// we can only process create and update events (create is because of EntityEvent optimization
			// (CREATE + UPDATE = CREATE) which requires us to process CREATE events with imported mails)
			if (event.operation === OperationType.CREATE || event.operation === OperationType.UPDATE) {
				let mailIds: IdTuple[] = await this.loadImportedMailIdsInIndexDateRange([event.instanceListId, event.instanceId])

				await this.preloadMails(mailIds)

				return await promiseMap(mailIds, (mailId) =>
					this.processNewMail(mailId).then((result) => {
						if (result) {
							this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries, indexUpdate)
						}
					}),
				)
			}
		})
	}

	/**
	 * We preload all mails and mail details into the cache in order to prevent loading mails one by one
	 * after importing lots of mails...
	 */
	private async preloadMails(mailIds: IdTuple[]) {
		const mailsByList = groupBy(mailIds, (m) => listIdPart(m))
		let mails: Array<Mail> = []
		for (const [listId, mailIds] of mailsByList.entries()) {
			const mailElementIds = mailIds.map((m) => elementIdPart(m))
			mails = mails.concat(await this.entityClient.loadMultiple(MailTypeRef, listId, mailElementIds))
		}
		const indexLoader = this.bulkLoaderFactory()
		await indexLoader.loadMailDetails(mails)
		await indexLoader.loadAttachments(mails)
	}

	async loadImportedMailIdsInIndexDateRange(importStateId: IdTuple): Promise<IdTuple[]> {
		const importMailState = await this.entityClient.load(ImportMailStateTypeRef, importStateId)
		let status = parseInt(importMailState.status) as ImportStatus
		if (status !== ImportStatus.Finished && status !== ImportStatus.Canceled) {
			return Promise.resolve([])
		}
		let importedMailEntries = await this.entityClient.loadAll(ImportedMailTypeRef, importMailState.importedMails)

		if (isEmpty(importedMailEntries)) {
			return Promise.resolve([])
		}

		let importedMailSetEntryListId = listIdPart(importedMailEntries[0].mailSetEntry)
		// we only want to index mails with a receivedDate newer than the currentIndexTimestamp
		let dateRangeFilteredMailSetEntryIds = importedMailEntries
			.map((importedMail) => elementIdPart(importedMail.mailSetEntry))
			.filter((importedEntry) => deconstructMailSetEntryId(importedEntry).receiveDate.getTime() >= this.currentIndexTimestamp)
		return this.entityClient
			.loadMultiple(MailSetEntryTypeRef, importedMailSetEntryListId, dateRangeFilteredMailSetEntryIds)
			.then((entries) => entries.map((entry) => entry.mail))
	}

	/**
	 * Prepare IndexUpdate in response to the new entity events.
	 * {@see MailIndexerTest.js}
	 * @param events Events from one batch
	 * @param groupId
	 * @param batchId
	 * @param indexUpdate which will be populated with operations
	 * @returns {Promise<*>} Indication that we're done.
	 */
	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id, indexUpdate: IndexUpdate): Promise<void> {
		if (!this.mailIndexingEnabled) return Promise.resolve()
		return promiseMap(events, (event) => {
			const mailId: IdTuple = [event.instanceListId, event.instanceId]
			if (event.operation === OperationType.CREATE) {
				if (containsEventOfType(events as readonly EntityUpdateData[], OperationType.DELETE, event.instanceId)) {
					// do not execute move operation if there is a delete event or another move event.
					return this.processMovedMail(event, indexUpdate)
				} else {
					return this.processNewMail(mailId).then((result) => {
						if (result) {
							this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries, indexUpdate)
						}
					})
				}
			} else if (event.operation === OperationType.UPDATE) {
				return this.entityClient
					.load(MailTypeRef, [event.instanceListId, event.instanceId])
					.then((mail) => {
						if (mail.state === MailState.DRAFT) {
							return Promise.all([
								this._core._processDeleted(event, indexUpdate),
								this.processNewMail(mailId).then((result) => {
									if (result) {
										this._core.encryptSearchIndexEntries(
											result.mail._id,
											neverNull(result.mail._ownerGroup),
											result.keyToIndexEntries,
											indexUpdate,
										)
									}
								}),
							])
						}
					})
					.catch(ofClass(NotFoundError, () => console.log("tried to index update event for non existing mail")))
			} else if (event.operation === OperationType.DELETE) {
				if (!containsEventOfType(events as readonly EntityUpdateData[], OperationType.CREATE, event.instanceId)) {
					// Check that this is *not* a move event. Move events are handled separately.
					return this._core._processDeleted(event, indexUpdate)
				}
			}
		}).then(noOp)
	}
}

// export just for testing
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
type MboxIndexData = {
	mailListIds: Array<Id>
	newestTimestamp: number
	ownerGroup: Id
}
