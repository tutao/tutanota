//@flow
import {FULL_INDEXED_TIMESTAMP, MailFolderType, MailState, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../common/TutanotaConstants"
import {load} from "../EntityWorker"
import type {MailBody} from "../../entities/tutanota/MailBody"
import {MailBodyTypeRef} from "../../entities/tutanota/MailBody"
import {NotAuthorizedError, NotFoundError} from "../../common/error/RestError"
import {MailboxGroupRootTypeRef} from "../../entities/tutanota/MailboxGroupRoot"
import type {MailBox} from "../../entities/tutanota/MailBox"
import {MailBoxTypeRef} from "../../entities/tutanota/MailBox"
import type {MailFolder} from "../../entities/tutanota/MailFolder"
import {MailFolderTypeRef} from "../../entities/tutanota/MailFolder"
import type {Mail} from "../../entities/tutanota/Mail"
import {_TypeModel as MailModel, MailTypeRef} from "../../entities/tutanota/Mail"
import {ElementDataOS, GroupDataOS, MetaDataOS} from "./DbFacade"
import {containsEventOfType, getMailBodyText, neverNull} from "../../common/utils/Utils"
import {timestampToGeneratedId} from "../../common/utils/Encoding"
import {
	_createNewIndexUpdate,
	encryptIndexKeyBase64,
	filterMailMemberships,
	getPerformanceTimestamp,
	htmlToText,
	typeRefToTypeInfo
} from "./IndexUtils"
import type {Db, GroupData, IndexUpdate, SearchIndexEntry} from "./SearchTypes"
import type {File as TutanotaFile} from "../../entities/tutanota/File"
import {FileTypeRef} from "../../entities/tutanota/File"
import {CancelledError} from "../../common/error/CancelledError"
import {IndexerCore} from "./IndexerCore"
import {Metadata} from "./Indexer"
import type {WorkerImpl} from "../WorkerImpl"
import {contains, flat, groupBy, splitInChunks} from "../../common/utils/ArrayUtils"
import {DbError} from "../../common/error/DbError"
import {EntityRestCache} from "../rest/EntityRestCache"
import {InvalidDatabaseStateError} from "../../common/error/InvalidDatabaseStateError"
import type {DateProvider} from "../DateProvider"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import type {User} from "../../entities/sys/User"
import type {GroupMembership} from "../../entities/sys/GroupMembership"
import type {EntityRestInterface} from "../rest/EntityRestClient"
import {EntityClient} from "../../common/EntityClient"
import {ProgressMonitor} from "../../common/utils/ProgressMonitor"
import {elementIdPart, isSameId, listIdPart} from "../../common/utils/EntityUtils";
import {TypeRef} from "../../common/utils/TypeRef";

export const INITIAL_MAIL_INDEX_INTERVAL_DAYS = 28

const ENTITY_INDEXER_CHUNK = 20
export const MAIL_INDEXER_CHUNK = 100

const MAIL_INDEX_BATCH_INTERVAL = 1000 * 60 * 60 * 24 // one day

export class MailIndexer {
	currentIndexTimestamp: number; // The oldest timestamp that has been indexed for all mail lists
	mailIndexingEnabled: boolean;
	mailboxIndexingPromise: Promise<void>;
	_indexingCancelled: boolean;
	_excludedListIds: Id[];

	_core: IndexerCore;
	_db: Db;
	_worker: WorkerImpl;
	_entityRestClient: EntityRestInterface;
	_defaultCachingEntity: EntityClient;
	_dateProvider: DateProvider;

	constructor(core: IndexerCore, db: Db, worker: WorkerImpl, entityRestClient: EntityRestInterface, defaultCachingRestClient: EntityRestInterface,
	            dateProvider: DateProvider) {
		this._core = core
		this._db = db
		this._defaultCachingEntity = new EntityClient(defaultCachingRestClient)
		this._worker = worker

		this.currentIndexTimestamp = NOTHING_INDEXED_TIMESTAMP
		this.mailIndexingEnabled = false
		this.mailboxIndexingPromise = Promise.resolve()
		this._indexingCancelled = false
		this._excludedListIds = []
		this._entityRestClient = entityRestClient
		this._dateProvider = dateProvider
	}


	createMailIndexEntries(mail: Mail, mailBody: ?MailBody, files: TutanotaFile[]): Map<string, SearchIndexEntry[]> {
		let startTimeIndex = getPerformanceTimestamp()
		let keyToIndexEntries = this._core.createIndexEntriesForAttributes(MailModel, mail, [
			{
				attribute: MailModel.values["subject"],
				value: () => mail.subject
			}, {
				attribute: MailModel.associations["toRecipients"],
				value: () => mail.toRecipients.map(r => r.name + " <" + r.address + ">").join(","),
			}, {
				attribute: MailModel.associations["ccRecipients"],
				value: () => mail.ccRecipients.map(r => r.name + " <" + r.address + ">").join(","),
			}, {
				attribute: MailModel.associations["bccRecipients"],
				value: () => mail.bccRecipients.map(r => r.name + " <" + r.address + ">").join(","),
			}, {
				attribute: MailModel.associations["sender"],
				value: () => mail.sender ? (mail.sender.name + " <" + mail.sender.address + ">") : "",
			}, {
				attribute: MailModel.associations["body"],
				// Sometimes we encounter inconsistencies such as when deleted emails appear again
				value: () => mailBody != null ? htmlToText(getMailBodyText(mailBody)) : ""
			}, {
				attribute: MailModel.associations["attachments"],
				value: () => files.map(file => file.name).join(" ")
			}
		])
		this._core._stats.indexingTime += (getPerformanceTimestamp() - startTimeIndex)
		return keyToIndexEntries
	}

	processNewMail(event: EntityUpdate): Promise<?{mail: Mail, keyToIndexEntries: Map<string, SearchIndexEntry[]>}> {
		if (this._isExcluded(event)) {
			return Promise.resolve()
		}
		return this._defaultCachingEntity.load(MailTypeRef, [event.instanceListId, event.instanceId], null)
		           .then(mail => {
			           return Promise.all([
				           Promise.map(mail.attachments, attachmentId => this._defaultCachingEntity.load(FileTypeRef, attachmentId, null)),
				           this._defaultCachingEntity.load(MailBodyTypeRef, mail.body, null)
			           ]).then(([files, body]) => {
				           let keyToIndexEntries = this.createMailIndexEntries(mail, body, files)
				           return {mail, keyToIndexEntries}
			           })
		           })
		           .catch(NotFoundError, () => {
			           console.log("tried to index non existing mail")
			           return null
		           })
		           .catch(NotAuthorizedError, () => {
			           console.log("tried to index contact without permission")
			           return null
		           })
	}

	processMovedMail(event: EntityUpdate, indexUpdate: IndexUpdate): Promise<void> {
		let encInstanceId = encryptIndexKeyBase64(this._db.key, event.instanceId, this._db.iv)
		return this._db.dbFacade.createTransaction(true, [ElementDataOS]).then(transaction => {
			return transaction.get(ElementDataOS, encInstanceId).then(elementData => {
				if (elementData) {
					if (this._isExcluded(event)) {
						return this._core._processDeleted(event, indexUpdate) // move to spam folder
					} else {
						indexUpdate.move.push({
							encInstanceId,
							newListId: event.instanceListId
						})
					}
				} else {
					// instance is moved but not yet indexed: handle as new for example moving a mail from non indexed folder like spam to indexed folder
					return this.processNewMail(event).then(result => {
						if (result) {
							this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries,
								indexUpdate)
						}
					})
				}
			})
		})
	}

	enableMailIndexing(user: User): Promise<void> {
		return this._db.dbFacade.createTransaction(true, [MetaDataOS]).then(t => {
			return t.get(MetaDataOS, Metadata.mailIndexingEnabled).then(enabled => {
				if (!enabled) {
					return Promise.map(filterMailMemberships(user), (mailGroupMembership) => this._getSpamFolder(mailGroupMembership))
					              .then(spamFolders => {
						              this._excludedListIds = spamFolders.map(folder => folder.mails)
						              this.mailIndexingEnabled = true
						              return this._db.dbFacade.createTransaction(false, [MetaDataOS])
						                         .then(t2 => {
							                         t2.put(MetaDataOS, Metadata.mailIndexingEnabled, true)
							                         t2.put(MetaDataOS, Metadata.excludedListIds, this._excludedListIds)
							                         // create index in background, cancellation is handled in Indexer.enableMailIndexing
							                         const oldestTimestamp = this._dateProvider.getStartOfDayShiftedBy(-INITIAL_MAIL_INDEX_INTERVAL_DAYS)
							                                                     .getTime()
							                         this.indexMailboxes(user, oldestTimestamp)
							                             .catch(CancelledError, (e) => {console.log("cancelled initial indexing", e)})
							                         return t2.wait()
						                         })
					              })
				} else {
					return t.get(MetaDataOS, Metadata.excludedListIds).then(excludedListIds => {
						this.mailIndexingEnabled = true
						this._excludedListIds = excludedListIds || []
					})
				}
			})
		})
	}

	disableMailIndexing(): Promise<void> {
		this.mailIndexingEnabled = false
		this._indexingCancelled = true
		this._excludedListIds = []
		return this._db.dbFacade.deleteDatabase()
	}

	cancelMailIndexing(): Promise<void> {
		this._indexingCancelled = true
		return Promise.resolve()
	}

	/**
	 * Extend mail index if not indexed this range yet.
	 * newOldestTimestamp should be aligned to the start of the day up until which you want to index, we don't do rounding inside here.
	 */
	extendIndexIfNeeded(user: User, newOldestTimestamp: number): Promise<void> {
		return this.mailboxIndexingPromise.then(() => {
			if (this.currentIndexTimestamp > FULL_INDEXED_TIMESTAMP && this.currentIndexTimestamp > newOldestTimestamp) {
				this.indexMailboxes(user, newOldestTimestamp)
				    .catch(CancelledError, (e) => {console.log("extend mail index has been cancelled", e)})
				return this.mailboxIndexingPromise
			}
		}).catch(CancelledError, e => {console.log("extend mail index has been cancelled", e)})
	}

	/**
	 * Indexes all mailboxes of the given user up to the endIndexTimestamp if mail indexing is enabled. If the mailboxes are already fully indexed, they are not indexed again.
	 */
	indexMailboxes(user: User, oldestTimestamp: number): Promise<void> {
		if (!this.mailIndexingEnabled) {
			return Promise.resolve()
		}
		this._indexingCancelled = false

		this._core.resetStats()
		this._worker.sendIndexState({
			initializing: false,
			mailIndexEnabled: this.mailIndexingEnabled,
			progress: 1,
			currentMailIndexTimestamp: this.currentIndexTimestamp,
			indexedMailCount: 0,
			failedIndexingUpTo: null
		})
		let memberships = filterMailMemberships(user)
		this._core.queue.pause()


		this.mailboxIndexingPromise = Promise
			.map(memberships, (mailGroupMembership) => {
				let mailGroupId = mailGroupMembership.group
				return this._defaultCachingEntity.load(MailboxGroupRootTypeRef, mailGroupId)
				           .then(mailGroupRoot => this._defaultCachingEntity.load(MailBoxTypeRef, mailGroupRoot.mailbox))
				           .then(mbox => {
					           return this._db.dbFacade.createTransaction(true, [GroupDataOS]).then(t => {
						           return t.get(GroupDataOS, mailGroupId).then((groupData: ?GroupData) => {
							           if (!groupData) {
								           // group data is not available if group has been added. group will be indexed after login.
								           return null
							           } else {
								           const newestTimestamp = groupData.indexTimestamp === NOTHING_INDEXED_TIMESTAMP
									           ? this._dateProvider.getStartOfDayShiftedBy(1).getTime()
									           : groupData.indexTimestamp
								           if (newestTimestamp > oldestTimestamp) {
									           return {mbox, newestTimestamp}
								           } else {
									           return null
								           }
							           }
						           })
					           })
				           })
			}).then((mailBoxes: Array<?{mbox: MailBox, newestTimestamp: number}>) => {
				const filtered = mailBoxes.filter(Boolean)
				if (filtered.length > 0) {
					return this._indexMailLists(filtered, oldestTimestamp)
				}
			})
			.then(() => {
				this._core.printStatus()
				return this.updateCurrentIndexTimestamp(user)
				           .then(() =>
					           this._worker.sendIndexState({
						           initializing: false,
						           mailIndexEnabled: this.mailIndexingEnabled,
						           progress: 0,
						           currentMailIndexTimestamp: this.currentIndexTimestamp,
						           indexedMailCount: this._core._stats.mailcount,
						           failedIndexingUpTo: null
					           }))
			})
			.catch(e => {
				console.warn("Mail indexing failed: ", e)
				// avoid that a rejected promise is stored
				this.mailboxIndexingPromise = Promise.resolve()

				return this.updateCurrentIndexTimestamp(user)
				           .then(() => {
					           this._worker.sendIndexState({
						           initializing: false,
						           mailIndexEnabled: this.mailIndexingEnabled,
						           progress: 0,
						           currentMailIndexTimestamp: this.currentIndexTimestamp,
						           indexedMailCount: this._core._stats.mailcount,
						           failedIndexingUpTo: this._core.isStoppedProcessing() || e
						           instanceof CancelledError ? null : oldestTimestamp
					           })
				           })
			})
			.finally(() => {
				this._core.queue.resume()
			})
		return this.mailboxIndexingPromise.return()
	}


	_indexMailLists(mailBoxes: Array<{mbox: MailBox, newestTimestamp: number}>, oldestTimestamp: number): Promise<void> {
		const newestTimestamp = mailBoxes.reduce((acc, data) => Math.max(acc, data.newestTimestamp), 0)
		const progress = new ProgressMonitor(newestTimestamp - oldestTimestamp, progress => {
			this._worker.sendIndexState({
				initializing: false,
				mailIndexEnabled: this.mailIndexingEnabled,
				progress,
				currentMailIndexTimestamp: this.currentIndexTimestamp,
				indexedMailCount: this._core._stats.mailcount,
				failedIndexingUpTo: null
			})
		})
		const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))
		const indexLoader = new IndexLoader(this._entityRestClient)

		return Promise.map(mailBoxes, (mBoxData => {
			return this._loadMailListIds(mBoxData.mbox).then(mailListIds => {
				return {
					mailListIds,
					newestTimestamp: mBoxData.newestTimestamp,
					ownerGroup: neverNull(mBoxData.mbox._ownerGroup)
				}
			})
		})).then((mailboxData) =>
			this._indexMailListsInTimeBatches(mailboxData, [newestTimestamp, oldestTimestamp], indexUpdate, progress, indexLoader))
	}

	_processedEnough(indexUpdate: IndexUpdate): boolean {
		return indexUpdate.create.encInstanceIdToElementData.size > 500
	}

	_indexMailListsInTimeBatches(dataPerMailbox: Array<MboxIndexData>, timeRange: TimeRange, indexUpdate: IndexUpdate, progress: ProgressMonitor,
	                             indexLoader: IndexLoader): Promise<void> {
		const [rangeStart, rangeEnd] = timeRange
		let batchEnd = rangeStart - MAIL_INDEX_BATCH_INTERVAL
		// Make sure that we index up until aligned date and not more, otherwise it stays misaligned for user after changing the time zone once
		if (batchEnd < rangeEnd) {
			batchEnd = rangeEnd
		}
		const mailboxesToWrite = dataPerMailbox.filter((mboxData) => batchEnd < mboxData.newestTimestamp)

		const batchRange = [rangeStart, batchEnd]

		// rangeStart is what we have indexed at the previous step. If it's equals to rangeEnd then we're done.
		// If it's less then we overdid a little bit but we've covered the range and we will write down rangeStart so
		// we will continue from it next time.
		if (rangeStart <= rangeEnd) { // all ranges have been processed
			const indexTimestampPerGroup = mailboxesToWrite.map(data => ({
				groupId: data.ownerGroup,
				indexTimestamp: data.mailListIds.length === 0 ? FULL_INDEXED_TIMESTAMP : rangeStart
			}))
			return this._writeIndexUpdate(indexTimestampPerGroup, indexUpdate)
			           .then(() => {
				           progress.workDone(rangeStart - batchEnd)
			           })
		}
		return this._prepareMailDataForTimeBatch(mailboxesToWrite, batchRange, indexUpdate, indexLoader).then(() => {
			const nextRange = [batchEnd, rangeEnd]
			if (this._processedEnough(indexUpdate)) { // only write to database if we have collected enough entities
				const indexTimestampPerGroup = mailboxesToWrite.map(data => ({
					groupId: data.ownerGroup,
					indexTimestamp: data.mailListIds.length === 0 ? FULL_INDEXED_TIMESTAMP : batchEnd
				}))
				return this._writeIndexUpdate(indexTimestampPerGroup, indexUpdate)
				           .then(() => {
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

	_updateIndexTimeStamp(mailGroupId: Id, indexTimestamp: number): Promise<void> {
		return this._db.dbFacade
		           .createTransaction(false, [GroupDataOS])
		           .then(t2 => {
			           return t2.get(GroupDataOS, mailGroupId).then((groupData: ?GroupData) => {
				           if (groupData) {
					           groupData.indexTimestamp = indexTimestamp
					           t2.put(GroupDataOS, mailGroupId, groupData)
					           return t2.wait()
				           } else {
					           throw new InvalidDatabaseStateError("no group data for mail group " + mailGroupId)
				           }
			           })
		           })
		           .then(() => {
			           this.currentIndexTimestamp = indexTimestamp
		           })
	}

	/**
	 * @return Number of processed emails?
	 * @private
	 */
	_prepareMailDataForTimeBatch(mboxDataList: Array<MboxIndexData>, timeRange: TimeRange, indexUpdate: IndexUpdate,
	                             indexLoader: IndexLoader): Promise<void> {
		const startTimeLoad = getPerformanceTimestamp()
		return Promise.map(mboxDataList, mboxData => {
			return Promise
				.map(mboxData.mailListIds.slice(), (listId) => {
					// We use caching here because we may load same emails twice
					return indexLoader.loadMailsWithCache(listId, timeRange)
					                  .then(({elements: mails, loadedCompletely}) => {
						                  // If we loaded mail list completely, don't try to load from it anymore
						                  if (loadedCompletely) {
							                  mboxData.mailListIds.splice(mboxData.mailListIds.indexOf(listId), 1)
						                  }
						                  this._core._stats.mailcount += mails.length
						                  // Remove all processed entities from cache
						                  mails.forEach((m) => indexLoader.removeFromCache(m._id))
						                  return this._processIndexMails(mails, indexUpdate, indexLoader)
					                  })
				}, {concurrency: 2})
		}).then(() => {
			this._core._stats.preparingTime += (getPerformanceTimestamp() - startTimeLoad)
		})
	}

	_processIndexMails(mails: Array<Mail>, indexUpdate: IndexUpdate, indexLoader: IndexLoader): Promise<number> {
		if (this._indexingCancelled) throw new CancelledError("cancelled indexing in processing index mails")
		const bodies = indexLoader.loadMailBodies(mails)
		const files = indexLoader.loadAttachments(mails)
		return Promise.all([bodies, files])
		              .then(([bodies, files]) => mails
			              .map(mail => {
				              const body = bodies.find(b => isSameId(b._id, mail.body))
				              if (body == null) return null
				              return {
					              mail: mail,
					              body,
					              files: files.filter(file => mail.attachments.find(a => isSameId(a, file._id)))
				              }
			              })
			              .filter(Boolean))
		              .then((mailWithBodyAndFiles: {mail: Mail, body: MailBody, files: TutanotaFile[]}[]) => {
			              mailWithBodyAndFiles.forEach(element => {
				              let keyToIndexEntries = this.createMailIndexEntries(element.mail, element.body, element.files)
				              this._core.encryptSearchIndexEntries(element.mail._id, neverNull(element.mail._ownerGroup), keyToIndexEntries, indexUpdate)
			              })
		              }).return(mails.length)
	}

	_writeIndexUpdate(dataPerGroup: Array<{groupId: Id, indexTimestamp: number}>, indexUpdate: IndexUpdate): Promise<void> {
		return this._core.writeIndexUpdate(dataPerGroup, indexUpdate)
	}


	updateCurrentIndexTimestamp(user: User): Promise<void> {
		return this._db.dbFacade.createTransaction(true, [GroupDataOS]).then(t => {
			return Promise.all(filterMailMemberships(user).map((mailGroupMembership) => {
				return t.get(GroupDataOS, mailGroupMembership.group).then((groupData: ?GroupData) => {
					if (!groupData) {
						return NOTHING_INDEXED_TIMESTAMP
					} else {
						return groupData.indexTimestamp
					}
				})
			})).then(groupIndexTimestamps => {
				this.currentIndexTimestamp = _getCurrentIndexTimestamp(groupIndexTimestamps)
			})
		}).catch((err) => {
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
		const folders = await this._defaultCachingEntity.loadAll(MailFolderTypeRef, neverNull(mailbox.systemFolders).folders)
		const mailListIds = []
		for (const folder of folders) {
			if (!this._excludedListIds.includes(folder.mails)) {
				mailListIds.push(folder.mails)
				const subfolders = await this._defaultCachingEntity.loadAll(MailFolderTypeRef, folder.subFolders)
				mailListIds.push(...subfolders.map(f => f.mails))
			}
		}
		return mailListIds
	}

	_getSpamFolder(mailGroup: GroupMembership): Promise<MailFolder> {
		return load(MailboxGroupRootTypeRef, mailGroup.group)
			.then(mailGroupRoot => load(MailBoxTypeRef, mailGroupRoot.mailbox))
			.then(mbox => {
				return this._defaultCachingEntity.loadAll(MailFolderTypeRef, neverNull(mbox.systemFolders).folders)
				           .then(folders => neverNull(folders.find(folder => folder.folderType === MailFolderType.SPAM)))
			})
	}

	/**
	 * Prepare IndexUpdate in response to the new entity events.
	 * {@see MailIndexerTest.js}
	 * @param events Events from one batch
	 * @param groupId
	 * @param batchId
	 * @param indexUpdate which will be populated with operations
	 * @param futureActions lookahead for actions optimizations. Actions will be removed when processed.
	 * @returns {Promise<*>} Indication that we're done.
	 */
	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id, indexUpdate: IndexUpdate): Promise<void> {
		if (!this.mailIndexingEnabled) return Promise.resolve()
		return Promise.each(events, (event) => {
			if (event.operation === OperationType.CREATE) {
				if (containsEventOfType(events, OperationType.DELETE, event.instanceId)) {
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
				return this._defaultCachingEntity.load(MailTypeRef, [event.instanceListId, event.instanceId], null)
				           .then(mail => {
					           if (mail.state === MailState.DRAFT) {
						           return Promise.all([
							           this._core._processDeleted(event, indexUpdate),
							           this.processNewMail(event).then(result => {
								           if (result) {
									           this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries,
										           indexUpdate)
								           }
							           })
						           ])
					           }
				           })
				           .catch(NotFoundError, () => console.log("tried to index update event for non existing mail"))
			} else if (event.operation === OperationType.DELETE) {
				if (!containsEventOfType(events, OperationType.CREATE, event.instanceId)) {
					// Check that this is *not* a move event. Move events are handled separately.
					return this._core._processDeleted(event, indexUpdate)
				}
			}
		}).return()
	}
}

// export just for testing
export function _getCurrentIndexTimestamp(groupIndexTimestamps: number[]): number {
	let currentIndexTimestamp = NOTHING_INDEXED_TIMESTAMP
	groupIndexTimestamps.forEach((t, index) => {
		if (index === 0) {
			currentIndexTimestamp = t
		} else if (t === NOTHING_INDEXED_TIMESTAMP) {
			// skip new group memberships
		} else if (t === FULL_INDEXED_TIMESTAMP && currentIndexTimestamp !== FULL_INDEXED_TIMESTAMP
			&& currentIndexTimestamp !== NOTHING_INDEXED_TIMESTAMP) {
			// skip full index timestamp if this is not the first mail group
		} else if (currentIndexTimestamp === FULL_INDEXED_TIMESTAMP && t !== currentIndexTimestamp) { // find the oldest timestamp
			// mail index ist not fully indexed if one of the mailboxes is not fully indexed
			currentIndexTimestamp = t
		} else if (t < currentIndexTimestamp) {
			// set the oldest index timestamp as current timestamp so all mailboxes can index to this timestamp during log in.
			currentIndexTimestamp = t
		}
	})
	return currentIndexTimestamp
}

type TimeRange = [number, number]

type MboxIndexData = {mailListIds: Array<Id>, newestTimestamp: number, ownerGroup: Id}

class IndexLoader {
	_entityCache: EntityRestCache;
	_entity: EntityClient;
	_cachingEntity: EntityClient;

	constructor(restClient: EntityRestInterface) {
		this._entityCache = new EntityRestCache(restClient)
		this._entity = new EntityClient(restClient)
		this._cachingEntity = new EntityClient(this._entityCache)
	}

	loadMailsWithCache(mailListId: Id, [rangeStart, rangeEnd]: TimeRange): Promise<{elements: Array<Mail>, loadedCompletely: boolean}> {
		return this._cachingEntity.loadReverseRangeBetween(MailTypeRef, mailListId, timestampToGeneratedId(rangeStart),
			timestampToGeneratedId(rangeEnd), MAIL_INDEXER_CHUNK)
	}

	removeFromCache(id: IdTuple) {
		this._entityCache._tryRemoveFromCache(MailTypeRef, listIdPart(id), elementIdPart(id))
	}

	loadMailBodies(mails: Mail[]): Promise<MailBody[]> {
		const ids = mails.map(m => m.body)
		return this._loadInChunks(MailBodyTypeRef, null, ids)
	}

	loadAttachments(mails: Mail[]): Promise<TutanotaFile[]> {
		const attachmentIds = []
		mails.forEach(mail => {
			attachmentIds.push(...mail.attachments)
		})
		const filesByList = groupBy(attachmentIds, a => a[0])
		const fileLoadingPromises: Array<Promise<Array<TutanotaFile>>> = []
		filesByList.forEach((fileIds, listId) => {
			fileLoadingPromises.push(this._loadInChunks(FileTypeRef, listId, fileIds.map(f => f[1])))
		})
		// if (this._indexingCancelled) throw new CancelledError("cancelled indexing in loading attachments")
		return Promise.all(fileLoadingPromises).then((filesResults: TutanotaFile[][]) => flat(filesResults))
	}

	_loadInChunks<T>(typeRef: TypeRef<T>, listId: ?Id, ids: Id[]): Promise<T[]> {
		const byChunk = splitInChunks(ENTITY_INDEXER_CHUNK, ids)
		return Promise.map(byChunk, (chunk) => {
			return chunk.length > 0
				? this._entity.loadMultipleEntities(typeRef, listId, chunk)
				: Promise.resolve([])
		}, {concurrency: 2})
		              .then(entityResults => flat(entityResults))
	}


}

