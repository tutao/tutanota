import { EntityUpdateData } from "../common/utils/EntityUpdateUtils"
import { Mail, MailDetailsBlobTypeRef, MailTypeRef } from "../entities/tutanota/TypeRefs"
import { elementIdPart, ensureBase64Ext, isSameId, listIdPart } from "../common/utils/EntityUtils"
import { assertNotNull, getTypeString, groupBy, isNotNull, isSameTypeRef, parseTypeString, TypeRef } from "@tutao/tutanota-utils"
import { parseKeyVersion } from "./facades/KeyLoaderFacade"
import { VersionedEncryptedKey } from "./crypto/CryptoWrapper"
import { OperationType } from "../common/TutanotaConstants"
import { NotAuthorizedError, NotFoundError } from "../common/error/RestError"
import { CacheStorage, Range } from "./rest/DefaultEntityRestCache"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { ServerTypeModelResolver } from "../common/EntityFunctions"
import { ListElementEntity, SomeEntity } from "../common/EntityTypes"
import { CacheMode, type EntityRestInterface } from "./rest/EntityRestClient"
import { ProgressMonitorDelegate } from "./ProgressMonitorDelegate"

export class EventInstancePrefetcher {
	constructor(
		private readonly cacheStorage: CacheStorage,
		private readonly entityCache: EntityRestInterface,
		private readonly serverTypeModelResolver: ServerTypeModelResolver,
	) {}

	/**
	 * We preload list element entities in case we get updates for multiple instances of a single list.
	 * So that single item requests for those instances will be served from the cache.
	 */
	public async preloadEntities(allEventsFromAllBatch: Array<EntityUpdateData>, progressMonitor: ProgressMonitorDelegate): Promise<void> {
		const start = new Date().getTime()
		console.log("====== PREFETCH ============")
		const preloadMap = await this.groupedListElementUpdatedInstances(allEventsFromAllBatch, progressMonitor)
		await this.loadGroupedListElementEntities(allEventsFromAllBatch, preloadMap, progressMonitor)
		console.log("====== PREFETCH END ============", new Date().getTime() - start, "ms")
	}

	private async loadGroupedListElementEntities(
		allEventsFromAllBatch: Array<EntityUpdateData>,
		preloadMap: Map<string, Map<Id, Map<Id, number[]>>>,
		progressMonitor: ProgressMonitorDelegate,
	): Promise<void> {
		for (const [typeRefString, groupedListIds] of preloadMap.entries()) {
			const typeRef = parseTypeString(typeRefString) as TypeRef<ListElementEntity>
			for (const [listId, elementIdsAndIndexes] of groupedListIds.entries()) {
				// This prevents requests to conversationEntries which were always singleRequests
				if (elementIdsAndIndexes.size > 1) {
					try {
						const elementIds = Array.from(elementIdsAndIndexes.keys())
						const instances = await this.entityCache.loadMultiple<ListElementEntity>(typeRef, listId, elementIds, undefined, {
							cacheMode: CacheMode.WriteOnly,
						})
						if (isSameTypeRef(MailTypeRef, typeRef)) {
							await this.fetchMailDetailsBlob(instances)
						}
						this.setEventsWithInstancesAsPrefetched(allEventsFromAllBatch, instances, elementIdsAndIndexes)
					} catch (e) {
						if (isExpectedErrorForSynchronization(e)) {
							console.log(`could not preload, probably lost group membership ( or not added yet ) for list ${typeRefString}/${listId}`)
						} else {
							console.warn(`failed to preload ${typeRefString}/${listId}`, e)
						}
					}
				}
				progressMonitor.workDone(elementIdsAndIndexes.size)
			}
		}
	}

	private async fetchMailDetailsBlob(instances: Array<SomeEntity>) {
		const mailsWithMailDetails = instances.filter((mail: Mail) => isNotNull(mail.mailDetails)) as Array<Mail>

		const mailDetailsByList = groupBy(mailsWithMailDetails, (m) => listIdPart(assertNotNull(m.mailDetails)))
		for (const [listId, mails] of mailDetailsByList.entries()) {
			const mailDetailsElementIds = mails.map((m) => elementIdPart(assertNotNull(m.mailDetails)))
			const initialMap: Map<Id, Mail> = new Map()
			const mailDetailsElementIdToMail = mails.reduce((previous: Map<Id, Mail>, current) => {
				previous.set(elementIdPart(assertNotNull(current.mailDetails)), current)
				return previous
			}, initialMap)
			await this.entityCache.loadMultiple(
				MailDetailsBlobTypeRef,
				listId,
				mailDetailsElementIds,
				async (mailDetailsElementId: Id) => {
					const mail = assertNotNull(mailDetailsElementIdToMail.get(mailDetailsElementId))
					return {
						key: mail._ownerEncSessionKey,
						encryptingKeyVersion: parseKeyVersion(mail._ownerKeyVersion ?? "0"),
					} as VersionedEncryptedKey
				},
				{ cacheMode: CacheMode.ReadAndWrite },
			)
		}
	}

	private setEventsWithInstancesAsPrefetched(
		allEventsFromAllBatch: Array<EntityUpdateData>,
		instances: Array<ListElementEntity>,
		elementIdsAndIndexes: Map<Id, number[]>,
	) {
		for (const { _id } of instances) {
			const elementId = elementIdPart(_id)
			const elementEventBatchIndexes = elementIdsAndIndexes.get(elementId) || []
			for (const index of elementEventBatchIndexes) {
				allEventsFromAllBatch[index].isPrefetched = true
			}
		}
	}

	// @VisibleForTesting
	public async groupedListElementUpdatedInstances(
		allEventsFromAllBatch: Array<EntityUpdateData>,
		progressMonitor: ProgressMonitorDelegate,
	): Promise<Map<string, Map<Id, Map<Id, number[]>>>> {
		const prefetchMap: Map<string, Map<Id, Map<Id, number[]>>> = new Map()
		for (const [eventIndexInList, entityUpdateData] of allEventsFromAllBatch.entries()) {
			const typeIdentifier = getTypeString(entityUpdateData.typeRef)

			// if CREATE update itself have a instance, we don't need to fetch it.
			// EventRestCache will update the database
			// or,
			// if we have UPDATE event with patches, we can also re-create server state locally ( happens in EntityrestCache)
			// if we don't have this instance in database, we anyway don't need this event
			const isCreateWithInstance = entityUpdateData.operation === OperationType.CREATE && entityUpdateData.instance != null
			const isUpdateWithPatches = entityUpdateData.operation === OperationType.UPDATE && entityUpdateData.patches != null
			const isListElement = entityUpdateData.instanceListId != ""

			if (isCreateWithInstance || isUpdateWithPatches || !isListElement) {
				progressMonitor.workDone(1)
				continue
			}

			if (entityUpdateData.operation === OperationType.DELETE) {
				prefetchMap.get(typeIdentifier)?.get(entityUpdateData.instanceListId)?.delete(entityUpdateData.instanceId)
				progressMonitor.workDone(1)
				continue
			} else {
				const isTypeIdentifierInitialized = prefetchMap.has(typeIdentifier)
				if (!isTypeIdentifierInitialized) {
					prefetchMap.set(typeIdentifier, new Map().set(entityUpdateData.instanceListId, new Map()))
				}

				const isInstanceListInitialized = prefetchMap?.get(typeIdentifier)?.has(entityUpdateData.instanceListId)
				if (!isInstanceListInitialized) {
					prefetchMap.get(typeIdentifier)?.set(entityUpdateData.instanceListId, new Map())
				}

				const isInstanceIdInitialized = prefetchMap?.get(typeIdentifier)?.get(entityUpdateData.instanceListId)?.has(entityUpdateData.instanceId)
				if (!isTypeIdentifierInitialized || !isInstanceListInitialized || !isInstanceIdInitialized) {
					prefetchMap.get(typeIdentifier)!.get(entityUpdateData.instanceListId)!.set(entityUpdateData.instanceId, [])
				}
			}

			const singleEntityUpdateEventIndexes = prefetchMap.get(typeIdentifier)!.get(entityUpdateData.instanceListId)!.get(entityUpdateData.instanceId)!
			singleEntityUpdateEventIndexes.push(eventIndexInList)
		}

		return prefetchMap
	}

	/// Reads a range of list from database and put it in memory,
	/// this is mainly to avoid that we do not re-read the ranges from database always.
	///
	/// Concurrency wise: this is safe because, we could anyway not write anything to database while the missedEntityEvents is not finished processing
	/// So we can assume range never change once we read them for this set of events batch
	private async populateKnownListIdRange(knownRanges: Map<string, Map<Id, Nullable<Range>>>, typeIdentifier: string, entityUpdateData: EntityUpdateData) {
		if (knownRanges.get(typeIdentifier) == null) {
			const range = await this.cacheStorage.getRangeForList(entityUpdateData.typeRef, entityUpdateData.instanceListId)
			const mapInstanceToRange = new Map()
			mapInstanceToRange.set(entityUpdateData.instanceListId, range)
			knownRanges.set(typeIdentifier, mapInstanceToRange)
		} else if (!knownRanges.get(typeIdentifier)?.has(entityUpdateData.instanceListId)) {
			const range = await this.cacheStorage.getRangeForList(entityUpdateData.typeRef, entityUpdateData.instanceListId)
			knownRanges.get(typeIdentifier)?.set(entityUpdateData.instanceListId, range)
		}
	}

	private async isInstanceInCacheRange(
		typeIdentifier: string,
		entityUpdateData: EntityUpdateData,
		knownRanges: Map<string, Map<Id, Nullable<Range>>>,
	): Promise<boolean> {
		let instanceIsInRange = false
		const customHandlerRangeFilter = this.cacheStorage.getCustomCacheHandlerMap().get(entityUpdateData.typeRef)?.getElementIdsInCacheRange ?? null
		if (customHandlerRangeFilter != null) {
			const customRangeCheckRes = await customHandlerRangeFilter(
				this.cacheStorage,
				entityUpdateData.instanceListId,
				Array.of(entityUpdateData.instanceId),
			)
			instanceIsInRange = isSameId(customRangeCheckRes[0], entityUpdateData.instanceId)
		} else {
			await this.populateKnownListIdRange(knownRanges, typeIdentifier, entityUpdateData)
			const range = knownRanges.get(typeIdentifier)?.get(entityUpdateData.instanceListId) ?? null
			if (range != null) {
				const typeModel = await this.serverTypeModelResolver.resolveServerTypeReference(entityUpdateData.typeRef)
				const encodedInstanceId = ensureBase64Ext(typeModel, entityUpdateData.instanceId)

				//IF / When this is redone, it must be AWARE of BASE64EXT being used in the cachestorage
				// and outside being base64URL encoded, DANGER!!!!!
				instanceIsInRange = await this.cacheStorage.isElementIdInCacheRange(
					entityUpdateData.typeRef,
					entityUpdateData.instanceListId,
					entityUpdateData.instanceId,
				)
			}
		}

		return !instanceIsInRange
	}
}

/**
 * Returns whether the error is expected for the cases where our local state might not be up-to-date with the server yet. E.g. we might be processing an update
 * for the instance that was already deleted. Normally this would be optimized away but it might still happen due to timing.
 */
function isExpectedErrorForSynchronization(e: Error): boolean {
	return e instanceof NotFoundError || e instanceof NotAuthorizedError
}
