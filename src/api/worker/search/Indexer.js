//@flow
import type {GroupTypeEnum} from "../../common/TutanotaConstants"
import {GroupType, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../common/TutanotaConstants"
import {EntityWorker} from "../EntityWorker"
import {NotAuthorizedError} from "../../common/error/RestError"
import {EntityEventBatchTypeRef} from "../../entities/sys/EntityEventBatch"
import type {DbTransaction} from "./DbFacade"
import {DbFacade, GroupDataOS, MetaDataOS} from "./DbFacade"
import {firstBiggerThanSecond, GENERATED_MAX_ID, getElementId, isSameId, isSameTypeRef, TypeRef} from "../../common/EntityFunctions"
import {defer, neverNull, noOp} from "../../common/utils/Utils"
import {hash} from "../crypto/Sha256"
import {generatedIdToTimestamp, stringToUtf8Uint8Array, timestampToGeneratedId, uint8ArrayToBase64} from "../../common/utils/Encoding"
import {aes256Decrypt, aes256Encrypt, aes256RandomKey, IV_BYTE_LENGTH} from "../crypto/Aes"
import {decrypt256Key, encrypt256Key} from "../crypto/CryptoFacade"
import {_createNewIndexUpdate, filterIndexMemberships} from "./IndexUtils"
import type {Db, GroupData} from "./SearchTypes"
import type {WorkerImpl} from "../WorkerImpl"
import {ContactIndexer} from "./ContactIndexer"
import {MailTypeRef} from "../../entities/tutanota/Mail"
import {ContactTypeRef} from "../../entities/tutanota/Contact"
import {GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {UserTypeRef} from "../../entities/sys/User"
import {GroupInfoIndexer} from "./GroupInfoIndexer"
import {MailIndexer} from "./MailIndexer"
import {IndexerCore} from "./IndexerCore"
import type {EntityRestClient} from "../rest/EntityRestClient"
import {OutOfSyncError} from "../../common/error/OutOfSyncError"
import {SuggestionFacade} from "./SuggestionFacade"
import {DbError} from "../../common/error/DbError"
import type {FutureBatchActions, QueuedBatch} from "./EventQueue"
import {EventQueue} from "./EventQueue"
import {WhitelabelChildTypeRef} from "../../entities/sys/WhitelabelChild"
import {WhitelabelChildIndexer} from "./WhitelabelChildIndexer"
import {contains} from "../../common/utils/ArrayUtils"
import {CancelledError} from "../../common/error/CancelledError"
import {random} from "../crypto/Randomizer"
import {MembershipRemovedError} from "../../common/error/MembershipRemovedError"

export const Metadata = {
	userEncDbKey: "userEncDbKey",
	mailIndexingEnabled: "mailIndexingEnabled",
	excludedListIds: "excludedListIds", // stored in the database, so the mailbox does not need to be loaded when starting to index mails except spam folder after login
	encDbIv: "encDbIv"
}

export type InitParams = {
	user: User;
	groupKey: Aes128Key;
}

export class Indexer {
	db: Db;
	_dbInitializedCallback: Function

	_worker: WorkerImpl;
	_initParams: InitParams;

	_contact: ContactIndexer;
	_mail: MailIndexer;
	_groupInfo: GroupInfoIndexer;
	_whitelabelChildIndexer: WhitelabelChildIndexer;

	_core: IndexerCore;
	_entity: EntityWorker;
	_indexedGroupIds: Array<Id>;

	constructor(entityRestClient: EntityRestClient, worker: WorkerImpl, indexedDbSupported: boolean) {
		let deferred = defer()
		this._dbInitializedCallback = deferred.resolve
		this.db = {
			dbFacade: new DbFacade(indexedDbSupported),
			key: neverNull(null),
			iv: neverNull(null),
			initialized: deferred.promise
		} // correctly initialized during init()
		this._worker = worker
		this._core = new IndexerCore(this.db, new EventQueue((batch, futureActions) => this._processEntityEvents(batch, futureActions)))
		this._entity = new EntityWorker()
		this._contact = new ContactIndexer(this._core, this.db, this._entity, new SuggestionFacade(ContactTypeRef, this.db))
		this._whitelabelChildIndexer = new WhitelabelChildIndexer(this._core, this.db, this._entity, new SuggestionFacade(WhitelabelChildTypeRef, this.db))
		this._mail = new MailIndexer(this._core, this.db, this._entity, worker, entityRestClient)
		this._groupInfo = new GroupInfoIndexer(this._core, this.db, this._entity, new SuggestionFacade(GroupInfoTypeRef, this.db))
		this._indexedGroupIds = []
	}

	/**
	 * Opens a new DbFacade and initializes the metadata if it is not there yet
	 */
	init(user: User, userGroupKey: Aes128Key) {
		this._initParams = {
			user,
			groupKey: userGroupKey,
		}
		return this.db.dbFacade.open(uint8ArrayToBase64(hash(stringToUtf8Uint8Array(user._id)))).then(() => {
			let dbInit = (): Promise<void> => {
				// return Promise.delay(5000).then(() => {
				return this.db.dbFacade.createTransaction(true, [MetaDataOS]).then(t => {
					return t.get(MetaDataOS, Metadata.userEncDbKey).then(userEncDbKey => {
						if (!userEncDbKey) {
							// database was opened for the first time - create new tables
							return this._createIndexTables(user, userGroupKey)
						} else {
							return this._loadIndexTables(t, user, userGroupKey, userEncDbKey)
						}
					})
				})
				// })
			}
			return dbInit().then(() => {
				this._worker.sendIndexState({
					initializing: false,
					indexingSupported: this._core.indexingSupported,
					mailIndexEnabled: this._mail.mailIndexingEnabled,
					progress: 0,
					currentMailIndexTimestamp: this._mail.currentIndexTimestamp
				})
				this._core.startProcessing()
				return this._contact.indexFullContactList(user.userGroup.group)
				           .then(() => this._groupInfo.indexAllUserAndTeamGroupInfosForAdmin(user))
				           .then(() => this._whitelabelChildIndexer.indexAllWhitelabelChildrenForAdmin(user))
				           .then(() => this._mail.mailboxIndexingPromise.then(() => this._mail.indexMailboxes(user, this._mail.currentIndexTimestamp)))
				           .then(() => this._loadPersistentGroupData(user)
				                           .then(groupIdToEventBatches => this._loadNewEntities(groupIdToEventBatches)))
				           .catch(OutOfSyncError, e => {
					           console.log("out of sync - delete database and disable mail indexing")
					           return this.disableMailIndexing()
				           })
			}).catch(MembershipRemovedError, e => {
				// mail or contact group has been removed from user, disable mail indexing and init index again
				// do not use this.disableMailIndexing() because db.initialized is not yet resolved.
				// initialized promise will be resolved in this.init later.
				console.log("cancelled init, disable mail indexing and init again")
				let mailIndexingEnabled = this._mail.mailIndexingEnabled;
				return this._mail.disableMailIndexing().then(() => {
					return this.init(this._initParams.user, this._initParams.groupKey).then(() => {
						if (mailIndexingEnabled) {
							return this.enableMailIndexing()
						}
					})

				})
			})
		}).catch(DbError, e => {
			console.log("Indexing not supported", e)
			this._core.indexingSupported = false
			this._worker.sendIndexState({
				initializing: false,
				indexingSupported: this._core.indexingSupported,
				mailIndexEnabled: this._mail.mailIndexingEnabled,
				progress: 0,
				currentMailIndexTimestamp: this._mail.currentIndexTimestamp
			})
		})
	}

	enableMailIndexing(): Promise<void> {
		return this.db.initialized.then(() => {
			return this._mail.enableMailIndexing(this._initParams.user).then(() => {
				this._mail.mailboxIndexingPromise.catch(CancelledError, () => {
					// Disable mail indexing if the user cancelled the initial mail indexing.
					this.disableMailIndexing()
				})
			})
		})
	}

	disableMailIndexing(): Promise<void> {
		return this.db.initialized
		           .then(() => {
			           if (!this._core.isStoppedProcessing()) {
				           this._core.stopProcessing()
				           return this._mail.disableMailIndexing()
				                      .then(() => this.init(this._initParams.user, this._initParams.groupKey))
			           }
		           })
	}

	cancelMailIndexing(): Promise<void> {
		return this._mail.cancelMailIndexing()
	}


	addBatchesToQueue(batches: QueuedBatch[]) {
		this._core.addBatchesToQueue(batches)
	}

	startProcessing() {
		this._core.queue.start()
	}


	_createIndexTables(user: User, userGroupKey: Aes128Key): Promise<void> {
		return this._loadGroupData(user)
		           .then((groupBatches: {groupId: Id, groupData: GroupData}[]) => {
			           return this.db.dbFacade.createTransaction(false, [MetaDataOS, GroupDataOS])
			                      .then(t2 => {
				                      this.db.key = aes256RandomKey()
				                      this.db.iv = random.generateRandomData(IV_BYTE_LENGTH)
				                      t2.put(MetaDataOS, Metadata.userEncDbKey, encrypt256Key(userGroupKey, this.db.key))
				                      t2.put(MetaDataOS, Metadata.mailIndexingEnabled, this._mail.mailIndexingEnabled)
				                      t2.put(MetaDataOS, Metadata.excludedListIds, this._mail._excludedListIds)
				                      t2.put(MetaDataOS, Metadata.encDbIv, aes256Encrypt(this.db.key, this.db.iv, random.generateRandomData(IV_BYTE_LENGTH), true, false))
				                      return this._initGroupData(groupBatches, t2)
			                      })
		           })
		           .then(() => this._updateIndexedGroups())
		           .then(() => {
			           this._dbInitializedCallback()
		           })
	}


	_loadIndexTables(t: DbTransaction, user: User, userGroupKey: Aes128Key, userEncDbKey: Uint8Array): Promise<void> {
		this.db.key = decrypt256Key(userGroupKey, userEncDbKey)
		return t.get(MetaDataOS, Metadata.encDbIv).then(encDbIv => {
			this.db.iv = aes256Decrypt(this.db.key, neverNull(encDbIv), true, false)
		}).then(() => Promise.all([
			t.get(MetaDataOS, Metadata.mailIndexingEnabled).then(mailIndexingEnabled => {
				this._mail.mailIndexingEnabled = neverNull(mailIndexingEnabled)
			}),
			t.get(MetaDataOS, Metadata.excludedListIds).then(excludedListIds => {
				this._mail._excludedListIds = neverNull(excludedListIds)
			}),

			this._loadGroupDiff(user)
			    .then(groupDiff => this._updateGroups(user, groupDiff))
			    .then(() => this._mail.updateCurrentIndexTimestamp(user))
		]).then(() => {
			return this._updateIndexedGroups()
		}).then(() => {
			this._dbInitializedCallback()
		}).then(() => {
			return Promise.all([
				this._contact.suggestionFacade.load(),
				this._groupInfo.suggestionFacade.load(),
				this._whitelabelChildIndexer.suggestionFacade.load()
			])
		})).return()
	}


	_updateIndexedGroups(): Promise<void> {
		return this.db.dbFacade.createTransaction(true, [GroupDataOS])
		           .then(t => t.getAll(GroupDataOS)
		                       .map((groupDataEntry: {key: Id, value: GroupData}) => groupDataEntry.key))
		           .then(indexedGroupIds => {
			           this._indexedGroupIds = indexedGroupIds
		           })
	}


	_loadGroupDiff(user: User): Promise<{deletedGroups: {id: Id, type: GroupTypeEnum}[], newGroups: {id: Id, type: GroupTypeEnum}[]}> {
		let currentGroups = filterIndexMemberships(user).map(m => {
			return {id: m.group, type: neverNull(m.groupType)}
		})
		return this.db.dbFacade.createTransaction(true, [GroupDataOS]).then(t => {
			return t.getAll(GroupDataOS).then((loadedGroups: {key: Id, value: GroupData}[]) => {
				let oldGroups = loadedGroups.map((group: {key: Id, value: GroupData}) => {
					return {id: group.key, type: group.value.groupType}
				})
				let deletedGroups = oldGroups.filter(oldGroup => currentGroups.find(m => m.id === oldGroup.id) == null)
				let newGroups = currentGroups.filter(m => oldGroups.find(oldGroup => m.id === oldGroup.id) == null)
				return {
					deletedGroups,
					newGroups
				}
			})
		})
	}

	/**
	 *
	 * Initializes the index db for new groups of the user, but does not start the actual indexing for those groups.
	 * If the user was removed from a contact or mail group the function throws a CancelledError to delete the complete mail index afterwards.
	 */
	_updateGroups(user: User, groupDiff: {deletedGroups: {id: Id, type: GroupTypeEnum}[], newGroups: {id: Id, type: GroupTypeEnum}[]}): Promise<void> {
		if (groupDiff.deletedGroups.filter(g => g.type === GroupType.Mail || g.type === GroupType.Contact).length > 0) {
			return Promise.reject(new MembershipRemovedError("user has been removed from contact or mail group")) // user has been removed from a shared group
		} else if (groupDiff.newGroups.length > 0) {
			return this._loadGroupData(user, groupDiff.newGroups.map(g => g.id))
			           .then((groupBatches: {groupId: Id, groupData: GroupData}[]) => {
				           return this.db.dbFacade.createTransaction(false, [GroupDataOS]).then(t => {
					           return this._initGroupData(groupBatches, t)
				           })
			           })
		}
		return Promise.resolve()
	}

	/**
	 * Provides a GroupData object including the last 100 event batch ids for all indexed membership groups of the given user.
	 */
	_loadGroupData(user: User, restrictToTheseGroups: ?Id[]): Promise<{groupId: Id, groupData: GroupData}[]> {
		let memberships = filterIndexMemberships(user)
		const restrictTo = restrictToTheseGroups // type check
		if (restrictTo) {
			memberships = memberships.filter(membership => contains(restrictTo, membership.group))
		}
		return Promise.map(memberships, (membership: GroupMembership) => {
			return this._entity.loadRange(EntityEventBatchTypeRef, membership.group, GENERATED_MAX_ID, 100, true)
			           .then(eventBatches => {
				           return {
					           groupId: membership.group,
					           groupData: ({
						           lastBatchIds: eventBatches.map(eventBatch => eventBatch._id[1]),
						           indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						           groupType: neverNull(membership.groupType)
					           }: GroupData)
				           }
			           })
			           .catch(NotAuthorizedError, () => {
				           console.log("could not download entity updates => lost permission on list")
				           return null
			           })
		}).filter(r => r != null)
	}

	/**
	 * creates the initial group data for all provided group ids
	 */
	_initGroupData(groupBatches: {groupId: Id, groupData: GroupData}[], t2: DbTransaction): Promise<void> {
		groupBatches.forEach(groupIdToLastBatchId => {
			t2.put(GroupDataOS, groupIdToLastBatchId.groupId, groupIdToLastBatchId.groupData)
		})
		return t2.wait()
	}

	_loadNewEntities(groupIdToEventBatches: {groupId: Id, eventBatchIds: Id[]}[]): Promise<void> {
		return Promise
			.each(groupIdToEventBatches, (groupIdToEventBatch) => {
				if (groupIdToEventBatch.eventBatchIds.length > 0) {
					let lastBatchId = groupIdToEventBatch.eventBatchIds[groupIdToEventBatch.eventBatchIds.length - 1] // start from lowest id
					// reduce the generated id by a millisecond in order to fetch the instance with lastBatchId, too (would throw OutOfSync, otherwise if the instance with lasBatchId is the only one in the list)
					let startId = timestampToGeneratedId(generatedIdToTimestamp(lastBatchId) - 1)
					return this._entity.loadAll(EntityEventBatchTypeRef, groupIdToEventBatch.groupId, startId)
					           .then(eventBatchesOnServer => {
						           const batchesToQueue: QueuedBatch[] = []
						           for (let batch of eventBatchesOnServer) {
							           const batchId = getElementId(batch)
							           if (groupIdToEventBatch.eventBatchIds.indexOf(batchId) === -1 && firstBiggerThanSecond(batchId, lastBatchId)) {
								           batchesToQueue.push({groupId: groupIdToEventBatch.groupId, batchId, events: batch.events})
							           }
						           }
						           // Good scenario: we know when we stopped, we can process events we did not process yet and catch up the server
						           //
						           //
						           // [4, 3, 2, 1]                          - processed events, lastBatchId =1
						           // load from lowest id 1 -1
						           // [0.9, 1, 2, 3, 4, 5, 6, 7, 8]         - last X events from server
						           // => [5, 6, 7, 8]                       - batches to queue
						           //
						           // Bad scenario: we don' know where we stopped, server doesn't have events to fill the gap anymore, we cannot fix the index.
						           // [4, 3, 2, 1] - processed events, lastBatchId = 1
						           // [7, 5, 9, 10] - last events from server
						           // => [7, 5, 9, 10] - batches to queue - nothing has been processed before so we are out of sync

						           if (eventBatchesOnServer.length === batchesToQueue.length) {
							           // Bad scenario happened.
							           // None of the events we want to process were processed before, we're too far away, stop the process and delete
							           // the index.
							           throw new OutOfSyncError()
						           }
						           this.addBatchesToQueue(batchesToQueue)
					           })
					           .catch(NotAuthorizedError, () => {
						           console.log("could not download entity updates => lost permission on list")
					           })
				}
			})
			.then(() => this.startProcessing())
	}

	/**
	 * @private a map from group id to event batches
	 */
	_loadPersistentGroupData(user: User): Promise<{groupId: Id, eventBatchIds: Id[]}[]> {
		return this.db.dbFacade.createTransaction(true, [GroupDataOS]).then(t => {
			return Promise.all(filterIndexMemberships(user).map(membership => {
				return t.get(GroupDataOS, membership.group).then((groupData: ?GroupData) => {
					if (groupData) {
						return {
							groupId: membership.group,
							eventBatchIds: groupData.lastBatchIds
						}
					} else {
						throw Error("no group data for group " + membership.group)
					}
				})
			}))
		})
	}

	_processEntityEvents(batch: QueuedBatch, futureActions: FutureBatchActions): Promise<void> {
		const {events, groupId, batchId} = batch
		return this.db.initialized.then(() => {
			if (!this._core.indexingSupported) {
				return Promise.resolve()
			}

			if (filterIndexMemberships(this._initParams.user).map(m => m.group).indexOf(groupId) === -1) {
				return Promise.resolve()
			}
			if (this._indexedGroupIds.indexOf(groupId) === -1) {
				return Promise.resolve()
			}
			performance.mark("processEntityEvents-start")
			let indexUpdate = _createNewIndexUpdate(groupId)
			indexUpdate.batchId = [groupId, batchId]
			let groupedEvents: Map<TypeRef<any>, EntityUpdate[]> = events.reduce((all: Map<TypeRef<any>, EntityUpdate[]>, update: EntityUpdate) => {
				let type = new TypeRef(update.application, update.type)
				if (isSameTypeRef(type, MailTypeRef)) {
					neverNull(all.get(MailTypeRef)).push(update)
				} else if (isSameTypeRef(type, ContactTypeRef)) {
					neverNull(all.get(ContactTypeRef)).push(update)
				} else if (isSameTypeRef(type, GroupInfoTypeRef)) {
					neverNull(all.get(GroupInfoTypeRef)).push(update)
				} else if (isSameTypeRef(type, UserTypeRef)) {
					neverNull(all.get(UserTypeRef)).push(update)
				} else if (isSameTypeRef(type, WhitelabelChildTypeRef)) {
					neverNull(all.get(WhitelabelChildTypeRef)).push(update)
				}
				return all
			}, new Map([
				[MailTypeRef, []], [ContactTypeRef, []], [GroupInfoTypeRef, []], [UserTypeRef, []],
				[WhitelabelChildTypeRef, []]
			]))
			performance.mark("processEvent-start")

			return Promise
				.all([
					this._mail.processEntityEvents(neverNull(groupedEvents.get(MailTypeRef)), groupId, batchId, indexUpdate, futureActions),
					this._contact.processEntityEvents(neverNull(groupedEvents.get(ContactTypeRef)), groupId, batchId, indexUpdate),
					this._groupInfo.processEntityEvents(neverNull(groupedEvents.get(GroupInfoTypeRef)), groupId, batchId, indexUpdate, this._initParams.user),
					this._whitelabelChildIndexer.processEntityEvents(neverNull(groupedEvents.get(WhitelabelChildTypeRef)), groupId, batchId, indexUpdate, this._initParams.user),
					this._processUserEntityEvents(neverNull(groupedEvents.get(UserTypeRef)))
				])
				.then(() => {
					performance.mark("processEvent-end")
					performance.measure("processEvent", "processEvent-start", "processEvent-end")
					performance.mark("writeIndexUpdate-start")
					return this._core.writeIndexUpdate(indexUpdate)
				})
				.then(() => {
					performance.mark("writeIndexUpdate-end")
					performance.measure("writeIndexUpdate", "writeIndexUpdate-start", "writeIndexUpdate-end")
					performance.mark("processEntityEvents-end")
					performance.measure("processEntityEvents", "processEntityEvents-start", "processEntityEvents-end")
					// measure([
					// 	"processEntityEvents", "processEvent", "writeIndexUpdate", "processNewMail", "processNewMail_load",
					// 	"processNewMail_createIndexEnties", "insertNewElementData", "insertNewElementData_get", "insertNewElementData_put",
					// 	"insertNewIndexEntries", "insertNewIndexEntries_getMeta", "insertNewIndexEntries_putIndexNew",
					// 	"insertNewIndexEntries_getRow", "insertNewIndexEntries_putIndex",
					// 	"insertNewIndexEntries_putMeta"
					// ])
				})
		}).catch(CancelledError, noOp)
	}

	_processUserEntityEvents(events: EntityUpdate[]): Promise<void> {
		return Promise.all(events.map(event => {
			if (event.operation === OperationType.UPDATE && isSameId(this._initParams.user._id, event.instanceId)) {
				return this._entity.load(UserTypeRef, event.instanceId).then(updatedUser => {
					this._initParams.user = updatedUser
				})
			}
			return Promise.resolve()
		})).return()
	}

}




