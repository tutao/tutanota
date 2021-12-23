
import type {EntityRestInterface} from "./EntityRestClient"
import {typeRefToPath} from "./EntityRestClient"
import {resolveTypeReference} from "../../common/EntityFunctions"
import {OperationType} from "../../common/TutanotaConstants"
import {clone, downcast, flat, groupBy, isSameTypeRef, neverNull, promiseMap, remove, TypeRef} from "@tutao/tutanota-utils"
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
import {firstBiggerThanSecond, GENERATED_MAX_ID, GENERATED_MIN_ID, getElementId, getLetId} from "../../common/utils/EntityUtils"
import {ProgrammingError} from "../../common/error/ProgrammingError"
import {assertWorkerOrNode} from "../../common/Env"
import type {$Promisable} from "@tutao/tutanota-utils/"
import type {ElementEntity, ListElementEntity, SomeEntity} from "../../common/EntityTypes"
assertWorkerOrNode()

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
type ListCache = {
    allRange: Id[]
    lowerRangeId: Id
    upperRangeId: Id
    elements: Record<Id, ListElementEntity>
}
export class EntityRestCache implements EntityRestInterface {
    _ignoredTypes: ReadonlyArray<TypeRef<any>> = [
        EntityEventBatchTypeRef,
        PermissionTypeRef,
        BucketPermissionTypeRef,
        SessionTypeRef,
        SecondFactorTypeRef,
        RecoverCodeTypeRef,
        RejectedSenderTypeRef,
    ]
    readonly _entityRestClient: EntityRestInterface

    /**
     * stores all contents that would be stored on the server, otherwise
     */
    _entities: Record<string, Record<Id, ElementEntity>>
    //	Example:
    //	_entities = {
    //		'path': { 		// element type
    //			'element1Id': 'element1',
    //			'element2Id': 'element2'
    //		    // and so on
    //		},
    //      // and so on
    //  }
    _listEntities: Record<string, ListCache>

    //	Example:
    //    _listEntities {
    //		'path': { 		// list element type
    //			'listId': {
    //				allRange: ['listElement1Id', 'listElement2Id'],
    //              lowerRangeId: listElement1Id,
    //              upperRangeId: GENERATED_MAX_ID,
    //              elements: {
    //				    'listElement1Id': 'listElement1',
    //				    'listElement2Id': 'listElement2',
    //    				// and so on
    //              }
    //			},
    //          // and so on
    //		},
    //      // and so on
    //	}
    constructor(entityRestClient: EntityRestInterface) {
        this._entityRestClient = entityRestClient
        this._entities = {}
        this._listEntities = {}
    }

    async load<T extends SomeEntity>(
        typeRef: TypeRef<T>,
        id: $PropertyType<T, "_id">,
        queryParameters: Params | null,
        extraHeaders?: Params,
    ): Promise<T> {
        const {listId, elementId} = expandId(id)

        if (!this._isInCache(typeRef, listId, elementId)) {
            const entity = await this._entityRestClient.load(typeRef, id, queryParameters, extraHeaders)

            if (typeRef.app !== "monitor" && queryParameters?.version == null && !this._ignoredTypes.find(ref => isSameTypeRef(typeRef, ref))) {
                this._putIntoCache(entity)
            }

            return entity
        }

        // Some methods like "createDraft" load the created instance directly after the service has completed.
        // Currently we cannot apply this optimization here because the cache is not updated directly after a service request because
        // We don't wait for the update/create event of the modified instance.
        // We can add this optimization again if our service requests resolve after the cache has been updated
        //} else if (listId && this._isInCacheRange(typeRefToPath(typeRef), listId, id)) {
        //return Promise.reject(new NotFoundError("Instance not found but in the cache range: " + listId + " " + id))
        return this._getFromCache(typeRef, listId, elementId)
    }

    async loadRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<Array<T>> {
        const typeModel = await resolveTypeReference(typeRef)

        if (
            typeRef.app === "monitor" ||
            this._ignoredTypes.find(ref => isSameTypeRef(typeRef, ref)) ||
            typeModel.values._id.type !== ValueType.GeneratedId // we currently only store ranges for generated ids
        ) {
            return this._entityRestClient.loadRange(typeRef, listId, start, count, reverse)
        }

        return this._loadRange(typeRef, listId, start, count, reverse)
    }

    loadMultiple<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementIds: Array<Id>): Promise<Array<T>> {
        if (typeRef.app === "monitor" || this._ignoredTypes.find(ref => isSameTypeRef(typeRef, ref))) {
            return this._entityRestClient.loadMultiple(typeRef, listId, elementIds)
        }

        return this._loadMultiple(typeRef, listId, elementIds)
    }

    setup<T extends SomeEntity>(listId: Id | null, instance: T, extraHeaders?: Params): Promise<Id> {
        return this._entityRestClient.setup(listId, instance, extraHeaders)
    }

    setupMultiple<T extends SomeEntity>(listId: Id | null, instances: Array<T>): Promise<Array<Id>> {
        return this._entityRestClient.setupMultiple(listId, instances)
    }

    update<T extends SomeEntity>(instance: T): Promise<void> {
        return this._entityRestClient.update(instance)
    }

    erase<T extends SomeEntity>(instance: T): Promise<void> {
        return this._entityRestClient.erase(instance)
    }

    async _loadMultiple<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, ids: Array<Id>): Promise<Array<T>> {
        const entitiesInCache = []
        const idsToLoad = []

        for (let id of ids) {
            if (this._isInCache(typeRef, listId, id)) {
                entitiesInCache.push(this._getFromCache(typeRef, listId, id))
            } else {
                idsToLoad.push(id)
            }
        }

        const entitiesFromServer = []

        if (idsToLoad.length > 0) {
            const entities = await this._entityRestClient.loadMultiple(typeRef, listId, idsToLoad)

            for (let entity of entities) {
                this._putIntoCache(entity)

                entitiesFromServer.push(entity)
            }
        }

        return entitiesFromServer.concat(entitiesInCache)
    }

    _loadRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
        let path = typeRefToPath(typeRef)
        const listCache = this._listEntities[path]?.[listId]

        // check which range must be loaded from server
        if (
            !listCache ||
            (start === GENERATED_MAX_ID && reverse && listCache.upperRangeId !== GENERATED_MAX_ID) ||
            (start === GENERATED_MIN_ID && !reverse && listCache.lowerRangeId !== GENERATED_MIN_ID)
        ) {
            // this is the first request for this list or
            // our upper range id is not MAX_ID and we now read the range starting with MAX_ID. we just replace the complete existing range with the new one because we do not want to handle multiple ranges or
            // our lower range id is not MIN_ID and we now read the range starting with MIN_ID. we just replace the complete existing range with the new one because we do not want to handle multiple ranges
            // this can also happen if we just have read a single element before, so the range is only that element and can be skipped
            return this._entityRestClient.loadRange(typeRef, listId, start, count, reverse).then(entities => {
                // create the list data path in the cache if not existing
                let newListCache

                if (!listCache) {
                    if (!this._listEntities[path]) {
                        this._listEntities[path] = {}
                    }

                    newListCache = {
                        allRange: [],
                        lowerRangeId: start,
                        upperRangeId: start,
                        elements: {},
                    }
                    this._listEntities[path][listId] = newListCache
                } else {
                    newListCache = listCache
                    newListCache.allRange = []
                    newListCache.lowerRangeId = start
                    newListCache.upperRangeId = start
                }

                return this._handleElementRangeResult(newListCache, start, count, reverse, entities, count)
            })
        } else if (!firstBiggerThanSecond(start, listCache.upperRangeId) && !firstBiggerThanSecond(listCache.lowerRangeId, start)) {
            // check if the requested start element is located in the range
            // count the numbers of elements that are already in allRange to determine the number of elements to read
            const {newStart, newCount} = this._recalculateRangeRequest(listCache, start, count, reverse)

            if (newCount > 0) {
                return this._entityRestClient.loadRange(typeRef, listId, newStart, newCount, reverse).then(entities => {
                    return this._handleElementRangeResult(neverNull(listCache), start, count, reverse, entities, newCount)
                })
            } else {
                // all elements are located in the cache.
                return Promise.resolve(this._provideFromCache(listCache, start, count, reverse))
            }
        } else if (
            (firstBiggerThanSecond(start, listCache.upperRangeId) && !reverse) || // Start is outside the range.
            (firstBiggerThanSecond(listCache.lowerRangeId, start) && reverse)
        ) {
            let loadStartId

            if (firstBiggerThanSecond(start, listCache.upperRangeId) && !reverse) {
                // start is higher than range. load from upper range id with same count. then, if all available elements have been loaded or the requested number is in cache, return from cache. otherwise load again the same way.
                loadStartId = listCache.upperRangeId
            } else {
                // start is lower than range. load from lower range id with same count. then, if all available elements have been loaded or the requested number is in cache, return from cache. otherwise load again the same way.
                loadStartId = listCache.lowerRangeId
            }

            return this._entityRestClient.loadRange<T>(typeRef, listId, loadStartId, count, reverse).then(entities => {
                // put the new elements into the cache
                this._handleElementRangeResult(neverNull(listCache), loadStartId, count, reverse, entities, count)

                // provide from cache with the actual start id
                let resultElements = this._provideFromCache(neverNull(listCache), start, count, reverse)

                if (entities.length < count || resultElements.length === count) {
                    // either all available elements have been loaded from target or the requested number of elements could be provided from cache
                    return resultElements
                } else {
                    // try again with the new elements in the cache
                    return this.loadRange(typeRef, listId, start, count, reverse)
                }
            })
        } else {
            let msg =
                "invalid range request. path: " +
                path +
                " list: " +
                listId +
                " start: " +
                start +
                " count: " +
                count +
                " reverse: " +
                String(reverse) +
                " lower: " +
                listCache.lowerRangeId +
                " upper: " +
                listCache.upperRangeId
            return Promise.reject(new Error(msg))
        }
    }

    _handleElementRangeResult<T extends ListElementEntity>(
        listCache: ListCache,
        start: Id,
        count: number,
        reverse: boolean,
        elements: Array<T>,
        targetCount: number,
    ): Array<T> {
        let elementsToAdd: ReadonlyArray<T> = elements

        if (elements.length > 0) {
            // Ensure that elements are cached in ascending (not reverse) order
            if (reverse) {
                elementsToAdd = elements.reverse()

                if (elements.length < targetCount) {
                    listCache.lowerRangeId = GENERATED_MIN_ID
                } else {
                    // After reversing the list the first element in the list is the lower range limit
                    listCache.lowerRangeId = getLetId(elements[0])[1]
                }
            } else {
                // Last element in the list is the upper range limit
                if (elements.length < targetCount) {
                    // all elements have been loaded, so the upper range must be set to MAX_ID
                    listCache.upperRangeId = GENERATED_MAX_ID
                } else {
                    listCache.upperRangeId = getLetId(elements[elements.length - 1])[1]
                }
            }

            for (const element of elementsToAdd) {
                this._putIntoCache(element)
            }
        } else {
            // all elements have been loaded, so the range must be set to MAX_ID / MIN_ID
            if (reverse) {
                listCache.lowerRangeId = GENERATED_MIN_ID
            } else {
                listCache.upperRangeId = GENERATED_MAX_ID
            }
        }

        return this._provideFromCache(listCache, start, count, reverse)
    }

    /**
     * Calculates the new start value for the getElementRange request and the number of elements to read in
     * order to read no duplicate values.
     * @return returns the new start and count value.
     */
    _recalculateRangeRequest<T>(
        listCache: ListCache,
        start: Id,
        count: number,
        reverse: boolean,
    ): {
        newStart: string
        newCount: number
    } {
        let allRangeList = listCache["allRange"]
        let elementsToRead = count
        let startElementId = start
        let indexOfStart = allRangeList.indexOf(start)

        if ((!reverse && listCache.upperRangeId === GENERATED_MAX_ID) || (reverse && listCache.lowerRangeId === GENERATED_MIN_ID)) {
            // we have already loaded the complete range in the desired direction, so we do not have to load from server
            elementsToRead = 0
        } else if (allRangeList.length === 0) {
            // Element range is empty, so read all elements
            elementsToRead = count
        } else if (indexOfStart !== -1) {
            // Start element is located in allRange read only elements that are not in allRange.
            if (reverse) {
                elementsToRead = count - indexOfStart
                startElementId = allRangeList[0] // use the lowest id in allRange as start element
            } else {
                elementsToRead = count - (allRangeList.length - 1 - indexOfStart)
                startElementId = allRangeList[allRangeList.length - 1] // use the  highest id in allRange as start element
            }
        } else if (
            listCache["lowerRangeId"] === start ||
            (firstBiggerThanSecond(start, listCache["lowerRangeId"]) && firstBiggerThanSecond(allRangeList[0], start))
        ) {
            // Start element is not in allRange but has been used has start element for a range request, eg. EntityRestInterface.GENERATED_MIN_ID, or start is between lower range id and lowest element in range
            if (!reverse) {
                // if not reverse read only elements that are not in allRange
                startElementId = allRangeList[allRangeList.length - 1] // use the  highest id in allRange as start element

                elementsToRead = count - allRangeList.length
            } // if reverse read all elements
        } else if (
            listCache["upperRangeId"] === start ||
            (firstBiggerThanSecond(start, allRangeList[allRangeList.length - 1]) && firstBiggerThanSecond(listCache["upperRangeId"], start))
        ) {
            // Start element is not in allRange but has been used has start element for a range request, eg. EntityRestInterface.GENERATED_MAX_ID, or start is between upper range id and highest element in range
            if (reverse) {
                // if not reverse read only elements that are not in allRange
                startElementId = allRangeList[0] // use the  highest id in allRange as start element

                elementsToRead = count - allRangeList.length
            } // if not reverse read all elements
        }

        return {
            newStart: startElementId,
            newCount: elementsToRead,
        }
    }

    _provideFromCache<T extends ListElementEntity>(listCache: ListCache, start: Id, count: number, reverse: boolean): T[] {
        let range = listCache.allRange
        let ids: Id[] = []

        if (reverse) {
            let i

            for (i = range.length - 1; i >= 0; i--) {
                if (firstBiggerThanSecond(start, range[i])) {
                    break
                }
            }

            if (i >= 0) {
                let startIndex = i + 1 - count

                if (startIndex < 0) {
                    // start index may be negative if more elements have been requested than available when getting elements reverse.
                    startIndex = 0
                }

                ids = range.slice(startIndex, i + 1)
                ids.reverse()
            } else {
                ids = []
            }
        } else {
            let i

            for (i = 0; i < range.length; i++) {
                if (firstBiggerThanSecond(range[i], start)) {
                    break
                }
            }

            ids = range.slice(i, i + count)
        }

        let result: T[] = []

        for (let a = 0; a < ids.length; a++) {
            const cachedEntity = downcast<T>(listCache.elements[ids[a]])
            result.push(clone(cachedEntity))
        }

        return result
    }

    /**
     * Resolves when the entity is loaded from the server if necessary
     * @pre The last call of this function must be resolved. This is needed to avoid that e.g. while
     * loading a created instance from the server we receive an update of that instance and ignore it because the instance is not in the cache yet.
     *
     * @return Promise, which resolves to the array of valid events (if response is NotFound or NotAuthorized we filter it out)
     */
    async entityEventsReceived(batch: ReadonlyArray<EntityUpdate>): Promise<Array<EntityUpdate>> {
        // we handle post multiple create operations separately to optimize the number of requests with getMultiple
        const createUpdatesForLETs = []
        const regularUpdates = [] // all updates not resulting from post multiple requests

        for (const update of batch) {
            if (update.application !== "monitor") {
                //monitor application is ignored
                // mails are ignores because move operation are handled as a special event (and no post multiple is possible)
                if (
                    update.operation === OperationType.CREATE &&
                    update.instanceListId != null &&
                    !isSameTypeRef(new TypeRef(update.application, update.type), MailTypeRef)
                ) {
                    createUpdatesForLETs.push(update)
                } else {
                    regularUpdates.push(update)
                }
            }
        }

        const createUpdatesForLETsPerList = groupBy(createUpdatesForLETs, update => update.instanceListId)
        // we first handle potential post multiple updates in get multiple requests
        const postMultipleEventUpdates = await promiseMap(createUpdatesForLETsPerList, async ([instanceListId, updates]) => {
            const firstUpdate = updates[0]
            const typeRef = new TypeRef(firstUpdate.application, firstUpdate.type)
            const path = typeRefToPath(typeRef)
            const ids = updates.map(update => update.instanceId)

            //We only want to load the instances that are in cache range
            const idsInCacheRange = this._getInCacheRange(path, instanceListId, ids)

            if (idsInCacheRange.length === 0) {
                return updates
            }

            const updatesNotInCacheRange =
                idsInCacheRange.length === updates.length ? [] : updates.filter(update => !idsInCacheRange.includes(update.instanceId))

            try {
                // loadMultiple is only called to cache the elements and check which ones return errors
                const returnedInstances = await this._loadMultiple(typeRef, instanceListId, idsInCacheRange)

                //We do not want to pass updates that caused an error
                if (returnedInstances.length !== idsInCacheRange.length) {
                    const returnedIds = returnedInstances.map(instance => getElementId(instance))
                    return updates.filter(update => returnedIds.includes(update.instanceId)).concat(updatesNotInCacheRange)
                } else {
                    return updates
                }
            } catch (e) {
                if (e instanceof NotAuthorizedError) {
                    // return updates that are not in cache Range if NotAuthorizedError (for those updates that are in cache range)
                    return updatesNotInCacheRange
                } else {
                    throw e
                }
            }
        })
        const otherEventUpdates = await promiseMap(regularUpdates, update => {
            const {instanceListId, instanceId, operation, type, application} = update
            const typeRef = new TypeRef(application, type)

            switch (operation) {
                case OperationType.UPDATE:
                    return this._processUpdateEvent(typeRef, update)

                case OperationType.DELETE:
                    if (isSameTypeRef(MailTypeRef, typeRef) && containsEventOfType(batch, OperationType.CREATE, instanceId)) {
                        // move for mail is handled in create event.
                    } else {
                        this._tryRemoveFromCache(typeRef, instanceListId, instanceId)
                    }

                    return update

                case OperationType.CREATE:
                    return this._processCreateEvent(typeRef, update, batch)

                default:
                    throw new ProgrammingError("Unknown operation type: " + operation)
            }
        })
        // merge the results
        return otherEventUpdates.filter(Boolean).concat(flat(postMultipleEventUpdates))
    }

    _processCreateEvent(typeRef: TypeRef<any>, update: EntityUpdate, batch: ReadonlyArray<EntityUpdate>): $Promisable<EntityUpdate | null> {
        // do not return undefined to avoid implicit returns
        const {instanceListId, instanceId} = update

        // We put new instances into cache only when it's a new instance in the cached range which is only for the list instances.
        if (instanceListId) {
            const deleteEvent = getEventOfType(batch, OperationType.DELETE, instanceId)
            const path = typeRefToPath(typeRef)

            if (deleteEvent && isSameTypeRef(MailTypeRef, typeRef) && this._isInCache(typeRef, deleteEvent.instanceListId, instanceId)) {
                // It is a move event for cached mail
                const element = this._getFromCache(typeRef, deleteEvent.instanceListId, instanceId)

                this._tryRemoveFromCache(typeRef, deleteEvent.instanceListId, instanceId)

                element._id = [instanceListId, instanceId]

                this._putIntoCache(element)

                return update
            } else if (this._isInCacheRange(path, instanceListId, instanceId)) {
                // No need to try to download something that's not there anymore
                return this._entityRestClient
                    .load(typeRef, [instanceListId, instanceId])
                    .then(entity => this._putIntoCache(entity))
                    .then(() => update)
                    .catch(e => this._handleProcessingError(e))
            } else {
                return update
            }
        } else {
            return update
        }
    }

    _processUpdateEvent(typeRef: TypeRef<any>, update: EntityUpdate): $Promisable<EntityUpdate | null> {
        const {instanceListId, instanceId} = update

        if (this._isInCache(typeRef, instanceListId, instanceId)) {
            // No need to try to download something that's not there anymore
            return this._entityRestClient
                .load(typeRef, collapseId(instanceListId, instanceId))
                .then(entity => this._putIntoCache(entity))
                .then(() => update)
                .catch(e => this._handleProcessingError(e))
        }

        return update
    }

    /**
     * @returns {null} to avoid implicit returns where it is called
     */
    _handleProcessingError(e: Error): null {
        if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
            return null
        } else {
            throw e
        }
    }

    _isInCache(typeRef: TypeRef<any>, listId: Id | null, id: Id): boolean {
        let path = typeRefToPath(typeRef)

        if (listId) {
            return this._listEntities[path]?.[listId]?.elements?.[id] != null
        } else {
            return this._entities[path]?.[id] != null
        }
    }

    _getFromCache<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): T {
        let path = typeRefToPath(typeRef)

        if (listId) {
            return downcast<T>(clone(this._listEntities[path][listId].elements[id]))
        } else {
            return downcast<T>(clone(this._entities[path][id]))
        }
    }

    _isInCacheRange(path: string, listId: Id, id: Id): boolean {
        return (
            this._listEntities[path]?.[listId] != null &&
            !firstBiggerThanSecond(id, this._listEntities[path][listId].upperRangeId) &&
            !firstBiggerThanSecond(this._listEntities[path][listId].lowerRangeId, id)
        )
    }

    /**
     *
     * @returns {Array<Id>} the ids that are in cache range
     */
    _getInCacheRange(path: string, listId: Id, ids: ReadonlyArray<Id>): Id[] {
        return ids.filter(id => this._isInCacheRange(path, listId, id))
    }

    _putIntoCache(originalEntity: SomeEntity): void {
        let entity = clone(originalEntity)
        let path = typeRefToPath(entity._type)

        if (entity._id instanceof Array) {
            if (!this._listEntities[path]) {
                this._listEntities[path] = {}
            }

            let listId = entity._id[0]
            let id = entity._id[1]

            if (!this._listEntities[path][listId]) {
                // first element in this list
                this._listEntities[path][listId] = {
                    allRange: [id],
                    lowerRangeId: id,
                    upperRangeId: id,
                    elements: {},
                }
                this._listEntities[path][listId].elements[id] = entity
            } else {
                // if the element already exists in the cache, overwrite it
                // add new element to existing list if necessary
                this._listEntities[path][listId].elements[id] = entity

                if (this._isInCacheRange(path, listId, id)) {
                    this._insertIntoRange(this._listEntities[path][listId].allRange, id)
                }
            }
        } else {
            const elementEntity = downcast<ElementEntity>(entity)

            if (!this._entities[path]) {
                this._entities[path] = {}
            }

            this._entities[path][elementEntity._id] = elementEntity
        }
    }

    _insertIntoRange(allRange: Array<Id>, elementId: Id) {
        for (let i = 0; i < allRange.length; i++) {
            let rangeElement = allRange[i]

            if (firstBiggerThanSecond(rangeElement, elementId)) {
                allRange.splice(i, 0, elementId)
                return
            }

            if (rangeElement === elementId) {
                return
            }
        }

        allRange.push(elementId)
    }

    _tryRemoveFromCache(typeRef: TypeRef<any>, listId: Id | null, id: Id): void {
        let path = typeRefToPath(typeRef)

        if (this._isInCache(typeRef, listId, id)) {
            if (listId) {
                delete this._listEntities[path][listId].elements[id]
                remove(this._listEntities[path][listId].allRange, id)
            } else {
                delete this._entities[path][id]
            }
        }
    }
}
export function expandId(
    id: Id | IdTuple,
): {
    listId: Id | null
    elementId: Id
} {
    if (typeof id === "string") {
        return {
            listId: null,
            elementId: id,
        }
    } else {
        const [listId, elementId] = id
        return {
            listId,
            elementId,
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