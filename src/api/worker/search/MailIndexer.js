//@flow
import {FULL_INDEXED_TIMESTAMP, MailFolderType, MailState, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../common/TutanotaConstants"
import {EntityWorker, load, loadAll} from "../EntityWorker"
import {MailBodyTypeRef} from "../../entities/tutanota/MailBody"
import {NotAuthorizedError, NotFoundError} from "../../common/error/RestError"
import {MailboxGroupRootTypeRef} from "../../entities/tutanota/MailboxGroupRoot"
import {MailBoxTypeRef} from "../../entities/tutanota/MailBox"
import {MailFolderTypeRef} from "../../entities/tutanota/MailFolder"
import {_TypeModel as MailModel, MailTypeRef} from "../../entities/tutanota/Mail"
import {ElementDataOS, GroupDataOS, MetaDataOS} from "./DbFacade"
import {firstBiggerThanSecond, GENERATED_MAX_ID, isSameId, TypeRef} from "../../common/EntityFunctions"
import {neverNull} from "../../common/utils/Utils"
import {timestampToGeneratedId} from "../../common/utils/Encoding"
import {_createNewIndexUpdate, containsEventOfType, encryptIndexKeyBase64, filterMailMemberships, getPerformanceTimestamp, htmlToText} from "./IndexUtils"
import type {Db, GroupData, IndexUpdate, SearchIndexEntry} from "./SearchTypes"
import {FileTypeRef} from "../../entities/tutanota/File"
import {CancelledError} from "../../common/error/CancelledError"
import {IndexerCore} from "./IndexerCore"
import {EntityRestClient} from "../rest/EntityRestClient"
import {getDayShifted, getStartOfDay} from "../../common/utils/DateUtils"
import {Metadata} from "./Indexer"
import type {WorkerImpl} from "../WorkerImpl"
import {contains, flat, groupBy, splitInChunks} from "../../common/utils/ArrayUtils"
import * as promises from "../../common/utils/PromiseUtils"
import type {FutureBatchActions} from "./EventQueue"
import {DbError} from "../../common/error/DbError"

export const INITIAL_MAIL_INDEX_INTERVAL_DAYS = 28
const ENTITY_INDEXER_CHUNK = 20
export const MAIL_INDEXER_CHUNK = 100

export class MailIndexer {
	currentIndexTimestamp: number; // The oldest timestamp that has been indexed for all mail lists
	mailIndexingEnabled: boolean;
	mailboxIndexingPromise: Promise<void>;
	_indexingCancelled: boolean;
	_excludedListIds: Id[];

	_core: IndexerCore;
	_db: Db;
	_entity: EntityWorker;
	_worker: WorkerImpl;
	_entityRestClient: EntityRestClient;

	constructor(core: IndexerCore, db: Db, entity: EntityWorker, worker: WorkerImpl, entityRestClient: EntityRestClient) {
		this._core = core
		this._db = db
		this._entity = entity
		this._worker = worker

		this.currentIndexTimestamp = NOTHING_INDEXED_TIMESTAMP
		this.mailIndexingEnabled = false
		this.mailboxIndexingPromise = Promise.resolve()
		this._indexingCancelled = false
		this._excludedListIds = []
		this._entityRestClient = entityRestClient
	}


	createMailIndexEntries(mail: Mail, mailBody: MailBody, files: TutanotaFile[]): Map<string, SearchIndexEntry[]> {
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
				value: () => htmlToText(mailBody.text)
			}, {
				attribute: MailModel.associations["attachments"],
				value: () => files.map(file => file.name).join(" ")
			}
		])
		this._core._stats.indexingTime += (getPerformanceTimestamp() - startTimeIndex)
		return keyToIndexEntries
	}

	processNewMail(event: EntityUpdate): Promise<?{mail: Mail, keyToIndexEntries: Map<string, SearchIndexEntry[]>}> {
		performance.mark("processNewMail-start")
		if (this._isExcluded(event)) {
			return Promise.resolve()
		}
		performance.mark("processNewMail_load-start")
		return this._entity.load(MailTypeRef, [event.instanceListId, event.instanceId]).then(mail => {
			return Promise.all([
				Promise.map(mail.attachments, attachmentId => this._entity.load(FileTypeRef, attachmentId)),
				this._entity.load(MailBodyTypeRef, mail.body)
			]).spread((files, body) => {
				performance.mark("processNewMail_load-end")
				performance.mark("processNewMail_createIndexEnties-start")
				let keyToIndexEntries = this.createMailIndexEntries(mail, body, files)
				performance.mark("processNewMail_createIndexEnties-end")
				return {mail, keyToIndexEntries}
			})
		}).catch(NotFoundError, () => {
			console.log("tried to index non existing mail")
			return null
		}).catch(NotAuthorizedError, () => {
			console.log("tried to index contact without permission")
			return null
		}).finally(() => {
			performance.mark("processNewMail-end")
		})
	}

	processMovedMail(event: EntityUpdate, indexUpdate: IndexUpdate) {
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
					// instance is moved but not yet indexed: handle as new
					return this.processNewMail(event).then(result => {
						if (result) {
							this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries, indexUpdate)
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
						              return this._db.dbFacade.createTransaction(false, [MetaDataOS, GroupDataOS])
						                         .then(t2 => {
							                         t2.put(MetaDataOS, Metadata.mailIndexingEnabled, true)
							                         t2.put(MetaDataOS, Metadata.excludedListIds, this._excludedListIds)
							                         // create index in background, cancellation is handled in Indexer.enableMailIndexing
							                         this.indexMailboxes(user, getStartOfDay(getDayShifted(new Date(), -INITIAL_MAIL_INDEX_INTERVAL_DAYS)))
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
	 * Indexes all mailboxes of the given user up to the endIndexTimestamp if mail indexing is enabled. If the mailboxes are already fully indexed, they are not indexed again.
	 */
	indexMailboxes(user: User, endIndexTimestamp: number): Promise<void> {
		if (!this.mailIndexingEnabled) {
			return Promise.resolve()
		}
		this._indexingCancelled = false

		this._worker.sendIndexState({
			initializing: false,
			indexingSupported: this._core.indexingSupported,
			mailIndexEnabled: this.mailIndexingEnabled,
			progress: 1,
			currentMailIndexTimestamp: this.currentIndexTimestamp
		})
		let memberships = filterMailMemberships(user)
		this._core.queue.pause()
		this.mailboxIndexingPromise = Promise.each(memberships, (mailGroupMembership) => {
			let mailGroupId = mailGroupMembership.group
			return this._entity.load(MailboxGroupRootTypeRef, mailGroupId)
			           .then(mailGroupRoot => this._entity.load(MailBoxTypeRef, mailGroupRoot.mailbox))
			           .then(mbox => {
				           return this._db.dbFacade.createTransaction(true, [GroupDataOS]).then(t => {
					           return t.get(GroupDataOS, mailGroupId).then((groupData: ?GroupData) => {
						           let progress = {count: 1}
						           if (!groupData) {
							           // group data is not available if group has been added. group will be indexed after login.
							           progress.count++
						           } else {
							           let startId = groupData.indexTimestamp === NOTHING_INDEXED_TIMESTAMP
								           ? GENERATED_MAX_ID
								           : timestampToGeneratedId(groupData.indexTimestamp)
							           const endId = timestampToGeneratedId(endIndexTimestamp)
							           if (firstBiggerThanSecond(startId, endId)) {
								           return this._indexMailLists(mbox, mailGroupId, startId, endId, endIndexTimestamp, progress)
							           }
						           }

					           })
				           })
			           })
		}).then(() => {
			this._core.printStatus()
			console.log("finished indexing")
		}).catch(e => {
			// avoid that a rejected promise is stored
			this.mailboxIndexingPromise = Promise.resolve()
			if (e instanceof DbError && this._core.isStoppedProcessing()) {
				console.log("The database was closed, ignore indexing error", e)
			} else {
				throw e
			}
		}).finally(() => {
			this._core.queue.resume()
			// update our index timestamp and send the information to the main thread. this can be done async
			this.updateCurrentIndexTimestamp(user)
			    .catch((err) => {
				    if (err instanceof DbError && this._core.isStoppedProcessing()) {
					    console.log("The database was closed, do not write currentIndexTimestamp")
				    }
			    })
			    .finally(() => this._worker.sendIndexState({
				    initializing: false,
				    indexingSupported: this._core.indexingSupported,
				    mailIndexEnabled: this.mailIndexingEnabled,
				    progress: 0,
				    currentMailIndexTimestamp: this.currentIndexTimestamp
			    }))
		})
		return this.mailboxIndexingPromise.return()
	}


	_indexMailLists(mbox: MailBox, mailGroupId: Id, startId: Id, endId: Id, endIndexTimstamp: number, progress: {count: number}): Promise<void> {
		return this._loadMailListIds(mbox).map((mailListId, i, count) => {
			return this._indexMailList(mbox, mailGroupId, mailListId, startId, endId)
			           .then((finishedMailList) => {
				           this._worker.sendIndexState({
					           initializing: false,
					           indexingSupported: this._core.indexingSupported,
					           mailIndexEnabled: this.mailIndexingEnabled,
					           progress: Math.round(100 * (progress.count++) / count),
					           currentMailIndexTimestamp: this.currentIndexTimestamp
				           })
				           return finishedMailList
			           })
		}, {concurrency: 1}).then((finishedIndexing: boolean[]) => {
			return this._db.dbFacade.createTransaction(false, [GroupDataOS]).then(t2 => {
				return t2.get(GroupDataOS, mailGroupId).then((groupData: ?GroupData) => {
					if (groupData) {
						groupData.indexTimestamp = finishedIndexing
							.find(finishedListIndexing => finishedListIndexing === false) == null
							? FULL_INDEXED_TIMESTAMP
							: endIndexTimstamp
						t2.put(GroupDataOS, mailGroupId, groupData)
						return t2.wait()
					} else {
						throw Error("no group data for mail group " + mailGroupId)
					}

				})
			})
		})
	}

	/**@return returns true if the mail list has been fully indexed. */
	_indexMailList(mailbox: MailBox, mailGroupId: Id, mailListId: Id, startId: Id, endId: Id): Promise<boolean> {
		let startTimeLoad = getPerformanceTimestamp()
		if (this._indexingCancelled) return Promise.reject(new CancelledError("cancelled indexing - index mail list " + mailListId))

		console.time("indexMailList " + mailListId)

		return this._entity._loadEntityRange(MailTypeRef, mailListId, startId, MAIL_INDEXER_CHUNK, true, this._entityRestClient)
		           .then(mails => {
			           if (this._indexingCancelled) throw new CancelledError("cancelled indexing - load entity range")
			           let filteredMails = mails.filter(m => firstBiggerThanSecond(m._id[1], endId))
			           const bodies = this._loadMailBodies(filteredMails)
			           const files = this._loadAttachments(filteredMails)
			           return promises.all(filteredMails, bodies, files)
			                          .then(([mails, bodies, files]) => mails.map(mail => ({
				                          mail: mail,
				                          body: bodies.find(b => isSameId(b._id, mail.body)),
				                          files: files.filter(file => mail.attachments.find(a => isSameId(a, file._id)))
			                          })))
			                          .then((mailWithBodyAndFiles: {mail: Mail, body: MailBody, files: TutanotaFile[]}[]) => {
				                          let indexUpdate = _createNewIndexUpdate(mailGroupId)
				                          this._core._stats.downloadingTime += (getPerformanceTimestamp() - startTimeLoad)
				                          this._core._stats.mailcount += mailWithBodyAndFiles.length
				                          return Promise.each(mailWithBodyAndFiles, element => {
					                          let keyToIndexEntries = this.createMailIndexEntries(element.mail, element.body, element.files)
					                          this._core.encryptSearchIndexEntries(element.mail._id, neverNull(element.mail._ownerGroup), keyToIndexEntries, indexUpdate)
				                          }).then(() => this._core.writeIndexUpdate(indexUpdate)).finally(() => {
					                          // measure([
					                          //    "processEntityEvents", "processEvent", "writeIndexUpdate", "processNewMail", "processNewMail_load",
					                          //    "processNewMail_createIndexEnties", "insertNewElementData", "insertNewElementData_get",
					                          //    "insertNewElementData_put",
					                          //    "insertNewIndexEntries", "insertNewIndexEntries_getMeta", "insertNewIndexEntries_putIndexNew",
					                          //    "insertNewIndexEntries_getRow", "insertNewIndexEntries_putIndex",
					                          //    "insertNewIndexEntries_putMeta"
					                          // ])
				                          })
			                          })
			                          .then(() => {
				                          if (filteredMails.length === MAIL_INDEXER_CHUNK) { // not filtered and more emails are available
					                          console.log("completed indexing range from", startId, "to", endId, "of mail list id", mailListId)
					                          this._core.printStatus()
					                          console.timeEnd("indexMailList " + mailListId)
					                          return this._indexMailList(mailbox, mailGroupId, mailListId, mails[mails.length
					                          - 1]._id[1], endId)
				                          } else {
					                          console.log("completed indexing of mail list id", mailListId)
					                          this._core.printStatus()
					                          console.timeEnd("indexMailList " + mailListId)
					                          return filteredMails.length === mails.length
				                          }
			                          })
		           })

	}


	_loadMailBodies(mails: Mail[]): Promise<MailBody[]> {
		const ids = mails.map(m => m.body)
		return this._loadInChunks(MailBodyTypeRef, null, ids)
	}

	_loadAttachments(mails: Mail[]): Promise<TutanotaFile[]> {
		const attachmentIds = []
		mails.forEach(mail => {
			attachmentIds.push(...mail.attachments)
		})
		const filesByList = groupBy(attachmentIds, a => a[0])
		const fileLoadingPromises: Array<Promise<Array<TutanotaFile>>> = []
		filesByList.forEach((fileIds, listId) => {
			fileLoadingPromises.push(this._loadInChunks(FileTypeRef, listId, fileIds.map(f => f[1])))
		})
		if (this._indexingCancelled) throw new CancelledError("cancelled indexing in loading attachments")
		return Promise.all(fileLoadingPromises).then((filesResults: TutanotaFile[][]) => flat(filesResults))
	}

	_loadInChunks<I, T>(typeRef: TypeRef<T>, listId: ?Id, ids: Id[]): Promise<T[]> {
		const byChunk = splitInChunks(ENTITY_INDEXER_CHUNK, ids)
		return Promise.map(byChunk, (chunk) => {
			return chunk.length > 0
				? this._entity._loadMultipleEntities(typeRef, listId, chunk, this._entityRestClient)
				: Promise.resolve([])
		}, {concurrency: 2})
		              .then(entityResults => flat(entityResults))
	}

	updateCurrentIndexTimestamp(user: User): Promise<void> {
		return this._db.dbFacade.createTransaction(true, [GroupDataOS]).then(t => {
			return Promise.all(filterMailMemberships(user).map((mailGroupMembership, index) => {
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
		})
	}

	_isExcluded(event: EntityUpdate) {
		return this._excludedListIds.indexOf(event.instanceListId) !== -1
	}

	/**
	 * Provides all non-excluded mail list ids of the given mailbox
	 */
	_loadMailListIds(mailbox: MailBox): Promise<Id[]> {
		let mailListIds = []
		return loadAll(MailFolderTypeRef, neverNull(mailbox.systemFolders).folders)
			.filter(f => !contains(this._excludedListIds, f.mails))
			.map(folder => {
				mailListIds.push(folder.mails)
				return loadAll(MailFolderTypeRef, folder.subFolders).map(folder => {
					mailListIds.push(folder.mails)
				})
			})
			.then(() => mailListIds)
	}

	_getSpamFolder(mailGroup: GroupMembership): Promise<MailFolder> {
		return load(MailboxGroupRootTypeRef, mailGroup.group)
			.then(mailGroupRoot => load(MailBoxTypeRef, mailGroupRoot.mailbox))
			.then(mbox => {
				return loadAll(MailFolderTypeRef, neverNull(mbox.systemFolders).folders)
					.then(folders => neverNull(folders.find(folder => folder.folderType === MailFolderType.SPAM)))
			})
	}

	/**
	 * Prepare IndexUpdate in response to the new entity events.
	 * This implementation uses futureActions as a lookahead to optimize some operations. Namely:
	 *  create + delete = nothing
	 *  create + move   = create*          (create with list id from move operation)
	 *  move   + delete = delete
	 *  move   + move   = move*            (move to the final folder only)
	 *  update + move   = update* + move   (only delete in update and use create event from move)
	 *  update + delete = delete
	 * There are other possible combinations but we only optimize these because they would not work
	 * because of the different server state anyway.
	 * {@see MailIndexerTest.js}
	 * @param events Events from one batch
	 * @param groupId
	 * @param batchId
	 * @param indexUpdate which will be populated with operations
	 * @param futureActions lookahead for actions optimizations. Actions will be removed when processed.
	 * @returns {Promise<*>} Indication that we're done.
	 */
	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id, indexUpdate: IndexUpdate, futureActions: FutureBatchActions): Promise<void> {
		if (!this.mailIndexingEnabled) return Promise.resolve()
		return Promise.each(events, (event) => {
			if (event.operation === OperationType.CREATE) {
				if (containsEventOfType(events, OperationType.DELETE, event.instanceId)) {
					// move mail
					const finalDestinationEvent = futureActions.moved.get(event.instanceId)

					const futureMoveEvent = futureActions.moved.get(event.instanceId)
					if (futureMoveEvent && isSameId(futureMoveEvent._id, event._id)) {
						// Remove from futureActions if we process this event
						futureActions.moved.delete(futureMoveEvent.instanceId)
					}

					// do not execute move operation if there is a delete event or another move event.
					if (futureActions.deleted.has(event.instanceId)
						|| (finalDestinationEvent && !isSameId(finalDestinationEvent.instanceListId, event.instanceListId))) {
						return Promise.resolve()
					} else {
						return this.processMovedMail(event, indexUpdate)
					}
				} else {
					// do not create the index entry if the element has been deleted or moved
					// if moved the element will be indexed in the move event.
					if (futureActions.deleted.has(event.instanceId) || futureActions.moved.has(event.instanceId)) {
						return Promise.resolve()
					} else {
						return this.processNewMail(event).then((result) => {
							if (result) {
								this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries, indexUpdate)
							}
						})
					}
				}
			} else if (event.operation === OperationType.UPDATE) {
				// do not execute update if event has been deleted.
				if (futureActions.deleted.has(event.instanceId)) {
					return Promise.resolve()
				}

				return this._entity.load(MailTypeRef, [event.instanceListId, event.instanceId]).then(mail => {
					if (mail.state === MailState.DRAFT) {
						return Promise.all([
							this._core._processDeleted(event, indexUpdate),
							// only index updated draft if the draft has not been moved.
							// the moved draft will be indexed in the move event.
							!futureActions.moved.get(event.instanceId)
								? this.processNewMail(event).then(result => {
									if (result) {
										this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries, indexUpdate)
									}
								})
								: Promise.resolve()
						])
					}
				}).catch(NotFoundError, () => console.log("tried to index update event for non existing mail"))
			} else if (event.operation === OperationType.DELETE) {
				const futureDeleteEvent = futureActions.deleted.get(event.instanceId)
				if (futureDeleteEvent && isSameId(futureDeleteEvent._id, event._id)) {
					// Welcome to the Future
					futureActions.deleted.delete(futureDeleteEvent.instanceId)
				}
				if (!containsEventOfType(events, OperationType.CREATE, event.instanceId)) { // move events are handled separately
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

