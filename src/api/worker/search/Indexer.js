//@flow
import type {GroupTypeEnum} from "../../common/TutanotaConstants"
import {getMembershipGroupType, GroupType, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../common/TutanotaConstants"
import {NotAuthorizedError} from "../../common/error/RestError"
import {EntityEventBatchTypeRef} from "../../entities/sys/EntityEventBatch"
import type {DbTransaction} from "./DbFacade"
import {DbFacade, GroupDataOS, MetaDataOS} from "./DbFacade"
import {
	firstBiggerThanSecond,
	GENERATED_MAX_ID,
	getElementId,
	isSameId,
	isSameTypeRef,
	isSameTypeRefByAttr,
	TypeRef
} from "../../common/EntityFunctions"
import type {DeferredObject} from "../../common/utils/Utils"
import {defer, downcast, neverNull, noOp} from "../../common/utils/Utils"
import {hash} from "../crypto/Sha256"
import {generatedIdToTimestamp, stringToUtf8Uint8Array, timestampToGeneratedId, uint8ArrayToBase64} from "../../common/utils/Encoding"
import {aes256Decrypt, aes256Encrypt, aes256RandomKey, IV_BYTE_LENGTH} from "../crypto/Aes"
import {decrypt256Key, encrypt256Key} from "../crypto/CryptoFacade"
import {_createNewIndexUpdate, filterIndexMemberships, markEnd, markStart, typeRefToTypeInfo} from "./IndexUtils"
import type {Db, GroupData} from "./SearchTypes"
import type {WorkerImpl} from "../WorkerImpl"
import {ContactIndexer} from "./ContactIndexer"
import {MailTypeRef} from "../../entities/tutanota/Mail"
import {ContactTypeRef} from "../../entities/tutanota/Contact"
import {GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import type {User} from "../../entities/sys/User"
import {UserTypeRef} from "../../entities/sys/User"
import {GroupInfoIndexer} from "./GroupInfoIndexer"
import {MailIndexer} from "./MailIndexer"
import {IndexerCore} from "./IndexerCore"
import type {EntityRestClient, EntityRestInterface} from "../rest/EntityRestClient"
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
import type {BrowserData} from "../../../misc/ClientConstants"
import {InvalidDatabaseStateError} from "../../common/error/InvalidDatabaseStateError"
import {getFromMap} from "../../common/utils/MapUtils"
import {LocalTimeDateProvider} from "../DateProvider"
import type {GroupMembership} from "../../entities/sys/GroupMembership"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import {EntityClient} from "../../common/EntityClient"

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
	_dbInitializedDeferredObject: DeferredObject<void>

	_worker: WorkerImpl;
	_initParams: InitParams;

	_contact: ContactIndexer;
	_mail: MailIndexer;
	_groupInfo: GroupInfoIndexer;
	_whitelabelChildIndexer: WhitelabelChildIndexer;

	_core: IndexerCore;
	_entity: EntityClient;
	_indexedGroupIds: Array<Id>;

	constructor(entityRestClient: EntityRestClient, worker: WorkerImpl, browserData: BrowserData, defaultEntityRestCache: EntityRestInterface) {
		let deferred = defer()
		this._dbInitializedDeferredObject = deferred
		this.db = {
			dbFacade: new DbFacade(browserData.indexedDbSupported, () => {
				worker.infoMessage({translationKey: "indexDeleted_msg", args: {}})
			}),
			key: neverNull(null),
			iv: neverNull(null),
			initialized: deferred.promise
		} // correctly initialized during init()
		this._worker = worker
		this._core = new IndexerCore(this.db, new EventQueue(worker, (batch, futureActions) => this._processEntityEvents(batch, futureActions)),
			browserData)
		this._entity = new EntityClient(defaultEntityRestCache)
		this._contact = new ContactIndexer(this._core, this.db, this._entity, new SuggestionFacade(ContactTypeRef, this.db))
		this._whitelabelChildIndexer = new WhitelabelChildIndexer(this._core, this.db, this._entity, new SuggestionFacade(WhitelabelChildTypeRef, this.db))
		const dateProvider = new LocalTimeDateProvider()
		this._mail = new MailIndexer(this._core, this.db, worker, entityRestClient, defaultEntityRestCache, dateProvider)
		this._groupInfo = new GroupInfoIndexer(this._core, this.db, this._entity, new SuggestionFacade(GroupInfoTypeRef, this.db))
		this._indexedGroupIds = []
	}

	/**
	 * Opens a new DbFacade and initializes the metadata if it is not there yet
	 */
	init(user: User, userGroupKey: Aes128Key, retryOnError: boolean = true): Promise<void> {
		this._initParams = {
			user,
			groupKey: userGroupKey,
		}
		return this.db.dbFacade.open(uint8ArrayToBase64(hash(stringToUtf8Uint8Array(user._id)))).then(() => {
			let dbInit = (): Promise<void> => {
				return this.db.dbFacade.createTransaction(true, [MetaDataOS]).then(t => {
					return t.get(MetaDataOS, Metadata.userEncDbKey).then(userEncDbKey => {
						if (!userEncDbKey) {
							// database was opened for the first time - create new tables
							return this._createIndexTables(user, userGroupKey)
						} else {
							return this._loadIndexTables(t, user, userGroupKey, userEncDbKey)
						}
					}).then(() => t.wait())
				})
			}
			return dbInit().then(() => {
				this._worker.sendIndexState({
					initializing: false,
					mailIndexEnabled: this._mail.mailIndexingEnabled,
					progress: 0,
					currentMailIndexTimestamp: this._mail.currentIndexTimestamp,
					indexedMailCount: 0,
					failedIndexingUpTo: null
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
			}).catch(e => {
				if (retryOnError && (e instanceof MembershipRemovedError || e instanceof InvalidDatabaseStateError)) {
					// in case of MembershipRemovedError mail or contact group has been removed from user.
					// in case of InvalidDatabaseError no group id has been stored to the database.
					// disable mail indexing and init index again in both cases.
					// do not use this.disableMailIndexing() because db.initialized is not yet resolved.
					// initialized promise will be resolved in this.init later.
					console.log("disable mail indexing and init again", e)
					return this._reCreateIndex()
				} else {
					throw e
				}
			})
		}).catch(e => {
			this._worker.sendIndexState({
				initializing: false,
				mailIndexEnabled: this._mail.mailIndexingEnabled,
				progress: 0,
				currentMailIndexTimestamp: this._mail.currentIndexTimestamp,
				indexedMailCount: 0,
				failedIndexingUpTo: this._mail.currentIndexTimestamp
			})
			this._dbInitializedDeferredObject.reject(e)
			throw e
		})
	}

	enableMailIndexing(): Promise<void> {
		return this.db.initialized.then(() => {
			return this._mail.enableMailIndexing(this._initParams.user).then(() => {
				// We don't have to disable mail indexing when it's stopped now
				this._mail.mailboxIndexingPromise.catch(CancelledError, noOp)
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


	extendMailIndex(newOldestTimestamp: number): Promise<void> {
		return this._mail.extendIndexIfNeeded(this._initParams.user, newOldestTimestamp)
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

	onVisibilityChanged(visible: boolean) {
		this._core.onVisibilityChanged(visible)
	}

	_reCreateIndex(): Promise<void> {
		const mailIndexingWasEnabled = this._mail.mailIndexingEnabled;
		return this._mail.disableMailIndexing().then(() => {
			// do not try to init again on error
			return this.init(this._initParams.user, this._initParams.groupKey, false).then(() => {
				if (mailIndexingWasEnabled) {
					return this.enableMailIndexing()
				}
			})
		})
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
			           this._dbInitializedDeferredObject.resolve()
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
			this._dbInitializedDeferredObject.resolve()
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
			           if (indexedGroupIds.length === 0) {
				           // tried to index twice, this is probably not our fault
				           console.log("no group ids in database, disabling indexer")
				           this.disableMailIndexing()
			           }
			           this._indexedGroupIds = indexedGroupIds
		           })
	}


	_loadGroupDiff(user: User): Promise<{deletedGroups: {id: Id, type: GroupTypeEnum}[], newGroups: {id: Id, type: GroupTypeEnum}[]}> {
		let currentGroups: Array<{id: Id, type: GroupTypeEnum}> = filterIndexMemberships(user).map(m => {
			return {id: m.group, type: getMembershipGroupType(m)}
		})
		return this.db.dbFacade.createTransaction(true, [GroupDataOS]).then(t => {
			return t.getAll(GroupDataOS).then((loadedGroups: {key: Id | number, value: GroupData}[]) => {
				let oldGroups = loadedGroups.map((group) => {
					const id: Id = downcast(group.key)
					return {id, type: group.value.groupType}
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
			// we only need the latest EntityEventBatch to synchronize the index state after reconnect. The lastBatchIds are filled up to 100 with each event we receive.
			return this._entity.loadRange(EntityEventBatchTypeRef, membership.group, GENERATED_MAX_ID, 1, true)
			           .then(eventBatches => {
				           return {
					           groupId: membership.group,
					           groupData: ({
						           lastBatchIds: eventBatches.map(eventBatch => eventBatch._id[1]),
						           indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						           groupType: getMembershipGroupType(membership)
					           }: GroupData)
				           }
			           })
			           .catch(NotAuthorizedError, () => {
				           console.log("could not download entity updates => lost permission on list")
				           return null
			           })
		}, {concurrency: 1}) // sequentially to avoid rate limiting
		              .filter(r => r != null)
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
		const batchesOfAllGroups: QueuedBatch[] = []
		return Promise
			.each(groupIdToEventBatches, (groupIdToEventBatch) => {
				if (groupIdToEventBatch.eventBatchIds.length > 0) {
					let startId = this._getStartIdForLoadingMissedEventBatches(groupIdToEventBatch.eventBatchIds)
					return this._entity.loadAll(EntityEventBatchTypeRef, groupIdToEventBatch.groupId, startId)
					           .then(eventBatchesOnServer => {
						           const batchesToQueue: QueuedBatch[] = []
						           for (let batch of eventBatchesOnServer) {
							           const batchId = getElementId(batch)
							           if (groupIdToEventBatch.eventBatchIds.indexOf(batchId) === -1
								           && firstBiggerThanSecond(batchId, startId)) {
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
						           batchesOfAllGroups.push(...batchesToQueue)
					           })
					           .catch(NotAuthorizedError, () => {
						           console.log("could not download entity updates => lost permission on list")
					           })
				}
			})
			.then(() => {
				// add all batches of all groups in one step to avoid that just some groups are added when a ServiceUnavailableError occurs
				this.addBatchesToQueue(batchesOfAllGroups)
				this.startProcessing()
			})
	}

	_getStartIdForLoadingMissedEventBatches(lastEventBatchIds: Id[]): Id {
		let newestBatchId = lastEventBatchIds[0]
		let oldestBatchId = lastEventBatchIds[lastEventBatchIds.length - 1]
		// load all EntityEventBatches which are not older than 1 minute before the newest batch
		// to be able to get batches that were overtaken by the newest batch and therefore missed before
		let startId = timestampToGeneratedId(generatedIdToTimestamp(newestBatchId) - 1000 * 60)
		// do not load events that are older than the stored events
		if (!firstBiggerThanSecond(startId, oldestBatchId)) {
			// reduce the generated id by a millisecond in order to fetch the instance with lastBatchId, too (would throw OutOfSync, otherwise if the instance with lasBatchId is the only one in the list)
			startId = timestampToGeneratedId(generatedIdToTimestamp(oldestBatchId) - 1)
		}
		return startId
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
						throw new InvalidDatabaseStateError("no group data for group " + membership.group + " indexedGroupIds: "
							+ this._indexedGroupIds.join(","))
					}
				})
			}))
		})
	}

	_processEntityEvents(batch: QueuedBatch, futureActions: FutureBatchActions): Promise<void> {
		const {events, groupId, batchId} = batch
		return this
			.db.initialized.then(() => {
				if (!this.db.dbFacade.indexingSupported) {
					return Promise.resolve()
				}

				if (filterIndexMemberships(this._initParams.user).map(m => m.group).indexOf(groupId) === -1) {
					return Promise.resolve()
				}
				if (this._indexedGroupIds.indexOf(groupId) === -1) {
					return Promise.resolve()
				}
				markStart("processEntityEvents")
				let groupedEvents: Map<TypeRef<any>, EntityUpdate[]> = events.reduce((all: Map<TypeRef<any>, EntityUpdate[]>, update: EntityUpdate) => {
					if (isSameTypeRefByAttr(MailTypeRef, update.application, update.type)) {
						getFromMap(all, MailTypeRef, () => []).push(update)
					} else if (isSameTypeRefByAttr(ContactTypeRef, update.application, update.type)) {
						getFromMap(all, ContactTypeRef, () => []).push(update)
					} else if (isSameTypeRefByAttr(GroupInfoTypeRef, update.application, update.type)) {
						getFromMap(all, GroupInfoTypeRef, () => []).push(update)
					} else if (isSameTypeRefByAttr(UserTypeRef, update.application, update.type)) {
						getFromMap(all, UserTypeRef, () => []).push(update)
					} else if (isSameTypeRefByAttr(WhitelabelChildTypeRef, update.application, update.type)) {
						getFromMap(all, WhitelabelChildTypeRef, () => []).push(update)
					}
					return all
				}, new Map())

				markStart("processEvent")
				return Promise.each(groupedEvents.entries(), ([key, value]) => {
					let promise = Promise.resolve()
					if (isSameTypeRef(UserTypeRef, key)) {
						return this._processUserEntityEvents(value)
					}
					const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(key))

					if (isSameTypeRef(MailTypeRef, key)) {
						promise = this._mail.processEntityEvents(value, groupId, batchId, indexUpdate, futureActions)
					} else if (isSameTypeRef(ContactTypeRef, key)) {
						promise = this._contact.processEntityEvents(value, groupId, batchId, indexUpdate)
					} else if (isSameTypeRef(GroupInfoTypeRef, key)) {
						promise = this._groupInfo.processEntityEvents(value, groupId, batchId, indexUpdate, this._initParams.user)
					} else if (isSameTypeRef(UserTypeRef, key)) {
						promise = this._processUserEntityEvents(value)
					} else if (isSameTypeRef(WhitelabelChildTypeRef, key)) {
						promise = this._whitelabelChildIndexer.processEntityEvents(value, groupId, batchId, indexUpdate, this._initParams.user)
					}
					return promise.then(() => {
						markEnd("processEvent")
						markStart("writeIndexUpdate")
						return this._core.writeIndexUpdateWithBatchId(groupId, batchId, indexUpdate)
					}).then(() => {
						markEnd("writeIndexUpdate")
						markEnd("processEntityEvents")
						// if (!env.dist && env.mode !== "Test") {
						// 	printMeasure("Update of " + key.type + " " + batch.events.map(e => operationTypeKeys[e.operation]).join(","), [
						// 		"processEntityEvents", "processEvent", "writeIndexUpdate"
						// 	])
						// }
					})
				})
			})
			.catch(CancelledError, noOp)
			.catch(DbError, (e) => {
				if (this._core.isStoppedProcessing()) {
					console.log("Ignoring DBerror when indexing is disabled", e)
				} else {
					throw e
				}
			})
			.catch(InvalidDatabaseStateError, (e) => {
				console.log("InvalidDatabaseStateError during _processEntityEvents")
				this._core.stopProcessing()
				return this._reCreateIndex()
			})
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

