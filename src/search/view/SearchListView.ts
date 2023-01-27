import m, { Children, Component } from "mithril"
import { List, ListFetchResult } from "../../gui/base/List"
import { assertMainOrNode } from "../../api/common/Env"
import { lang } from "../../misc/LanguageViewModel"
import { size } from "../../gui/size"
import type { Contact, Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactTypeRef, MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactRow } from "../../contacts/view/ContactListView"
import type { SearchView } from "./SearchView"
import { NotFoundError } from "../../api/common/error/RestError"
import { locator } from "../../api/main/MainLocator"
import type { DeferredObject } from "@tutao/tutanota-utils"
import { defer, downcast, groupBy, isSameTypeRef, neverNull, noOp, ofClass, TypeRef } from "@tutao/tutanota-utils"
import type { OperationType } from "../../api/common/TutanotaConstants"
import { logins } from "../../api/main/LoginController"
import { hasMoreResults } from "../model/SearchModel"
import { Dialog } from "../../gui/base/Dialog"
import { assertIsEntity2, elementIdPart, GENERATED_MAX_ID, isSameId, listIdPart, sortCompareByReverseId } from "../../api/common/utils/EntityUtils"
import { archiveMails, moveToInbox, showDeleteConfirmationDialog, showMoveMailsDropdown } from "../../mail/view/MailGuiUtils"
import { MailRow } from "../../mail/view/MailRow"
import { compareContacts } from "../../contacts/view/ContactGuiUtils"
import type { SearchResult } from "../../api/worker/search/SearchTypes"
import type { ListElementEntity } from "../../api/common/EntityTypes"
import Stream from "mithril/stream"
import { markMails } from "../../mail/model/MailUtils.js"

assertMainOrNode()

type SearchableTypes = Mail | Contact

export class SearchResultListEntry {
	_id: IdTuple
	entry: SearchableTypes

	constructor(entry: SearchableTypes) {
		this._id = entry._id
		this.entry = entry
	}
}

export class SearchListView implements Component {
	list: List<SearchResultListEntry, SearchResultListRow> | null = null
	readonly view: Component["view"]
	private _searchView: SearchView
	private _resultStreamDependency: Stream<any> | null = null
	readonly oncreate: Component["oncreate"]
	readonly onremove: Component["onremove"]
	// currently accessed from outside
	_lastType: TypeRef<Mail> | TypeRef<Contact>
	// Contains load more results even when searchModel doesn't.
	// Load more should probably be moved to the model to update it's result stream.
	_searchResult: SearchResult | null = null
	_lastSearchResults: DeferredObject<ListFetchResult<SearchResultListEntry>> | null = null

	constructor(searchView: SearchView) {
		this._searchView = searchView
		this._lastType = MailTypeRef

		this.oncreate = () => {
			this.list = this._createList()

			if (!locator.search.result()) {
				// do not call loadInitial if we already have a result. It will be called during the subscription for result stream. This is only needed for mobile search or by navigating to /search url
				this._loadInitial(neverNull(this.list))
			}

			this._resultStreamDependency = locator.search.result.map((result) => {
				const oldResult = this._searchResult
				this._searchResult = result

				if (!result) {
					// result is null so we assume that a new search has been triggered. Show spinner in this case
					if (this.list) {
						const l = this.list

						if (oldResult && oldResult.results.length > 0) {
							l.clear()
						}

						l.displaySpinner()
					}
				} else if (isSameTypeRef(this._lastType, result.restriction.type)) {
					// if this search type is the same as the last one, don't re-create the list, just clear it
					if (this.list) {
						const l = this.list
						l.clear()

						this._loadInitial(l)
					}
				} else {
					const l = this._createList()

					this.list = l
					window.requestAnimationFrame(() => {
						// m.redraw() must not be called immediately in the stream.map function because it would lead to errors for the initial call. therefore use requestAnimationFrame
						m.redraw()

						this._loadInitial(l)
					})
				}
			})
		}

		this.view = (): Children => {
			return this.list ? m(this.list) : null
		}

		this.onremove = () => {
			if (this._resultStreamDependency) {
				this._resultStreamDependency.end(true)
			}
		}
	}

	_loadInitial(list: List<any, any>) {
		let selectedId = m.route.param("id")
		list.loadInitial(selectedId)
	}

	isInSearchResult(typeRef: TypeRef<any>, id: IdTuple): boolean {
		const result = this._searchResult
		return !!(result && isSameTypeRef(typeRef, result.restriction.type) && result.results.find((r) => isSameId(r, id)))
	}

	_createList(): List<SearchResultListEntry, SearchResultListRow> {
		this._lastType = m.route.param("category") === "mail" ? MailTypeRef : ContactTypeRef
		return new List({
			rowHeight: size.list_row_height,
			fetch: async (startId, count) => {
				if (locator.search.indexState().initializing) {
					// show spinner until the actual search index is initialized
					return new Promise(noOp)
				}

				const lastResult = this._searchResult

				if (!lastResult || (lastResult.results.length === 0 && !hasMoreResults(lastResult))) {
					return { items: [], complete: true }
				}

				// If search is triggered and completes again before we finished loading the results from the previous search
				// then we will end up loading results again and they will be inserted into the list, resulting in duplicate entries
				// this can happen if the user hits the enter key fast while in the search bar
				// so we will ignore whatever is being downloaded from the last search, and the new search will update the list
				if (this._lastSearchResults) {
					this._lastSearchResults.resolve({ items: [], complete: true })
				}

				const deferredResult = defer<ListFetchResult<SearchResultListEntry>>()
				this._lastSearchResults = deferredResult

				this.loadSearchResults(lastResult, startId !== GENERATED_MAX_ID, startId, count)
					.then((results) => {
						const entries = results.map((instance) => new SearchResultListEntry(instance))

						// We only want to resolve the most recent deferred object with it's respective search query results
						// Any queries that started but didn't finish before this one began have already been resolved with `[]`
						if (this._lastSearchResults === deferredResult) {
							deferredResult.resolve({ items: entries, complete: entries.length < count })
							this._lastSearchResults = null
						}
					})
					.catch(deferredResult.reject)

				return deferredResult.promise.finally(m.redraw)
			},
			loadSingle: (elementId) => {
				if (this._searchResult) {
					const currentResult = this._searchResult
					let id = currentResult.results.find((r) => r[1] === elementId)

					if (id) {
						return locator.entityClient
							.load(currentResult.restriction.type, id)
							.then((entity) => new SearchResultListEntry(entity))
							.catch(
								ofClass(NotFoundError, (e) => {
									// we return null if the entity does not exist
									return null
								}),
							)
					} else {
						return Promise.resolve(null)
					}
				} else {
					return Promise.resolve(null)
				}
			},
			sortCompare: (o1: SearchResultListEntry, o2: SearchResultListEntry) => {
				if (isSameTypeRef(o1.entry._type, ContactTypeRef)) {
					return compareContacts(o1.entry as any, o2.entry as any)
				} else {
					return sortCompareByReverseId(o1.entry, o2.entry)
				}
			},
			elementSelected: (entities: SearchResultListEntry[], elementClicked, selectionChanged, multiSelectionActive) => {
				this._searchView.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive)
			},
			createVirtualRow: () => new SearchResultListRow(m.route.param("category") === "mail" ? new MailRow(true) : new ContactRow()),
			className: m.route.param("category") === "mail" ? "mail-list" : "contact-list",
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: () => Promise.resolve(false),
				swipeRight: () => Promise.resolve(false),
				enabled: false,
			},
			multiSelectionAllowed: true,
			emptyMessage:
				lang.get("searchNoResults_msg") +
				"\n" +
				(logins.getUserController().isFreeAccount() ? lang.get("goPremium_msg") : lang.get("switchSearchInMenu_label")),
		})
	}

	private async loadSearchResults<T extends SearchableTypes>(
		currentResult: SearchResult,
		getMoreFromSearch: boolean,
		startId: Id,
		count: number,
	): Promise<T[]> {
		const mail = isSameTypeRef(currentResult.restriction.type, MailTypeRef)
		const contact = isSameTypeRef(currentResult.restriction.type, ContactTypeRef)

		if (!isSameTypeRef(this._lastType, currentResult.restriction.type)) {
			return []
		}

		const result =
			getMoreFromSearch && hasMoreResults(currentResult) ? await locator.searchFacade.getMoreSearchResults(currentResult, count) : currentResult

		// we need to override global reference for other functions
		this._searchResult = result

		let searchResult
		if (mail) {
			let startIndex = 0

			if (startId !== GENERATED_MAX_ID) {
				startIndex = result.results.findIndex((id) => id[1] === startId)

				if (startIndex === -1) {
					throw new Error("start index not found")
				} else {
					// the start index is already in the list of loaded elements load from the next element
					startIndex++
				}
			}

			// Ignore count when slicing here because we would have to modify SearchResult too
			const toLoad = result.results.slice(startIndex)
			searchResult = await this.loadAndFilterInstances(currentResult.restriction.type, toLoad, result, startIndex)
		} else if (contact) {
			try {
				// load all contacts to sort them by name afterwards
				searchResult = await this.loadAndFilterInstances(currentResult.restriction.type, result.results, result, 0)
			} finally {
				this.list && this.list.setLoadedCompletely()
				m.redraw()
			}
		} else {
			// this type is not shown in the search view, e.g. group info
			searchResult = []
		}

		if (searchResult.length < count && hasMoreResults(this._searchResult)) {
			// Recursively load more until we have enough or there are no more results.
			// Otherwise List thinks that this is the end
			return this.loadSearchResults(neverNull(this._searchResult), true, startId, count)
		} else {
			return searchResult
		}
	}

	entityEventReceived(elementId: Id, operation: OperationType): Promise<void> {
		if (this.list) {
			return this.list.entityEventReceived(elementId, operation)
		}

		return Promise.resolve()
	}

	private async loadAndFilterInstances<T extends ListElementEntity>(
		type: TypeRef<T>,
		toLoad: IdTuple[],
		currentResult: SearchResult,
		startIndex: number,
	): Promise<T[]> {
		let instances = [] as T[]
		for (let [listId, ids] of groupBy(toLoad, listIdPart)) {
			const loaded = await locator.entityClient.loadMultiple(type, listId, ids.map(elementIdPart))
			instances = instances.concat(loaded)
		}

		// Filter not found instances from the current result as well so we don’t loop trying to load them
		if (instances.length < toLoad.length) {
			const resultLength = currentResult.results.length
			console.log(`Could not load some results: ${instances.length} out of ${toLoad.length}`)

			// loop backwards to remove correct elements by index
			for (let i = toLoad.length - 1; i >= 0; i--) {
				const toLoadId = toLoad[i]

				if (instances.find((instance) => isSameId(instance._id, toLoadId)) == null) {
					currentResult.results.splice(startIndex + i, 1)

					if (instances.length === toLoad.length) {
						break
					}
				}
			}

			console.log(`Fixed results, before ${resultLength}, after: ${currentResult.results.length}`)
		}

		return instances
	}

	isEntitySelected(id: Id): boolean {
		if (this.list) {
			return this.list.isEntitySelected(id)
		}

		return false
	}

	getSelectedEntities(): SearchResultListEntry[] {
		if (this.list) {
			return this.list.getSelectedEntities()
		}

		return []
	}

	loading(): Promise<void> {
		if (this.list) {
			return this.list.loading
		}

		return Promise.resolve()
	}

	selectNext(shiftPressed: boolean) {
		if (this.list) {
			this.list.selectNext(shiftPressed)
		}
	}

	selectPrevious(shiftPressed: boolean) {
		if (this.list) {
			this.list.selectPrevious(shiftPressed)
		}
	}

	scrollToIdAndSelect(listElementId: Id): Promise<SearchResultListEntry | null> {
		if (this.list) {
			return this.list.scrollToIdAndSelect(listElementId)
		}

		return Promise.resolve(null)
	}

	selectNone() {
		if (this.list) {
			this.list.selectNone()
		}
	}

	archiveSelected(): void {
		const selectedMails = this.getSelectedEntities()
			.map((e) => e.entry)
			.filter(assertIsEntity2(MailTypeRef))

		if (selectedMails.length > 0) {
			if (selectedMails.length > 1) {
				this.selectNone()
			}

			archiveMails(selectedMails)
		}
	}

	moveSelectedToInbox(): void {
		const selectedMails = this.getSelectedEntities()
			.map((e) => e.entry)
			.filter(assertIsEntity2(MailTypeRef))

		if (selectedMails.length > 0) {
			if (selectedMails.length > 1) {
				this.selectNone()
			}

			moveToInbox(selectedMails)
		}
	}

	move() {
		const selectedMails = this.getSelectedEntities()
			.map((e) => e.entry)
			.filter(assertIsEntity2(MailTypeRef))

		if (this.list && selectedMails.length > 0) {
			showMoveMailsDropdown(locator.mailModel, this.list.getSelectionBounds(), selectedMails, {
				onSelected: () => {
					if (selectedMails.length > 1) {
						this.selectNone()
					}
				},
			})
		}
	}

	toggleUnreadStatus(): void {
		let selectedMails = this.getSelectedEntities()
			.map((e) => e.entry)
			.filter(assertIsEntity2(MailTypeRef))

		if (selectedMails.length > 0) {
			markMails(locator.entityClient, selectedMails, !selectedMails[0].unread)
		}
	}

	deleteSelected(): void {
		const selectedEntries = this.getSelectedEntities()
		if (selectedEntries.length > 0) {
			if (isSameTypeRef(this._lastType, MailTypeRef)) {
				const selected = selectedEntries.map((e) => e.entry).filter(assertIsEntity2(MailTypeRef))
				showDeleteConfirmationDialog(selected).then((confirmed) => {
					if (confirmed) {
						if (selected.length > 1) {
							// is needed for correct selection behavior on mobile
							this.selectNone()
						}

						locator.mailModel.deleteMails(selected)
					}
				})
			} else if (isSameTypeRef(this._lastType, ContactTypeRef)) {
				Dialog.confirm("deleteContacts_msg").then((confirmed) => {
					if (confirmed) {
						if (selectedEntries.length > 1) {
							// is needed for correct selection behavior on mobile
							this.selectNone()
						}
						const selected = selectedEntries.map((e) => e.entry).filter(assertIsEntity2(ContactTypeRef))

						for (const contact of selected) {
							locator.entityClient.erase(contact).catch(
								ofClass(NotFoundError, (e) => {
									// ignore because the delete key shortcut may be executed again while the contact is already deleted
								}),
							)
						}
					}
				})
			}
		}
	}
}

export class SearchResultListRow {
	top: number
	domElement: HTMLElement | null = null // set from List

	entity: SearchResultListEntry | null
	private _delegate: MailRow | ContactRow

	constructor(delegate: MailRow | ContactRow) {
		this._delegate = delegate
		this.top = 0
		this.entity = null
	}

	update(entry: SearchResultListEntry, selected: boolean): void {
		this._delegate.domElement = this.domElement

		this._delegate.update(downcast(entry.entry), selected)
	}

	render(): Children {
		return this._delegate.render()
	}
}
