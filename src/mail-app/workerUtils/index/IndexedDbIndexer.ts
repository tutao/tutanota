import { daysToMillis, ENTITY_EVENT_BATCH_TTL_DAYS, GroupType, NOTHING_INDEXED_TIMESTAMP, OperationType } from "@tutao/appEnv"
import { restError } from "@tutao/restClient"
import {
	ClientTypeModelResolver,
	entityUpdateUtils,
	getMembershipGroupType,
	isSameId,
	sysTypeRefs,
	timestampToGeneratedId,
	tutanotaTypeRefs,
} from "@tutao/typeRefs"
import type { DatabaseEntry, DbKey, DbTransaction } from "../../../common/api/worker/search/DbFacade.js"
import { b64UserIdHash, DbFacade } from "../../../common/api/worker/search/DbFacade.js"
import { contains, defer, downcast, isNotNull, isSameTypeRef, millisToDays, neverNull, promiseMap } from "@tutao/utils"
import { filterIndexMemberships } from "../../../common/api/common/utils/IndexUtils.js"
import type { GroupData } from "../../../common/api/worker/search/SearchTypes.js"
import { IndexingErrorReason } from "../../../common/api/worker/search/SearchTypes.js"
import { ContactIndexer } from "./ContactIndexer.js"
import { MailIndexer } from "./MailIndexer.js"
import { IndexerCore } from "./IndexerCore.js"
import { DbError } from "../../../common/api/common/error/DbError.js"
import type { QueuedBatch } from "../../../common/api/worker/EventQueue.js"
import { EventQueue } from "../../../common/api/worker/EventQueue.js"
import { CancelledError } from "../../../common/api/common/error/CancelledError.js"
import { MembershipRemovedError } from "../../../common/api/common/error/MembershipRemovedError.js"
import { InvalidDatabaseStateError } from "../../../common/api/common/error/InvalidDatabaseStateError.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { deleteObjectStores } from "../../../common/api/worker/utils/DbUtils.js"
import { aes256EncryptSearchIndexEntry, aes256RandomKey, aesDecryptUnauthenticated, AesKey, decryptKey, IV_BYTE_LENGTH, random } from "@tutao/crypto"
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
import { _encryptKeyWithVersionedKey, VersionedKey } from "@tutao/instancePipeline"
import { Indexer, IndexerInitParams } from "./Indexer"
import { EncryptedDbWrapper } from "../../../common/api/worker/search/EncryptedDbWrapper"
import { DateProvider } from "../../../common/api/common/DateProvider"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"
import { IndexingNotSupportedError } from "../../../common/api/common/error/IndexingNotSupportedError"
import { OutOfSyncError } from "../../../common/api/common/error/OutOfSyncError"

export type InitParams = {
	user: sysTypeRefs.User
}

const DB_VERSION: number = 3

export function initSearchIndexObjectStores(db: IDBDatabase) {
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
 * Group membership changes
 */
export interface GroupDiff {
	deletedGroups: GroupDiffGroup[]
	newGroups: GroupDiffGroup[]
}

/**
 * A single group addition or removal composite in GroupDiff
 */
export interface GroupDiffGroup {
	id: Id
	type: GroupType
}

/**
 * Provides a group ID and corresponding group data
 */
export interface LoadedGroupData {
	groupId: Id
	groupData: GroupData
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
	 * Queue which gets all the websocket events and dispatches them to the other queue. It is paused until we load initial events to avoid
	 * putting events from websocket before initial events.
	 * @private visibleForTesting
	 */
	eventQueue: EventQueue = new EventQueue("indexer_realtime", (batch: QueuedBatch) => this._processEntityEvents(batch))
	constructor(
		private readonly serverDateProvider: DateProvider,
		/** @private visibleForTesting */
		private readonly db: EncryptedDbWrapper,
		private readonly core: IndexerCore,
		private readonly infoMessageHandler: InfoMessageHandler,
		private readonly entity: EntityClient,
		private readonly mailIndexer: MailIndexer,
		private readonly contactIndexer: ContactIndexer,
		private readonly typeModelResolver: ClientTypeModelResolver,
		private readonly keyLoaderFacade: KeyLoaderFacade,
	) {}

	async partialLoginInit() {
		// no-op: this is not intended to be used offline / partial login
	}

	/**
	 * Opens a new DbFacade and initializes the metadata if it is not there yet
	 */
	async fullLoginInit({ user, retryOnError }: IndexerInitParams): Promise<void> {
		this.initParams = {
			user,
		}
		this.initDeferred = defer()

		try {
			const dbId = this.getDbId(user)
			await this.db.dbFacade.open(dbId)
			await this.mailIndexer.init(user)
			const metaData = await getIndexerMetaData(this.db.dbFacade, MetaDataOS)
			if (metaData == null) {
				const userGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey()
				// database was opened for the first time - create new tables
				await this.createIndexTables(user, userGroupKey)
			} else {
				const userGroupKey = await this.keyLoaderFacade.loadSymUserGroupKey(metaData.userGroupKeyVersion)
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
			await this.indexOrLoadContactListIfNeeded()
			await this.mailIndexer.mailboxIndexingPromise

			this.eventQueue.pause()
			this.mailIndexer.indexMailboxes(user, this.mailIndexer.currentIndexTimestamp).then(() => this.eventQueue.resume())
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
					error: e instanceof restError.ConnectionError ? IndexingErrorReason.ConnectionLost : IndexingErrorReason.Unknown,
				})

				this.initDeferred.reject(e)
				this.db.initWithError(new IndexingNotSupportedError("indexer could not be initializer", e))
				throw e
			}
		}
	}

	private getDbId(user: sysTypeRefs.User) {
		return b64UserIdHash(user._id)
	}

	private async indexOrLoadContactListIfNeeded() {
		try {
			const contactsIndexed = await this.contactIndexer.areContactsIndexed()
			if (!contactsIndexed) {
				await this.contactIndexer.indexFullContactList()
			}
		} catch (e) {
			// external users have no contact list.
			if (!(e instanceof restError.NotFoundError)) {
				throw e
			}
		}
	}

	async enableMailIndexing(): Promise<void> {
		await this.initDeferred.promise
		const enabled = await this.mailIndexer.enableMailIndexing()
		if (enabled) {
			this.eventQueue.pause()
			await this.mailIndexer.doInitialMailIndexing(this.initParams.user)
			this.eventQueue.resume()
		}
	}

	async disableMailIndexing(): Promise<void> {
		await this.initDeferred.promise

		if (!this.core.isStoppedProcessing()) {
			await this.deleteIndex(this.initParams.user._id)
			await this.fullLoginInit({
				user: this.initParams.user,
			})
		}
	}

	async deleteIndex(userId: string): Promise<void> {
		// pause the queue immediately
		this.eventQueue.pause()
		// signal mail indexer that it should stop and abort any processing
		this.mailIndexer.cancelMailIndexing()
		// make core abort any operations
		this.core.stopProcessing()
		// wait for queue to become empty
		await this.eventQueue.waitForEmptyQueue()
		// delete the index
		await this.db.dbFacade.deleteDatabase(b64UserIdHash(userId))
	}

	/** @private VisibleForTesting */
	async _stopProcessing() {
		this.core.stopProcessing()
		this.eventQueue.pause()
		this.mailIndexer.cancelMailIndexing()

		await this.eventQueue.waitForEmptyQueue()
	}

	async extendMailIndex(newOldestTimestamp: number): Promise<void> {
		await this.initDeferred.promise
		try {
			this.eventQueue.pause()
			await this.mailIndexer.extendIndexIfNeeded(this.initParams.user, newOldestTimestamp)
			this.eventQueue.resume()
		} catch (e) {
			if (e instanceof CancelledError) {
				// no-op
			} else {
				throw e
			}
		}
	}

	cancelMailIndexing() {
		this.mailIndexer.cancelMailIndexing()
		this.eventQueue.resume()
	}

	async processEntityEvents(updates: readonly entityUpdateUtils.EntityUpdateData[], batchId: Id, groupId: Id): Promise<void> {
		try {
			await this.throwIfOutOfDate()
			await this.writeServerTimestamp()
		} catch (e) {
			if (e instanceof OutOfSyncError) {
				await this.disableMailIndexing()
			}
		}
		this.eventQueue.addBatches([{ events: updates, batchId, groupId }])
		// Trigger event queue processing in case it was stopped due to an error
		// Realtime queue won't be automatically paused and doesn't need a trigger here. It will be resumed when
		// we loaded all events.
		this._startProcessing()
	}

	/** @private visibleForTesting */
	_startProcessing() {
		this.eventQueue.start()
	}

	private async reCreateIndex(): Promise<void> {
		const mailIndexingWasEnabled = this.mailIndexer.mailIndexingEnabled
		this.mailIndexer.cancelMailIndexing()
		await this.deleteIndex(this.initParams.user._id)
		// do not try to init again on error
		await this.fullLoginInit({
			user: this.initParams.user,
			retryOnError: false,
		})
		if (mailIndexingWasEnabled) {
			await this.enableMailIndexing()
		}
	}

	private async createIndexTables(user: sysTypeRefs.User, userGroupKey: VersionedKey): Promise<void> {
		const key = aes256RandomKey()
		const iv = random.generateRandomData(IV_BYTE_LENGTH)
		this.db.init({ key, iv })
		const groupBatches = await this._loadGroupData(user)
		const userEncDbKey = _encryptKeyWithVersionedKey(userGroupKey, key)
		const transaction = await this.db.dbFacade.createTransaction(false, [MetaDataOS, GroupDataOS])
		await transaction.put(MetaDataOS, Metadata.userEncDbKey, userEncDbKey.key)
		await transaction.put(MetaDataOS, Metadata.mailIndexingEnabled, this.mailIndexer.mailIndexingEnabled)
		await transaction.put(MetaDataOS, Metadata.encDbIv, aes256EncryptSearchIndexEntry(key, iv))
		await transaction.put(MetaDataOS, Metadata.userGroupKeyVersion, userEncDbKey.encryptingKeyVersion)
		await transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, this.serverDateProvider.now())
		await this._initGroupData(groupBatches, transaction)
		await this.updateIndexedGroups()
	}

	private async loadIndexTables(user: sysTypeRefs.User, userGroupKey: AesKey, metaData: EncryptedIndexerMetaData): Promise<void> {
		const key = decryptKey(userGroupKey, metaData.userEncDbKey)
		const iv = aesDecryptUnauthenticated(key, neverNull(metaData.encDbIv))
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

		this.core.indexedGroupIds = indexedGroupIds
	}

	/** @private visibleForTesting */
	_loadGroupDiff(user: sysTypeRefs.User): Promise<GroupDiff> {
		let currentGroups: Array<GroupDiffGroup> = filterIndexMemberships(user)
			.concat(user.userGroup)
			.map((m) => {
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
	async _updateGroups(user: sysTypeRefs.User, groupDiff: GroupDiff): Promise<void> {
		if (groupDiff.deletedGroups.some((g) => g.type === GroupType.Mail || g.type === GroupType.Contact)) {
			throw new MembershipRemovedError("user has been removed from contact or mail group") // user has been removed from a shared group
		}

		if (groupDiff.newGroups.length > 0) {
			const groupBatches = await this._loadGroupData(
				user,
				groupDiff.newGroups.map((g) => g.id),
			)
			const transaction = await this.db.dbFacade.createTransaction(false, [GroupDataOS])
			await this._initGroupData(groupBatches, transaction)
		}
	}

	/**
	 * Provides a GroupData object including the last 100 event batch ids for all indexed membership groups of the given user.
	 * @private visibleForTesting
	 */
	_loadGroupData(user: sysTypeRefs.User, restrictToTheseGroups?: Id[]): Promise<LoadedGroupData[]> {
		let memberships = filterIndexMemberships(user).concat(user.userGroup)

		const restrictTo = restrictToTheseGroups // type check

		if (restrictTo) {
			memberships = memberships.filter((membership) => contains(restrictTo, membership.group))
		}

		return promiseMap(memberships, async (membership: sysTypeRefs.GroupMembership) => {
			const FIVE_SECONDS_IN_MILLISECONDS = 5000
			const lastProcessedBatchId =
				(await this.core.getLastProcessedEventBatchIdForGroup(membership.group)) ??
				timestampToGeneratedId(this.serverDateProvider.now() - FIVE_SECONDS_IN_MILLISECONDS)
			this.core.indexedGroupIds.push(membership.group)
			return {
				groupId: membership.group,
				groupData: {
					lastBatchIds: [lastProcessedBatchId],
					indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
					groupType: getMembershipGroupType(membership),
				} as GroupData,
			}
		}).then((data) => data.filter(isNotNull))
	}

	/**
	 * creates the initial group data for all provided group ids
	 * @private visibleForTesting
	 */
	_initGroupData(groupBatches: LoadedGroupData[], t2: DbTransaction): Promise<void> {
		for (const groupIdToLastBatchId of groupBatches) {
			t2.put(GroupDataOS, groupIdToLastBatchId.groupId, groupIdToLastBatchId.groupData)
		}
		return t2.wait()
	}

	/** @private visibleForTesting */
	async _processEntityEvents(batch: QueuedBatch): Promise<any> {
		const { groupId, batchId, events } = batch
		try {
			await this.initDeferred.promise

			await this._processUserEntityEvents(events)
			await this.processMailEntityEvents(events)
			await this.mailIndexer.processEntityEvents(events, groupId, batchId)
			await this.contactIndexer.processEntityEvents(events, groupId, batchId)
			await this.core.putLastBatchIdForGroup(groupId, batchId)
		} catch (e) {
			if (e instanceof CancelledError) {
				// no-op
			} else if (e instanceof DbError && this.core.isStoppedProcessing()) {
				console.log("Ignoring DBerror when indexing is disabled", e)
			} else if (e instanceof InvalidDatabaseStateError) {
				console.log("InvalidDatabaseStateError during _processEntityEvents")

				this._stopProcessing()

				return this.reCreateIndex()
			} else {
				throw e
			}
		}
	}

	/**
	 * Process all mail entity events and delegates them to the indexer.
	 *
	 * This is required because we do not use cache handlers, so we have to call these methods on MailIndexer ourselves.
	 *
	 * ATTENTION: Must be called before the group batch ID is written.
	 */
	private async processMailEntityEvents(events: Iterable<entityUpdateUtils.EntityUpdateData>) {
		for (const event of events) {
			if (entityUpdateUtils.isUpdateForTypeRef(tutanotaTypeRefs.MailTypeRef, event)) {
				const mailId: IdTuple = [event.instanceListId, event.instanceId]
				try {
					switch (event.operation) {
						case OperationType.DELETE:
							await this.mailIndexer.afterMailDeleted(mailId)
							break
						case OperationType.UPDATE:
							await this.mailIndexer.afterMailUpdated(mailId)
							break
						case OperationType.CREATE:
							await this.mailIndexer.afterMailCreated(mailId)
							break
					}
				} catch (e) {
					if (e instanceof restError.NotAuthorizedError || e instanceof restError.NotFoundError) {
						continue
					} else {
						throw e
					}
				}
			}
		}
	}

	/**
	 * @private visibleForTesting
	 */
	async _processUserEntityEvents(events: readonly entityUpdateUtils.EntityUpdateData[]): Promise<void> {
		for (const event of events) {
			if (
				!(
					event.operation === OperationType.UPDATE &&
					isSameTypeRef(sysTypeRefs.UserTypeRef, event.typeRef) &&
					isSameId(this.initParams.user._id, event.instanceId)
				)
			) {
				continue
			}
			this.initParams.user = await this.entity.load(sysTypeRefs.UserTypeRef, event.instanceId)
			await updateEncryptionMetadata(this.db.dbFacade, this.keyLoaderFacade, MetaDataOS)
		}
	}

	private async throwIfOutOfDate(): Promise<void> {
		const lastIndexTimeMs = await this.readServerTimestamp()

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

	private async readServerTimestamp() {
		const transaction = await this.db.dbFacade.createTransaction(true, [MetaDataOS])
		const lastIndexTimeMs = await transaction.get(MetaDataOS, Metadata.lastEventIndexTimeMs)
		return lastIndexTimeMs
	}

	private async writeServerTimestamp() {
		const transaction = await this.db.dbFacade.createTransaction(false, [MetaDataOS])

		const now = this.serverDateProvider.now()

		await transaction.put(MetaDataOS, Metadata.lastEventIndexTimeMs, now)
	}

	async resizeMailIndex(_: number) {
		throw new ProgrammingError("resizeMailIndex can only be called with offline storage")
	}

	async rebuildMailIndex() {
		await this.mailIndexer.rebuildIndex(this.initParams.user)
	}
}
