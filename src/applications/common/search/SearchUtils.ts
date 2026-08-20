import { CalendarEvent, Contact, Mail } from "@tutao/entities/tutanota"
import { DriveFile, DriveFolder } from "@tutao/entities/drive"
import { getElementId, ListElementEntity, OperationType, PersistentEntity, TypeRef } from "@tutao/meta"
import { ListModel } from "../misc/ListModel"
import { ListFetchResult } from "../../../ui/base/ListUtils"
import { ListAutoSelectBehavior } from "../misc/DeviceConfig"
import m, { Children } from "mithril"
import type { SearchToken } from "../../../ui/utils/QueryTokenUtils"
import { SearchCategoryType, SearchRestriction, SearchResult } from "../api/worker/search/SearchTypes"
import Stream from "mithril/stream"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { searchQueryEquals } from "../../mail-app/search/model/MailSearchUtils"
import { List, ListAttrs, RenderConfig, ViewHolder } from "../../../ui/base/List"
import { Icons } from "../../../ui/base/icons/Icons"
import { ListColumnWrapper } from "../../../ui/ListColumnWrapper"
import ColumnEmptyMessageBox from "../../../ui/base/ColumnEmptyMessageBox"
import { theme } from "../../../ui/theme"
import { Styles } from "../../../ui/styles"

export type SearchableTypes = Mail | Contact | CalendarEvent | DriveFile | DriveFolder

export type SearchResultUpdate<T> = { type: "reset" } | { type: "newitem"; item: T } | { type: "updateitem"; item: T } | { type: "deleteitem"; item: T }

/**
 * View on the loaded search results that can change e.g. because of entity updates or extended interval.
 * Users should subscribe to {@link #updates} stream and must call {@link dispose} when the result is not used anymore.
 */
export interface LiveSearchResult<T> {
	readonly items: readonly T[]
	searchResult: SearchResult
	readonly hasMoreResults: boolean
	loadMoreResults: (max: number) => Promise<T[]>
	updates: Stream<SearchResultUpdate<T>>
	/** Must be called when this result is not used anymore */
	dispose: () => unknown
	/** Include bigger time range in the search result */
	extendResults: (extendEnd: number) => unknown
}

export interface SearchQuery {
	query: string
	restriction: SearchRestriction
	maxResults: number | null
}

export function searchResultQuery({ maxResults, query, restriction }: SearchResult): SearchQuery {
	return {
		query,
		restriction,
		maxResults: maxResults ?? null,
	}
}

export function isNewSearch(searchResult: LiveSearchResult<unknown> | null, newQuery: SearchQuery): boolean {
	return searchResult == null || !searchQueryEquals(searchResultQuery(searchResult.searchResult), newQuery)
}

export interface CommonSearchListViewAttrs<T extends SearchableTypes> {
	listModel: ListModel<T, Id>
	onSingleSelection: (item: T) => unknown
	highlightedStrings: readonly SearchToken[]
}

export enum PaidFunctionResult {
	Success,
	PaidSubscriptionNeeded,
}

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

export function renderListColumnWrapper<T, U extends ViewHolder<T>>(
	listModel: ListModel<T, Id>,
	icon: Icons,
	onSingleSelection: (item: T) => unknown,
	renderConfig: RenderConfig<T, U>,
	cancelCallback?: () => unknown,
	endOfListRender?: () => Children,
): Children {
	return m(
		ListColumnWrapper,
		{ headerContent: null, class: Styles.get().isSingleColumnLayout() ? undefined : "column-resize-margin" },
		listModel.isEmptyAndDone()
			? m(ColumnEmptyMessageBox, {
					icon,
					message: "searchNoResults_msg",
					color: theme.on_surface_variant,
				})
			: m(List, {
					state: listModel.state,
					renderConfig,
					onLoadMore: () => {
						listModel.loadMore()
					},
					onRetryLoading: () => {
						listModel.retryLoading()
					},
					onSingleSelection: (item: T) => {
						listModel.onSingleSelection(item)
						onSingleSelection(item)
					},
					onSingleTogglingMultiselection: (item: T) => {
						listModel.onSingleInclusiveSelection(item, Styles.get().isSingleColumnLayout())
					},
					onRangeSelectionTowards: (item: T) => {
						listModel.selectRangeTowards(item)
					},
					onStopLoading: () => {
						cancelCallback?.()
						listModel.stopLoading()
					},
					renderEndOfListMessage: endOfListRender ? endOfListRender() : null,
				} satisfies ListAttrs<T, U>),
	)
}

/** Default handler of entity updates for search results */
export async function applyEntityUpdates<T extends ListElementEntity & PersistentEntity>(
	entityClient: EntityClient,
	typeRef: TypeRef<T>,
	items: T[],
	updates: readonly EntityUpdateData[],
	sendUpdate: (update: SearchResultUpdate<T>) => unknown,
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

/** Construct URL parameters */
export function getSearchParameters(
	query: string | null,
	restriction: SearchRestriction,
	selectionKey: string | null,
): {
	path: string
	params: Record<string, string | number | Array<string>>
} {
	const params: Record<string, string | number | Array<string>> = {
		query: query ?? "",
		category: restriction.type,
	}
	// a bit annoying but avoids putting unnecessary things into the url (if we would put undefined into it)
	if (restriction.start) {
		params.start = restriction.start
	}
	if (restriction.end) {
		params.end = restriction.end
	}
	if (restriction.folderIds.length > 0) {
		params.folder = restriction.folderIds
	}
	if (restriction.field) {
		params.field = restriction.field
	}
	if (restriction.eventSeries != null) {
		params.eventSeries = String(restriction.eventSeries)
	}

	return {
		path: "/search/:category" + (selectionKey ? "/" + selectionKey : ""),
		params: params,
	}
}

/** Gets the resulting URL if the output of  {@link getSearchParameters()} was routed to */
export function getSearchUrl(query: string | null, restriction: SearchRestriction, selectionKey: string | null = null): string {
	const { path, params } = getSearchParameters(query, restriction, selectionKey)
	return m.buildPathname(path, params as m.Params)
}

export function createEmptyRestriction(category: SearchCategoryType): SearchRestriction {
	return {
		type: category,
		start: null,
		end: null,
		field: null,
		folderIds: [],
		attributeIds: null,
		eventSeries: null,
	}
}
export type QuickSearchQuery = Pick<SearchQuery, "query" | "maxResults">
