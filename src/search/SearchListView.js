// @flow
import m from "mithril"
import {List} from "../gui/base/List"
import type {ListElement} from "../api/common/EntityFunctions"
import {
	elementIdPart,
	GENERATED_MAX_ID,
	isSameId,
	isSameTypeRef,
	listIdPart,
	sortCompareByReverseId,
	TypeRef
} from "../api/common/EntityFunctions"
import {assertMainOrNode} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {size} from "../gui/size"
import {MailRow} from "../mail/MailListView"
import type {Mail} from "../api/entities/tutanota/Mail"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {erase, load, loadMultiple} from "../api/main/Entity"
import {ContactRow} from "../contacts/ContactListView"
import type {Contact} from "../api/entities/tutanota/Contact"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import type {SearchView} from "./SearchView"
import {NotFoundError} from "../api/common/error/RestError"
import {locator} from "../api/main/MainLocator"
import {compareContacts} from "../contacts/ContactUtils"
import {defer, neverNull} from "../api/common/utils/Utils"
import type {OperationTypeEnum} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {logins} from "../api/main/LoginController"
import {hasMoreResults} from "./SearchModel"
import {archiveMails, moveToInbox, showDeleteConfirmationDialog} from "../mail/MailUtils"
import {Dialog} from "../gui/base/Dialog"
import {flat, groupBy} from "../api/common/utils/ArrayUtils"

assertMainOrNode()

export class SearchResultListEntry {
	_id: IdTuple;
	entry: Mail | Contact;

	constructor(entry: Mail | Contact) {
		this._id = entry._id
		this.entry = entry
	}
}

export class SearchListView {
	list: ?List<SearchResultListEntry, SearchResultListRow>;
	view: Function;
	_searchView: SearchView;
	_resultStreamDependency: ?Stream<any>;
	oncreate: Function;
	onremove: Function;
	_lastType: (TypeRef<Mail> | TypeRef<Contact>);
	// Contains load more results even when searchModel doesn't.
	// Load more should probably be moved to the model to update it's result stream.
	_searchResult: ?SearchResult;

	constructor(searchView: SearchView) {
		this._searchView = searchView
		this._lastType = MailTypeRef
		this.oncreate = () => {
			this.list = this._createList()
			if (!locator.search.result()) { // do not call loadInitial if we already have a result. It will be called during the subscription for result stream. This is only needed for mobile search or by navigating to /search url
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
						l.displaySpinner(true, true)
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

		this.view = (): ?VirtualElement => {
			return this.list ? m(this.list) : null
		}

		this.onremove = () => {
			if (this._resultStreamDependency) {
				this._resultStreamDependency.end(true)
			}
		}
	}

	_loadInitial(list: List<*, *>) {
		let selectedId = m.route.param("id")
		list.loadInitial(selectedId)
	}

	isInSearchResult(typeRef: TypeRef<any>, id: IdTuple): boolean {
		const result = this._searchResult
		return !!(result && isSameTypeRef(typeRef, result.restriction.type)
			&& result.results.find(r => isSameId(r, id)))
	}

	_createList(): List<SearchResultListEntry, SearchResultListRow> {
		this._lastType = m.route.param("category") === 'mail' ? MailTypeRef : ContactTypeRef
		return new List({
			rowHeight: size.list_row_height,
			fetch: (startId, count) => {
				if (locator.search.indexState().initializing) {
					// show spinner until the actual search index is initialized
					return defer().promise
				}
				if (!this._searchResult || this._searchResult.results.length === 0 && !hasMoreResults(this._searchResult)) {
					return Promise.resolve([])
				}
				return this._loadSearchResults(this._searchResult, startId !== GENERATED_MAX_ID, startId, count)
				           .then(results => results.map(instance => new SearchResultListEntry(instance)))
				           .finally(m.redraw)
			},
			loadSingle: (elementId) => {
				if (this._searchResult) {
					const currentResult = this._searchResult
					let id = currentResult.results.find(r => r[1] === elementId)
					if (id) {
						return load(currentResult.restriction.type, id)
							.then(entity => new SearchResultListEntry(entity))
							.catch(NotFoundError, (e) => {
								// we return null if the entity does not exist
								return null
							})
					} else {
						return Promise.resolve(null)
					}
				} else {
					return Promise.resolve(null)
				}
			},

			sortCompare: (o1: SearchResultListEntry, o2: SearchResultListEntry) => {
				if (isSameTypeRef(o1.entry._type, ContactTypeRef)) {
					return compareContacts((o1.entry: any), (o2.entry: any))
				} else {
					return sortCompareByReverseId(o1.entry, o2.entry)
				}
			},

			elementSelected: (entities: SearchResultListEntry[], elementClicked, selectionChanged, multiSelectionActive) => {
				this._searchView.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive)
			},
			createVirtualRow: () => new SearchResultListRow(m.route.param('category') === 'mail' ?
				new MailRow(true) : new ContactRow()),
			showStatus: false,
			className: m.route.param('category') === 'mail' ? "mail-list" : "contact-list",
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: () => Promise.resolve(),
				swipeRight: () => Promise.resolve(),
				enabled: false,
			},
			elementsDraggable: false,
			multiSelectionAllowed: true,
			emptyMessage: lang.get("searchNoResults_msg") + "\n" + (logins.getUserController()
			                                                              .isFreeAccount() ? lang.get("goPremium_msg") : lang.get("switchSearchInMenu_label"))
		})
	}


	_loadSearchResults<T : Mail | Contact>(currentResult: SearchResult, getMoreFromSearch: boolean, startId: Id, count: number): Promise<T[]> {
		let mail = isSameTypeRef(currentResult.restriction.type, MailTypeRef)
		let contact = isSameTypeRef(currentResult.restriction.type, ContactTypeRef)
		if (!isSameTypeRef(this._lastType, currentResult.restriction.type)) {
			//console.log("different type ref - don't load resuloadInitiallts")
			return Promise.resolve([])
		}
		let loadingResultsPromise = Promise.resolve(currentResult)
		if (getMoreFromSearch && hasMoreResults(currentResult)) {
			loadingResultsPromise = worker.getMoreSearchResults(currentResult, count)
		}
		return loadingResultsPromise
			.then((moreResults) => {
				// we need to override global reference for other functions
				this._searchResult = moreResults
				if (mail) {
					let startIndex = 0
					if (startId !== GENERATED_MAX_ID) {
						startIndex = moreResults.results.findIndex(id => id[1] === startId)
						if (startIndex === -1) {
							throw new Error("start index not found")
						} else {
							startIndex++ // the start index is already in the list of loaded elements load from the next element
						}
					}
					// Ignore count when slicing here because we would have to modify SearchResult too
					let toLoad = moreResults.results.slice(startIndex)
					return this._loadAndFilterInstances(currentResult.restriction.type, toLoad, moreResults, startIndex)
				} else if (contact) {
					// load all contacts to sort them by name afterwards
					return this._loadAndFilterInstances(currentResult.restriction.type, moreResults.results, moreResults, 0)
					           .finally(() => {
						           this.list && this.list.setLoadedCompletely()
						           m.redraw()
					           })
				} else {
					// this type is not shown in the search view, e.g. group info
					return Promise.resolve([])
				}
			})
			.then(results => {
				return results.length < count && hasMoreResults(neverNull(this._searchResult))
					// Recursively load more until we have enough or there are no more results.
					// Otherwise List thinks that this is the end
					? this._loadSearchResults(neverNull(this._searchResult), true, startId, count)
					: results
			})

	}

	entityEventReceived(elementId: Id, operation: OperationTypeEnum): Promise<void> {
		if (this.list) {
			return this.list.entityEventReceived(elementId, operation)
		}
		return Promise.resolve()
	}

	_loadAndFilterInstances<T: ListElement>(type: TypeRef<T>, toLoad: IdTuple[], currentResult: SearchResult,
	                                        startIndex: number): Promise<T[]> {

		const grouped = groupBy(toLoad, listIdPart)
		return Promise.map(grouped, ([listId, ids]) => loadMultiple(type, listId, ids.map(elementIdPart)), {concurrency: 1})
		              .then(flat)
		              .then((loaded) => {
			              // Filter not found instances from the current result as well so we don’t loop trying to load them
			              if (loaded.length < toLoad.length) {
				              const resultLength = currentResult.results.length
				              console.log(`Could not load some results: ${loaded.length} out of ${toLoad.length}`)
				              // loop backwards to remove correct elements by index
				              for (let i = toLoad.length - 1; i >= 0; i--) {
					              const toLoadId = toLoad[i]
					              if (loaded.find((l) => isSameId(l._id, toLoadId)) == null) {
						              currentResult.results.splice(startIndex + i, 1)
						              if (loaded.length === toLoad.length) {
							              break
						              }
					              }
				              }
				              console.log(`Fixed results, before ${resultLength}, after: ${currentResult.results.length}`)
			              }
			              return loaded
		              })
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
			return this.list._loading
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

	scrollToIdAndSelect(listElementId: Id): Promise<?SearchResultListEntry> {
		if (this.list) {
			return this.list.scrollToIdAndSelect(listElementId);
		}
		return Promise.resolve(null);
	}

	selectNone() {
		if (this.list) {
			this.list.selectNone()
		}
	}

	isListAvailable(): boolean {
		return this.list != null && this.list.ready
	}

	archiveSelected(): void {
		let selected = this.getSelectedEntities()
		if (selected.length > 0) {
			if (isSameTypeRef(selected[0].entry._type, MailTypeRef)) {
				let selectedMails = selected.map(m => ((m.entry: any): Mail))
				if (selected.length > 1) {
					// is needed for correct selection behavior on mobile
					this.selectNone()
				}
				archiveMails(selectedMails)
			}
		}
	}

	moveSelectedToInbox(): void {
		let selected = this.getSelectedEntities()
		if (selected.length > 0) {
			if (isSameTypeRef(selected[0].entry._type, MailTypeRef)) {
				let selectedMails = selected.map(m => ((m.entry: any): Mail))
				if (selected.length > 1) {
					// is needed for correct selection behavior on mobile
					this.selectNone()
				}
				moveToInbox(selectedMails)
			}
		}
	}

	deleteSelected(): void {
		let selected = this.getSelectedEntities()
		if (selected.length > 0) {
			if (isSameTypeRef(selected[0].entry._type, MailTypeRef)) {
				let selectedMails = selected.map(m => ((m.entry: any): Mail))
				showDeleteConfirmationDialog(selectedMails).then(confirmed => {
					if (confirmed) {
						if (selected.length > 1) {
							// is needed for correct selection behavior on mobile
							this.selectNone()
						}
						locator.mailModel.deleteMails(selectedMails)
					}
				})
			} else if (isSameTypeRef(selected[0].entry._type, ContactTypeRef)) {
				let selectedContacts = selected.map(m => ((m.entry: any): Contact))
				Dialog.confirm("deleteContacts_msg").then(confirmed => {
					if (confirmed) {
						if (selected.length > 1) {
							// is needed for correct selection behavior on mobile
							this.selectNone()
						}
						selectedContacts.forEach((c) => erase(c).catch(NotFoundError, e => {
							// ignore because the delete key shortcut may be executed again while the contact is already deleted
						}))
					}
				})
			}
		}
	}
}

export class SearchResultListRow {
	top: number;
	domElement: ?HTMLElement; // set from List
	entity: ?SearchResultListEntry;
	_delegate: MailRow | ContactRow

	constructor(delegate: MailRow | ContactRow) {
		this._delegate = delegate
		this.top = 0
		this.entity = null
	}

	update(entry: SearchResultListEntry, selected: boolean): void {
		this._delegate.domElement = this.domElement
		this._delegate.update((entry.entry: any), selected)
	}

	render(): Children {
		return this._delegate.render()
	}
}
