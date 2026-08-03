import { CalendarEvent, Contact, Mail } from "@tutao/entities/tutanota"
import { DriveFile, DriveFolder } from "@tutao/entities/drive"
import { EntityIdEncoding, getElementId, ListElementEntity, OperationType, sortCompareByReverseId, TypeRef } from "@tutao/meta"
import { ListModel } from "../misc/ListModel"
import { ListFetchResult } from "../../../ui/base/ListUtils"
import { ListAutoSelectBehavior } from "../misc/DeviceConfig"
import m, { Children } from "mithril"
import { isBrowser, isOfflineStorageAvailable } from "@tutao/app-env"
import { InfoLink, lang } from "../../../ui/utils/LanguageViewModel"
import { compareMails } from "../../mail-app/mail/model/MailUtils"
import type { SearchToken } from "../../../ui/utils/QueryTokenUtils"
import { SearchRestriction, SearchResult } from "../api/worker/search/SearchTypes"
import Stream from "mithril/stream"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { EntityClient } from "../../../platform-kit/network/EntityClient"

export type SearchableTypes = Mail | Contact | CalendarEvent | DriveFile | DriveFolder

export type ResultUpdate<T> = { type: "reset" } | { type: "newitem"; item: T } | { type: "updateitem"; item: T } | { type: "deleteitem"; item: T }

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

export type SearchQuery = {
	query: string
	restriction: SearchRestriction
	maxResults: number | null
}

export interface CommonSearchListViewAttrs<T extends SearchableTypes> {
	listModel: ListModel<T, Id>
	onSingleSelection: (item: T) => unknown
	isFreeAccount: boolean
	highlightedStrings: readonly SearchToken[]
}

export enum PaidFunctionResult {
	Success,
	PaidSubscriptionNeeded,
}

export const mailSearchComparator: (l: Mail, r: Mail) => number = isOfflineStorageAvailable()
	? (l, r) => compareMails(l, r)
	: (l, r) => sortCompareByReverseId(l, r, EntityIdEncoding.Base64Ext)

export function emptyListModel<ItemType, IdType>(): ListModel<ItemType, IdType> {
	return new ListModel({
		async fetch(last: ItemType | null | undefined, count: number): Promise<ListFetchResult<ItemType>> {
			return { items: [] as ItemType[], complete: true }
		},
		sortCompare(item1: ItemType, item2: ItemType): number {
			return 0
		},
		getItemId(item: ItemType): IdType {
			throw new Error()
		},
		isSameId(id1: IdType, id2: IdType): boolean {
			throw new Error()
		},
		autoSelectBehavior: () => ListAutoSelectBehavior.NEWER,
	})
}

export function renderSearchInOurApps(): Children | null {
	if (!isBrowser()) {
		return null
	} else {
		return m.trust(
			lang.get("searchInOurApps_msg", {
				"{link}": `<a href="${InfoLink.Download}" target="_blank">${lang.get("searchInOurAppsLinkText_msg")}</a>`,
			}),
		)
	}
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
