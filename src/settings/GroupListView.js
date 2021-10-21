// @flow
import m from "mithril"
import type {VirtualRow} from "../gui/base/List"
import {List} from "../gui/base/List"
import {load, loadAll} from "../api/main/Entity"
import {assertMainOrNode} from "../api/common/Env"
import {lang} from "../misc/LanguageViewModel"
import {NotFoundError} from "../api/common/error/RestError"
import {size} from "../gui/size"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {neverNull, noOp} from "../api/common/utils/Utils"
import type {SettingsView, UpdatableSettingsViewer} from "./SettingsView"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {logins} from "../api/main/LoginController"
import {GroupViewer} from "./GroupViewer"
import * as AddGroupDialog from "./AddGroupDialog"
import {Icon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {OperationType} from "../api/common/TutanotaConstants"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {header} from "../gui/base/Header"
import {isAdministratedGroup} from "../search/model/SearchUtils"
import {GroupMemberTypeRef} from "../api/entities/sys/GroupMember"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {GroupMembership} from "../api/entities/sys/GroupMembership"
import {compareGroupInfos} from "../api/common/utils/GroupUtils";
import {GENERATED_MAX_ID} from "../api/common/utils/EntityUtils";
import {showNotAvailableForFreeDialog} from "../misc/SubscriptionDialogs"
import {locator} from "../api/main/MainLocator"
import {ListColumnWrapper} from "../gui/ListColumnWrapper"
import {ofClass, promiseMap} from "../api/common/utils/PromiseUtils"

assertMainOrNode()

const className = "group-list"

export class GroupListView implements UpdatableSettingsViewer {
	list: List<GroupInfo, GroupRow>;
	view: Function;
	_listId: LazyLoaded<Id>;
	_settingsView: SettingsView;
	_searchResultStreamDependency: Stream<any>;
	onremove: Function;
	_localAdminGroupMemberships: GroupMembership[];

	constructor(settingsView: SettingsView) {
		this._settingsView = settingsView

		this._listId = new LazyLoaded(() => {
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
				return customer.teamGroups
			})
		})

		this._localAdminGroupMemberships = logins.getUserController().getLocalAdminGroupMemberships()

		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: (startId, count) => {
				if (startId === GENERATED_MAX_ID) {
					return this._listId.getAsync().then(listId => {
						return loadAll(GroupInfoTypeRef, listId).then(allGroupInfos => {
							// we have to set loadedCompletely to make sure that fetch is never called again and also that new users are inserted into the list, even at the end
							this._setLoadedCompletely();

							// we return all users because we have already loaded all users and the scroll bar shall have the complete size.
							if (logins.getUserController().isGlobalAdmin()) {
								return allGroupInfos
							} else {
								let localAdminGroupIds = logins.getUserController()
								                               .getLocalAdminGroupMemberships()
								                               .map(gm => gm.group)
								return allGroupInfos.filter((gi: GroupInfo) => isAdministratedGroup(localAdminGroupIds, gi))
							}
						})
					})
				} else {
					throw new Error("fetch user group infos called for specific start id")
				}
			},
			loadSingle: (elementId) => {
				return this._listId.getAsync().then(listId => {
					return load(GroupInfoTypeRef, [listId, elementId]).catch(ofClass(NotFoundError, (e) => {
						// we return null if the entity does not exist
					}))
				})
			},
			sortCompare: compareGroupInfos,

			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) => this.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new GroupRow(),
			showStatus: false,
			className: className,
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: (listElement) => Promise.resolve(false),
				swipeRight: (listElement) => Promise.resolve(false),
				enabled: false
			},
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noEntries_msg")
		})

		this.view = (): Children => {
			return m(ListColumnWrapper, {
					headerContent: m(".mr-negative-s.align-self-end", m(ButtonN, {
						label: "addGroup_label",
						type: ButtonType.Primary,
						click: () => this.addButtonClicked()
					}))
				},
				m(this.list))
		}

		this.list.loadInitial()

		const searchBar = neverNull(header.searchBar)
		this._listId.getAsync().then(listId => {
			searchBar.setGroupInfoRestrictionListId(listId)
		})
		this._searchResultStreamDependency = searchBar.lastSelectedGroupInfoResult.map(groupInfo => {
			if (this._listId.isLoaded() && this._listId.getSync() === groupInfo._id[0]) {
				this.list.scrollToIdAndSelect(groupInfo._id[1])
			}
		})

		this.onremove = () => {
			if (this._searchResultStreamDependency) {
				this._searchResultStreamDependency.end(true)
			}
		}
	}

	_setLoadedCompletely() {
		this.list.setLoadedCompletely();
	}

	elementSelected(groupInfos: GroupInfo[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (groupInfos.length === 0 && this._settingsView.detailsViewer) {
			this._settingsView.detailsViewer = null
			m.redraw()
		} else if (groupInfos.length === 1 && selectionChanged) {
			this._settingsView.detailsViewer = new GroupViewer(locator.entityClient, groupInfos[0])
			if (elementClicked) {
				this._settingsView.focusSettingsDetailsColumn()
			}
			m.redraw()
		}
	}


	addButtonClicked() {
		if (logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog(false)
		} else {
			AddGroupDialog.show()
		}
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			return this.processUpdate(update)
		}).then(noOp)
	}

	processUpdate(update: EntityUpdateData): Promise<void> {
		const {instanceListId, instanceId, operation} = update
		if (isUpdateForTypeRef(GroupInfoTypeRef, update) && this._listId.getSync() === instanceListId) {
			if (!logins.getUserController().isGlobalAdmin()) {
				let listEntity = this.list.getEntity(instanceId)
				return load(GroupInfoTypeRef, [neverNull(instanceListId), instanceId]).then(gi => {
					let localAdminGroupIds = logins.getUserController()
					                               .getLocalAdminGroupMemberships()
					                               .map(gm => gm.group)
					if (listEntity) {
						if (!isAdministratedGroup(localAdminGroupIds, gi)) {
							return this.list.entityEventReceived(instanceId, OperationType.DELETE)
						} else {
							return this.list.entityEventReceived(instanceId, operation)
						}
					} else {
						if (isAdministratedGroup(localAdminGroupIds, gi)) {
							return this.list.entityEventReceived(instanceId, OperationType.CREATE)
						}
					}
				})
			} else {
				return this.list.entityEventReceived(instanceId, operation)
			}
		} else if (!logins.getUserController().isGlobalAdmin() && isUpdateForTypeRef(GroupMemberTypeRef, update)) {
			let oldLocalAdminGroupMembership = this._localAdminGroupMemberships.find(gm => gm.groupMember[1]
				=== instanceId)
			let newLocalAdminGroupMembership = logins.getUserController()
			                                         .getLocalAdminGroupMemberships()
			                                         .find(gm => gm.groupMember[1] === instanceId)
			let promise = Promise.resolve()
			if (operation === OperationType.CREATE && !oldLocalAdminGroupMembership && newLocalAdminGroupMembership) {
				promise = this.list.entityEventReceived(newLocalAdminGroupMembership.groupInfo[1], operation)
			} else if (operation === OperationType.DELETE && oldLocalAdminGroupMembership
				&& !newLocalAdminGroupMembership) {
				promise = this.list.entityEventReceived(oldLocalAdminGroupMembership.groupInfo[1], operation)
			}
			return promise.then(() => {
				this._localAdminGroupMemberships = logins.getUserController().getLocalAdminGroupMemberships()
			})
		} else {
			return Promise.resolve()
		}
	}
}

export class GroupRow implements VirtualRow<GroupInfo> {
	top: number;
	domElement: ?HTMLElement; // set from List
	entity: ?GroupInfo;
	_domName: HTMLElement;
	_domAddress: HTMLElement;
	_domDeletedIcon: HTMLElement;
	_domLocalAdminIcon: HTMLElement;
	_domMailIcon: HTMLElement;

	constructor() {
		this.top = 0
		this.entity = null
	}

	update(groupInfo: GroupInfo, selected: boolean): void {
		if (!this.domElement) {
			return
		}
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
			this._domLocalAdminIcon.style.display = 'none'
			this._domMailIcon.style.display = ''
		} else {
			this._domLocalAdminIcon.style.display = ''
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
						icon: BootIcons.Settings,
						oncreate: (vnode) => this._domLocalAdminIcon = vnode.dom,
						class: "svg-list-accent-fg",
						style: {display: 'none'}
					}),
					m(Icon, {
						icon: BootIcons.Mail,
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
