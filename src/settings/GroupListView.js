// @flow
import m from "mithril"
import {List, sortCompareById} from "../gui/base/List"
import {load, loadAll} from "../api/main/Entity"
import {GENERATED_MAX_ID, TypeRef, isSameTypeRef} from "../api/common/EntityFunctions"
import {assertMainOrNode} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {NotFoundError} from "../api/common/error/RestError"
import {size} from "../gui/size"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {neverNull} from "../api/common/utils/Utils"
import {SettingsView} from "./SettingsView"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {logins} from "../api/main/LoginController"
import {GroupViewer} from "./GroupViewer"
import * as AddGroupDialog from "./AddGroupDialog"
import {Icon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"

assertMainOrNode()

const className = "group-list"

export class GroupListView {
	list: List<GroupInfo, GroupRow>;
	view: Function;
	_listId: LazyLoaded<Id>;
	_settingsView: SettingsView;

	constructor(settingsView: SettingsView) {
		this._settingsView = settingsView

		this._listId = new LazyLoaded(() => {
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
				return customer.teamGroups
			})
		})

		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: (startId, count) => {
				if (startId == GENERATED_MAX_ID) {
					return this._listId.getAsync().then(listId => {
						return loadAll(GroupInfoTypeRef, listId).then(allGroupInfos => {
							// we have to set loadedCompletely to make sure that fetch is never called again and also that new users are inserted into the list, even at the end
							this._setLoadedCompletely();

							// we return all users because we have already loaded all users and the scroll bar shall have the complete size.
							return Promise.resolve(allGroupInfos);

						})
					})
				} else {
					throw new Error("fetch user group infos called for specific start id")
				}
			},
			loadSingle: (elementId) => {
				return this._listId.getAsync().then(listId => {
					return load(GroupInfoTypeRef, [listId, elementId]).catch(NotFoundError, (e) => {
						// we return null if the entity does not exist
					})
				})
			},
			sortCompare: sortCompareById,

			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) => this.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new GroupRow(),
			showStatus: false,
			className: className,
			swipe: ({
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: (listElement) => Promise.resolve(),
				swipeRight: (listElement) => Promise.resolve(),
			}:any),
			elementsDraggable: false,
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noEntries_msg")
		})

		this.view = (): VirtualElement => {
			return m(this.list)
		}

		this.list.loadInitial()
	}

	_setLoadedCompletely() {
		this.list.setLoadedCompletely();
	}

	elementSelected(groupInfos: GroupInfo[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (groupInfos.length == 0 && this._settingsView.detailsViewer) {
			this._settingsView.detailsViewer = null
			m.redraw()
		} else if (groupInfos.length == 1 && selectionChanged) {
			this._settingsView.detailsViewer = new GroupViewer(groupInfos[0])
			if (elementClicked) {
				this._settingsView.focusSettingsDetailsColumn()
			}
			m.redraw()
		}
	}


	addButtonClicked() {
		AddGroupDialog.show()
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, GroupInfoTypeRef) && this._listId.getSync() == listId) {
			this.list.entityEventReceived(elementId, operation)
		}
	}
}

export class GroupRow {
	top: number;
	domElement: HTMLElement; // set from List
	entity: ?GroupInfo;
	_domName: HTMLElement;
	_domAddress: HTMLElement;
	_domDeletedIcon: HTMLElement;
	_domTeamIcon: HTMLElement;
	_domMailIcon: HTMLElement;

	constructor() {
		this.top = 0
		this.entity = null
	}

	update(groupInfo: GroupInfo, selected: boolean): void {
		if (selected) {
			this.domElement.classList.add("row-selected")
		} else {
			this.domElement.classList.remove("row-selected")
		}

		this._domName.textContent = groupInfo.name
		this._domAddress.textContent = (groupInfo.mailAddress) ? groupInfo.mailAddress : ""
		if (groupInfo.deleted) {
			this._domDeletedIcon.style.display = ''
		} else {
			this._domDeletedIcon.style.display = 'none'
		}
		if (groupInfo.mailAddress) {
			this._domTeamIcon.style.display = 'none'
			this._domMailIcon.style.display = ''
		} else {
			this._domTeamIcon.style.display = ''
			this._domMailIcon.style.display = 'none'
		}
	}


	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): any {
		let elements = [
			m(".top", [
				m(".name", {oncreate: (vnode) => this._domName = vnode.dom}),
			]),
			m(".bottom.flex-space-between", [
				m("small.mail-address", {oncreate: (vnode) => this._domAddress = vnode.dom}),
				m(".icons.flex", [
					m(Icon, {
						icon: Icons.Trash,
						oncreate: (vnode) => this._domDeletedIcon = vnode.dom,
						class: "svg-list-accent-fg",
						style: {display: 'none'},
					}),
					m(Icon, {
						icon: Icons.People,
						oncreate: (vnode) => this._domTeamIcon = vnode.dom,
						class: "svg-list-accent-fg",
						style: {display: 'none'}
					}),
					m(Icon, {
						icon: Icons.Mail,
						oncreate: (vnode) => this._domMailIcon = vnode.dom,
						class: "svg-list-accent-fg",
						style: {display: 'none'}
					}),
				])
			])
		]
		return elements
	}
}
