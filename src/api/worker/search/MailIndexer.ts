import { FULL_INDEXED_TIMESTAMP, MailFolderType, MailState, NOTHING_INDEXED_TIMESTAMP, OperationType } from "../../common/TutanotaConstants"
import type { File as TutanotaFile, Mail, MailBox, MailFolder } from "../../entities/tutanota/TypeRefs.js"
import {
	File,
	FileTypeRef,
	MailBodyTypeRef,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetailsBlobTypeRef,
	MailDetailsDraftTypeRef,
	MailFolderTypeRef,
	MailTypeRef,
} from "../../entities/tutanota/TypeRefs.js"
import { ConnectionError, NotAuthorizedError, NotFoundError } from "../../common/error/RestError"
import { typeModels } from "../../entities/tutanota/TypeModels"
import { assertNotNull, first, groupBy, groupByAndMap, isNotNull, neverNull, noOp, ofClass, promiseMap, splitInChunks, TypeRef } from "@tutao/tutanota-utils"
import { elementIdPart, isSameId, listIdPart, timestampToGeneratedId } from "../../common/utils/EntityUtils"
import { _createNewIndexUpdate, encryptIndexKeyBase64, filterMailMemberships, getPerformanceTimestamp, htmlToText, typeRefToTypeInfo } from "./IndexUtils"
import type { Db, GroupData, IndexUpdate, SearchIndexEntry } from "./SearchTypes"
import { IndexingErrorReason } from "./SearchTypes"
import { CancelledError } from "../../common/error/CancelledError"
import { IndexerCore } from "./IndexerCore"
import { DbError } from "../../common/error/DbError"
import { DefaultEntityRestCache } from "../rest/DefaultEntityRestCache.js"
import type { DateProvider } from "../DateProvider"
import type { EntityUpdate, GroupMembership, User } from "../../entities/sys/TypeRefs.js"
import { EntityRestClient, OwnerEncSessionKeyProvider } from "../rest/EntityRestClient"
import { EntityClient } from "../../common/EntityClient"
import { ProgressMonitor } from "../../common/utils/ProgressMonitor"
import type { SomeEntity } from "../../common/EntityTypes"
import { isDetailsDraft, isLegacyMail, MailWrapper } from "../../common/MailWrapper.js"
import { EphemeralCacheStorage } from "../rest/EphemeralCacheStorage"
import { InfoMessageHandler } from "../../../gui/InfoMessageHandler.js"
import { ElementDataOS, GroupDataOS, Metadata, MetaDataOS } from "./IndexTables.js"
import { MailFacade } from "../facades/lazy/MailFacade.js"
import { getDisplayedSender, MailAddressAndName } from "../../common/mail/CommonMailUtils.js"
import { containsEventOfType, EntityUpdateData } from "../../common/utils/EntityUpdateUtils.js"
import { b64UserIdHash } from "./DbFacade.js"
import { hasError } from "../../common/utils/ErrorUtils.js"

export const INITIAL_MAIL_INDEX_INTERVAL_DAYS = 28
const ENTITY_INDEXER_CHUNK = 20
export const MAIL_INDEXER_CHUNK = 100
const MAIL_INDEX_BATCH_INTERVAL = 1000 * 60 * 60 * 24 // one day

export class MailIndexer {
	currentIndexTimestamp: number // The oldest timestamp that has been indexed for all mail lists

	mailIndexingEnabled: boolean
	mailboxIndexingPromise: Promise<void>
	isIndexing: boolean = false
	_indexingCancelled: boolean
	_excludedListIds: Id[]
	_core: IndexerCore
	_db: Db
	_entityRestClient: EntityRestClient
	_defaultCachingEntityRestClient: DefaultEntityRestCache
	_defaultCachingEntity: EntityClient
	_dateProvider: DateProvider

	private isUsingOfflineCache = false

	constructor(
		core: IndexerCore,
		db: Db,
		private readonly infoMessageHandler: InfoMessageHandler,
		entityRestClient: EntityRestClient,
		defaultCachingRestClient: DefaultEntityRestCache,
		dateProvider: DateProvider,
		private readonly mailFacade: MailFacade,
	) {
		this._core = core
		this._db = db
		this._defaultCachingEntityRestClient = defaultCachingRestClient
		this._defaultCachingEntity = new EntityClient(defaultCachingRestClient)
		this.currentIndexTimestamp = NOTHING_INDEXED_TIMESTAMP
		this.mailIndexingEnabled = false
		this.mailboxIndexingPromise = Promise.resolve()
		this._indexingCancelled = false
		this._excludedListIds = []
		this._entityRestClient = entityRestClient
		this._dateProvider = dateProvider
	}

	setIsUsingOfflineCache(isUsing: boolean) {
		this.isUsingOfflineCache = isUsing
	}

	createMailIndexEntries(mailWrapper: MailWrapper, files: File[]): Map<string, SearchIndexEntry[]> {
		let startTimeIndex = getPerformanceTimestamp()
		const mail = mailWrapper.getMail()

		// avoid caching system@tutanota.de since the user wouldn't be searching for this
		let senderToIndex: MailAddressAndName

		const hasSender = mail.sender != null
		if (hasSender) senderToIndex = getDisplayedSender(mail)

		const MailModel = typeModels.Mail
		let keyToIndexEntries = this._core.createIndexEntriesForAttributes(mail, [
			{
				attribute: MailModel.values["subject"],
				value: () => mail.subject,
			},
			{
				attribute: MailModel.associations["toRecipients"],
				value: () =>
					mailWrapper
						.getToRecipients()
						.map((r) => r.name + " <" + r.address + ">")
						.join(","),
			},
			{
				attribute: MailModel.associations["ccRecipients"],
				value: () =>
					mailWrapper
						.getCcRecipients()
						.map((r) => r.name + " <" + r.address + ">")
						.join(","),
			},
			{
				attribute: MailModel.associations["bccRecipients"],
				value: () =>
					mailWrapper
						.getBccRecipients()
						.map((r) => r.name + " <" + r.address + ">")
						.join(","),
			},
			{
				attribute: MailModel.associations["sender"],
				value: () => (hasSender ? senderToIndex.name + " <" + senderToIndex.address + ">" : ""),
			},
			{
				attribute: MailModel.associations["body"],
				// Sometimes we encounter inconsistencies such as when deleted emails appear again
				value: () => htmlToText(mailWrapper.getMailBodyText()),
			},
			{
				attribute: MailModel.associations["attachments"],
				value: () => files.map((file) => file.name).join(" "),
			},
		])

		this._core._stats.indexingTime += getPerformanceTimestamp() - startTimeIndex
		return keyToIndexEntries
	}

	processNewMail(event: EntityUpdate): Promise<{
		mail: Mail
		keyToIndexEntries: Map<string, SearchIndexEntry[]>
	} | null> {
		if (this._isExcluded(event)) {
			return Promise.resolve(null)
		}

		return this._defaultCachingEntity
			.load(MailTypeRef, [event.instanceListId, event.instanceId])
			.then(async (mail) => {
				let mailWrapper: MailWrapper
				if (isLegacyMail(mail)) {
					mailWrapper = await this._defaultCachingEntity.load(MailBodyTypeRef, neverNull(mail.body)).then((b) => MailWrapper.body(mail, b))
				} else if (isDetailsDraft(mail)) {
					// Will be always there, if it was not updated yet it will still be set by CryptoFacade
					const mailOwnerEncSessionKey = assertNotNull(mail._ownerEncSessionKey)
					const mailDetailsDraftId = assertNotNull(mail.mailDetailsDraft)
					mailWrapper = await this._defaultCachingEntity
						.loadMultiple(MailDetailsDraftTypeRef, listIdPart(mailDetailsDraftId), [elementIdPart(mailDetailsDraftId)], async () => ({
							key: mailOwnerEncSessionKey,
							encryptingKeyVersion: Number(mail._ownerKeyVersion),
						}))
						.then((d) => {
							const draft = first(d)
							if (draft == null) {
								throw new NotFoundError(`MailDetailsDraft ${mailDetailsDraftId}`)
							}
							return MailWrapper.details(mail, draft.details)
						})
				} else {
					// Will be always there, if it was not updated yet it will still be set by CryptoFacade
					const mailOwnerEncSessionKey = assertNotNull(mail._ownerEncSessionKey)
					const mailDetailsBlobId = neverNull(mail.mailDetails)
					mailWrapper = await this._defaultCachingEntity
						.loadMultiple(MailDetailsBlobTypeRef, listIdPart(mailDetailsBlobId), [elementIdPart(mailDetailsBlobId)], async () => ({
							key: mailOwnerEncSessionKey,
							encryptingKeyVersion: Number(mail._ownerKeyVersion),
						}))
						.then((d) => {
							const blob = first(d)
							if (blob == null) {
								throw new NotFoundError(`MailDetailsBlob ${mailDetailsBlobId}`)
							}
							return MailWrapper.details(mail, blob.details)
						})
				}
				const files = await this.mailFacade.loadAttachments(mail)
				let keyToIndexEntries = this.createMailIndexEntries(mailWrapper, files)
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
					if (this._isExcluded(event)) {
						return this._core._processDeleted(event, indexUpdate) // move to spam folder
					} else {
						indexUpdate.move.push({
							encInstanceId,
							newListId: event.instanceListId,
						})
					}
				} else {
					// instance is moved but not yet indexed: handle as new for example moving a mail from non indexed folder like spam to indexed folder
					return this.processNewMail(event).then((result) => {
						if (result) {
							this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries, indexUpdate)
						}
					})
				}
			})
		})
	}

	enableMailIndexing(user: User): Promise<void> {
		return this._db.dbFacade.createTransaction(true, [MetaDataOS]).then((t) => {
			return t.get(MetaDataOS, Metadata.mailIndexingEnabled).then((enabled) => {
				if (!enabled) {
					return promiseMap(filterMailMemberships(user), (mailGroupMembership) => this._getSpamFolder(mailGroupMembership)).then((spamFolders) => {
						this._excludedListIds = spamFolders.map((folder) => folder.mails)
						this.mailIndexingEnabled = true
						return this._db.dbFacade.createTransaction(false, [MetaDataOS]).then((t2) => {
							t2.put(MetaDataOS, Metadata.mailIndexingEnabled, true)
							t2.put(MetaDataOS, Metadata.excludedListIds, this._excludedListIds)

							// create index in background, termination is handled in Indexer.enableMailIndexing
							const oldestTimestamp = this._dateProvider.getStartOfDayShiftedBy(-INITIAL_MAIL_INDEX_INTERVAL_DAYS).getTime()

							this.indexMailboxes(user, oldestTimestamp).catch(
								ofClass(CancelledError, (e) => {
									console.log("cancelled initial indexing", e)
								}),
							)
							return t2.wait()
						})
					})
				} else {
					return t.get(MetaDataOS, Metadata.excludedListIds).then((excludedListIds) => {
						this.mailIndexingEnabled = true
						this._excludedListIds = excludedListIds || []
					})
				}
			})
		})
	}

	disableMailIndexing(userId: Id): Promise<void> {
		this.mailIndexingEnabled = false
		this._indexingCancelled = true
		this._excludedListIds = []
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
	 * Indexes all mailboxes of the given user up to the endIndexTimestamp if mail indexing is enabled. If the mailboxes are already fully indexed, they are not indexed again.
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
				const mailboxGroupRoot = await this._defaultCachingEntity.load(MailboxGroupRootTypeRef, mailGroupId)
				const mailbox = await this._defaultCachingEntity.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)

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

	_indexMailLists(mailBoxes: Array<{ mbox: MailBox; newestTimestamp: number }>, oldestTimestamp: number): Promise<void> {
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

		const indexLoader = new IndexLoader(this._entityRestClient, this._defaultCachingEntityRestClient, this.isUsingOfflineCache)

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
		indexLoader: IndexLoader,
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
		indexLoader: IndexLoader,
	): Promise<void> {
		const startTimeLoad = getPerformanceTimestamp()
		return promiseMap(
			mboxDataList,
			(mboxData) => {
				return promiseMap(
					mboxData.mailListIds.slice(),
					async (listId) => {
						// We use caching here because we may load same emails twice
						const { elements: mails, loadedCompletely } = await indexLoader.loadMailsWithCache(listId, timeRange)
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

	async _processIndexMails(mails: Array<Mail>, indexUpdate: IndexUpdate, indexLoader: IndexLoader): Promise<number> {
		if (this._indexingCancelled) throw new CancelledError("cancelled indexing in processing index mails")
		const detailsList = await indexLoader.loadMailDetails(mails)
		const files = await indexLoader.loadAttachments(detailsList)
		const mailWithBodyAndFiles = detailsList
			.map((mailWrapper) => {
				const mail = mailWrapper.getMail()
				return {
					mail: mail,
					mailWrapper: mailWrapper,
					files: files.filter((file) => mail.attachments.find((a) => isSameId(a, file._id))),
				}
			})
			.filter(isNotNull)
		for (const element of mailWithBodyAndFiles) {
			let keyToIndexEntries = this.createMailIndexEntries(element.mailWrapper, element.files)

			this._core.encryptSearchIndexEntries(element.mail._id, neverNull(element.mail._ownerGroup), keyToIndexEntries, indexUpdate)
		}
		return mailWithBodyAndFiles.length
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

	_isExcluded(event: EntityUpdate): boolean {
		return this._excludedListIds.indexOf(event.instanceListId) !== -1
	}

	/**
	 * Provides all non-excluded mail list ids of the given mailbox
	 */
	async _loadMailListIds(mailbox: MailBox): Promise<Id[]> {
		const folders = await this._defaultCachingEntity.loadAll(MailFolderTypeRef, neverNull(mailbox.folders).folders)
		const mailListIds: Id[] = []

		for (const folder of folders) {
			if (!this._excludedListIds.includes(folder.mails)) {
				mailListIds.push(folder.mails)
			}
		}

		return mailListIds
	}

	_getSpamFolder(mailGroup: GroupMembership): Promise<MailFolder> {
		return this._defaultCachingEntity
			.load(MailboxGroupRootTypeRef, mailGroup.group)
			.then((mailGroupRoot) => this._defaultCachingEntity.load(MailBoxTypeRef, mailGroupRoot.mailbox))
			.then((mbox) => {
				return this._defaultCachingEntity
					.loadAll(MailFolderTypeRef, neverNull(mbox.folders).folders)
					.then((folders) => neverNull(folders.find((folder) => folder.folderType === MailFolderType.SPAM)))
			})
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
			if (event.operation === OperationType.CREATE) {
				if (containsEventOfType(events as readonly EntityUpdateData[], OperationType.DELETE, event.instanceId)) {
					// do not execute move operation if there is a delete event or another move event.
					return this.processMovedMail(event, indexUpdate)
				} else {
					return this.processNewMail(event).then((result) => {
						if (result) {
							this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries, indexUpdate)
						}
					})
				}
			} else if (event.operation === OperationType.UPDATE) {
				return this._defaultCachingEntity
					.load(MailTypeRef, [event.instanceListId, event.instanceId])
					.then((mail) => {
						if (mail.state === MailState.DRAFT) {
							return Promise.all([
								this._core._processDeleted(event, indexUpdate),
								this.processNewMail(event).then((result) => {
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

class IndexLoader {
	private readonly entityCache: DefaultEntityRestCache
	// modified in tests
	_entity: EntityClient
	private readonly cachingEntity: EntityClient

	constructor(restClient: EntityRestClient, cachingEntityClient: DefaultEntityRestCache, private isUsingOfflineCache: boolean) {
		if (isUsingOfflineCache) {
			this.entityCache = cachingEntityClient
			this._entity = new EntityClient(cachingEntityClient)
		} else {
			cachingEntityClient = new DefaultEntityRestCache(restClient, new EphemeralCacheStorage())
			this._entity = new EntityClient(restClient)
		}
		this.entityCache = cachingEntityClient
		this.cachingEntity = new EntityClient(this.entityCache)
	}

	loadMailsWithCache(
		mailListId: Id,
		[rangeStart, rangeEnd]: TimeRange,
	): Promise<{
		elements: Array<Mail>
		loadedCompletely: boolean
	}> {
		return this.cachingEntity.loadReverseRangeBetween(
			MailTypeRef,
			mailListId,
			timestampToGeneratedId(rangeStart),
			timestampToGeneratedId(rangeEnd),
			MAIL_INDEXER_CHUNK,
		)
	}

	async removeFromCache(id: IdTuple): Promise<void> {
		if (!this.isUsingOfflineCache) {
			return this.entityCache.deleteFromCacheIfExists(MailTypeRef, listIdPart(id), elementIdPart(id))
		}
	}

	async loadMailDetails(mails: Mail[]): Promise<MailWrapper[]> {
		const result: Array<MailWrapper> = []
		let mailsWithoutErros = mails.filter((m) => !hasError(m))
		//legacy mails
		const legacyMails = mailsWithoutErros.filter((m) => isLegacyMail(m))
		const bodyIds = legacyMails.map((m) => assertNotNull(m.body))
		result.push(
			...(await this.loadInChunks(MailBodyTypeRef, null, bodyIds)).map((body) => {
				const mail = assertNotNull(legacyMails.find((m) => m.body === body._id))
				return MailWrapper.body(mail, body)
			}),
		)
		// mailDetails stored as blob
		let mailDetailsBlobMails = mailsWithoutErros.filter((m) => !isLegacyMail(m) && !isDetailsDraft(m))
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
					encryptingKeyVersion: Number(mail._ownerKeyVersion),
				}
			}
			const mailDetailsBlobs = await this.loadInChunks(MailDetailsBlobTypeRef, listId, ids, ownerEncSessionKeyProvider)
			result.push(
				...mailDetailsBlobs.map((mailDetailsBlob) => {
					const mail = assertNotNull(mailDetailsBlobMails.find((m) => isSameId(m.mailDetails, mailDetailsBlob._id)))
					return MailWrapper.details(mail, mailDetailsBlob.details)
				}),
			)
		}
		// mailDetails stored in db (draft)
		let mailDetailsDraftMails = mailsWithoutErros.filter((m) => isDetailsDraft(m))
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
					encryptingKeyVersion: Number(mail._ownerKeyVersion),
				}
			}
			const mailDetailsDrafts = await this.loadInChunks(MailDetailsDraftTypeRef, listId, ids, ownerEncSessionKeyProvider)
			result.push(
				...mailDetailsDrafts.map((draftDetails) => {
					const mail = assertNotNull(mailDetailsDraftMails.find((m) => isSameId(m.mailDetailsDraft, draftDetails._id)))
					return MailWrapper.details(mail, draftDetails.details)
				}),
			)
		}
		return result
	}

	loadAttachments(detailsList: MailWrapper[]): Promise<TutanotaFile[]> {
		const attachmentIds: IdTuple[] = []
		for (const d of detailsList) {
			attachmentIds.push(...d.getAttachmentIds())
		}
		const filesByList = groupBy(attachmentIds, (a) => a[0])
		const fileLoadingPromises: Array<Promise<Array<TutanotaFile>>> = []
		for (const [listId, fileIds] of filesByList.entries()) {
			fileLoadingPromises.push(
				this.loadInChunks(
					FileTypeRef,
					listId,
					fileIds.map((f) => f[1]),
				),
			)
		}
		// if (this._indexingCancelled) throw new CancelledError("cancelled indexing in loading attachments")
		return Promise.all(fileLoadingPromises).then((filesResults: TutanotaFile[][]) => filesResults.flat())
	}

	private loadInChunks<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		ids: Id[],
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
	): Promise<T[]> {
		const byChunk = splitInChunks(ENTITY_INDEXER_CHUNK, ids)
		return promiseMap(
			byChunk,
			(chunk) => {
				return chunk.length > 0 ? this._entity.loadMultiple(typeRef, listId, chunk, ownerEncSessionKeyProvider) : Promise.resolve([])
			},
			{
				concurrency: 2,
			},
		).then((entityResults) => entityResults.flat())
	}
}
