// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {List} from "../gui/base/List"
import {sortCompareByReverseId, GENERATED_MAX_ID, isSameTypeRef, TypeRef, isSameId} from "../api/common/EntityFunctions"
import {assertMainOrNode} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {size} from "../gui/size"
import {MailRow} from "../mail/MailListView"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {load} from "../api/main/Entity"
import {ContactRow} from "../contacts/ContactListView"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import type {SearchView} from "./SearchView"
import {NotFoundError} from "../api/common/error/RestError"
import {locator} from "../api/main/MainLocator"
import {compareContacts} from "../contacts/ContactUtils"
import {defer} from "../api/common/utils/Utils"
import type {OperationTypeEnum} from "../api/common/TutanotaConstants"

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
	_resultStreamDependency: ?stream;
	oncreate: Function;
	onremove: Function;
	_lastType: TypeRef<Mail> | TypeRef<Contact>;

	constructor(searchView: SearchView) {
		this._searchView = searchView
		this.oncreate = () => {
			this.list = this._createList()
			this._loadInitial(this.list)
			this._resultStreamDependency = locator.search.result.map((result) => {
				// if this search type is the same as the last one, don't re-create the list, just clear it
				if (result && isSameTypeRef(this._lastType, result.restriction.type) || result == null) {
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
				this._searchView.newResultReceived()
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
		let selectedId = m.route.param()["id"]
		list.loadInitial(selectedId)
	}

	isInSearchResult(typeRef: TypeRef<any>, id: IdTuple): boolean {
		return locator.search.result() && isSameTypeRef(typeRef, locator.search.result().restriction.type)
			&& locator.search.result().results.find(r => isSameId(r, id))
	}

	_createList(): List<SearchResultListEntry, SearchResultListRow> {
		this._lastType = m.route.param()['category'] === 'mail' ? MailTypeRef : ContactTypeRef
		return new List({
			rowHeight: size.list_row_height,
			fetch: (startId, count) => {
				let result = locator.search.result()
				if (result && result.initializing) {
					// show spinner until the actual search result is available
					return defer().promise
				}
				if (!result || result.results.length === 0) {
					return Promise.resolve([])
				}
				let mail = isSameTypeRef(result.restriction.type, MailTypeRef)
				let contact = isSameTypeRef(result.restriction.type, ContactTypeRef)
				let resultIds = [].concat(result.results) //create copy
				if (mail) {
					let startIndex = 0
					if (startId !== GENERATED_MAX_ID) {
						startIndex = resultIds.findIndex(id => id[1] === startId)
						if (startIndex === -1) {
							throw new Error("start index not found")
						} else {
							startIndex++ // the start index is already in the list of loaded elements load from the next element
						}
					}
					let toLoad = resultIds.slice(startIndex, startIndex + count)
					return Promise.map(toLoad, (id) => load(result.restriction.type, id)
							.then(instance => new SearchResultListEntry(instance))
							.catch(NotFoundError, () => console.log("mail not found")),
						{concurrency: 5})
					              .then(sr => sr.filter(r => r)) // filter not found instances
					              .finally(() => m.redraw())
				} else if (contact) {
					// load all contacts to sort them by name afterwards
					return Promise.map(resultIds, (id) => load(result.restriction.type, id)
							.then(instance => new SearchResultListEntry(instance))
							.catch(NotFoundError, () => console.log("contact not found")),
						{concurrency: 5})
					              .then(sr => sr.filter(r => r)) // filter not found instances
					              .finally(() => {
						              this.list && this.list.setLoadedCompletely()
						              m.redraw()
					              })
				} else {
					// this type is not shown in the search view, e.g. group info
					return Promise.resolve([])
				}
			},
			loadSingle: (elementId) => {
				let result = locator.search.result()
				if (result) {
					let id = result.results.find(r => r[1] === elementId)
					if (id) {
						return load(locator.search.result().restriction.type, id)
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
			createVirtualRow: () => new SearchResultListRow(m.route.param()['category'] === 'mail' ?
				new MailRow(true) : new ContactRow()),
			showStatus: false,
			className: m.route.param()['category'] === 'mail' ? "mail-list" : "contact-list",
			swipe: ({
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: listElement => Promise.resolve(),
				swipeRight: listElement => Promise.resolve(),
			}: any),
			elementsDraggable: false,
			multiSelectionAllowed: false,
			emptyMessage: lang.get("searchNoResults_msg") + "\n" + lang.get("switchSearchInMenu_label")
		})
	}

	entityEventReceived(elementId: Id, operation: OperationTypeEnum): Promise<void> {
		if (this.list) {
			return this.list.entityEventReceived(elementId, operation)
		}
		return Promise.resolve()
	}

	isEntitySelected(id: Id): boolean {
		if (this.list) {
			return this.list.isEntitySelected(id)
		}
		return false
	}

	deleteLoadedEntity(elementId: Id): Promise<void> {
		if (this.list) {
			return this.list._deleteLoadedEntity(elementId)
		}
		return Promise.resolve()
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

	isListAvailable() {
		return this.list != null && this.list.ready
	}

}

export class SearchResultListRow {
	top: number;
	domElement: HTMLElement; // set from List
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
