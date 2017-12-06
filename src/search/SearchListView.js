// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {List, sortCompareByReverseId} from "../gui/base/List"
import {GENERATED_MAX_ID, isSameTypeRef} from "../api/common/EntityFunctions"
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
	onbeforeremove: Function;

	constructor(searchView: SearchView) {
		this._searchView = searchView
		this._resultStreamDependency = locator.search.result.map((result) => {
			this.list = new List({
				rowHeight: size.list_row_height,
				fetch: (startId, count) => {
					let result = locator.search.result()
					if (!result) {
						return Promise.resolve([])
					}
					let mail = result.restriction && isSameTypeRef(result.restriction.type, MailTypeRef)
					let contact = result.restriction && isSameTypeRef(result.restriction.type, ContactTypeRef)
					if (mail || contact) {
						let resultIds = result.mails.concat(result.contacts)
						let startIndex = 0
						if (startId != GENERATED_MAX_ID) {
							startIndex = resultIds.findIndex(id => id[1] == startId)
							if (startIndex == -1) throw new Error("start index not found")
						}
						let toLoad = resultIds.slice(startIndex, count)

						return Promise.map(toLoad, (m) => load(result.restriction.type, m).then(m => new SearchResultListEntry(m)).catch(NotFoundError, () => console.log("search result not found")), {concurrency: 5}).then(sr => sr.filter(r => r)).finally(() => m.redraw())
					} else {
						// this type is not shown in the search view, e.g. group info
						return Promise.resolve([])
					}
				},
				loadSingle: (elementId) => {
					//return load(ContactTypeRef, [this.listId, elementId]).catch(NotFoundError, (e) => {
					// we return null if the entity does not exist
					//})
					return Promise.resolve()
				},

				sortCompare: sortCompareByReverseId,

				elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) => {
					this._searchView.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive)
				},
				createVirtualRow: () => new SearchResultListRow(m.route.param()['category'] == 'mail' ? new MailRow() : new ContactRow()),
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

		})
		this.view = (): ?VirtualElement => {
			return this.list ? m(this.list) : null
		}
		this.onbeforeremove = () => {
			if (this._resultStreamDependency) {
				this._resultStreamDependency.end(true)
			}
		}
	}

	_setLoadedCompletely() {
		this.list.setLoadedCompletely();
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