// @flow
import m from "mithril"
import {List} from "../gui/base/List"
import {GENERATED_MAX_ID, isSameTypeRef} from "../api/common/EntityFunctions"
import {assertMainOrNode} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {size} from "../gui/size"
import {MailRow} from "../mail/MailListView"
import {searchModel} from "./SearchModel"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {load} from "../api/main/Entity"
import {ContactRow} from "../contacts/ContactListView"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"

assertMainOrNode()

class SearchResultListEntry {
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

	constructor() {
		searchModel.result.map((result) => {
			let mail = result.restriction && isSameTypeRef(result.restriction.type, MailTypeRef)
			let contact = result.restriction && isSameTypeRef(result.restriction.type, ContactTypeRef)

			this.list = new List({
				rowHeight: size.list_row_height,
				fetch: (startId, count) => {
					if (mail || contact) {
						let resultIds = result.mails.concat(result.contacts)
						let startIndex = 0
						if (startId != GENERATED_MAX_ID) {
							startIndex = resultIds.findIndex(id => id[1] == startId)
							if (startIndex == -1) throw new Error("start index not found")
						}
						let toLoad = resultIds.slice(startIndex, count)

						return Promise.map(toLoad, (m) => load(result.restriction.type, m).then(m => new SearchResultListEntry(m)), {concurrency: 5}).finally(() => m.redraw())
					} else {
						throw new Error("incompatible type")
					}
				},
				loadSingle: (elementId) => {
					//return load(ContactTypeRef, [this.listId, elementId]).catch(NotFoundError, (e) => {
					// we return null if the entity does not exist
					//})
					return Promise.resolve()
				},

				sortCompare: () => 0,

				elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) => {

					//contactView.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive)
				},
				createVirtualRow: () => new SearchResultListRow(mail ? new MailRow() : new ContactRow()),
				showStatus: false,
				className: mail ? "mail-list" : "contact-list",
				swipe: ({
					renderLeftSpacer: () => [],
					renderRightSpacer: () => [],
					swipeLeft: listElement => Promise.resolve(),
					swipeRight: listElement => Promise.resolve(),
				}:any),
				elementsDraggable: true,
				multiSelectionAllowed: true,
				emptyMessage: lang.get("searchNoResults_msg")
			})
			this.list.loadInitial(null)
		})

		this.view = (): ?VirtualElement => {
			return this.list ? m(this.list) : null
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