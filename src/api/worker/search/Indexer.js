//@flow
import type {GroupTypeEnum} from "../../common/TutanotaConstants"
import {GroupType, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../common/TutanotaConstants"
import {EntityWorker} from "../EntityWorker"
import {NotAuthorizedError} from "../../common/error/RestError"
import {EntityEventBatchTypeRef} from "../../entities/sys/EntityEventBatch"
import type {DbTransaction} from "./DbFacade"
import {DbFacade, GroupDataOS, MetaDataOS} from "./DbFacade"
import {GENERATED_MAX_ID, isSameId, isSameTypeRef, TypeRef} from "../../common/EntityFunctions"
import {defer, neverNull} from "../../common/utils/Utils"
import {hash} from "../crypto/Sha256"
import {
	generatedIdToTimestamp,
	stringToUtf8Uint8Array,
	timestampToGeneratedId,
	uint8ArrayToBase64
} from "../../common/utils/Encoding"
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
import {EventQueue} from "./EventQueue"
import {WhitelabelChildTypeRef} from "../../entities/sys/WhitelabelChild"
import {WhitelabelChildIndexer} from "./WhitelabelChildIndexer"
import {contains} from "../../common/utils/ArrayUtils"
import {CancelledError} from "../../common/error/CancelledError"
import {random} from "../crypto/Randomizer"

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
		this._core = new IndexerCore(this.db, new EventQueue(() => this._processEntityEventFromQueue()))
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
							           .then(() => {
								           return this._updateIndexedGroups()
							           })
							           .then(() => {
								           this._dbInitializedCallback()
							           })
						} else {
							this.db.key = decrypt256Key(userGroupKey, userEncDbKey)
							return t.get(MetaDataOS, Metadata.encDbIv).then(encDbIv => {
								this.db.iv = aes256Decrypt(this.db.key, encDbIv, true, false)
							}).then(() => Promise.all([
								t.get(MetaDataOS, Metadata.mailIndexingEnabled).then(mailIndexingEnabled => {
									this._mail.mailIndexingEnabled = mailIndexingEnabled
								}),
								t.get(MetaDataOS, Metadata.excludedListIds).then(excludedListIds => {
									this._mail._excludedListIds = excludedListIds
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
			}).catch(CancelledError, e => {
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
			return this._mail.enableMailIndexing(this._initParams.user)
		})
	}

	disableMailIndexing(): Promise<void> {
		return this.db.initialized.then(() => {
			return this._mail.disableMailIndexing().then(() => {
				return this.init(this._initParams.user, this._initParams.groupKey)
			})
		})
	}

	cancelMailIndexing(): Promise<void> {
		return this._mail.cancelMailIndexing()
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
			return Promise.reject(new CancelledError("user has been removed from contact or mail group")) // user has been removed from a shared group
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
			           .catch(NotAuthorizedError, e => {
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
		this._core.queue.queue()
		return Promise.map(groupIdToEventBatches, (groupIdToEventBatch) => {
			if (groupIdToEventBatch.eventBatchIds.length > 0) {
				let lastBatchId = groupIdToEventBatch.eventBatchIds[groupIdToEventBatch.eventBatchIds.length - 1] // start from lowest id
				// reduce the generated id by a millisecond in order to fetch the instance with lastBatchId, too (would throw OutOfSync, otherwise if the instance with lasBatchId is the only one in the list)
				let startId = timestampToGeneratedId(generatedIdToTimestamp(lastBatchId) - 1)
				return this._entity.loadAll(EntityEventBatchTypeRef, groupIdToEventBatch.groupId, startId)
				           .then(eventBatches => {
					           let processedEntityEvents = eventBatches.filter((batch) =>
						           groupIdToEventBatch.eventBatchIds.indexOf(batch._id[1]) !== -1)
					           if (processedEntityEvents.length === 0) {
						           throw new OutOfSyncError()
					           }
					           return Promise.map(eventBatches, batch => {
						           if (groupIdToEventBatch.eventBatchIds.indexOf(batch._id[1]) === -1) {
							           return this.processEntityEvents(batch.events, groupIdToEventBatch.groupId, batch._id[1])
						           }
					           }, {concurrency: 5})
				           })
				           .catch(NotAuthorizedError, e => {
					           console.log("could not download entity updates => lost permission on list")
				           })
			}
		}, {concurrency: 1})
		              .finally(() => this._core.queue.processNext())
		              .return()
	}

	/**
	 * @private a map from group id to event batches
	 */
	_loadPersistentGroupData(user: User): Promise<{groupId: Id, eventBatchIds: Id[]}[]> {
		return this.db.dbFacade.createTransaction(true, [GroupDataOS]).then(t => {
			return Promise.all(filterIndexMemberships(user).map(membership => {
				return t.get(GroupDataOS, membership.group).then((groupData: GroupData) => {
					return {
						groupId: membership.group,
						eventBatchIds: groupData.lastBatchIds
					}
				})
			}))
		})
	}

	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id): Promise<void> {
		return this.db.initialized.then(() => {
			if (!this._core.indexingSupported) {
				return Promise.resolve()
			}
			if (this._core.queue.queueEvents) {
				this._core.queue.eventQueue.push({events, groupId, batchId})
				return Promise.resolve()
			}

			if (filterIndexMemberships(this._initParams.user).map(m => m.group).indexOf(groupId) === -1) {
				return Promise.resolve()
			}
			if (this._indexedGroupIds.indexOf(groupId) === -1) {
				return Promise.resolve()
			}
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

			this._core.queue.queue()
			return Promise.all([
				this._mail.processEntityEvents(neverNull(groupedEvents.get(MailTypeRef)), groupId, batchId, indexUpdate),
				this._contact.processEntityEvents(neverNull(groupedEvents.get(ContactTypeRef)), groupId, batchId, indexUpdate),
				this._groupInfo.processEntityEvents(neverNull(groupedEvents.get(GroupInfoTypeRef)), groupId, batchId, indexUpdate, this._initParams.user),
				this._whitelabelChildIndexer.processEntityEvents(neverNull(groupedEvents.get(WhitelabelChildTypeRef)), groupId, batchId, indexUpdate, this._initParams.user),
				this._processUserEntityEvents(neverNull(groupedEvents.get(UserTypeRef)))
			]).then(() => {
				return this._core.writeIndexUpdate(indexUpdate)
			}).finally(() => {
				this._core.queue.processNext()
			})
		})
	}

	_processEntityEventFromQueue() {
		if (this._core.queue.eventQueue.length > 0) {
			let next = this._core.queue.eventQueue.shift()
			this.processEntityEvents(next.events, next.groupId, next.batchId)
		}
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




