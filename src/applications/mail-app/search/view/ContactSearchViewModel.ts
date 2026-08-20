import { ListModel } from "../../../common/misc/ListModel"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { Contact } from "@tutao/entities/tutanota"
import { LoginController } from "../../../common/api/main/LoginController"
import { SearchToken } from "../../../../ui/utils/QueryTokenUtils"
import { debounce, isNotNull, noOp, ofClass, onceAsync } from "@tutao/utils"
import { CancelledError } from "@tutao/app-env"
import { getElementId, isSameSingleId } from "@tutao/meta"
import { SearchRouter } from "../../../common/search/view/SearchRouter"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig"
import { createEmptyRestriction, emptyListModel, getSearchUrl, isNewSearch, LiveSearchResult, SearchQuery } from "../../../common/search/SearchUtils"
import { ContactSearchModel } from "../model/ContactSearchModel"
import Stream from "mithril/stream"
import { NotFoundError } from "@tutao/rest-client/error"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { compareContacts } from "../../contacts/ContactUtils"

export class ContactSearchViewModel {
	#listModel: ListModel<Contact, Id> = emptyListModel()
	get listModel(): ListModel<Contact, Id> {
		return this.#listModel
	}
	#delayingSearch: boolean = false
	get busy(): boolean {
		return this.#delayingSearch
	}
	private currentQuery: string = ""
	private searchResult: LiveSearchResult<Contact> | null = null
	private listStateSubscription: Stream<unknown> | null = null

	constructor(
		private readonly logins: LoginController,
		private readonly router: SearchRouter,
		private readonly entityClient: EntityClient,
		private readonly search: ContactSearchModel,
		private readonly updateUi: () => unknown,
	) {}

	getUrlFromSearchCategory(category: SearchCategoryType) {
		return getSearchUrl(this.currentQuery, createEmptyRestriction(category))
	}

	getSelectedContacts(): Contact[] {
		return this.#listModel.getSelectedAsArray()
	}

	getCurrentQuery(): string {
		return this.currentQuery
	}

	onSearchQueryUpdated(text: string) {
		this.currentQuery = text
		this.#delayingSearch = true
		this.debouncedUpdateSearchUrl(() => {
			this.#delayingSearch = false
		})
	}
	private readonly debouncedUpdateSearchUrl = debounce(200, (cb) => {
		this.updateSearchUrl()
		cb()
	})

	getHighlightedStrings(): readonly SearchToken[] {
		return this.searchResult?.searchResult.tokens ?? []
	}

	readonly init = onceAsync(async () => {})

	dispose() {
		this.stopLoadAll()
		this.searchResult?.dispose()
		this.listStateSubscription?.end(true)
	}

	stopLoadAll() {
		this.#listModel.cancelLoadAll()
	}

	onNewUrl(args: Record<string, any>, _requestedPath: string) {
		this.currentQuery = args.query ?? this.currentQuery
		const newSearchQuery: SearchQuery = { query: this.currentQuery, restriction: createEmptyRestriction(SearchCategoryType.contact), maxResults: null }
		if (isNewSearch(this.searchResult, newSearchQuery)) {
			this.searchResult?.dispose()
			this.stopLoadAll()
			const searchPromise = this.search.searchContacts(newSearchQuery).then((result) => {
				this.applyLiveSearchResults(result)
				return result
			})
			const listModel = this.createList(searchPromise, noOp)
			this.#listModel = listModel
			listModel.loadInitial()
			this.loadAndSelectIfNeeded(args.id)
			this.listStateSubscription?.end(true)
			this.listStateSubscription = this.listModel.stateStream.map(() => {
				this.updateUi()
			})
		}
	}
	private loadAndSelectIfNeeded(id: string | null, finder?: (a: Contact) => boolean) {
		// nothing to select
		if (id == null) {
			return
		}

		if (!this.#listModel.isItemSelected(id)) {
			if (!this.#listModel.isItemSelected(id)) {
				this.handleLoadAndSelection(id, finder)
			}
		}
	}
	private handleLoadAndSelection(id: string, finder: ((a: Contact) => boolean) | undefined) {
		const listModel = this.#listModel
		let iterations = 0
		this.#listModel.loadAndSelect(finder ?? ((item) => isSameSingleId(getElementId(item), id)), () => listModel !== this.#listModel || iterations++ > 10)
	}

	private createList(deferredResult: Promise<LiveSearchResult<Contact>>, restartSearch: () => unknown): ListModel<Contact, Id> {
		// the list is recreated every time a new search is performed, but not when the current result is extended
		// note in case of refactor: the fact that the list updates the URL every time it changes
		// its state is a major source of complexity and makes everything very order-dependent

		return new ListModel<Contact, Id>({
			fetch: async (lastFetchedEntity: Contact | null, count: number) => {
				let result
				try {
					result = await deferredResult
				} catch (e) {
					if (e instanceof CancelledError) {
						return { items: [], complete: true }
					} else {
						throw e
					}
				}
				let newItems
				if (isNotNull(lastFetchedEntity)) {
					newItems = await result.loadMoreResults(count)
				} else {
					newItems = result.items
				}
				const complete = !result.hasMoreResults
				return { items: newItems, complete }
			},
			getItemId(item: Contact): Id {
				return getElementId(item)
			},
			isSameId(id1, id2): boolean {
				return isSameSingleId(id1, id2)
			},
			sortCompare: (o1: Contact, o2: Contact) => {
				return compareContacts(o1, o2)
			},
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})
	}

	private applyLiveSearchResults(result: LiveSearchResult<Contact>) {
		this.searchResult = result
		// LiveSearchResult#dispose() will end the stream
		result.updates.map((update) => {
			switch (update.type) {
				case "deleteitem":
					this.listModel.deleteLoadedItem(getElementId(update.item))
					break
				case "updateitem":
					this.listModel.updateLoadedItem(update.item)
					break
			}
		})
	}

	private updateSearchUrl() {
		const selectedElement = this.#listModel.state.selectedItems.size === 1 ? this.#listModel.getSelectedAsArray().at(0) : null
		this.router.routeTo(this.currentQuery, createEmptyRestriction(SearchCategoryType.contact), selectedElement ? getElementId(selectedElement) : null)
	}

	deleteContacts(selected: readonly Contact[]): void {
		if (selected.length > 1) {
			// is needed for correct selection behavior on mobile
			this.listModel.selectNone()
		}

		for (const contact of selected) {
			this.entityClient.erase(contact).catch(
				ofClass(NotFoundError, (_) => {
					// ignore because the delete key shortcut may be executed again while the contact is already deleted
				}),
			)
		}
	}
}
