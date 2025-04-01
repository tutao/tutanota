import {
	ENTITY_EVENT_BATCH_TTL_DAYS,
	getMembershipGroupType,
	GroupType,
	NOTHING_INDEXED_TIMESTAMP,
	OperationType,
} from "../../../common/api/common/TutanotaConstants.js"
import { ConnectionError, NotAuthorizedError, NotFoundError } from "../../../common/api/common/error/RestError.js"
import type { EntityUpdate, GroupMembership, User } from "../../../common/api/entities/sys/TypeRefs.js"
import { EntityEventBatch, EntityEventBatchTypeRef, UserTypeRef } from "../../../common/api/entities/sys/TypeRefs.js"
import type { DatabaseEntry, DbKey, DbTransaction } from "../../../common/api/worker/search/DbFacade.js"
import { b64UserIdHash, DbFacade } from "../../../common/api/worker/search/DbFacade.js"
import { contains, daysToMillis, defer, downcast, first, isNotNull, last, millisToDays, neverNull, noOp, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { firstBiggerThanSecond, GENERATED_MAX_ID, getElementId, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import { filterIndexMemberships } from "../../../common/api/worker/search/IndexUtils.js"
import type { GroupData } from "../../../common/api/worker/search/SearchTypes.js"
import { IndexingErrorReason } from "../../../common/api/worker/search/SearchTypes.js"
import { ContactIndexer } from "./ContactIndexer.js"
import { ContactList, ContactListTypeRef, ContactTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { MailIndexer } from "./MailIndexer.js"
import { IndexerCore } from "./IndexerCore.js"
import { OutOfSyncError } from "../../../common/api/common/error/OutOfSyncError.js"
import { DbError } from "../../../common/api/common/error/DbError.js"
import type { QueuedBatch } from "../../../common/api/worker/EventQueue.js"
import { EventQueue } from "../../../common/api/worker/EventQueue.js"
import { CancelledError } from "../../../common/api/common/error/CancelledError.js"
import { MembershipRemovedError } from "../../../common/api/common/error/MembershipRemovedError.js"
import { InvalidDatabaseStateError } from "../../../common/api/common/error/InvalidDatabaseStateError.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { deleteObjectStores } from "../../../common/api/worker/utils/DbUtils.js"
import { aes256EncryptSearchIndexEntry, aes256RandomKey, AesKey, decryptKey, IV_BYTE_LENGTH, random, unauthenticatedAesDecrypt } from "@tutao/tutanota-crypto"
import { CacheInfo } from "../../../common/api/worker/facades/LoginFacade.js"
import { InfoMessageHandler } from "../../../common/gui/InfoMessageHandler.js"
import {
	ElementDataOS,
	EncryptedIndexerMetaData,
	GroupDataOS,
	Metadata,
	MetaDataOS,
	SearchIndexMetaDataOS,
	SearchIndexOS,
	SearchIndexWordsIndex,
	SearchTermSuggestionsOS,
} from "../../../common/api/worker/search/IndexTables.js"
import { KeyLoaderFacade } from "../../../common/api/worker/facades/KeyLoaderFacade.js"
import { getIndexerMetaData, updateEncryptionMetadata } from "../../../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { encryptKeyWithVersionedKey, VersionedKey } from "../../../common/api/worker/crypto/CryptoWrapper.js"
import { EntityUpdateData, entityUpdatesAsData } from "../../../common/api/common/utils/EntityUpdateUtils"
import { Indexer, IndexerInitParams } from "./Indexer"
import { EncryptedDbWrapper } from "../../../common/api/worker/search/EncryptedDbWrapper"
import { DbStub } from "../../../../test/tests/api/worker/search/DbStub"
import { DateProvider } from "../../../common/api/common/DateProvider"

export type InitParams = {
	user: User
	keyLoaderFacade: KeyLoaderFacade
}

const DB_VERSION: number = 3

export function initSearchIndexObjectStores(db: IDBDatabase | DbStub) {
	db.createObjectStore(SearchIndexOS, {
		autoIncrement: true,
	})
	const metaOS = db.createObjectStore(SearchIndexMetaDataOS, {
		autoIncrement: true,
		keyPath: "id",
	})
	db.createObjectStore(ElementDataOS)
	db.createObjectStore(MetaDataOS)
	db.createObjectStore(GroupDataOS)
	db.createObjectStore(SearchTermSuggestionsOS)
	metaOS.createIndex(SearchIndexWordsIndex, "word", {
		unique: true,
	})
}

export function newSearchIndexDB(): DbFacade {
	return new DbFacade(DB_VERSION, (event, db) => {
		if (event.oldVersion !== DB_VERSION && event.oldVersion !== 0) {
			deleteObjectStores(db, SearchIndexOS, ElementDataOS, MetaDataOS, GroupDataOS, SearchTermSuggestionsOS, SearchIndexMetaDataOS)
		}
		initSearchIndexObjectStores(db)
	})
}

/**
 * Top-level orchestrator for search index.
 *  - Allows enabling/disabling mail indexing
 *  - Coordinates loading of events and dispatching of realtime events
 */
export class IndexedDbIndexer implements Indexer {
	private initDeferred = defer<void>()
	private initParams!: InitParams

	/**
	 * Last batch id per group from initial loading.
	 * In case we get duplicate events from loading and websocket we want to filter them out to avoid processing duplicates.
	 * */
	private initiallyLoadedBatchIdsPerGroup: Map<Id, Id>

	/**
	 * Queue which gets all the websocket events and dispatches them to the other queue. It is paused until we load initial events to avoid
	 * putting events from websocket before initial events.
	 * @private visibleForTesting
	 */
	_realtimeEventQueue: EventQueue
	/** @private visibleForTesting */
	_indexedGroupIds: Array<Id>

	/** @private visibleForTesting */
	readonly eventQueue = new EventQueue("indexer", true, (batch) => this._processEntityEvents(batch))

	constructor(
		private readonly serverDateProvider: DateProvider,
		/** @private visibelForTesting */
		private readonly db: EncryptedDbWrapper,
		private readonly core: IndexerCore,
		private readonly infoMessageHandler: InfoMessageHandler,
		private readonly entity: EntityClient,
		private readonly mailIndexer: MailIndexer,
		private readonly contactIndexer: ContactIndexer,
	) {
		// correctly initialized during init()
		this._indexedGroupIds = []
		this.initiallyLoadedBatchIdsPerGroup = new Map()
		this._realtimeEventQueue = new EventQueue("indexer_realtime", false, (nextElement: QueuedBatch) => {
			// During initial loading we remember the last batch we loaded
			// so if we get updates from EventBusClient here for things that are already loaded we discard them
			const loadedIdForGroup = this.initiallyLoadedBatchIdsPerGroup.get(nextElement.groupId)

			if (loadedIdForGroup == null || firstBiggerThanSecond(nextElement.batchId, loadedIdForGroup)) {
				this.eventQueue.addBatches([nextElement])
			}

			return Promise.resolve()
		})

		this._realtimeEventQueue.pause()
	}

	/**
	 * Opens a new DbFacade and initializes the metadata if it is not there yet
	 */
	async init({ user, keyLoaderFacade, retryOnError, cacheInfo }: IndexerInitParams): Promise<void> {
		this.initParams = {
			user,
			keyLoaderFacade,
		}
		this.initDeferred = defer()

		try {
			await this.db.dbFacade.open(this.getDbId(user))
			await this.mailIndexer.init(user)
			const metaData = await getIndexerMetaData(this.db.dbFacade, MetaDataOS)
			if (metaData == null) {
				const userGroupKey = keyLoaderFacade.getCurrentSymUserGroupKey()
				// database was opened for the first time - create new tables
				await this.createIndexTables(user, userGroupKey)
			} else {
				const userGroupKey = await keyLoaderFacade.loadSymUserGroupKey(metaData.userGroupKeyVersion)
				await this.loadIndexTables(user, userGroupKey, metaData)
			}
			this.initDeferred.resolve()

			await this.infoMessageHandler.onSearchIndexStateUpdate({
				initializing: false,
				mailIndexEnabled: this.mailIndexer.mailIndexingEnabled,
				progress: 0,
				currentMailIndexTimestamp: this.mailIndexer.currentIndexTimestamp,
				aimedMailIndexTimestamp: this.mailIndexer.currentIndexTimestamp,
				indexedMailCount: 0,
				failedIndexingUpTo: null,
			})

			this.core.startProcessing()
			await this.indexOrLoadContactListIfNeeded(user, cacheInfo)
			await this.mailIndexer.mailboxIndexingPromise
			await this.mailIndexer.indexMailboxes(user, this.mailIndexer.currentIndexTimestamp)
			const groupIdToEventBatches = await this._loadPersistentGroupData(user)
			await this._loadAndQueueMissedEntityUpdates(groupIdToEventBatches).catch(ofClass(OutOfSyncError, (e) => this.disableMailIndexing()))
		} catch (e) {
			if (retryOnError !== false && (e instanceof MembershipRemovedError || e instanceof InvalidDatabaseStateError)) {
				// in case of MembershipRemovedError mail or contact group has been removed from user.
				// in case of InvalidDatabaseError no group id has been stored to the database.
				// disable mail indexing and init index again in both cases.
				// do not use this.disableMailIndexing() because db.initialized is not yet resolved.
				// initialized promise will be resolved in this.init later.
				console.log("disable mail indexing and init again", e)
				return this.reCreateIndex()
			} else {
				await this.infoMessageHandler.onSearchIndexStateUpdate({
					initializing: false,
					mailIndexEnabled: this.mailIndexer.mailIndexingEnabled,
					progress: 0,
					currentMailIndexTimestamp: this.mailIndexer.currentIndexTimestamp,
					aimedMailIndexTimestamp: this.mailIndexer.currentIndexTimestamp,
					indexedMailCount: 0,
					failedIndexingUpTo: this.mailIndexer.currentIndexTimestamp,
					error: e instanceof ConnectionError ? IndexingErrorReason.ConnectionLost : IndexingErrorReason.Unknown,
				})

				this.initDeferred.reject(e)
				throw e
			}
		}
	}

	private getDbId(user: User) {
		return b64UserIdHash(user._id)
	}

	private async indexOrLoadContactListIfNeeded(user: User, cacheInfo: CacheInfo | undefined) {
		try {
			const contactsIndexed = await this.contactIndexer.areContactsIndexed()
			if (!contactsIndexed) {
				await this.contactIndexer.indexFullContactList()
			}
			//If we do not have to index the contact list we might still need to download it so we cache it in the offline storage
			else if (cacheInfo?.isNewOfflineDb) {
				const contactList: ContactList = await this.entity.loadRoot(ContactListTypeRef, user.userGroup.group)
				await this.entity.loadAll(ContactTypeRef, contactList.contacts)
			}
		} catch (e) {
			// external users have no contact list.
			if (!(e instanceof NotFoundError)) {
				throw e
			}
		}
	}

	async enableMailIndexing(): Promise<void> {
		await this.initDeferred.promise
		const enabled = await this.mailIndexer.enableMailIndexing()
		if (enabled) {
			this.mailIndexer.doInitialMailIndexing(this.initParams.user).catch(ofClass(CancelledError, noOp))
		}
	}

	async disableMailIndexing(): Promise<void> {
		await this.initDeferred.promise

		if (!this.core.isStoppedProcessing()) {
			await this.deleteIndex(this.initParams.user._id)
			await this.init({
				user: this.initParams.user,
				keyLoaderFacade: this.initParams.keyLoaderFacade,
			})
		}
	}

	async deleteIndex(userId: string): Promise<void> {
		await this.stopProcessing()
		await this.mailIndexer.disableMailIndexing()
	}

	private async stopProcessing() {
		this.eventQueue.pause()

		await this.eventQueue.waitForEmptyQueue()
	}

	extendMailIndex(newOldestTimestamp: number): Promise<void> {
		return this.mailIndexer.extendIndexIfNeeded(this.initParams.user, newOldestTimestamp)
	}

	cancelMailIndexing() {
		this.mailIndexer.cancelMailIndexing()
	}

	async processEntityEvents(updates: readonly EntityUpdateData[], batchId: Id, groupId: Id): Promise<void> {
		this._realtimeEventQueue.addBatches([{ events: updates, batchId, groupId }])
		// Trigger event queue processing in case it was stopped due to an error
		// Realtime queue won't be automatically paused and doesn't need a trigger here. It will be resumed when
		// we loaded all events.
		this._startProcessing()
	}

	/** @private visibleForTesting */
	_startProcessing() {
		this.eventQueue.start()
	}

	private reCreateIndex(): Promise<void> {
		const mailIndexingWasEnabled = this.mailIndexer.mailIndexingEnabled
		return this.mailIndexer.disableMailIndexing().then(() => {
			// do not try to init again on error
			return this.init({
				user: this.initParams.user,
				keyLoaderFacade: this.initParams.keyLoaderFacade,
				retryOnError: false,
			}).then(() => {
				if (mailIndexingWasEnabled) {
					return this.enableMailIndexing()
				}
			})
		})
	}

	private async createIndexTables(user: User, userGroupKey: VersionedKey): Promise<void> {
		const key = aes256RandomKey()
		const iv = random.generateRandomData(IV_BYTE_LENGTH)
		this.db.init({ key, iv })
		const groupBatches = await this._loadGroupData(user)
		const userEncDbKey = encryptKeyWithVersionedKey(userGroupKey, key)
		const transaction = await this.db.dbFacade.createTransaction(false, [MetaDataOS, GroupDataOS])
		await transaction.put(MetaDataOS, Metadata.userEncDbKey, userEncDbKey.key)
		await transaction.put(MetaDataOS, Metadata.mailIndexingEnabled, this.mailIndexer.mailIndexingEnabled)
		await transaction.put(MetaDataOS, Metadata.encDbIv, aes256EncryptSearchIndexEntry(key, iv))
		await transaction.put(MetaDataOS, Metadata.userGroupKeyVersion, userEncDbKey.encryptingKeyVersion)
		await transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, this.serverDateProvider.now())
		await this._initGroupData(groupBatches, transaction)
		await this.updateIndexedGroups()
	}

	private async loadIndexTables(user: User, userGroupKey: AesKey, metaData: EncryptedIndexerMetaData): Promise<void> {
		const key = decryptKey(userGroupKey, metaData.userEncDbKey)
		const iv = unauthenticatedAesDecrypt(key, neverNull(metaData.encDbIv), true)
		this.db.init({ key, iv })
		const groupDiff = await this._loadGroupDiff(user)
		await this._updateGroups(user, groupDiff)
		await this.mailIndexer.updateCurrentIndexTimestamp(user)
		await this.updateIndexedGroups()
		await this.contactIndexer.init()
	}

	private async updateIndexedGroups(): Promise<void> {
		const t: DbTransaction = await this.db.dbFacade.createTransaction(true, [GroupDataOS])
		const indexedGroupIds = await promiseMap(await t.getAll(GroupDataOS), (groupDataEntry: DatabaseEntry) => downcast<Id>(groupDataEntry.key))

		if (indexedGroupIds.length === 0) {
			// tried to index twice, this is probably not our fault
			console.log("no group ids in database, disabling indexer")
			this.disableMailIndexing()
		}

		this._indexedGroupIds = indexedGroupIds
	}

	/** @private visibleForTesting */
	_loadGroupDiff(user: User): Promise<{
		deletedGroups: {
			id: Id
			type: GroupType
		}[]
		newGroups: {
			id: Id
			type: GroupType
		}[]
	}> {
		let currentGroups: Array<{
			id: Id
			type: GroupType
		}> = filterIndexMemberships(user).map((m) => {
			return {
				id: m.group,
				type: getMembershipGroupType(m),
			}
		})
		return this.db.dbFacade.createTransaction(true, [GroupDataOS]).then((t) => {
			return t.getAll(GroupDataOS).then(
				(
					loadedGroups: {
						key: DbKey
						value: GroupData
					}[],
				) => {
					if (!Array.isArray(loadedGroups)) {
						throw new InvalidDatabaseStateError("loadedGroups is not an array")
					}
					let oldGroups = loadedGroups.map((group) => {
						if (typeof group?.key !== "string" || typeof group?.value?.groupType !== "string") {
							throw new InvalidDatabaseStateError(`loaded group is malformed: ${group} ${JSON.stringify(group)}`)
						}
						const id: Id = group.key
						return {
							id,
							type: group.value.groupType,
						}
					})
					let deletedGroups = oldGroups.filter((oldGroup) => !currentGroups.some((m) => m.id === oldGroup.id))
					let newGroups = currentGroups.filter((m) => !oldGroups.some((oldGroup) => m.id === oldGroup.id))
					return {
						deletedGroups,
						newGroups,
					}
				},
			)
		})
	}

	/**
	 * Initializes the index db for new groups of the user, but does not start the actual indexing for those groups.
	 * If the user was removed from a contact or mail group the function throws a CancelledError to delete the complete mail index afterwards.
	 * @private visibleForTesting
	 */
	_updateGroups(
		user: User,
		groupDiff: {
			deletedGroups: {
				id: Id
				type: GroupType
			}[]
			newGroups: {
				id: Id
				type: GroupType
			}[]
		},
	): Promise<void> {
		if (groupDiff.deletedGroups.some((g) => g.type === GroupType.Mail || g.type === GroupType.Contact)) {
			return Promise.reject(new MembershipRemovedError("user has been removed from contact or mail group")) // user has been removed from a shared group
		} else if (groupDiff.newGroups.length > 0) {
			return this._loadGroupData(
				user,
				groupDiff.newGroups.map((g) => g.id),
			).then(
				(
					groupBatches: {
						groupId: Id
						groupData: GroupData
					}[],
				) => {
					return this.db.dbFacade.createTransaction(false, [GroupDataOS]).then((t) => {
						return this._initGroupData(groupBatches, t)
					})
				},
			)
		}

		return Promise.resolve()
	}

	/**
	 * Provides a GroupData object including the last 100 event batch ids for all indexed membership groups of the given user.
	 * @private visibleForTesting
	 */
	_loadGroupData(
		user: User,
		restrictToTheseGroups?: Id[],
	): Promise<
		{
			groupId: Id
			groupData: GroupData
		}[]
	> {
		let memberships = filterIndexMemberships(user)
		const restrictTo = restrictToTheseGroups // type check

		if (restrictTo) {
			memberships = memberships.filter((membership) => contains(restrictTo, membership.group))
		}

		return promiseMap(memberships, (membership: GroupMembership) => {
			// we only need the latest EntityEventBatch to synchronize the index state after reconnect. The lastBatchIds are filled up to 100 with each event we receive.
			return this.entity
				.loadRange(EntityEventBatchTypeRef, membership.group, GENERATED_MAX_ID, 1, true)
				.then((eventBatches) => {
					return {
						groupId: membership.group,
						groupData: {
							lastBatchIds: eventBatches.map((eventBatch) => eventBatch._id[1]),
							indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
							groupType: getMembershipGroupType(membership),
						} as GroupData,
					}
				})
				.catch(
					ofClass(NotAuthorizedError, () => {
						console.log("could not download entity updates => lost permission on list")
						return null
					}),
				)
		}) // sequentially to avoid rate limiting
			.then((data) => data.filter(isNotNull))
	}

	/**
	 * creates the initial group data for all provided group ids
	 * @private visibleForTesting
	 */
	_initGroupData(
		groupBatches: {
			groupId: Id
			groupData: GroupData
		}[],
		t2: DbTransaction,
	): Promise<void> {
		for (const groupIdToLastBatchId of groupBatches) {
			t2.put(GroupDataOS, groupIdToLastBatchId.groupId, groupIdToLastBatchId.groupData)
		}
		return t2.wait()
	}

	/**
	 * Load entity events since the last processed event for each group. Add them to the {@link this.eventQueue}.
	 * It is similar to what {@link EventBusClient} doeson reconnect or after login with offline.
	 * @private visibleForTesting
	 */
	async _loadAndQueueMissedEntityUpdates(
		groupIdToEventBatches: {
			groupId: Id
			eventBatchIds: Id[]
		}[],
	): Promise<void> {
		const batchesOfAllGroups: QueuedBatch[] = []
		const lastLoadedBatchIdInGroup = new Map<Id, Id>()
		await this.throwIfOutOfDate()

		for (let { eventBatchIds, groupId } of groupIdToEventBatches) {
			// We keep the last 1000 eventBatchIds. This was done in the past to detect out of sync situations,
			// but now it is done based on timestamp (see throwIfOutOfDate()).
			const startId = first(eventBatchIds)
			if (startId == null) {
				continue
			}

			let eventBatchesOnServer: EntityEventBatch[]
			try {
				eventBatchesOnServer = await this.entity.loadAll(EntityEventBatchTypeRef, groupId, startId)
			} catch (e) {
				if (e instanceof NotAuthorizedError) {
					console.log(`could not download entity updates for group ${groupId} => lost permission on list`)
					continue
				}

				throw e
			}
			const batchesToQueue: QueuedBatch[] = eventBatchesOnServer.map((entityEventBatch) => ({
				groupId: groupId,
				batchId: getElementId(entityEventBatch),
				events: entityUpdatesAsData(entityEventBatch.events),
			}))

			const lastBatch = last(batchesToQueue)
			if (lastBatch != null) {
				lastLoadedBatchIdInGroup.set(groupId, lastBatch.batchId)
			}

			batchesOfAllGroups.push(...batchesToQueue)
		}

		// add all batches of all groups in one step to avoid that just some groups are added when a ServiceUnavailableError occurs
		// Add them directly to the core so that they are added before the realtime batches
		this.eventQueue.addBatches(batchesOfAllGroups)

		// Add latest batches per group so that we can filter out overlapping realtime updates later
		this.initiallyLoadedBatchIdsPerGroup = lastLoadedBatchIdInGroup

		this._realtimeEventQueue.resume()

		this._startProcessing()
		await this.writeServerTimestamp()
	}

	/**
	 * @private visibleForTesting
	 */
	_loadPersistentGroupData(user: User): Promise<
		{
			groupId: Id
			eventBatchIds: Id[]
		}[]
	> {
		return this.db.dbFacade.createTransaction(true, [GroupDataOS]).then((t) => {
			return Promise.all(
				filterIndexMemberships(user).map((membership) => {
					return t.get(GroupDataOS, membership.group).then((groupData: GroupData | null) => {
						if (groupData) {
							return {
								groupId: membership.group,
								eventBatchIds: groupData.lastBatchIds,
							}
						} else {
							throw new InvalidDatabaseStateError(
								"no group data for group " + membership.group + " indexedGroupIds: " + this._indexedGroupIds.join(","),
							)
						}
					})
				}),
			)
		})
	}

	/** @private visibleForTesting */
	async _processEntityEvents(batch: QueuedBatch): Promise<any> {
		const { groupId, batchId, events } = batch
		try {
			await this.initDeferred.promise
			if (!this._indexedGroupIds.includes(groupId)) {
				return
			}

			await this.mailIndexer.processEntityEvents(events, groupId, batchId)
			await this.contactIndexer.processEntityEvents(events, groupId, batchId)
			await this.core.writeGroupDataBatchId(groupId, batchId)
		} catch (e) {
			if (e instanceof CancelledError) {
				// no-op
			} else if (e instanceof DbError && this.core.isStoppedProcessing()) {
				console.log("Ignoring DBerror when indexing is disabled", e)
			} else if (e instanceof InvalidDatabaseStateError) {
				console.log("InvalidDatabaseStateError during _processEntityEvents")

				this.stopProcessing()

				return this.reCreateIndex()
			} else {
				throw e
			}
		}
	}

	/**
	 * @private visibleForTesting
	 */
	async _processUserEntityEvents(events: EntityUpdate[]): Promise<void> {
		for (const event of events) {
			if (!(event.operation === OperationType.UPDATE && isSameId(this.initParams.user._id, event.instanceId))) {
				continue
			}
			this.initParams.user = await this.entity.load(UserTypeRef, event.instanceId)
			await updateEncryptionMetadata(this.db.dbFacade, this.initParams.keyLoaderFacade, MetaDataOS)
		}
	}

	private async throwIfOutOfDate(): Promise<void> {
		const transaction = await this.db.dbFacade.createTransaction(true, [MetaDataOS])
		const lastIndexTimeMs = await transaction.get(MetaDataOS, Metadata.lastEventIndexTimeMs)

		if (lastIndexTimeMs != null) {
			const now = this.serverDateProvider.now()

			const timeSinceLastIndex = now - lastIndexTimeMs

			if (timeSinceLastIndex >= daysToMillis(ENTITY_EVENT_BATCH_TTL_DAYS)) {
				throw new OutOfSyncError(
					`we haven't updated the index in ${millisToDays(timeSinceLastIndex)} days. last update was ${new Date(
						neverNull(lastIndexTimeMs),
					).toString()}`,
				)
			}
		}
	}

	private async writeServerTimestamp() {
		const transaction = await this.db.dbFacade.createTransaction(false, [MetaDataOS])

		const now = this.serverDateProvider.now()

		await transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, now)
	}
}
