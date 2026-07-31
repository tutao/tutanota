import Stream from "mithril/stream"
import { SearchRestriction, SearchResult } from "../api/worker/search/SearchTypes.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { SearchableTypes } from "./SearchUtils"
import { getElementId, ListElementEntity, OperationType, TypeRef } from "@tutao/meta"
import { EntityClient } from "../../../platform-kit/network/EntityClient"

export interface LiveSearchResult<T> {
	items: T[]
	searchResult: SearchResult
	hasMoreResults: boolean
	loadMoreResults: (max: number) => Promise<T[]>
	updates: Stream<ResultUpdate<T>>
	dispose: () => unknown
	extendResults: (extendEnd: number) => unknown
	entityEventsReceived: (data: readonly EntityUpdateData[]) => Promise<unknown>
}

export type ResultUpdate<T> = { type: "reset" } | { type: "newitem"; item: T } | { type: "updateitem"; item: T } | { type: "deleteitem"; item: T }

export type SearchQuery = {
	query: string
	restriction: SearchRestriction
	maxResults: number | null
}

export async function applyEntityUpdates<T extends SearchableTypes & ListElementEntity>(
	entityClient: EntityClient,
	typeRef: TypeRef<T>,
	items: T[],
	updates: readonly EntityUpdateData[],
	sendUpdate: (update: ResultUpdate<T>) => unknown,
) {
	for (const update of updates) {
		if (isUpdateForTypeRef(typeRef, update)) {
			if (update.operation === OperationType.DELETE) {
				const index = items.findIndex((mail) => getElementId(mail) === update.instanceId)
				if (index !== -1) {
					const [item] = items.splice(index, 1)
					sendUpdate({ type: "deleteitem", item: item })
				}
			} else if (update.operation === OperationType.UPDATE) {
				const index = items.findIndex((mail) => getElementId(mail) === update.instanceId)
				// surprisingly hard to convince ts that this is the correct id type
				const instanceIdTuple = [update.instanceListId, update.instanceId] as unknown as PropertyType<T, "_id">
				const updatedItem = await entityClient.load<T>(typeRef, instanceIdTuple)
				if (index !== -1) {
					items.splice(index, 1, updatedItem)
					sendUpdate({ type: "updateitem", item: updatedItem })
				}
			}
		}
	}
}
