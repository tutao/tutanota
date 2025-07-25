import { EntityUpdateData, PrefetchStatus } from "../common/utils/EntityUpdateUtils"
import { ConversationEntryTypeRef, Mail, MailDetailsBlobTypeRef, MailTypeRef, TutanotaPropertiesTypeRef } from "../entities/tutanota/TypeRefs"
import { elementIdPart, getElementId, isElementEntity, listIdPart } from "../common/utils/EntityUtils"
import { assertNotNull, getTypeString, groupBy, isNotNull, isSameTypeRef, parseTypeString, TypeRef } from "@tutao/tutanota-utils"
import { parseKeyVersion } from "./facades/KeyLoaderFacade"
import { VersionedEncryptedKey } from "./crypto/CryptoWrapper"
import { OperationType } from "../common/TutanotaConstants"
import { NotAuthorizedError, NotFoundError } from "../common/error/RestError"
import { ElementEntity, ListElementEntity, SomeEntity } from "../common/EntityTypes"
import { CacheMode, type EntityRestInterface } from "./rest/EntityRestClient"
import { ProgressMonitorDelegate } from "./ProgressMonitorDelegate"

export class EventInstancePrefetcher {
	constructor(private readonly entityCache: EntityRestInterface) {}

	/**
	 * We preload list element entities in case we get updates for multiple instances of a single list.
	 * So that single item requests for those instances will be served from the cache.
	 */
	public async preloadEntities(allEventsFromAllBatch: Array<EntityUpdateData>, progressMonitor: ProgressMonitorDelegate): Promise<void> {
		const start = new Date().getTime()
		console.log("====== PREFETCH ============")
		const preloadMap = this.groupedUpdatedInstances(allEventsFromAllBatch, progressMonitor)
		await this.loadGroupedListElementEntities(allEventsFromAllBatch, preloadMap, progressMonitor)

		// after prefetching is done, we can set the totalWorkDone to the amount of entity events from all batches
		// plus the one initialized so the progress bar is shown
		await progressMonitor.totalWorkDone(allEventsFromAllBatch.length + 1)
		console.log("====== PREFETCH END ============", new Date().getTime() - start, "ms")
	}

	// visible for testing
	public groupedUpdatedInstances(
		allEventsFromAllBatch: Array<EntityUpdateData>,
		progressMonitor: ProgressMonitorDelegate,
	): Map<string, Map<Id, Map<Id, number[]>>> {
		const prefetchMap: Map<string, Map<Id, Map<Id, number[]>>> = new Map()
		for (const [eventIndexInList, entityUpdateData] of allEventsFromAllBatch.entries()) {
			const typeIdentifier = getTypeString(entityUpdateData.typeRef)

			// we do not prefetch elementInstances (ET) except for TutanotaProperties
			// we prefetch listElementInstances (LET) except for ConversationEntry
			const isElementType = entityUpdateData.instanceListId === ""
			const isConversationEntryEvent = isSameTypeRef(ConversationEntryTypeRef, entityUpdateData.typeRef)
			const isTutanotaPropertiesEvent = isSameTypeRef(TutanotaPropertiesTypeRef, entityUpdateData.typeRef)
			if ((isElementType && !isTutanotaPropertiesEvent) || isConversationEntryEvent) {
				progressMonitor.workDone(1)
				continue
			}

			if (entityUpdateData.operation === OperationType.DELETE) {
				const indexesForTheInstance = prefetchMap.get(typeIdentifier)?.get(entityUpdateData.instanceListId)?.get(entityUpdateData.instanceId)
				if (indexesForTheInstance !== undefined) {
					this.markPrefetchStatusForEntityEvents(indexesForTheInstance, allEventsFromAllBatch, progressMonitor, PrefetchStatus.NotAvailable)
					prefetchMap.get(typeIdentifier)?.get(entityUpdateData.instanceListId)?.delete(entityUpdateData.instanceId)
				}
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

	private async loadGroupedListElementEntities(
		allEventsFromAllBatch: Array<EntityUpdateData>,
		preloadMap: Map<string, Map<Id, Map<Id, number[]>>>,
		progressMonitor: ProgressMonitorDelegate,
	): Promise<void> {
		for (const [typeRefString, groupedListIds] of preloadMap.entries()) {
			const typeRef = parseTypeString(typeRefString) as TypeRef<SomeEntity>
			for (const [listId, elementIdsAndIndexes] of groupedListIds.entries()) {
				if (listId === "") {
					await this.loadElementEntities(typeRef as TypeRef<ElementEntity>, allEventsFromAllBatch, elementIdsAndIndexes, progressMonitor)
				} else if (elementIdsAndIndexes.size > 1) {
					// This prevents requests to lists containing single element
					try {
						const elementIds = Array.from(elementIdsAndIndexes.keys())
						const instances = await this.entityCache.loadMultiple<ListElementEntity>(
							typeRef as TypeRef<ListElementEntity>,
							listId,
							elementIds,
							undefined,
							{
								cacheMode: CacheMode.WriteOnly,
							},
						)
						if (isSameTypeRef(MailTypeRef, typeRef)) {
							await this.fetchMailDetailsBlob(instances)
						}
						this.setEventsWithInstancesAsPrefetched(allEventsFromAllBatch, instances, elementIdsAndIndexes, progressMonitor)
					} catch (e) {
						if (isExpectedErrorForSynchronization(e)) {
							console.log(`could not preload, probably lost group membership ( or not added yet ) for list ${typeRefString}/${listId}`)
						} else {
							console.warn(`failed to preload ${typeRefString}/${listId}`, e)
						}
					}
				}
			}
		}
	}

	private async loadElementEntities(
		typeRef: TypeRef<ElementEntity>,
		allEventsFromAllBatch: Array<EntityUpdateData>,
		elementIdsAndIndexes: Map<Id, number[]>,
		progressMonitor: ProgressMonitorDelegate,
	) {
		const elementIds = Array.from(elementIdsAndIndexes.keys())
		const instances = await this.entityCache.loadMultiple<ElementEntity>(typeRef, null, elementIds, undefined, {
			cacheMode: CacheMode.WriteOnly,
		})
		this.setEventsWithInstancesAsPrefetched(allEventsFromAllBatch, instances, elementIdsAndIndexes, progressMonitor)
	}

	private async fetchMailDetailsBlob(instances: Array<SomeEntity>) {
		const mailsWithMailDetails = instances.filter((mail: Mail) => isNotNull(mail.mailDetails)) as Array<Mail>

		const mailDetailsByList = groupBy(mailsWithMailDetails, (m) => listIdPart(assertNotNull(m.mailDetails)))
		for (const [listId, mails] of mailDetailsByList.entries()) {
			const mailDetailsElementIdToMail = mails.reduce((acc: Map<Id, Mail>, current) => {
				acc.set(elementIdPart(assertNotNull(current.mailDetails)), current)
				return acc
			}, new Map())
			const mailDetailsElementIds = mails.map((m) => elementIdPart(assertNotNull(m.mailDetails)))
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
		instances: Array<SomeEntity>,
		elementIdsAndIndexes: Map<Id, number[]>,
		progressMonitor: ProgressMonitorDelegate,
	) {
		for (const [elementId, indices] of elementIdsAndIndexes.entries()) {
			const elementIdWasFetched = instances.some((instance) => {
				if (isElementEntity(instance)) {
					return instance._id === elementId
				} else {
					return getElementId(instance as ListElementEntity) === elementId
				}
			})
			const prefetchStatus = elementIdWasFetched ? PrefetchStatus.Prefetched : PrefetchStatus.NotAvailable
			this.markPrefetchStatusForEntityEvents(indices, allEventsFromAllBatch, progressMonitor, prefetchStatus)
		}
	}

	private markPrefetchStatusForEntityEvents(
		elementEventBatchIndexes: number[],
		allEventsFromAllBatch: Array<EntityUpdateData>,
		progressMonitor: ProgressMonitorDelegate,
		prefetchStatus: PrefetchStatus,
	) {
		for (const index of elementEventBatchIndexes) {
			allEventsFromAllBatch[index].prefetchStatus = prefetchStatus
			progressMonitor.workDone(1)
		}
	}
}

/**
 * Returns whether the error is expected for the cases where our local state might not be up-to-date with the server yet. E.g. we might be processing an update
 * for the instance that was already deleted. Normally this would be optimized away but it might still happen due to timing.
 */
function isExpectedErrorForSynchronization(e: Error): boolean {
	return e instanceof NotFoundError || e instanceof NotAuthorizedError
}
