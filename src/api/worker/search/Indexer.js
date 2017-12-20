//@flow
import type {GroupTypeEnum} from "../../common/TutanotaConstants"
import {NOTHING_INDEXED_TIMESTAMP, GroupType, OperationType} from "../../common/TutanotaConstants"
import {EntityWorker} from "../EntityWorker"
import {NotAuthorizedError} from "../../common/error/RestError"
import {EntityEventBatchTypeRef} from "../../entities/sys/EntityEventBatch"
import type {DbTransaction} from "./DbFacade"
import {DbFacade, MetaDataOS, GroupDataOS} from "./DbFacade"
import {GENERATED_MAX_ID, isSameTypeRef, TypeRef, isSameId} from "../../common/EntityFunctions"
import {neverNull} from "../../common/utils/Utils"
import {hash} from "../crypto/Sha256"
import {
	uint8ArrayToBase64,
	stringToUtf8Uint8Array,
	generatedIdToTimestamp,
	timestampToGeneratedId
} from "../../common/utils/Encoding"
import {aes256RandomKey} from "../crypto/Aes"
import {encrypt256Key, decrypt256Key} from "../crypto/CryptoFacade"
import {userIsAdmin, filterIndexMemberships, _createNewIndexUpdate} from "./IndexUtils"
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

export const Metadata = {
	userEncDbKey: "userEncDbKey",
	mailIndexingEnabled: "mailIndexingEnabled",
	excludedListIds: "excludedListIds"
}

export type InitParams = {
	user: User;
	groupKey: Aes128Key;
}

type QueuedBatch = {
	events: EntityUpdate[], groupId: Id, batchId: Id
}

export class Indexer {
	_queueEvents: boolean;
	_eventQueue: QueuedBatch[];
	db: Db;

	_worker: WorkerImpl;
	_initParams: InitParams;

	_contact: ContactIndexer;
	_mail: MailIndexer;
	_groupInfo: GroupInfoIndexer;
	_core: IndexerCore;
	_entity: EntityWorker;

	constructor(entityRestClient: EntityRestClient, worker: WorkerImpl) {
		this._queueEvents = false
		this._eventQueue = []
		this.db = ({dbFacade: new DbFacade()}:any) // correctly initialized during init()
		this._worker = worker
		this._core = new IndexerCore(this.db)
		this._entity = new EntityWorker()
		this._contact = new ContactIndexer(this._core, this.db, this._entity, new SuggestionFacade(ContactTypeRef, this.db))
		this._mail = new MailIndexer(this._core, this.db, this._entity, worker, entityRestClient)
		this._groupInfo = new GroupInfoIndexer(this._core, this.db, this._entity, new SuggestionFacade(GroupInfoTypeRef, this.db))
	}

	/**
	 * Opens a new DbFacade and initializes the metadata if it is not there yet
	 */
	init(user: User, userGroupKey: Aes128Key) {
		this._initParams = {
			user,
			groupKey: userGroupKey,
		}
		return this.db.dbFacade.open(uint8ArrayToBase64(hash(stringToUtf8Uint8Array(user._id)))).then(facade => {
			let dbInit = (): Promise<void> => {
				let t = this.db.dbFacade.createTransaction(true, [MetaDataOS])
				return t.get(MetaDataOS, Metadata.userEncDbKey).then(userEncDbKey => {
					if (!userEncDbKey) {
						return this._loadGroupData(user).then((groupBatches: {groupId: Id, groupData: GroupData}[]) => {
							let t2 = this.db.dbFacade.createTransaction(false, [MetaDataOS, GroupDataOS])
							this.db.key = aes256RandomKey()
							t2.put(MetaDataOS, Metadata.userEncDbKey, encrypt256Key(userGroupKey, this.db.key))
							t2.put(MetaDataOS, Metadata.mailIndexingEnabled, this._mail.mailIndexingEnabled)
							t2.put(MetaDataOS, Metadata.excludedListIds, this._mail._excludedListIds)
							return this._initGroupData(groupBatches, t2)
						})
					} else {
						this.db.key = decrypt256Key(userGroupKey, userEncDbKey)
						return Promise.all([
							t.get(MetaDataOS, Metadata.mailIndexingEnabled).then(mailIndexingEnabled => {
								this._mail.mailIndexingEnabled = mailIndexingEnabled
							}),
							t.get(MetaDataOS, Metadata.excludedListIds).then(excludedListIds => {
								this._mail._excludedListIds = excludedListIds
							}),
							this._groupDiff(user).then(groupDiff => this._updateGroups(user, groupDiff)).then(() => this._mail.updateCurrentIndexTimestamp(user)),
							this._contact._suggestionFacade.load(),
							this._groupInfo._suggestionFacade.load()
						]).return()
					}
				})
			}
			return dbInit().then(() => {
				this._worker.sendIndexState({
					indexingSupported: this._core.indexingSupported,
					mailIndexEnabled: this._mail.mailIndexingEnabled,
					progress: 0,
					currentMailIndexTimestamp: this._mail.currentIndexTimestamp
				})
				return this._contact.indexFullContactList(user.userGroup.group)
					.then(() => this._groupInfo.indexAllUserAndTeamGroupInfosForAdmin(user))
					.then(() => this._loadPersistentGroupData(user).then(groupIdToEventBatches => this._loadNewEntities(groupIdToEventBatches)))
					.catch(OutOfSyncError, e => {
						console.log("out of sync - delete database and disable mail indexing")
						return this.disableMailIndexing()
					})
			})
		}).catch(DbError, e => {
			console.log("Indexing not supported", e)
			this._core.indexingSupported = false
			this._worker.sendIndexState({
				indexingSupported: this._core.indexingSupported,
				mailIndexEnabled: this._mail.mailIndexingEnabled,
				progress: 0,
				currentMailIndexTimestamp: this._mail.currentIndexTimestamp
			})
		})
	}

	enableMailIndexing(): Promise<void> {
		return this._mail.enableMailIndexing(this._initParams.user)
	}

	disableMailIndexing(): Promise<void> {
		return this._mail.disableMailIndexing().then(() => {
			return this.init(this._initParams.user, this._initParams.groupKey)
		})
	}

	cancelMailIndexing(): Promise<void> {
		return this._mail.cancelMailIndexing()
	}

	_groupDiff(user: User): Promise<{deletedGroups: {id: Id, type: GroupTypeEnum}[], newGroups: {id: Id, type: GroupTypeEnum}[]}> {
		let currentGroups = filterIndexMemberships(user).map(m => {
			return {id: m.group, type: neverNull(m.groupType)}
		})
		let t = this.db.dbFacade.createTransaction(true, [GroupDataOS])
		return t.getAll(GroupDataOS).then((loadedGroups: {key: Id, value: GroupData}[]) => {
			let oldGroups = loadedGroups.map((group: {key: Id, value: GroupData}) => {
				return {id: group.key, type: group.value.groupType}
			})
			let deletedGroups = oldGroups.filter(oldGroup => currentGroups.find(m => m.id == oldGroup.id) == null)
			let newGroups = currentGroups.filter(m => oldGroups.find(oldGroup => m.id == oldGroup.id) == null)
			return {
				deletedGroups,
				newGroups
			}
		})
	}

	_updateGroups(user: User, groupDiff: {deletedGroups: {id: Id, type: GroupTypeEnum}[], newGroups: {id: Id, type: GroupTypeEnum}[]}): Promise<void> {
		if (groupDiff.deletedGroups.filter(g => g.type === GroupType.Mail || g.type === GroupType.Contact).length > 0) {
			return this.disableMailIndexing()
		} else if (groupDiff.newGroups.length > 0) {
			return this._loadGroupData(user).then((groupBatches: {groupId: Id, groupData: GroupData}[]) => {
				let t = this.db.dbFacade.createTransaction(false, [GroupDataOS])
				return this._initGroupData(groupBatches, t).then(() => {
					let newMailGroups = groupDiff.newGroups.filter(g => g.type === GroupType.Mail)
					if (newMailGroups.length > 0) {
						this._mail.mailboxIndexingPromise.then(() => this._mail.indexMailbox(user, this._mail.currentIndexTimestamp)) // FIXME move to MailIndexer?
					}
				})
			})
		}
		return Promise.resolve()
	}

	_loadGroupData(user: User): Promise<{groupId: Id, groupData: GroupData}[]> {
		let memberships = filterIndexMemberships(user)
		return Promise.map(memberships, (membership: GroupMembership) => {
			return this._entity.loadRange(EntityEventBatchTypeRef, membership.group, GENERATED_MAX_ID, 100, true).then(eventBatches => {
				return {
					groupId: membership.group,
					groupData: ({
						lastBatchIds: eventBatches.map(eventBatch => eventBatch._id[1]),
						indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						groupType: neverNull(membership.groupType)
					}:GroupData)
				}
			}).catch(NotAuthorizedError, e => {
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

	_loadNewEntities(groupIdToEventBatches: {groupId:Id, eventBatchIds:Id[]}[]): Promise<void> {
		return Promise.map(groupIdToEventBatches, (groupIdToEventBatch) => {
			if (groupIdToEventBatch.eventBatchIds.length > 0) {
				let lastBatchId = groupIdToEventBatch.eventBatchIds[groupIdToEventBatch.eventBatchIds.length - 1] // start from lowest id
				// reduce the generated id by a millisecond in order to fetch the instance with lastBatchId, too (would throw OutOfSync, otherwise if the instance with lasBatchId is the only one in the list)
				let startId = timestampToGeneratedId(generatedIdToTimestamp(lastBatchId) - 1)
				return this._entity.loadAll(EntityEventBatchTypeRef, groupIdToEventBatch.groupId, startId).then(eventBatches => {
					let processedEntityEvents = eventBatches.filter((batch) => groupIdToEventBatch.eventBatchIds.indexOf(batch._id[1]) !== -1)
					if (processedEntityEvents.length == 0) {
						throw new OutOfSyncError()
					}
					return Promise.map(eventBatches, batch => {
						if (groupIdToEventBatch.eventBatchIds.indexOf(batch._id[1]) == -1) {
							return this.processEntityEvents(batch.events, groupIdToEventBatch.groupId, batch._id[1])
						}
					}, {concurrency: 5})
				}).catch(NotAuthorizedError, e => {
					console.log("could not download entity updates => lost permission on list")
				})
			}
		}, {concurrency: 1}).return()
	}

	/**
	 * @private a map from group id to event batches
	 */
	_loadPersistentGroupData(user: User): Promise<{groupId:Id, eventBatchIds:Id[]}[]> {
		let t = this.db.dbFacade.createTransaction(true, [GroupDataOS])

		return Promise.all(filterIndexMemberships(user).map(membership => {
			return t.get(GroupDataOS, membership.group).then((groupData: GroupData) => {
				return {
					groupId: membership.group,
					eventBatchIds: groupData.lastBatchIds
				}
			})
		}))
	}

	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id): Promise<void> {
		if (!this._indexingSupported) {
			return Promise.resolve()
		}
		if (this._queueEvents) {
			this._eventQueue.push({events, groupId, batchId})
			return Promise.resolve()
		}

		if (filterIndexMemberships(this._initParams.user).map(m => m.group).indexOf(groupId) == -1) {
			console.log("not indexed group", groupId)
			return Promise.resolve()
		}
		let indexUpdate = _createNewIndexUpdate(groupId)
		indexUpdate.batchId = [groupId, batchId]
		let groupedEvents: Map<TypeRef<any>,EntityUpdate[]> = events.reduce((all: Map<TypeRef<any>,EntityUpdate[]>, update: EntityUpdate) => {
			let type = new TypeRef(update.application, update.type)
			if (isSameTypeRef(type, MailTypeRef)) {
				neverNull(all.get(MailTypeRef)).push(update)
			} else if (isSameTypeRef(type, ContactTypeRef)) {
				neverNull(all.get(ContactTypeRef)).push(update)
			} else if (isSameTypeRef(type, GroupInfoTypeRef)) {
				neverNull(all.get(GroupInfoTypeRef)).push(update)
			} else if (isSameTypeRef(type, UserTypeRef)) {
				neverNull(all.get(UserTypeRef)).push(update)
			}
			return all
		}, new Map([[MailTypeRef, []], [ContactTypeRef, []], [GroupInfoTypeRef, []], [UserTypeRef, []]]))

		this._queueEvents = true
		return Promise.all([
			this._mail.processEntityEvents(neverNull(groupedEvents.get(MailTypeRef)), groupId, batchId, indexUpdate),
			this._contact.processEntityEvents(neverNull(groupedEvents.get(ContactTypeRef)), groupId, batchId, indexUpdate),
			this._groupInfo.processEntityEvents(neverNull(groupedEvents.get(GroupInfoTypeRef)), groupId, batchId, indexUpdate, this._initParams.user),
			this._processUserEntityEvents(neverNull(groupedEvents.get(UserTypeRef)))
		]).then(() => {
			return this._core.writeIndexUpdate(indexUpdate)
		}).finally(() => {
			this._queueEvents = false
			if (this._eventQueue.length > 0) {
				let next = this._eventQueue.shift()
				this.processEntityEvents(next.events, next.groupId, next.batchId)
			}
		})
	}

	_processUserEntityEvents(events: EntityUpdate[]): Promise<void> {
		return Promise.all(events.map(event => {
			if (event.operation == OperationType.UPDATE && isSameId(this._initParams.user._id, event.instanceId)) {
				return this._entity.load(UserTypeRef, event.instanceId).then(updatedUser => {
					return this._groupDiff(updatedUser).then(groupDiff => {
						let promises = []
						if (groupDiff.deletedGroups.length == 0 && groupDiff.newGroups.filter(g => g.type == GroupType.Mail).length > 0) {
							promises.push(this._updateGroups(updatedUser, groupDiff))
						}
						if (!userIsAdmin(this._initParams.user) && userIsAdmin(updatedUser)) {
							promises.push(this._groupInfo.indexAllUserAndTeamGroupInfosForAdmin(updatedUser))
						}
						this._initParams.user = updatedUser
						return promises
					})

				})
			}
			return Promise.resolve()
		})).return()
	}

}




