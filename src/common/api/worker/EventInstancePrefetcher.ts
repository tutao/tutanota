import { EntityUpdateData } from "../common/utils/EntityUpdateUtils"
import { Mail, MailDetailsBlobTypeRef, MailTypeRef } from "../entities/tutanota/TypeRefs"
import { elementIdPart, listIdPart } from "../common/utils/EntityUtils"
import { assertNotNull, getTypeString, groupBy, isNotNull, isSameTypeRef, parseTypeString, TypeRef } from "@tutao/tutanota-utils"
import { parseKeyVersion } from "./facades/KeyLoaderFacade"
import { VersionedEncryptedKey } from "./crypto/CryptoWrapper"
import { OperationType } from "../common/TutanotaConstants"
import { NotAuthorizedError, NotFoundError } from "../common/error/RestError"
import { ListElementEntity, SomeEntity } from "../common/EntityTypes"
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
		const preloadMap = await this.groupedListElementUpdatedInstances(allEventsFromAllBatch, progressMonitor)
		await this.loadGroupedListElementEntities(allEventsFromAllBatch, preloadMap, progressMonitor)

		// after prefetching is done, we can set the totalWorkDone to the amount of entity events from all batches
		await progressMonitor.totalWorkDone(allEventsFromAllBatch.length)
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
						await this.setEventsWithInstancesAsPrefetched(allEventsFromAllBatch, elementIdsAndIndexes, progressMonitor)
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

	private async setEventsWithInstancesAsPrefetched(
		allEventsFromAllBatch: Array<EntityUpdateData>,
		elementIdsAndIndexes: Map<Id, number[]>,
		progressMonitor: ProgressMonitorDelegate,
	) {
		for (const [_, indices] of elementIdsAndIndexes) {
			for (const i of indices) {
				allEventsFromAllBatch[i].isPrefetched = true
				await progressMonitor.workDone(1)
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
				await progressMonitor.workDone(1)
				continue
			}

			if (entityUpdateData.operation === OperationType.DELETE) {
				await progressMonitor.workDone(1)
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
}

/**
 * Returns whether the error is expected for the cases where our local state might not be up-to-date with the server yet. E.g. we might be processing an update
 * for the instance that was already deleted. Normally this would be optimized away but it might still happen due to timing.
 */
function isExpectedErrorForSynchronization(e: Error): boolean {
	return e instanceof NotFoundError || e instanceof NotAuthorizedError
}
