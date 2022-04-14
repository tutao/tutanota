import m, {Vnode} from "mithril"
import type {VirtualRow} from "../gui/base/List"
import {List} from "../gui/base/List"
import {lang} from "../misc/LanguageViewModel"
import {NotFoundError} from "../api/common/error/RestError"
import {size} from "../gui/size"
import {CustomerTypeRef} from "../api/entities/sys/TypeRefs.js"
import {neverNull, noOp} from "@tutao/tutanota-utils"
import type {SettingsView} from "./SettingsView"
import {LazyLoaded} from "@tutao/tutanota-utils"
import {logins} from "../api/main/LoginController"
import {Icon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {header} from "../gui/base/Header"
import type {WhitelabelChild} from "../api/entities/sys/TypeRefs.js"
import {WhitelabelChildTypeRef} from "../api/entities/sys/TypeRefs.js"
import {formatDateWithMonth} from "../misc/Formatter"
import {WhitelabelChildViewer} from "./WhitelabelChildViewer"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {GENERATED_MAX_ID} from "../api/common/utils/EntityUtils"
import {ofClass, promiseMap} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../api/common/Env"
import {locator} from "../api/main/MainLocator"
import Stream from "mithril/stream";

assertMainOrNode()
const className = "whitelabelchildren-list"

export class WhitelabelChildrenListView {
	list: List<WhitelabelChild, WhitelabelChildRow>
	view: (...args: Array<any>) => any
	_listId: LazyLoaded<Id | null>
	_settingsView: SettingsView
	_searchResultStreamDependency: Stream<any>
	onremove: (...args: Array<any>) => any

	constructor(settingsView: SettingsView) {
		this._settingsView = settingsView
		this._listId = new LazyLoaded(() => {
			return locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
				return customer.whitelabelChildren ? customer.whitelabelChildren.items : null
			})
		})
		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: (startId, count) => {
				if (startId === GENERATED_MAX_ID) {
					return this._listId.getAsync().then(listId => {
						if (listId) {
							return locator.entityClient.loadAll(WhitelabelChildTypeRef, listId).then(allChildren => {
								// we have to set loadedCompletely to make sure that fetch is never called again and also that new whitelabel children are inserted into the list, even at the end
								this._setLoadedCompletely()

								// we return all whitelabel children because we have already loaded all children and the scroll bar shall have the complete size.
								return allChildren
							})
						} else {
							this._setLoadedCompletely()

							return []
						}
					})
				} else {
					throw new Error("fetch whitelabel children called for specific start id")
				}
			},
			loadSingle: elementId => {
				return this._listId.getAsync().then(listId => {
					if (listId) {
						return locator.entityClient
									  .load<WhitelabelChild>(WhitelabelChildTypeRef, [listId, elementId])
									  .catch(
										  ofClass(NotFoundError, e => {
											  // we return null if the entity does not exist
											  return null
										  }),
									  )
					} else {
						return null
					}
				})
			},
			sortCompare: (a: WhitelabelChild, b: WhitelabelChild) => a.mailAddress.localeCompare(b.mailAddress),
			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) =>
				this.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new WhitelabelChildRow(this),
			showStatus: false,
			className: className,
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: () => Promise.resolve(),
				swipeRight: () => Promise.resolve(),
			} as any,
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noEntries_msg"),
		})

		this.view = (): Vnode<any> => {
			return m(this.list)
		}

		this.list.loadInitial()
		this._searchResultStreamDependency = neverNull(header.searchBar).lastSelectedWhitelabelChildrenInfoResult.map(whitelabelChild => {
			if (this._listId.isLoaded() && this._listId.getSync() === whitelabelChild._id[0]) {
				this.list.scrollToIdAndSelect(whitelabelChild._id[1])
			}
		})

		this.onremove = () => {
			if (this._searchResultStreamDependency) {
				this._searchResultStreamDependency.end(true)
			}
		}
	}

	_setLoadedCompletely() {
		this.list.setLoadedCompletely()
	}

	elementSelected(whitelabelChildren: WhitelabelChild[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (whitelabelChildren.length === 0 && this._settingsView.detailsViewer) {
			this._settingsView.detailsViewer = null
			m.redraw()
		} else if (whitelabelChildren.length === 1 && selectionChanged) {
			this._settingsView.detailsViewer = new WhitelabelChildViewer(whitelabelChildren[0])

			if (elementClicked) {
				this._settingsView.focusSettingsDetailsColumn()
			}

			m.redraw()
		}
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			if (isUpdateForTypeRef(WhitelabelChildTypeRef, update) && this._listId.getSync() === update.instanceListId) {
				return this.list.entityEventReceived(update.instanceId, update.operation)
			}
		}).then(noOp)
	}
}

export class WhitelabelChildRow implements VirtualRow<WhitelabelChild> {
	top: number
	domElement: HTMLElement | null = null // set from List

	entity: WhitelabelChild | null
	private _domMailAddress!: HTMLElement
	private _domDeletedIcon!: HTMLElement
	private _domCreatedDate!: HTMLElement
	private _whitelabelChildrenListView: WhitelabelChildrenListView

	constructor(whitelabelChildrenListView: WhitelabelChildrenListView) {
		this._whitelabelChildrenListView = whitelabelChildrenListView
		this.top = 0
		this.entity = null
	}

	update(whitelabelChild: WhitelabelChild, selected: boolean): void {
		if (!this.domElement) {
			return
		}

		if (selected) {
			this.domElement.classList.add("row-selected")
		} else {
			this.domElement.classList.remove("row-selected")
		}

		this._domMailAddress.textContent = whitelabelChild.mailAddress
		this._domCreatedDate.textContent = formatDateWithMonth(whitelabelChild.createdDate)

		if (whitelabelChild.deletedDate) {
			this._domDeletedIcon.style.display = ""
		} else {
			this._domDeletedIcon.style.display = "none"
		}
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): any {
		let elements = [
			m(".top", [
				m(".name", {
					oncreate: vnode => (this._domMailAddress = vnode.dom as HTMLElement),
				}),
			]),
			m(".bottom.flex-space-between", [
				m("small", {
					oncreate: vnode => (this._domCreatedDate = vnode.dom as HTMLElement),
				}),
				m(".icons.flex", [
					m(Icon, {
						icon: Icons.Trash,
						oncreate: vnode => (this._domDeletedIcon = vnode.dom as HTMLElement),
						class: "svg-list-accent-fg",
						style: {
							display: "none",
						},
					}),
				]),
			]),
		]
		return elements
	}
}