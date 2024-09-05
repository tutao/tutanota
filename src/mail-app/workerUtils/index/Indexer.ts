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
import {
	assertNotNull,
	contains,
	daysToMillis,
	defer,
	DeferredObject,
	downcast,
	getFromMap,
	isNotNull,
	isSameTypeRef,
	isSameTypeRefByAttr,
	millisToDays,
	neverNull,
	noOp,
	ofClass,
	promiseMap,
	TypeRef,
} from "@tutao/tutanota-utils"
import {
	firstBiggerThanSecond,
	GENERATED_MAX_ID,
	generatedIdToTimestamp,
	getElementId,
	isSameId,
	timestampToGeneratedId,
} from "../../../common/api/common/utils/EntityUtils.js"
import { _createNewIndexUpdate, filterIndexMemberships, markEnd, markStart, typeRefToTypeInfo } from "../../../common/api/worker/search/IndexUtils.js"
import type { Db, GroupData } from "../../../common/api/worker/search/SearchTypes.js"
import { IndexingErrorReason } from "../../../common/api/worker/search/SearchTypes.js"
import { ContactIndexer } from "./ContactIndexer.js"
import { ContactList, ContactListTypeRef, ContactTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { MailIndexer } from "./MailIndexer.js"
import { IndexerCore } from "./IndexerCore.js"
import type { EntityRestClient } from "../../../common/api/worker/rest/EntityRestClient.js"
import { OutOfSyncError } from "../../../common/api/common/error/OutOfSyncError.js"
import { SuggestionFacade } from "./SuggestionFacade.js"
import { DbError } from "../../../common/api/common/error/DbError.js"
import type { QueuedBatch } from "../../../common/api/worker/EventQueue.js"
import { EventQueue } from "../../../common/api/worker/EventQueue.js"
import { CancelledError } from "../../../common/api/common/error/CancelledError.js"
import { MembershipRemovedError } from "../../../common/api/common/error/MembershipRemovedError.js"
import type { BrowserData } from "../../../common/misc/ClientConstants.js"
import { InvalidDatabaseStateError } from "../../../common/api/common/error/InvalidDatabaseStateError.js"
import { LocalTimeDateProvider } from "../../../common/api/worker/DateProvider.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { deleteObjectStores } from "../../../common/api/worker/utils/DbUtils.js"
import {
	aes256EncryptSearchIndexEntry,
	aes256RandomKey,
	AesKey,
	BitArray,
	decryptKey,
	IV_BYTE_LENGTH,
	random,
	unauthenticatedAesDecrypt,
} from "@tutao/tutanota-crypto"
import { DefaultEntityRestCache } from "../../../common/api/worker/rest/DefaultEntityRestCache.js"
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
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { KeyLoaderFacade } from "../../../common/api/worker/facades/KeyLoaderFacade.js"
import { getIndexerMetaData, updateEncryptionMetadata } from "../../../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { encryptKeyWithVersionedKey, VersionedKey } from "../../../common/api/worker/crypto/CryptoWrapper.js"

export type InitParams = {
	user: User
	keyLoaderFacade: KeyLoaderFacade
}

const DB_VERSION: number = 3

interface IndexerInitParams {
	user: User
	keyLoaderFacade: KeyLoaderFacade
	retryOnError?: boolean
	cacheInfo?: CacheInfo
}

export function newSearchIndexDB(): DbFacade {
	return new DbFacade(DB_VERSION, (event, db) => {
		if (event.oldVersion !== DB_VERSION && event.oldVersion !== 0) {
			deleteObjectStores(db, SearchIndexOS, ElementDataOS, MetaDataOS, GroupDataOS, SearchTermSuggestionsOS, SearchIndexMetaDataOS)
		}

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
	})
}

export class Indexer {
	readonly db: Db
	private readonly _dbInitializedDeferredObject: DeferredObject<void>
	private _initParams!: InitParams
	readonly _contact: ContactIndexer
	readonly _mail: MailIndexer

	/**
	 * Last batch id per group from initial loading.
	 * In case we get duplicate events from loading and websocket we want to filter them out to avoid processing duplicates.
	 * */
	_initiallyLoadedBatchIdsPerGroup: Map<Id, Id>

	/**
	 * Queue which gets all the websocket events and dispatches them to the core. It is paused until we load initial events to avoid
	 * putting events from websocket before initial events.
	 */
	_realtimeEventQueue: EventQueue
	_core: IndexerCore
	_entity: EntityClient
	_entityRestClient: EntityRestClient
	_indexedGroupIds: Array<Id>

	constructor(
		entityRestClient: EntityRestClient,
		private readonly infoMessageHandler: InfoMessageHandler,
		browserData: BrowserData,
		defaultEntityRestCache: DefaultEntityRestCache,
		mailFacade: MailFacade,
	) {
		let deferred = defer<void>()
		this._dbInitializedDeferredObject = deferred
		this.db = {
			dbFacade: newSearchIndexDB(),
			key: downcast<BitArray>(null),
			iv: downcast<Uint8Array>(null),
			initialized: deferred.promise,
		}
		// correctly initialized during init()
		this._core = new IndexerCore(this.db, new EventQueue("indexer_core", true, (batch) => this._processEntityEvents(batch)), browserData)
		this._entityRestClient = entityRestClient
		this._entity = new EntityClient(defaultEntityRestCache)
		this._contact = new ContactIndexer(this._core, this.db, this._entity, new SuggestionFacade(ContactTypeRef, this.db))
		const dateProvider = new LocalTimeDateProvider()
		this._mail = new MailIndexer(this._core, this.db, this.infoMessageHandler, entityRestClient, defaultEntityRestCache, dateProvider, mailFacade)
		this._indexedGroupIds = []
		this._initiallyLoadedBatchIdsPerGroup = new Map()
		this._realtimeEventQueue = new EventQueue("indexer_realtime", false, (nextElement: QueuedBatch) => {
			// During initial loading we remember the last batch we loaded
			// so if we get updates from EventBusClient here for things that are already loaded we discard them
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
	async init({ user, keyLoaderFacade, retryOnError, cacheInfo }: IndexerInitParams): Promise<void> {
		this._initParams = {
			user,
			keyLoaderFacade,
		}

		try {
			if (cacheInfo?.isPersistent) {
				this._mail.setIsUsingOfflineCache(cacheInfo.isPersistent)
			}
			await this.db.dbFacade.open(this.getDbId(user))
			const metaData = await getIndexerMetaData(this.db.dbFacade, MetaDataOS)
			if (metaData == null) {
				const userGroupKey = keyLoaderFacade.getCurrentSymUserGroupKey()
				// database was opened for the first time - create new tables
				await this.createIndexTables(user, userGroupKey)
			} else {
				const userGroupKey = await keyLoaderFacade.loadSymUserGroupKey(metaData.userGroupKeyVersion)
				await this.loadIndexTables(user, userGroupKey, metaData)
			}

			await this.infoMessageHandler.onSearchIndexStateUpdate({
				initializing: false,
				mailIndexEnabled: this._mail.mailIndexingEnabled,
				progress: 0,
				currentMailIndexTimestamp: this._mail.currentIndexTimestamp,
				aimedMailIndexTimestamp: this._mail.currentIndexTimestamp,
				indexedMailCount: 0,
				failedIndexingUpTo: null,
			})

			this._core.startProcessing()
			await this.indexOrLoadContactListIfNeeded(user, cacheInfo)
			await this._mail.mailboxIndexingPromise
			await this._mail.indexMailboxes(user, this._mail.currentIndexTimestamp)
			const groupIdToEventBatches = await this._loadPersistentGroupData(user)
			await this._loadNewEntities(groupIdToEventBatches).catch(ofClass(OutOfSyncError, (e) => this.disableMailIndexing()))
		} catch (e) {
			if (retryOnError !== false && (e instanceof MembershipRemovedError || e instanceof InvalidDatabaseStateError)) {
				// in case of MembershipRemovedError mail or contact group has been removed from user.
				// in case of InvalidDatabaseError no group id has been stored to the database.
				// disable mail indexing and init index again in both cases.
				// do not use this.disableMailIndexing() because db.initialized is not yet resolved.
				// initialized promise will be resolved in this.init later.
				console.log("disable mail indexing and init again", e)
				return this._reCreateIndex()
			} else {
				await this.infoMessageHandler.onSearchIndexStateUpdate({
					initializing: false,
					mailIndexEnabled: this._mail.mailIndexingEnabled,
					progress: 0,
					currentMailIndexTimestamp: this._mail.currentIndexTimestamp,
					aimedMailIndexTimestamp: this._mail.currentIndexTimestamp,
					indexedMailCount: 0,
					failedIndexingUpTo: this._mail.currentIndexTimestamp,
					error: e instanceof ConnectionError ? IndexingErrorReason.ConnectionLost : IndexingErrorReason.Unknown,
				})

				this._dbInitializedDeferredObject.reject(e)

				throw e
			}
		}
	}

	private getDbId(user: User) {
		return b64UserIdHash(user._id)
	}

	private async indexOrLoadContactListIfNeeded(user: User, cacheInfo: CacheInfo | undefined) {
		try {
			const contactList: ContactList = await this._entity.loadRoot(ContactListTypeRef, user.userGroup.group)
			const indexTimestamp = await this._contact.getIndexTimestamp(contactList)
			if (indexTimestamp === NOTHING_INDEXED_TIMESTAMP) {
				await this._contact.indexFullContactList(contactList)
			}
			//If we do not have to index the contact list we might still need to download it so we cache it in the offline storage
			else if (cacheInfo?.isNewOfflineDb) {
				await this._entity.loadAll(ContactTypeRef, contactList.contacts)
			}
		} catch (e) {
			// external users have no contact list.
			if (!(e instanceof NotFoundError)) {
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

	async disableMailIndexing(): Promise<void> {
		await this.db.initialized

		if (!this._core.isStoppedProcessing()) {
			await this.deleteIndex(this._initParams.user._id)
			await this.init({
				user: this._initParams.user,
				keyLoaderFacade: this._initParams.keyLoaderFacade,
			})
		}
	}

	async deleteIndex(userId: string): Promise<void> {
		this._core.stopProcessing()
		await this._mail.disableMailIndexing(userId)
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
		const mailIndexingWasEnabled = this._mail.mailIndexingEnabled
		return this._mail.disableMailIndexing(assertNotNull(this._initParams.user._id)).then(() => {
			// do not try to init again on error
			return this.init({
				user: this._initParams.user,
				keyLoaderFacade: this._initParams.keyLoaderFacade,
				retryOnError: false,
			}).then(() => {
				if (mailIndexingWasEnabled) {
					return this.enableMailIndexing()
				}
			})
		})
	}

	private async createIndexTables(user: User, userGroupKey: VersionedKey): Promise<void> {
		this.db.key = aes256RandomKey()
		this.db.iv = random.generateRandomData(IV_BYTE_LENGTH)
		const groupBatches = await this._loadGroupData(user)
		const userEncDbKey = encryptKeyWithVersionedKey(userGroupKey, this.db.key)
		const transaction = await this.db.dbFacade.createTransaction(false, [MetaDataOS, GroupDataOS])
		await transaction.put(MetaDataOS, Metadata.userEncDbKey, userEncDbKey.key)
		await transaction.put(MetaDataOS, Metadata.mailIndexingEnabled, this._mail.mailIndexingEnabled)
		await transaction.put(MetaDataOS, Metadata.encDbIv, aes256EncryptSearchIndexEntry(this.db.key, this.db.iv))
		await transaction.put(MetaDataOS, Metadata.userGroupKeyVersion, userEncDbKey.encryptingKeyVersion)
		await transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, this._entityRestClient.getRestClient().getServerTimestampMs())
		await this._initGroupData(groupBatches, transaction)
		await this._updateIndexedGroups()
		this._dbInitializedDeferredObject.resolve()
	}

	private async loadIndexTables(user: User, userGroupKey: AesKey, metaData: EncryptedIndexerMetaData): Promise<void> {
		this.db.key = decryptKey(userGroupKey, metaData.userEncDbKey)
		this.db.iv = unauthenticatedAesDecrypt(this.db.key, neverNull(metaData.encDbIv), true)
		this._mail.mailIndexingEnabled = metaData.mailIndexingEnabled
		const groupDiff = await this._loadGroupDiff(user)
		await this._updateGroups(user, groupDiff)
		await this._mail.updateCurrentIndexTimestamp(user)
		await this._updateIndexedGroups()
		this._dbInitializedDeferredObject.resolve()
		await this._contact.suggestionFacade.load()
	}

	async _updateIndexedGroups(): Promise<void> {
		const t: DbTransaction = await this.db.dbFacade.createTransaction(true, [GroupDataOS])
		const indexedGroupIds = await promiseMap(await t.getAll(GroupDataOS), (groupDataEntry: DatabaseEntry) => downcast<Id>(groupDataEntry.key))

		if (indexedGroupIds.length === 0) {
			// tried to index twice, this is probably not our fault
			console.log("no group ids in database, disabling indexer")
			this.disableMailIndexing()
		}

		this._indexedGroupIds = indexedGroupIds
	}

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
	 *
	 * Initializes the index db for new groups of the user, but does not start the actual indexing for those groups.
	 * If the user was removed from a contact or mail group the function throws a CancelledError to delete the complete mail index afterwards.
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
			return this._entity
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

	async _loadNewEntities(
		groupIdToEventBatches: {
			groupId: Id
			eventBatchIds: Id[]
		}[],
	): Promise<void> {
		const batchesOfAllGroups: QueuedBatch[] = []
		const lastLoadedBatchIdInGroup = new Map<Id, Id>()
		const transaction = await this.db.dbFacade.createTransaction(true, [MetaDataOS])
		const lastIndexTimeMs: number | null = await transaction.get(MetaDataOS, Metadata.lastEventIndexTimeMs)
		await this._throwIfOutOfDate()

		try {
			for (let groupIdToEventBatch of groupIdToEventBatches) {
				if (groupIdToEventBatch.eventBatchIds.length > 0) {
					let startId = this._getStartIdForLoadingMissedEventBatches(groupIdToEventBatch.eventBatchIds)

					let eventBatchesOnServer: EntityEventBatch[] = []
					eventBatchesOnServer = await this._entity.loadAll(EntityEventBatchTypeRef, groupIdToEventBatch.groupId, startId)
					const batchesToQueue: QueuedBatch[] = []

					for (let batch of eventBatchesOnServer) {
						const batchId = getElementId(batch)

						if (groupIdToEventBatch.eventBatchIds.indexOf(batchId) === -1 && firstBiggerThanSecond(batchId, startId)) {
							batchesToQueue.push({
								groupId: groupIdToEventBatch.groupId,
								batchId,
								events: batch.events,
							})
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

		// Add latest batches per group so that we can filter out overlapping realtime updates later
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

	_processEntityEvents(batch: QueuedBatch): Promise<any> {
		const { events, groupId, batchId } = batch
		return this.db.initialized
			.then(async () => {
				if (!this.db.dbFacade.indexingSupported) {
					return Promise.resolve()
				}

				if (
					filterIndexMemberships(this._initParams.user)
						.map((m) => m.group)
						.indexOf(groupId) === -1
				) {
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
					} else if (isSameTypeRefByAttr(UserTypeRef, update.application, update.type)) {
						getFromMap(all, UserTypeRef, () => []).push(update)
					}

					return all
				}, groupedEvents)
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
					}

					return promise
						.then(() => {
							markEnd("processEvent")
							markStart("writeIndexUpdate")
							return this._core.writeIndexUpdateWithBatchId(groupId, batchId, indexUpdate)
						})
						.then(() => {
							markEnd("writeIndexUpdate")
							markEnd("processEntityEvents") // if (!env.dist && env.mode !== "Test") {
							// 	printMeasure("Update of " + key.type + " " + batch.events.map(e => operationTypeKeys[e.operation]).join(","), [
							// 		"processEntityEvents", "processEvent", "writeIndexUpdate"
							// 	])
							// }
						})
				})
			})
			.catch(ofClass(CancelledError, noOp))
			.catch(
				ofClass(DbError, (e) => {
					if (this._core.isStoppedProcessing()) {
						console.log("Ignoring DBerror when indexing is disabled", e)
					} else {
						throw e
					}
				}),
			)
			.catch(
				ofClass(InvalidDatabaseStateError, (e) => {
					console.log("InvalidDatabaseStateError during _processEntityEvents")

					this._core.stopProcessing()

					return this._reCreateIndex()
				}),
			)
	}

	/**
	 * @VisibleForTesting
	 * @param events
	 */
	async _processUserEntityEvents(events: EntityUpdate[]): Promise<void> {
		for (const event of events) {
			if (!(event.operation === OperationType.UPDATE && isSameId(this._initParams.user._id, event.instanceId))) {
				continue
			}
			this._initParams.user = await this._entity.load(UserTypeRef, event.instanceId)
			await updateEncryptionMetadata(this.db.dbFacade, this._initParams.keyLoaderFacade, MetaDataOS)
		}
	}

	async _throwIfOutOfDate(): Promise<void> {
		const transaction = await this.db.dbFacade.createTransaction(true, [MetaDataOS])
		const lastIndexTimeMs = await transaction.get(MetaDataOS, Metadata.lastEventIndexTimeMs)

		if (lastIndexTimeMs != null) {
			const now = this._entityRestClient.getRestClient().getServerTimestampMs()

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

	async _writeServerTimestamp() {
		const transaction = await this.db.dbFacade.createTransaction(false, [MetaDataOS])

		const now = this._entityRestClient.getRestClient().getServerTimestampMs()

		await transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, now)
	}
}
