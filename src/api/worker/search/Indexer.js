//@flow
import type {GroupTypeEnum} from "../../common/TutanotaConstants"
import {
	ENTITY_EVENT_BATCH_TTL_DAYS,
	getMembershipGroupType,
	GroupType,
	NOTHING_INDEXED_TIMESTAMP,
	OperationType
} from "../../common/TutanotaConstants"
import {NotAuthorizedError} from "../../common/error/RestError"
import {EntityEventBatchTypeRef} from "../../entities/sys/EntityEventBatch"
import type {DatabaseEntry, DbKey, DbTransaction, ObjectStoreName} from "./DbFacade"
import {b64UserIdHash, DbFacade} from "./DbFacade"
import type {DeferredObject} from "@tutao/tutanota-utils"
import {generatedIdToTimestamp, timestampToGeneratedId} from "../../common/utils/EntityUtils"
import {
	contains,
	daysToMillis,
	defer,
	downcast,
	getFromMap,
	isSameTypeRef,
	isSameTypeRefByAttr,
	millisToDays,
	neverNull,
	noOp,
	ofClass,
	promiseMap,
	TypeRef
} from "@tutao/tutanota-utils"
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
import type {QueuedBatch} from "./EventQueue"
import {EventQueue} from "./EventQueue"
import {WhitelabelChildTypeRef} from "../../entities/sys/WhitelabelChild"
import {WhitelabelChildIndexer} from "./WhitelabelChildIndexer"
import {CancelledError} from "../../common/error/CancelledError"
import {random} from "../crypto/Randomizer"
import {MembershipRemovedError} from "../../common/error/MembershipRemovedError"
import type {BrowserData} from "../../../misc/ClientConstants"
import {InvalidDatabaseStateError} from "../../common/error/InvalidDatabaseStateError"
import {LocalTimeDateProvider} from "../DateProvider"
import type {GroupMembership} from "../../entities/sys/GroupMembership"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import {EntityClient} from "../../common/EntityClient"
import {firstBiggerThanSecond, GENERATED_MAX_ID, getElementId, isSameId} from "../../common/utils/EntityUtils";
import {deleteObjectStores} from "../utils/DbUtils"

export const Metadata = {
	userEncDbKey: "userEncDbKey",
	mailIndexingEnabled: "mailIndexingEnabled",
	excludedListIds: "excludedListIds", // stored in the database, so the mailbox does not need to be loaded when starting to index mails except spam folder after login
	encDbIv: "encDbIv",
	// server timestamp of the last time we indexed on this client, in millis
	lastEventIndexTimeMs: "lastEventIndexTimeMs"
}

export type InitParams = {
	user: User;
	groupKey: Aes128Key;
}

export type IndexName = string
export const indexName = (indexName: IndexName): string => indexName

export const SearchIndexOS: ObjectStoreName = "SearchIndex"
export const SearchIndexMetaDataOS: ObjectStoreName = "SearchIndexMeta"
export const ElementDataOS: ObjectStoreName = "ElementData"
export const MetaDataOS: ObjectStoreName = "MetaData"
export const GroupDataOS: ObjectStoreName = "GroupMetaData"
export const SearchTermSuggestionsOS: ObjectStoreName = "SearchTermSuggestions"
export const SearchIndexWordsIndex: IndexName = "SearchIndexWords"

const DB_VERSION: number = 3

export function newSearchIndexDB(): DbFacade {
	return new DbFacade(DB_VERSION, (event, db) => {
		if (event.oldVersion !== DB_VERSION && event.oldVersion !== 0) {

			deleteObjectStores(db,
				SearchIndexOS,
				ElementDataOS,
				MetaDataOS,
				GroupDataOS,
				SearchTermSuggestionsOS,
				SearchIndexMetaDataOS
			)
		}

		db.createObjectStore(SearchIndexOS, {autoIncrement: true})
		const metaOS = db.createObjectStore(SearchIndexMetaDataOS, {autoIncrement: true, keyPath: "id"})
		db.createObjectStore(ElementDataOS)
		db.createObjectStore(MetaDataOS)
		db.createObjectStore(GroupDataOS)
		db.createObjectStore(SearchTermSuggestionsOS)
		metaOS.createIndex(SearchIndexWordsIndex, "word", {unique: true})
	})
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
	/**
	 * Last batch id per group from initial loading.
	 * In case we get duplicate events from loading and websocket we want to filter them out to avoid processing duplicates.
	 * */
	_initiallyLoadedBatchIdsPerGroup: Map<Id, Id>;
	/**
	 * Queue which gets all the websocket events and dispatches them to the core. It is paused until we load initial events to avoid
	 * putting events from websocket before initial events.
	 */
	_realtimeEventQueue: EventQueue;

	_core: IndexerCore;
	_entity: EntityClient;
	_entityRestClient: EntityRestClient
	_indexedGroupIds: Array<Id>;

	constructor(entityRestClient: EntityRestClient, worker: WorkerImpl, browserData: BrowserData, defaultEntityRestCache: EntityRestInterface) {
		let deferred = defer()
		this._dbInitializedDeferredObject = deferred
		this.db = {
			dbFacade: newSearchIndexDB(),
			key: neverNull(null),
			iv: neverNull(null),
			initialized: deferred.promise
		} // correctly initialized during init()
		this._worker = worker
		this._core = new IndexerCore(this.db, new EventQueue(true, (batch) => this._processEntityEvents(batch)),
			browserData)
		this._entityRestClient = entityRestClient
		this._entity = new EntityClient(defaultEntityRestCache)
		this._contact = new ContactIndexer(this._core, this.db, this._entity, new SuggestionFacade(ContactTypeRef, this.db))
		this._whitelabelChildIndexer = new WhitelabelChildIndexer(this._core, this.db, this._entity, new SuggestionFacade(WhitelabelChildTypeRef, this.db))
		const dateProvider = new LocalTimeDateProvider()
		this._mail = new MailIndexer(this._core, this.db, worker, entityRestClient, defaultEntityRestCache, dateProvider)
		this._groupInfo = new GroupInfoIndexer(this._core, this.db, this._entity, new SuggestionFacade(GroupInfoTypeRef, this.db))
		this._indexedGroupIds = []
		this._initiallyLoadedBatchIdsPerGroup = new Map()
		this._realtimeEventQueue = new EventQueue(false, (nextElement: QueuedBatch) => {
			const loadedIdForGroup = this._initiallyLoadedBatchIdsPerGroup.get(nextElement.groupId)
			if (loadedIdForGroup == null || firstBiggerThanSecond(nextElement.batchId, loadedIdForGroup)) {
				this._core.addBatchesToQueue([nextElement])
			}
			return Promise.resolve()
		})
		this._realtimeEventQueue.pause()
	}

	/**
	 * Opens a new DbFacade and initializes the metadata if it is not there yet
	 */
	async init(user: User, userGroupKey: Aes128Key, retryOnError: boolean = true): Promise<void> {
		this._initParams = {
			user,
			groupKey: userGroupKey,
		}

		try {
			await this.db.dbFacade.open(b64UserIdHash(user))

			const transaction = await this.db.dbFacade.createTransaction(true, [MetaDataOS])
			const userEncDbKey = await transaction.get(MetaDataOS, Metadata.userEncDbKey)
			if (!userEncDbKey) {
				// database was opened for the first time - create new tables
				await this._createIndexTables(user, userGroupKey)
			} else {
				await this._loadIndexTables(transaction, user, userGroupKey, userEncDbKey)
			}

			await transaction.wait()
			await this._worker.sendIndexState({
				initializing: false,
				mailIndexEnabled: this._mail.mailIndexingEnabled,
				progress: 0,
				currentMailIndexTimestamp: this._mail.currentIndexTimestamp,
				indexedMailCount: 0,
				failedIndexingUpTo: null
			})
			this._core.startProcessing()
			await this._contact.indexFullContactList(user.userGroup.group)
			await this._groupInfo.indexAllUserAndTeamGroupInfosForAdmin(user)
			await this._whitelabelChildIndexer.indexAllWhitelabelChildrenForAdmin(user)
			await this._mail.mailboxIndexingPromise
			await this._mail.indexMailboxes(user, this._mail.currentIndexTimestamp)
			const groupIdToEventBatches = await this._loadPersistentGroupData(user)
			await this._loadNewEntities(groupIdToEventBatches)
			          .catch(ofClass(OutOfSyncError, e => this.disableMailIndexing("OutOfSyncError when loading new entities. "
				          + e.message)))
		} catch (e) {
			if (retryOnError && (e instanceof MembershipRemovedError || e instanceof InvalidDatabaseStateError)) {
				// in case of MembershipRemovedError mail or contact group has been removed from user.
				// in case of InvalidDatabaseError no group id has been stored to the database.
				// disable mail indexing and init index again in both cases.
				// do not use this.disableMailIndexing() because db.initialized is not yet resolved.
				// initialized promise will be resolved in this.init later.
				console.log("disable mail indexing and init again", e)
				return this._reCreateIndex()
			} else {
				await this._worker.sendIndexState({
					initializing: false,
					mailIndexEnabled: this._mail.mailIndexingEnabled,
					progress: 0,
					currentMailIndexTimestamp: this._mail.currentIndexTimestamp,
					indexedMailCount: 0,
					failedIndexingUpTo: this._mail.currentIndexTimestamp
				})
				this._dbInitializedDeferredObject.reject(e)
				throw e
			}
		}
	}

	enableMailIndexing(): Promise<void> {
		return this.db.initialized.then(() => {
			return this._mail.enableMailIndexing(this._initParams.user).then(() => {
				// We don't have to disable mail indexing when it's stopped now
				this._mail.mailboxIndexingPromise.catch(ofClass(CancelledError, noOp))
			})
		})
	}

	/**
	 * @param reason: To pass to the debug logger for find the reason that this is happening at updates
	 * @returns {Promise<R>|Promise<void>}
	 */
	async disableMailIndexing(reason: string): Promise<void> {
		await this.db.initialized
		if (!this._core.isStoppedProcessing()) {
			this._core.stopProcessing()
			this._worker.writeIndexerDebugLog("Disabling mail indexing: " + reason, this._initParams.user)
			await this._mail.disableMailIndexing()
			await this.init(this._initParams.user, this._initParams.groupKey)
		}
	}


	extendMailIndex(newOldestTimestamp: number): Promise<void> {
		return this._mail.extendIndexIfNeeded(this._initParams.user, newOldestTimestamp)
	}

	cancelMailIndexing(): Promise<void> {
		return this._mail.cancelMailIndexing()
	}

	addBatchesToQueue(batches: QueuedBatch[]) {
		this._realtimeEventQueue.addBatches(batches)
	}

	startProcessing() {
		this._core.queue.start()
	}

	async onVisibilityChanged(visible: boolean): Promise<void> {
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

	async _createIndexTables(user: User, userGroupKey: Aes128Key): Promise<void> {
		this.db.key = aes256RandomKey()
		this.db.iv = random.generateRandomData(IV_BYTE_LENGTH)

		const groupBatches = await this._loadGroupData(user)
		const transaction = await this.db.dbFacade.createTransaction(false, [MetaDataOS, GroupDataOS])
		await transaction.put(MetaDataOS, Metadata.userEncDbKey, encrypt256Key(userGroupKey, this.db.key))
		await transaction.put(MetaDataOS, Metadata.mailIndexingEnabled, this._mail.mailIndexingEnabled)
		await transaction.put(MetaDataOS, Metadata.excludedListIds, this._mail._excludedListIds)
		await transaction.put(MetaDataOS, Metadata.encDbIv, aes256Encrypt(this.db.key, this.db.iv, random.generateRandomData(IV_BYTE_LENGTH), true, false))
		await transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, this._entityRestClient.getRestClient().getServerTimestampMs());
		await this._initGroupData(groupBatches, transaction)
		await this._updateIndexedGroups()
		await this._dbInitializedDeferredObject.resolve()
	}


	async _loadIndexTables(transaction: DbTransaction, user: User, userGroupKey: Aes128Key, userEncDbKey: Uint8Array): Promise<void> {
		this.db.key = decrypt256Key(userGroupKey, userEncDbKey)


		const encDbIv = await transaction.get(MetaDataOS, Metadata.encDbIv)
		this.db.iv = aes256Decrypt(this.db.key, neverNull(encDbIv), true, false)

		await Promise.all([
			transaction.get(MetaDataOS, Metadata.mailIndexingEnabled).then(mailIndexingEnabled => {
				this._mail.mailIndexingEnabled = neverNull(mailIndexingEnabled)
			}),
			transaction.get(MetaDataOS, Metadata.excludedListIds).then(excludedListIds => {
				this._mail._excludedListIds = neverNull(excludedListIds)
			}),
			this._loadGroupDiff(user)
			    .then(groupDiff => this._updateGroups(user, groupDiff))
			    .then(() => this._mail.updateCurrentIndexTimestamp(user))
		])

		await this._updateIndexedGroups()
		this._dbInitializedDeferredObject.resolve()

		await Promise.all([
			this._contact.suggestionFacade.load(),
			this._groupInfo.suggestionFacade.load(),
			this._whitelabelChildIndexer.suggestionFacade.load()
		])
	}


	async _updateIndexedGroups(): Promise<void> {
		const t: DbTransaction = await this.db.dbFacade.createTransaction(true, [GroupDataOS])
		const indexedGroupIds = await promiseMap(await t.getAll(GroupDataOS),
			(groupDataEntry: DatabaseEntry) => downcast<Id>(groupDataEntry.key))
		if (indexedGroupIds.length === 0) {
			// tried to index twice, this is probably not our fault
			console.log("no group ids in database, disabling indexer")
			this.disableMailIndexing("no group ids were found in the database")
		}
		this._indexedGroupIds = indexedGroupIds
	}


	_loadGroupDiff(user: User): Promise<{deletedGroups: {id: Id, type: GroupTypeEnum}[], newGroups: {id: Id, type: GroupTypeEnum}[]}> {
		let currentGroups: Array<{id: Id, type: GroupTypeEnum}> = filterIndexMemberships(user).map(m => {
			return {id: m.group, type: getMembershipGroupType(m)}
		})
		return this.db.dbFacade.createTransaction(true, [GroupDataOS]).then(t => {
			return t.getAll(GroupDataOS).then((loadedGroups: {key: DbKey, value: GroupData}[]) => {
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
		return promiseMap(memberships, (membership: GroupMembership) => {
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
			           .catch(ofClass(NotAuthorizedError, () => {
				           console.log("could not download entity updates => lost permission on list")
				           return null
			           }))
		}) // sequentially to avoid rate limiting
			.then((data) => data.filter(Boolean))
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

	async _loadNewEntities(groupIdToEventBatches: {groupId: Id, eventBatchIds: Id[]}[]): Promise<void> {
		const batchesOfAllGroups: QueuedBatch[] = []
		const lastLoadedBatchIdInGroup = new Map<Id, Id>()

		const transaction = await this.db.dbFacade.createTransaction(true, [MetaDataOS])
		const lastIndexTimeMs: ?number = await transaction.get(MetaDataOS, Metadata.lastEventIndexTimeMs)

		await this._throwIfOutOfDate()

		try {
			for (let groupIdToEventBatch of groupIdToEventBatches) {
				if (groupIdToEventBatch.eventBatchIds.length > 0) {
					let startId = this._getStartIdForLoadingMissedEventBatches(groupIdToEventBatch.eventBatchIds)

					let eventBatchesOnServer = []
					eventBatchesOnServer = await this._entity.loadAll(EntityEventBatchTypeRef, groupIdToEventBatch.groupId, startId)

					const batchesToQueue: QueuedBatch[] = []
					for (let batch of eventBatchesOnServer) {
						const batchId = getElementId(batch)
						if (groupIdToEventBatch.eventBatchIds.indexOf(batchId) === -1
							&& firstBiggerThanSecond(batchId, startId)) {
							batchesToQueue.push({groupId: groupIdToEventBatch.groupId, batchId, events: batch.events})
							const lastBatch = lastLoadedBatchIdInGroup.get(groupIdToEventBatch.groupId)
							if (lastBatch == null || firstBiggerThanSecond(batchId, lastBatch)) {
								lastLoadedBatchIdInGroup.set(groupIdToEventBatch.groupId, batchId)
							}
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

					// We only want to do this check for clients that haven't yet saved the index time
					// This can be removed in the future
					if (lastIndexTimeMs == null && eventBatchesOnServer.length === batchesToQueue.length) {
						// Bad scenario happened.
						// None of the events we want to process were processed before, we're too far away, stop the process and delete
						// the index.
						throw new OutOfSyncError(`We lost entity events for group ${groupIdToEventBatch.groupId}. start id was ${startId}`)
					}
					batchesOfAllGroups.push(...batchesToQueue)
				}
			}
		} catch (e) {
			if (e instanceof NotAuthorizedError) {
				console.log("could not download entity updates => lost permission on list")
				return
			}
			throw e
		}

		// add all batches of all groups in one step to avoid that just some groups are added when a ServiceUnavailableError occurs
		// Add them directly to the core so that they are added before the realtime batches
		this._core.addBatchesToQueue(batchesOfAllGroups)
		this._initiallyLoadedBatchIdsPerGroup = lastLoadedBatchIdInGroup
		this._realtimeEventQueue.resume()
		this.startProcessing()
		await this._writeServerTimestamp()
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

	_processEntityEvents(batch: QueuedBatch): Promise<*> {
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
				const groupedEvents: Map<TypeRef<any>, EntityUpdate[]> = new Map() // define map first because Webstorm has problems with type annotations
				events.reduce((all, update) => {
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
					},
					groupedEvents
				)

				markStart("processEvent")
				return promiseMap(groupedEvents.entries(), ([key, value]) => {
					let promise = Promise.resolve()
					if (isSameTypeRef(UserTypeRef, key)) {
						return this._processUserEntityEvents(value)
					}
					const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(key))

					if (isSameTypeRef(MailTypeRef, key)) {
						promise = this._mail.processEntityEvents(value, groupId, batchId, indexUpdate)
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
			.catch(ofClass(CancelledError, noOp))
			.catch(ofClass(DbError, (e) => {
				if (this._core.isStoppedProcessing()) {
					console.log("Ignoring DBerror when indexing is disabled", e)
				} else {
					throw e
				}
			}))
			.catch(ofClass(InvalidDatabaseStateError, (e) => {
				console.log("InvalidDatabaseStateError during _processEntityEvents")
				this._core.stopProcessing()
				return this._reCreateIndex()
			}))
	}

	_processUserEntityEvents(events: EntityUpdate[]): Promise<void> {
		return Promise.all(events.map(event => {
			if (event.operation === OperationType.UPDATE && isSameId(this._initParams.user._id, event.instanceId)) {
				return this._entity.load(UserTypeRef, event.instanceId).then(updatedUser => {
					this._initParams.user = updatedUser
				})
			}
			return Promise.resolve()
		})).then(noOp)
	}

	async _throwIfOutOfDate(): Promise<void> {
		const transaction = await this.db.dbFacade.createTransaction(true, [MetaDataOS])
		const lastIndexTimeMs = await transaction.get(MetaDataOS, Metadata.lastEventIndexTimeMs)
		if (lastIndexTimeMs != null) {
			const now = this._entityRestClient.getRestClient().getServerTimestampMs()
			const timeSinceLastIndex = now - lastIndexTimeMs
			if (timeSinceLastIndex >= daysToMillis(ENTITY_EVENT_BATCH_TTL_DAYS)) {
				throw new OutOfSyncError(`we haven't updated the index in ${millisToDays(timeSinceLastIndex)} days. last update was ${new Date(neverNull(lastIndexTimeMs)).toString()}`)
			}
		}
	}

	async _writeServerTimestamp() {
		const transaction = await this.db.dbFacade.createTransaction(false, [MetaDataOS])
		const now = this._entityRestClient.getRestClient().getServerTimestampMs()
		await transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, now)
	}
}

