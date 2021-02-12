// @flow
import type {EntityRestInterface} from "./EntityRestClient"
import {typeRefToPath} from "./EntityRestClient"
import type {HttpMethodEnum} from "../../common/EntityFunctions"
import {
	HttpMethod,
	resolveTypeReference
} from "../../common/EntityFunctions"
import {OperationType} from "../../common/TutanotaConstants"
import {flat, remove} from "../../common/utils/ArrayUtils"
import {clone, containsEventOfType, downcast, getEventOfType, neverNull} from "../../common/utils/Utils"
import {PermissionTypeRef} from "../../entities/sys/Permission"
import {EntityEventBatchTypeRef} from "../../entities/sys/EntityEventBatch"
import {assertWorkerOrNode} from "../../common/Env"
// $FlowIgnore[untyped-import]
import {ValueType} from "../../common/EntityConstants"
import {SessionTypeRef} from "../../entities/sys/Session"
import {StatisticLogEntryTypeRef} from "../../entities/tutanota/StatisticLogEntry"
import {BucketPermissionTypeRef} from "../../entities/sys/BucketPermission"
import {SecondFactorTypeRef} from "../../entities/sys/SecondFactor"
import {RecoverCodeTypeRef} from "../../entities/sys/RecoverCode"
import {NotAuthorizedError, NotFoundError} from "../../common/error/RestError"
import {MailTypeRef} from "../../entities/tutanota/Mail"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import {RejectedSenderTypeRef} from "../../entities/sys/RejectedSender"
import {
	firstBiggerThanSecond,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	getLetId,
	READ_ONLY_HEADER
} from "../../common/utils/EntityUtils";
import type {ListElement} from "../../common/utils/EntityUtils"
import {isSameTypeRef, TypeRef} from "../../common/utils/TypeRef";


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
export class EntityRestCache implements EntityRestInterface {

	_ignoredTypes: TypeRef<any>[];

	_entityRestClient: EntityRestInterface;
	/**
	 * stores all contents that would be stored on the server, otherwise
	 */
	_entities: {[key: string]: {[key: Id]: Object}};
	//	Example:
	//	_entities = {
	//		'path': { 		// element type
	//			'element1Id': 'element1',
	//			'element2Id': 'element2'
	//		    // and so on
	//		},
	//      // and so on
	//  }
	_listEntities: {[key: string]: {[key: Id]: {allRange: Id[], lowerRangeId: Id, upperRangeId: Id, elements: {[key: Id]: Object}}}};
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
		this._ignoredTypes = [
			EntityEventBatchTypeRef, PermissionTypeRef, BucketPermissionTypeRef, SessionTypeRef,
			StatisticLogEntryTypeRef, SecondFactorTypeRef, RecoverCodeTypeRef, RejectedSenderTypeRef
		]
	}

	entityRequest<T>(typeRef: TypeRef<T>, method: HttpMethodEnum, listId: ?Id, id: ?Id, entity: ?T, queryParameter: ?Params, extraHeaders?: Params): Promise<any> {
		let readOnly = false
		if (extraHeaders) {
			readOnly = extraHeaders[READ_ONLY_HEADER] === "true"
			delete extraHeaders[READ_ONLY_HEADER]
		}
		if (method === HttpMethod.GET && !this._ignoredTypes.find(ref => isSameTypeRef(typeRef, ref))) {
			if ((typeRef.app === "monitor") || (queryParameter && queryParameter["version"])) {
				// monitor app and version requests are never cached
				return this._entityRestClient.entityRequest(typeRef, method, listId, id, entity, queryParameter, extraHeaders)
			} else if (!id && queryParameter && queryParameter["ids"]) {
				return this._loadMultiple(typeRef, method, listId, id, entity, queryParameter, extraHeaders, readOnly)
			} else if (this.isRangeRequest(listId, id, queryParameter)) {
				// load range
				return resolveTypeReference(typeRef).then(typeModel => {
					if (typeModel.values["_id"].type === ValueType.GeneratedId) {
						let params = neverNull(queryParameter)
						return this._loadRange(downcast(typeRef), neverNull(listId), params["start"], Number(params["count"]), params["reverse"]
							=== "true", readOnly)
					} else {
						// we currently only store ranges for generated ids
						return this._entityRestClient.entityRequest(typeRef, method, listId, id, entity, queryParameter, extraHeaders)
					}
				})
			} else if (id) {
				// load single entity
				if (this._isInCache(typeRef, listId, id)) {
					return Promise.resolve(this._getFromCache(typeRef, listId, id))
					// Some methods like "createDraft" are loading the created instance directly after the service has completed.
					// Currently we cannot apply this optimization here because the cached is not updated directly after a service request because
					// We don't wait for the updated/create event of the modified instance.
					// We can add this optimization again if our service requests resolve after the cache has been updated
					//} else if (listId && this._isInCacheRange(typeRefToPath(typeRef), listId, id)) {
					//return Promise.reject(new NotFoundError("Instance not found but in the cache range: " + listId + " " + id))
				} else {
					return this._entityRestClient.entityRequest(typeRef, method, listId, id, entity, queryParameter, extraHeaders)
					           .then(entity => {
						           if (!readOnly) {
							           this._putIntoCache(entity)
						           }
						           return entity
					           })
				}
			} else {
				throw new Error("invalid request params: " + String(listId) + ", " + String(id) + ", "
					+ String(JSON.stringify(queryParameter)))
			}
		} else {
			return this._entityRestClient.entityRequest(typeRef, method, listId, id, entity, queryParameter, extraHeaders)
		}
	}

	isRangeRequest(listId: ?Id, id: ?Id, queryParameter: ?Params): boolean {
		// check for null and undefined because "" and 0 are als falsy
		return listId != null && !id
			&& queryParameter != null
			&& queryParameter["start"] !== null
			&& queryParameter["start"] !== undefined
			&& queryParameter["count"] !== null
			&& queryParameter["count"] !== undefined
			&& queryParameter["reverse"] != null
	}

	_loadMultiple<T>(typeRef: TypeRef<T>, method: HttpMethodEnum, listId: ?Id, id: ?Id, entity: ?T, queryParameter: Params,
	                 extraHeaders?: Params, readOnly: boolean): Promise<Array<T>> {
		const ids = queryParameter["ids"].split(",")
		const inCache = [], notInCache = []
		ids.forEach((id) => {
			if (this._isInCache(typeRef, listId, id)) {
				inCache.push(id)
			} else {
				notInCache.push(id)
			}
		})
		const newQuery = Object.assign({}, queryParameter, {ids: notInCache.join(",")})
		const loadFromServerPromise = notInCache.length > 0
			? this._entityRestClient.entityRequest(typeRef, method, listId, id, entity, newQuery, extraHeaders)
			      .then((response) => {
				      const entities: Array<T> = downcast(response)
				      if (!readOnly) {
					      entities.forEach((e) => this._putIntoCache(e))
				      }
				      return entities
			      })
			: Promise.resolve([])

		return Promise.all([
			loadFromServerPromise,
			inCache.map(id => this._getFromCache(typeRef, listId, id))
		]).then(flat)
	}

	_loadRange<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean, readOnly: boolean): Promise<T[]> {
		let path = typeRefToPath(typeRef)
		const listCache = (this._listEntities[path] && this._listEntities[path][listId]) ? this._listEntities[path][listId] : null
		// check which range must be loaded from server
		if (!listCache || (start === GENERATED_MAX_ID && reverse && listCache.upperRangeId !== GENERATED_MAX_ID)
			|| (start === GENERATED_MIN_ID && !reverse && listCache.lowerRangeId !== GENERATED_MIN_ID)) {
			// this is the first request for this list or
			// our upper range id is not MAX_ID and we now read the range starting with MAX_ID. we just replace the complete existing range with the new one because we do not want to handle multiple ranges or
			// our lower range id is not MIN_ID and we now read the range starting with MIN_ID. we just replace the complete existing range with the new one because we do not want to handle multiple ranges
			// this can also happen if we just have read a single element before, so the range is only that element and can be skipped
			return this._entityRestClient.entityRequest(typeRef, HttpMethod.GET, listId, null, null, {
				start: start,
				count: String(count),
				reverse: String(reverse)
			}).then(result => {
				let entities: Array<T> = downcast(result)
				// create the list data path in the cache if not existing
				if (readOnly) {
					return entities;
				}

				let newListCache
				if (!listCache) {
					if (!this._listEntities[path]) {
						this._listEntities[path] = {}
					}
					newListCache = {allRange: [], lowerRangeId: start, upperRangeId: start, elements: {}}
					this._listEntities[path][listId] = newListCache
				} else {
					newListCache = listCache
					newListCache.allRange = []
					newListCache.lowerRangeId = start
					newListCache.upperRangeId = start
				}
				return this._handleElementRangeResult(newListCache, start, count, reverse, entities, count)
			})
		} else if (!firstBiggerThanSecond(start, listCache.upperRangeId)
			&& !firstBiggerThanSecond(listCache.lowerRangeId, start)) { // check if the requested start element is located in the range

			// count the numbers of elements that are already in allRange to determine the number of elements to read
			let newRequestParams = this._getNumberOfElementsToRead(listCache, start, count, reverse)
			if (newRequestParams.newCount > 0) {
				return this._entityRestClient.entityRequest(typeRef, HttpMethod.GET, listId, null, null, {
					start: newRequestParams.newStart,
					count: String(newRequestParams.newCount),
					reverse: String(reverse)
				}).then(result => {
					let entities: Array<T> = downcast(result)
					if (readOnly) {
						const cachedEntities = this._provideFromCache(listCache, start, count - newRequestParams.newCount, reverse)
						return cachedEntities.concat(entities)
					} else {
						return this._handleElementRangeResult(neverNull(listCache), start, count, reverse, entities, newRequestParams.newCount)
					}
				})
			} else {
				// all elements are located in the cache.
				return Promise.resolve(this._provideFromCache(listCache, start, count, reverse))
			}
		} else if ((firstBiggerThanSecond(start, listCache.upperRangeId) && !reverse) // Start is outside the range.
			|| (firstBiggerThanSecond(listCache.lowerRangeId, start) && reverse)) {
			if (readOnly) {
				// Doesn't make any sense to read from existing range because we know that elements are not in the cache
				return downcast(this._entityRestClient.entityRequest(typeRef, HttpMethod.GET, listId, null, null, {
					start: start,
					count: String(count),
					reverse: String(reverse)
				}))
			}
			let loadStartId
			if (firstBiggerThanSecond(start, listCache.upperRangeId) && !reverse) {
				// start is higher than range. load from upper range id with same count. then, if all available elements have been loaded or the requested number is in cache, return from cache. otherwise load again the same way.
				loadStartId = listCache.upperRangeId
			} else {
				// start is lower than range. load from lower range id with same count. then, if all available elements have been loaded or the requested number is in cache, return from cache. otherwise load again the same way.
				loadStartId = listCache.lowerRangeId
			}
			return this._entityRestClient.entityRequest(typeRef, HttpMethod.GET, listId, null, null, {
				start: loadStartId,
				count: String(count),
				reverse: String(reverse)
			}).then(entities => {
				// put the new elements into the cache
				this._handleElementRangeResult(neverNull(listCache), loadStartId, count, reverse, ((entities: any): T[]), count)
				// provide from cache with the actual start id
				let resultElements = this._provideFromCache(neverNull(listCache), start, count, reverse)
				if (((entities: any): T[]).length < count || resultElements.length === count) {
					// either all available elements have been loaded from target or the requested number of elements could be provided from cache
					return resultElements
				} else {
					// try again with the new elements in the cache
					return this.entityRequest(typeRef, HttpMethod.GET, listId, null, null, {
						start: start,
						count: String(count),
						reverse: String(reverse)
					})
				}
			})
		} else {
			let msg = "invalid range request. path: " + path + " list: " + listId + " start: " + start + " count: "
				+ count + " reverse: " + String(reverse) + " lower: " + listCache.lowerRangeId + " upper: "
				+ listCache.upperRangeId
			return Promise.reject(new Error(msg))
		}
	}

	_handleElementRangeResult<T: ListElement>(listCache: {allRange: Id[], lowerRangeId: Id, upperRangeId: Id, elements: {[key: Id]: Object}}, start: Id, count: number, reverse: boolean, elements: T[], targetCount: number): T[] {
		let elementsToAdd = elements
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
			for (let i = 0; i < elementsToAdd.length; i++) {
				this._putIntoCache(elementsToAdd[i])
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
	_getNumberOfElementsToRead<T>(listCache: {allRange: Id[], lowerRangeId: Id, upperRangeId: Id, elements: {[key: Id]: Object}}, start: Id, count: number, reverse: boolean): {newStart: string, newCount: number} {
		let allRangeList = listCache['allRange']
		let elementsToRead = count
		let startElementId = start

		let indexOfStart = allRangeList.indexOf(start)
		if ((!reverse && listCache.upperRangeId === GENERATED_MAX_ID) || (reverse && listCache.lowerRangeId
			=== GENERATED_MIN_ID)) {
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
		} else if (listCache["lowerRangeId"] === start || (firstBiggerThanSecond(start, listCache["lowerRangeId"])
			&& (firstBiggerThanSecond(allRangeList[0], start)))) { // Start element is not in allRange but has been used has start element for a range request, eg. EntityRestInterface.GENERATED_MIN_ID, or start is between lower range id and lowest element in range
			if (!reverse) { // if not reverse read only elements that are not in allRange
				startElementId = allRangeList[allRangeList.length - 1] // use the  highest id in allRange as start element
				elementsToRead = count - allRangeList.length
			}
			// if reverse read all elements
		} else if (listCache["upperRangeId"] === start
			|| (firstBiggerThanSecond(start, allRangeList[allRangeList.length - 1])
				&& (firstBiggerThanSecond(listCache["upperRangeId"], start)))) { // Start element is not in allRange but has been used has start element for a range request, eg. EntityRestInterface.GENERATED_MAX_ID, or start is between upper range id and highest element in range
			if (reverse) { // if not reverse read only elements that are not in allRange
				startElementId = allRangeList[0] // use the  highest id in allRange as start element
				elementsToRead = count - allRangeList.length
			}
			// if not reverse read all elements
		}
		return {newStart: startElementId, newCount: elementsToRead}
	}

	_provideFromCache<T>(listCache: {allRange: Id[], lowerRangeId: Id, upperRangeId: Id, elements: {[key: Id]: Object}}, start: Id, count: number, reverse: boolean): T[] {
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
				if (startIndex < 0) { // start index may be negative if more elements have been requested than available when getting elements reverse.
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
			result.push(clone((listCache.elements[ids[a]]: any)))
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
	entityEventsReceived(batch: $ReadOnlyArray<EntityUpdate>): Promise<Array<EntityUpdate>> {
		return Promise
			.mapSeries(batch, (update) => {
				const {instanceListId, instanceId, operation, type, application} = update
				if (application === "monitor") return null

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
				}
			})
			.then((result) => result.filter(Boolean))
	}

	_processCreateEvent(
		typeRef: TypeRef<*>,
		update: EntityUpdate,
		batch: $ReadOnlyArray<EntityUpdate>,
	): $Promisable<EntityUpdate | null> { // do not return undefined to avoid implicit returns
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
				return this._entityRestClient.entityRequest(typeRef, HttpMethod.GET, instanceListId, instanceId)
				           .then(entity => this._putIntoCache(entity))
				           .return(update)
				           .catch(this._handleProcessingError)
			} else {
				return update
			}
		} else {
			return update
		}
	}

	_processUpdateEvent(typeRef: TypeRef<*>, update: EntityUpdate): $Promisable<EntityUpdate | null> {
		const {instanceListId, instanceId} = update
		if (this._isInCache(typeRef, instanceListId, instanceId)) {
			// No need to try to download something that's not there anymore
			return this._entityRestClient.entityRequest(typeRef, HttpMethod.GET, instanceListId, instanceId)
			           .then(entity => this._putIntoCache(entity))
			           .return(update)
			           .catch(this._handleProcessingError)
		}
		return update
	}

	_handleProcessingError(e: Error): EntityUpdate | null {
		// skip event if NotFoundError. May occur if an entity is removed in parallel.
		// Skip event if NotAuthorizedError. May occur if the user was removed from the owner group.
		if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
			return null
		} else {
			throw e
		}
	}

	_isInCache(typeRef: TypeRef<any>, listId: ?Id, id: Id): boolean {
		let path = typeRefToPath(typeRef)
		if (listId) {
			return (this._listEntities[path] != null && this._listEntities[path][listId] != null
				&& this._listEntities[path][listId].elements[id] != null)
		} else {
			return (this._entities[path] != null && this._entities[path][id] != null)
		}
	}

	_getFromCache(typeRef: TypeRef<any>, listId: ?Id, id: Id): any {
		let path = typeRefToPath(typeRef)
		if (listId) {
			return clone(this._listEntities[path][listId].elements[id])
		} else {
			return clone(this._entities[path][id])
		}
	}

	_isInCacheRange(path: string, listId: Id, id: Id): boolean {
		return this._listEntities[path] != null && this._listEntities[path][listId] != null
			&& !firstBiggerThanSecond(id, this._listEntities[path][listId].upperRangeId)
			&& !firstBiggerThanSecond(this._listEntities[path][listId].lowerRangeId, id)
	}

	_putIntoCache(originalEntity: any): void {
		let entity = clone(originalEntity)
		let path = typeRefToPath((entity: any)._type)
		if (entity._id instanceof Array) {
			if (!this._listEntities[path]) {
				this._listEntities[path] = {}
			}
			let listId = entity._id[0]
			let id = entity._id[1]
			if (!this._listEntities[path][listId]) {
				// first element in this list
				this._listEntities[path][listId] = {allRange: [id], lowerRangeId: id, upperRangeId: id, elements: {}}
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
			if (!this._entities[path]) {
				this._entities[path] = {}
			}
			this._entities[path][entity._id] = entity
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

	_tryRemoveFromCache(typeRef: TypeRef<any>, listId: ?Id, id: Id): void {
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