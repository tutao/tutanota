import type {EntityRestInterface} from "./EntityRestClient"
import {EntityRestClient} from "./EntityRestClient"
import {resolveTypeReference} from "../../common/EntityFunctions"
import {OperationType} from "../../common/TutanotaConstants"
import {flat, groupBy, isSameTypeRef, TypeRef} from "@tutao/tutanota-utils"
import {containsEventOfType, getEventOfType} from "../../common/utils/Utils"
import {PermissionTypeRef} from "../../entities/sys/Permission"
import {EntityEventBatchTypeRef} from "../../entities/sys/EntityEventBatch"
import {ValueType} from "../../common/EntityConstants"
import {SessionTypeRef} from "../../entities/sys/Session"
import {BucketPermissionTypeRef} from "../../entities/sys/BucketPermission"
import {SecondFactorTypeRef} from "../../entities/sys/SecondFactor"
import {RecoverCodeTypeRef} from "../../entities/sys/RecoverCode"
import {NotAuthorizedError, NotFoundError} from "../../common/error/RestError"
import {MailTypeRef} from "../../entities/tutanota/Mail"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import {RejectedSenderTypeRef} from "../../entities/sys/RejectedSender"
import {firstBiggerThanSecond, GENERATED_MAX_ID, GENERATED_MIN_ID, getElementId, getLetId} from "../../common/utils/EntityUtils";
import {ProgrammingError} from "../../common/error/ProgrammingError"
import {assertWorkerOrNode, isDesktop} from "../../common/Env"
import type {ListElementEntity, SomeEntity} from "../../common/EntityTypes"
import {EntityUpdateData} from "../../main/EventController"
import {QueuedBatch} from "../search/EventQueue"


assertWorkerOrNode()

export interface IEntityRestCache extends EntityRestInterface {
	/**
	 * Clear out the contents of the cache.
	 */
	purgeStorage(): Promise<void>;

	/**
	 * Get the batch id of the most recently processed batch for the given group.
	 */
	getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null>;

	/**
	 * Gets the current time on the server.
	 */
	getServerTimestampMs(): number;

	/**
	 * Get from the offline cache the last time that entity events were processed.
	 */
	getLastUpdateTime(): Promise<number | null>;

	/**
	 * Writes the last time that entity events were processed to the database.
	 */

	setLastUpdateTime(value: number): Promise<void>;
}


export interface CacheStorage {
	/**
	 * Get a given entity from the cache, expects that you have already checked for existence
	 */
	get<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<T | null>;

	deleteIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<void>;

	isElementIdInCacheRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<boolean>;

	put(originalEntity: SomeEntity): Promise<void>;

	/**
	 * Load range of entities. Does not include {@param start}.
	 * If {@param reverse} is false then returns entities newer than {@param start} in ascending order sorted by
	 * elementId.
	 * If {@param reverse} is true then returns entities older than {@param start} in descending order sorted by
	 * elementId.
	 */
	provideFromRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]>;

	getRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<{lower: Id, upper: Id} | null>;

	setUpperRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<void>;

	setLowerRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<void>;

	/**
	 * Creates a new list cache if there is none. Resets everything but elements.
	 * @param typeRef
	 * @param listId
	 * @param lower
	 * @param upper
	 */
	setNewRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lower: Id, upper: Id): Promise<void>;

	getIdsInRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<Id>>;

	putLastBatchIdForGroup(groupId: Id, batchId: Id): Promise<void>;

	getLastBatchIdForGroup(groupId: Id): Promise<Id | null>;

	purgeStorage(): Promise<void>


	getLastUpdateTime(): Promise<number | null>

	putLastUpdateTime(value: number): Promise<void>
}

export function isUsingOfflineCache() {
	// TODO later: placeholder
	//   might depend on whether we store credentials or not
	return isDesktop()
}

/**
 * This implementation provides a caching mechanism to the rest chain.
 * It forwards requests to the entity rest client.
 * The cache works as follows:
 * If a read from the target fails, the request fails.
 * If a read from the target is successful, the cache is written and the element returned.
 * For LETs the cache stores one range per list id. if a range is requested starting in the stored range or at the range ends the missing elements are loaded from the server.
 * Only ranges with elements with generated ids are stored in the cache. Custom id elements are only stored as single element currently. If needed this has to be extended for ranges.
 * Range requests starting outside the stored range are only allowed if the direction is away from the stored range. In this case we load from the range end to avoid gaps in the stored range.
 * Requests for creating or updating elements are always forwarded and not directly stored in the cache.
 * On EventBusClient notifications updated elements are stored in the cache if the element already exists in the cache.
 * On EventBusClient notifications new elements are only stored in the cache if they are LETs and in the stored range.
 * On EventBusClient notifications deleted elements are removed from the cache.
 *
 * Range handling:
 * |          <|>        c d e f g h i j k      <|>             |
 * MIN_ID  lowerRangeId     ids in rage    upperRangeId    MAX_ID
 * lowerRangeId may be anything from MIN_ID to c, upperRangeId may be anything from k to MAX_ID
 */
export class EntityRestCache implements IEntityRestCache {
	private readonly ignoredTypes: TypeRef<any>[];
	readonly entityRestClient: EntityRestClient;
	private readonly storage: CacheStorage;

	constructor(entityRestClient: EntityRestClient, storage: CacheStorage) {
		this.entityRestClient = entityRestClient
		this.ignoredTypes = [
			EntityEventBatchTypeRef, PermissionTypeRef, BucketPermissionTypeRef, SessionTypeRef,
			SecondFactorTypeRef, RecoverCodeTypeRef, RejectedSenderTypeRef,
		]
		this.storage = storage
	}

	async load<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		id: PropertyType<T, "_id">,
		queryParameters?: Dict,
		extraHeaders?: Dict,
	): Promise<T> {
		const {listId, elementId} = expandId(id)

		const cachedEntity = await this.storage.get(typeRef, listId, elementId)
		if (queryParameters?.version != null //if a specific version is requested we have to load again
			|| cachedEntity == null
		) {
			const entity = await this.entityRestClient.load(typeRef, id, queryParameters, extraHeaders)
			if (typeRef.app !== "monitor" && queryParameters?.version == null && !this.ignoredTypes.some(ref => isSameTypeRef(typeRef, ref))) {
				await this.storage.put(entity)
			}
			return entity
		}
		return cachedEntity
	}


	async loadRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		const typeModel = await resolveTypeReference(typeRef)
		if (
			typeRef.app === "monitor"
			|| this.ignoredTypes.some(ref => isSameTypeRef(typeRef, ref))
			|| typeModel.values._id.type !== ValueType.GeneratedId // we currently only store ranges for generated ids
		) {
			return this.entityRestClient.loadRange(typeRef, listId, start, count, reverse)
		}

		return this._loadRange(typeRef, listId, start, count, reverse)
	}

	loadMultiple<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementIds: Array<Id>): Promise<Array<T>> {
		if (
			typeRef.app === "monitor"
			|| this.ignoredTypes.some(ref => isSameTypeRef(typeRef, ref))
		) {
			return this.entityRestClient.loadMultiple(typeRef, listId, elementIds)
		}

		return this._loadMultiple(typeRef, listId, elementIds)
	}

	setup<T extends SomeEntity>(listId: Id | null, instance: T, extraHeaders?: Dict): Promise<Id> {
		return this.entityRestClient.setup(listId, instance, extraHeaders)
	}

	setupMultiple<T extends SomeEntity>(listId: Id | null, instances: Array<T>): Promise<Array<Id>> {
		return this.entityRestClient.setupMultiple(listId, instances)
	}

	update<T extends SomeEntity>(instance: T): Promise<void> {
		return this.entityRestClient.update(instance)
	}

	erase<T extends SomeEntity>(instance: T): Promise<void> {
		return this.entityRestClient.erase(instance)
	}

	getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null> {
		return this.storage.getLastBatchIdForGroup(groupId)
	}

	purgeStorage(): Promise<void> {
		return this.storage.purgeStorage()
	}


	getServerTimestampMs(): number {
		return this.entityRestClient.getRestClient().getServerTimestampMs()
	}

	setLastUpdateTime(value: number): Promise<void> {
		return this.storage.putLastUpdateTime(value)
	}

	async getLastUpdateTime(): Promise<number | null> {
		return (await this.storage.getLastUpdateTime())
	}

	/**
	 * Delete a cached entity. Sometimes this is necessary to do to ensure you always load the new version
	 */
	deleteFromCacheIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementId: Id): Promise<void> {
		return this.storage.deleteIfExists(typeRef, listId, elementId)
	}

	private async _loadMultiple<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, ids: Array<Id>): Promise<Array<T>> {
		const entitiesInCache: T[] = []
		const idsToLoad: Id[] = []
		for (let id of ids) {
			const items = await this.storage.get(typeRef, listId, id)
			if (items != null) {
				entitiesInCache.push(items)
			} else {
				idsToLoad.push(id)
			}
		}
		const entitiesFromServer: T[] = []
		if (idsToLoad.length > 0) {
			const entities = await this.entityRestClient.loadMultiple(typeRef, listId, idsToLoad)
			for (let entity of entities) {
				await this.storage.put(entity)
				entitiesFromServer.push(entity)
			}
		}

		return entitiesFromServer.concat(entitiesInCache)
	}

	private async _loadRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {

		const range = await this.storage.getRangeForList(typeRef, listId)

		if (range == null) {

			// Create a new range and load everything
			const entities = await this.entityRestClient.loadRange(typeRef, listId, start, count, reverse)

			// Initialize a new range for this list
			await this.storage.setNewRangeForList(typeRef, listId, start, start)

			// The range bounds will be updated in here
			return this.handleElementRangeResult(typeRef, listId, start, count, reverse, entities, count)
		} else {

			const startIsLocatedInRange = !firstBiggerThanSecond(start, range.upper) && !firstBiggerThanSecond(range.lower, start)

			if (startIsLocatedInRange) {
				const {newStart, newCount} = await this.recalculateRangeRequest(typeRef, listId, start, count, reverse)
				if (newCount > 0) {
					// We will be able to provide some entities from the cache, so we just want to load the remaining entities from the server
					const entities = await this.entityRestClient.loadRange(typeRef, listId, newStart, newCount, reverse)
					return this.handleElementRangeResult(typeRef, listId, start, count, reverse, entities, newCount)
				} else {
					// all elements are located in the cache.
					return this.storage.provideFromRange(typeRef, listId, start, count, reverse)
				}
			} else {

				const isLoadingAwayFromRange = (reverse && firstBiggerThanSecond(range.lower, start)) || (!reverse && firstBiggerThanSecond(start, range.upper))

				if (isLoadingAwayFromRange) {
					// Start is outside the range, and we are loading away from the range, so we grow until we are able to provide enough
					// entities starting at startId

					// Which end of the range to start loading from
					const loadStartId = reverse
						? range.lower
						: range.upper

					// Load from the end of the range in the direction of the startId. then, if all available elements have been loaded or the requested number is in cache, return from cache. otherwise load again the same way.
					const entities = await this.entityRestClient.loadRange(typeRef, listId, loadStartId, count, reverse)

					// put the new elements into the cache
					await this.handleElementRangeResult(typeRef, listId, loadStartId, count, reverse, entities, count)

					// provide from cache with the actual start id
					const resultElements = await this.storage.provideFromRange(typeRef, listId, start, count, reverse)

					if (entities.length < count || resultElements.length === count) {
						// either all available elements have been loaded from target or the requested number of elements could be provided from cache
						return resultElements
					} else {
						// try again with the new elements in the cache
						return this.loadRange(typeRef, listId, start, count, reverse)
					}
				} else {
					// Start is outside the range, and we are loading towards the range, so grow outward from the range until start is
					// inside the range, then provide from cache

					const loadStartId = reverse
						? range.upper
						: range.lower

					const entities = await this.entityRestClient.loadRange(typeRef, listId, loadStartId, count, !reverse)

					await this.handleElementRangeResult(typeRef, listId, loadStartId, count, !reverse, entities, count)

					if (!await this.storage.isElementIdInCacheRange(typeRef, listId, start)) {
						return this.loadRange(typeRef, listId, start, count, reverse)
					} else {
						return this.storage.provideFromRange(typeRef, listId, start, count, reverse)
					}
				}
			}
		}
	}

	private async handleElementRangeResult<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean, elements: T[], targetCount: number): Promise<T[]> {
		let elementsToAdd = elements
		if (reverse) {
			// Ensure that elements are cached in ascending (not reverse) order
			elementsToAdd = elements.reverse()
			if (elements.length < targetCount) {
				await this.storage.setLowerRangeForList(typeRef, listId, GENERATED_MIN_ID)
			} else {
				// After reversing the list the first element in the list is the lower range limit
				await this.storage.setLowerRangeForList(typeRef, listId, getLetId(elements[0])[1])
			}
		} else {
			// Last element in the list is the upper range limit
			if (elements.length < targetCount) {
				// all elements have been loaded, so the upper range must be set to MAX_ID
				await this.storage.setUpperRangeForList(typeRef, listId, GENERATED_MAX_ID)
			} else {
				await this.storage.setUpperRangeForList(typeRef, listId, getLetId(elements[elements.length - 1])[1])
			}
		}

		await Promise.all(elementsToAdd.map(element => this.storage.put(element)))


		return this.storage.provideFromRange(typeRef, listId, start, count, reverse)
	}

	/**
	 * Calculates the new start value for the getElementRange request and the number of elements to read in
	 * order to read no duplicate values.
	 * @return returns the new start and count value.
	 */
	private async recalculateRangeRequest<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<{newStart: string, newCount: number}> {
		let allRangeList = await this.storage.getIdsInRange(typeRef, listId)
		let elementsToRead = count
		let startElementId = start
		const range = await this.storage.getRangeForList(typeRef, listId)
		if (range == null) {
			return {newStart: start, newCount: count}
		}
		const {lower, upper} = range
		let indexOfStart = allRangeList.indexOf(start)
		if ((!reverse && upper === GENERATED_MAX_ID) || (reverse && lower === GENERATED_MIN_ID)) {
			// we have already loaded the complete range in the desired direction, so we do not have to load from server
			elementsToRead = 0
		} else if (allRangeList.length === 0) { // Element range is empty, so read all elements
			elementsToRead = count
		} else if (indexOfStart !== -1) { // Start element is located in allRange read only elements that are not in allRange.
			if (reverse) {
				elementsToRead = count - indexOfStart
				startElementId = allRangeList[0] // use the lowest id in allRange as start element
			} else {
				elementsToRead = count - (allRangeList.length - 1 - indexOfStart)
				startElementId = allRangeList[allRangeList.length - 1] // use the  highest id in allRange as start element
			}
		} else if (
			lower === start
			|| (firstBiggerThanSecond(start, lower) && (firstBiggerThanSecond(allRangeList[0], start)))
		) { // Start element is not in allRange but has been used has start element for a range request, eg. EntityRestInterface.GENERATED_MIN_ID, or start is between lower range id and lowest element in range
			if (!reverse) { // if not reverse read only elements that are not in allRange
				startElementId = allRangeList[allRangeList.length - 1] // use the  highest id in allRange as start element
				elementsToRead = count - allRangeList.length
			}
			// if reverse read all elements
		} else if (upper === start
			|| (firstBiggerThanSecond(start, allRangeList[allRangeList.length - 1])
				&& (firstBiggerThanSecond(upper, start)))
		) { // Start element is not in allRange but has been used has start element for a range request, eg. EntityRestInterface.GENERATED_MAX_ID, or start is between upper range id and highest element in range
			if (reverse) { // if not reverse read only elements that are not in allRange
				startElementId = allRangeList[0] // use the  highest id in allRange as start element
				elementsToRead = count - allRangeList.length
			}
			// if not reverse read all elements
		}
		return {newStart: startElementId, newCount: elementsToRead}
	}


	/**
	 * Resolves when the entity is loaded from the server if necessary
	 * @pre The last call of this function must be resolved. This is needed to avoid that e.g. while
	 * loading a created instance from the server we receive an update of that instance and ignore it because the instance is not in the cache yet.
	 *
	 * @return Promise, which resolves to the array of valid events (if response is NotFound or NotAuthorized we filter it out)
	 */
	async entityEventsReceived(batch: QueuedBatch): Promise<Array<EntityUpdate>> {
		// we handle post multiple create operations separately to optimize the number of requests with getMultiple
		const createUpdatesForLETs: EntityUpdate[] = []
		const regularUpdates: EntityUpdate[] = [] // all updates not resulting from post multiple requests
		const updatesArray = batch.events
		for (const update of updatesArray) {
			const {instanceListId} = getUpdateInstanceId(update)
			if (update.application !== "monitor") {
				//monitor application is ignored
				// mails are ignores because move operation are handled as a special event (and no post multiple is possible)
				if (
					update.operation === OperationType.CREATE &&
					instanceListId != null &&
					!isSameTypeRef(new TypeRef(update.application, update.type), MailTypeRef)
				) {
					createUpdatesForLETs.push(update)
				} else {
					regularUpdates.push(update)
				}
			}
		}

		const createUpdatesForLETsPerList = groupBy(createUpdatesForLETs, (update) => update.instanceListId)

		const postMultipleEventUpdates: EntityUpdate[][] = []
		// we first handle potential post multiple updates in get multiple requests
		for (let [instanceListId, updates] of createUpdatesForLETsPerList) {
			const firstUpdate = updates[0]
			const typeRef = new TypeRef<ListElementEntity>(firstUpdate.application, firstUpdate.type)
			const ids = updates.map(update => update.instanceId)

			//We only want to load the instances that are in cache range
			const idsInCacheRange = await this.getElementIdsInCacheRange(typeRef, instanceListId, ids)
			if (idsInCacheRange.length === 0) {
				postMultipleEventUpdates.push(updates)
			} else {

				const updatesNotInCacheRange = idsInCacheRange.length === updates.length
					? []
					: updates.filter(update => !idsInCacheRange.includes(update.instanceId))

				try {
					// loadMultiple is only called to cache the elements and check which ones return errors
					const returnedInstances = await this._loadMultiple(typeRef, instanceListId, idsInCacheRange)
					//We do not want to pass updates that caused an error
					if (returnedInstances.length !== idsInCacheRange.length) {
						const returnedIds = returnedInstances.map(instance => getElementId(instance))
						postMultipleEventUpdates.push(updates.filter(update => returnedIds.includes(update.instanceId)).concat(updatesNotInCacheRange))
					} else {
						postMultipleEventUpdates.push(updates)
					}
				} catch (e) {
					if (e instanceof NotAuthorizedError) {
						// return updates that are not in cache Range if NotAuthorizedError (for those updates that are in cache range)
						postMultipleEventUpdates.push(updatesNotInCacheRange)
					} else {
						throw e
					}
				}
			}
		}

		const otherEventUpdates: EntityUpdate[] = []
		for (let update of regularUpdates) {
			const {operation, type, application} = update
			const {instanceListId, instanceId} = getUpdateInstanceId(update)
			const typeRef = new TypeRef<SomeEntity>(application, type)

			switch (operation) {
				case OperationType.UPDATE: {
					const handledUpdate = await this.processUpdateEvent(typeRef, update)
					if (handledUpdate) {
						otherEventUpdates.push(handledUpdate)
					}
					continue
				}
				case OperationType.DELETE: {
					if (isSameTypeRef(MailTypeRef, typeRef) && containsEventOfType(updatesArray as Readonly<EntityUpdateData[]>, OperationType.CREATE, instanceId)) {
						// move for mail is handled in create event.
					} else {
						await this.storage.deleteIfExists(typeRef, instanceListId, instanceId)
					}
					otherEventUpdates.push(update)
					continue
				}
				case OperationType.CREATE: {
					const handledUpdate = await this.processCreateEvent(typeRef, update, updatesArray)
					if (handledUpdate) {
						otherEventUpdates.push(handledUpdate)
					}
					continue
				}
				default:
					throw new ProgrammingError("Unknown operation type: " + operation)
			}
		}
		// the whole batch has been written successfully
		await this.storage.putLastBatchIdForGroup(batch.groupId, batch.batchId)
		// merge the results
		return otherEventUpdates.concat(flat(postMultipleEventUpdates))
	}

	private async processCreateEvent(typeRef: TypeRef<any>, update: EntityUpdate, batch: ReadonlyArray<EntityUpdate>): Promise<EntityUpdate | null> { // do not return undefined to avoid implicit returns
		const {instanceId, instanceListId} = getUpdateInstanceId(update)

		// We put new instances into cache only when it's a new instance in the cached range which is only for the list instances.
		if (instanceListId != null) {
			const deleteEvent = getEventOfType(batch, OperationType.DELETE, instanceId)

			const element = deleteEvent && isSameTypeRef(MailTypeRef, typeRef)
				? await this.storage.get(typeRef, deleteEvent.instanceListId, instanceId)
				: null
			if (deleteEvent != null && element != null) {
				// It is a move event for cached mail
				await this.storage.deleteIfExists(typeRef, deleteEvent.instanceListId, instanceId)
				element._id = [instanceListId, instanceId]
				await this.storage.put(element)
				return update
			} else if (await this.storage.isElementIdInCacheRange(typeRef, instanceListId, instanceId)) {
				// No need to try to download something that's not there anymore
				return this.entityRestClient.load(typeRef, [instanceListId, instanceId])
						   .then(entity => this.storage.put(entity))
						   .then(() => update)
						   .catch((e) => this._handleProcessingError(e))
			} else {
				return update
			}
		} else {
			return update
		}
	}

	private async processUpdateEvent(typeRef: TypeRef<SomeEntity>, update: EntityUpdate): Promise<EntityUpdate | null> {
		const {instanceId, instanceListId} = getUpdateInstanceId(update)
		const isInStorage = (await this.storage.get(typeRef, instanceListId, instanceId)) != null
		if (isInStorage) {
			// No need to try to download something that's not there anymore
			return this.entityRestClient.load(typeRef, collapseId(instanceListId, instanceId))
					   .then(entity => this.storage.put(entity))
					   .then(() => update)
					   .catch((e) => this._handleProcessingError(e))
		}
		return update
	}

	/**
	 * @returns {null} to avoid implicit returns where it is called
	 */
	private _handleProcessingError(e: Error): null {
		if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
			return null
		} else {
			throw e
		}
	}

	/**
	 *
	 * @returns {Array<Id>} the ids that are in cache range and therefore should be cached
	 */
	private async getElementIdsInCacheRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, ids: Id[]): Promise<Id[]> {
		const ret: Id[] = []
		for (let i = 0; i < ids.length; i++) {
			if (await this.storage.isElementIdInCacheRange(typeRef, listId, ids[i])) {
				ret.push(ids[i])
			}
		}
		return ret
	}
}

export function expandId(id: Id | IdTuple): {listId: Id | null, elementId: Id} {
	if (typeof id === "string") {
		return {
			listId: null,
			elementId: id
		}
	} else {
		const [listId, elementId] = id
		return {
			listId, elementId
		}
	}
}

export function collapseId(listId: Id | null, elementId: Id): Id | IdTuple {
	if (listId != null) {
		return [listId, elementId]
	} else {
		return elementId
	}
}

export function getUpdateInstanceId(update: EntityUpdate): {instanceListId: Id | null, instanceId: Id} {
	let instanceListId
	if (update.instanceListId === "") {
		instanceListId = null
	} else {
		instanceListId = update.instanceListId
	}
	return {instanceListId, instanceId: update.instanceId}
}