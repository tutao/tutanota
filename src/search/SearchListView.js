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

assertMainOrNode()

export class SearchResultListEntry {
	_id: IdTuple;
	entry: Mail|Contact;
 
	constructor(entry: Mail|Contact) {
		this._id = entry._id
		this.entry = entry
	}
}

export class SearchListView {
	list: List<SearchResultListEntry, SearchResultListRow>;
	view: Function;
	_searchView: SearchView;
	_resultStreamDependency: ?stream;
	oncreate: Function;
	onremove: Function;

	constructor(searchView: SearchView) {
		this._searchView = searchView
		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: (startId, count) => defer().promise, // show spinner until the actual search result is available
			loadSingle: (elementId) => Promise.resolve(null),
			sortCompare: sortCompareByReverseId,
			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) => {
			},
			createVirtualRow: () => new SearchResultListRow(m.route.param()['category'] == 'mail' ? new MailRow(true) : new ContactRow()),
			showStatus: false,
			className: m.route.param()['category'] == 'mail' ? "mail-list" : "contact-list",
			swipe: ({
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: listElement => Promise.resolve(),
				swipeRight: listElement => Promise.resolve(),
			}:any),
			elementsDraggable: false,
			multiSelectionAllowed: false,
			emptyMessage: lang.get("searchNoResults_msg")
		})
		this.list.loadInitial(null).then(() => {
			window.requestAnimationFrame(() => this.list.scrollToIdAndSelect(m.route.param()["id"]))
		})

		this.oncreate = () => {
			this._resultStreamDependency = locator.search.result.map(() => {
				this.list = new List({
					rowHeight: size.list_row_height,
					fetch: (startId, count) => {
//					console.log("fetch ", startId, count)
						let result = locator.search.result()
						if (result && result.initializing) {
							// show spinner until the actual search result is available
							return defer().promise
						}
						if (!result || result.results.length == 0) {
							return Promise.resolve([])
						}
						let mail = isSameTypeRef(result.restriction.type, MailTypeRef)
						let contact = isSameTypeRef(result.restriction.type, ContactTypeRef)
						let resultIds = [].concat(result.results) //create copy
						//console.log("found results: ", resultIds.length)
						if (mail) {
							let startIndex = 0
							if (startId != GENERATED_MAX_ID) {
								startIndex = resultIds.findIndex(id => id[1] == startId)
								if (startIndex == -1) {
									throw new Error("start index not found")
								} else {
									startIndex++ // the start index is already in the list of loaded elements load from the next element
								}
							}
							let toLoad = resultIds.slice(startIndex, startIndex + count)
							//console.log("load", toLoad.length, "first", (toLoad.length > 0 ? toLoad[0][1] : "emtpy"), "last", (toLoad.length > 0 ? toLoad[toLoad.length - 1][1] : "emtpy"))
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
									this.list.setLoadedCompletely()
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
							let id = result.results.find(r => r[1] == elementId)
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
							return compareContacts((o1.entry:any), (o2.entry:any))
						} else {
							return sortCompareByReverseId(o1.entry, o2.entry)
						}
					},

					elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) => {
						this._searchView.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive)
					},
					createVirtualRow: () => new SearchResultListRow(m.route.param()['category'] == 'mail' ? new MailRow(true) : new ContactRow()),
					showStatus: false,
					className: m.route.param()['category'] == 'mail' ? "mail-list" : "contact-list",
					swipe: ({
						renderLeftSpacer: () => [],
						renderRightSpacer: () => [],
						swipeLeft: listElement => Promise.resolve(),
						swipeRight: listElement => Promise.resolve(),
					}:any),
					elementsDraggable: false,
					multiSelectionAllowed: false,
					emptyMessage: lang.get("searchNoResults_msg")
				})
				window.requestAnimationFrame(() => {
					// m.redraw() must not be called immediately in the stream.map function because it would lead to errors for the initial call. therefore use requestAnimationFrame
					m.redraw()
					this.list.loadInitial(null).then(() => {
						let selectedId = m.route.param()["id"]
						if (selectedId) {
							this.list.scrollToIdAndSelect(selectedId)
						}
					})
				})
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

	_setLoadedCompletely() {
		this.list.setLoadedCompletely();
	}

	isInSearchResult(typeRef: TypeRef<any>, id: IdTuple): boolean {
		return locator.search.result() && isSameTypeRef(typeRef, locator.search.result().restriction.type) && locator.search.result().results.find(r => isSameId(r, id))
	}
}

export class SearchResultListRow {
	top: number;
	domElement: HTMLElement; // set from List
	entity: ?SearchResultListEntry;
	_delegate: MailRow|ContactRow

	constructor(delegate: MailRow|ContactRow) {
		this._delegate = delegate
		this.top = 0
		this.entity = null
	}

	update(entry: SearchResultListEntry, selected: boolean): void {
		this._delegate.domElement = this.domElement
		this._delegate.update((entry.entry:any), selected)
	}

	render(): Children {
		return this._delegate.render()
	}
}
