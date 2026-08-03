import { ListModel } from "../../../common/misc/ListModel"
import Id from "../../../../ui/translations/id"
import { createRestriction, getRestriction, getSearchUrl, searchQueryEquals } from "../model/SearchUtils"
import { SearchCategoryType, SearchRestriction } from "../../../common/api/worker/search/SearchTypes"
import { Contact } from "@tutao/entities/tutanota"
import { LoginController } from "../../../common/api/main/LoginController"
import { SearchToken } from "../../../../ui/utils/QueryTokenUtils"
import { debounce, isNotNull, noOp, onceAsync } from "@tutao/utils"
import { OfflineStorageSettingsModel } from "../../../common/offline/OfflineStorageSettingsModel"
import { CancelledError } from "@tutao/app-env"
import { getElementId, isSameId } from "@tutao/meta"
import { SearchRouter } from "../../../common/search/view/SearchRouter"
import { compareContacts } from "../../contacts/view/ContactGuiUtils"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig"
import { emptyListModel } from "../../../common/search/SearchUtils"
import { LiveSearchResult, SearchQuery } from "../../../common/search/CommonSearchModel"
import { ContactSearchModel } from "../model/ContactSearchModel"

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
	constructor(
		private readonly logins: LoginController,
		private readonly router: SearchRouter,
		private readonly search: ContactSearchModel,
		private readonly offlineStorageSettings: OfflineStorageSettingsModel | null,
		private readonly updateUi: () => unknown,
	) {}

	getUrlFromSearchCategory(category: SearchCategoryType) {
		return getSearchUrl(this.currentQuery, createRestriction(category, null, null, null, [], null))
	}

	getSelectedContacts(): Contact[] {
		return this.#listModel.getSelectedAsArray()
	}

	getCurrentQuery() {
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

	getUserId() {
		return this.logins.getUserController().userId
	}

	getHighlightedStrings(): readonly SearchToken[] {
		return this.searchResult?.searchResult.tokens ?? []
	}

	readonly init = onceAsync(async () => {
		await this.offlineStorageSettings?.init()
	})

	dispose() {
		this.stopLoadAll()
		this.searchResult?.dispose()
	}
	stopLoadAll() {
		this.#listModel.cancelLoadAll()
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {
		const query: string = args.query ?? ""
		let restriction: SearchRestriction
		try {
			restriction = getRestriction(requestedPath)
		} catch (e) {
			// if restriction is broken replace it with non-broken version
			this.router.routeTo(query, createRestriction(SearchCategoryType.contact, null, null, null, [], null))
			return
		}
		const lastQuery = this.currentQuery
		this.currentQuery = query
		const searchQuery = Object.hasOwn(args, "query") ? query : lastQuery
		const currentQuery: SearchQuery | null = this.searchResult
			? {
					query: this.searchResult.searchResult.query,
					restriction: this.searchResult.searchResult.restriction,
					maxResults: this.searchResult.searchResult.maxResults ?? null,
				}
			: null
		const newQuery: SearchQuery = { query: searchQuery ?? "", restriction, maxResults: null }
		const isNewSearch = currentQuery ? !searchQueryEquals(currentQuery, newQuery) : true
		if (isNewSearch) {
			this.searchResult?.dispose()
			this.stopLoadAll()
			const searchPromise = this.search
				.coolNewSearchContacts({
					query: searchQuery ?? "",
					restriction,
					maxResults: null,
				})
				.then((result) => {
					this.applyLiveSearchResults(result)
					return result
				})
			const listModel = this.createList(searchPromise, noOp)
			this.#listModel = listModel
			listModel.loadInitial()
			this.loadAndSelectIfNeeded(args.id)
		}
		this.listModel.stateStream.map(() => {
			this.updateUi()
		})
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
		this.#listModel.loadAndSelect(finder ?? ((item) => isSameId(getElementId(item), id)), () => listModel !== this.#listModel || iterations++ > 10)
	}

	private createList(deferredResult: Promise<LiveSearchResult<Contact>>, restartSearch: () => unknown): ListModel<Contact, Id> {
		// the list is recreated every time a new search is performed, but not when the current result is extended
		// note in case of refactor: the fact that the list updates the URL every time it changes
		// its state is a major source of complexity and makes everything very order-dependent

		let initialLoadAborted = false
		return new ListModel<Contact, Id>({
			fetch: async (lastFetchedEntity: Contact | null, count: number) => {
				let result
				try {
					result = await deferredResult
					initialLoadAborted = false
				} catch (e) {
					if (e instanceof CancelledError) {
						if (initialLoadAborted) {
							restartSearch()
						}
						initialLoadAborted = true
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
				return isSameId(id1, id2)
			},
			sortCompare: (o1: Contact, o2: Contact) => {
				return compareContacts(o1, o2)
			},
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})
	}

	private applyLiveSearchResults(result: LiveSearchResult<Contact>) {
		this.searchResult = result
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
		this.router.routeTo(
			this.currentQuery,
			createRestriction(SearchCategoryType.contact, null, null, null, [], null),
			selectedElement ? getElementId(selectedElement) : null,
		)
	}
}
