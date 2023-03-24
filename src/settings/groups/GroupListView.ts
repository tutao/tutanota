import m, { Children } from "mithril"
import type { VirtualRow } from "../../gui/base/List.js"
import { List } from "../../gui/base/List.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { NotFoundError } from "../../api/common/error/RestError.js"
import { size } from "../../gui/size.js"
import type { GroupInfo, GroupMembership } from "../../api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef, GroupMemberTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { LazyLoaded, neverNull, noOp, ofClass, promiseMap } from "@tutao/tutanota-utils"
import type { SettingsView, UpdatableSettingsViewer } from "../SettingsView.js"
import { GroupDetailsView } from "./GroupDetailsView.js"
import * as AddGroupDialog from "./AddGroupDialog.js"
import { Icon } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { OperationType } from "../../api/common/TutanotaConstants.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import { isAdministratedGroup } from "../../search/model/SearchUtils.js"
import type { EntityUpdateData } from "../../api/main/EventController.js"
import { isUpdateForTypeRef } from "../../api/main/EventController.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { compareGroupInfos } from "../../api/common/utils/GroupUtils.js"
import { GENERATED_MAX_ID } from "../../api/common/utils/EntityUtils.js"
import { showNotAvailableForFreeDialog } from "../../misc/SubscriptionDialogs.js"
import { locator } from "../../api/main/MainLocator.js"
import { ListColumnWrapper } from "../../gui/ListColumnWrapper.js"
import { assertMainOrNode } from "../../api/common/Env.js"
import { GroupDetailsModel } from "./GroupDetailsModel.js"
import { SelectableRowContainer, setSelectedRowStyle, setVisibility } from "../../gui/SelectableRowContainer.js"
import Stream from "mithril/stream"

assertMainOrNode()
const className = "group-list"

export class GroupListView implements UpdatableSettingsViewer {
	list: List<GroupInfo, GroupRow>
	view: (...args: Array<any>) => any
	_listId: LazyLoaded<Id>
	_settingsView: SettingsView
	_searchResultStreamDependency: Stream<any>
	onremove: (...args: Array<any>) => any
	_localAdminGroupMemberships: GroupMembership[]

	constructor(settingsView: SettingsView) {
		this._settingsView = settingsView
		this._listId = new LazyLoaded(() => {
			return locator.logins
				.getUserController()
				.loadCustomer()
				.then((customer) => {
					return customer.teamGroups
				})
		})
		this._localAdminGroupMemberships = locator.logins.getUserController().getLocalAdminGroupMemberships()
		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: async (startId, count) => {
				if (startId === GENERATED_MAX_ID) {
					const listId = await this._listId.getAsync()
					const allGroupInfos = await locator.entityClient.loadAll(GroupInfoTypeRef, listId)
					let items: GroupInfo[]
					if (locator.logins.getUserController().isGlobalAdmin()) {
						items = allGroupInfos
					} else {
						let localAdminGroupIds = locator.logins
							.getUserController()
							.getLocalAdminGroupMemberships()
							.map((gm) => gm.group)
						items = allGroupInfos.filter((gi: GroupInfo) => isAdministratedGroup(localAdminGroupIds, gi))
					}
					return { items, complete: true }
				} else {
					throw new Error("fetch user group infos called for specific start id")
				}
			},
			loadSingle: (elementId) => {
				return this._listId.getAsync().then((listId) => {
					return locator.entityClient.load<GroupInfo>(GroupInfoTypeRef, [listId, elementId]).catch(
						ofClass(NotFoundError, (e) => {
							// we return null if the entity does not exist
							return null
						}),
					)
				})
			},
			sortCompare: compareGroupInfos,
			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) =>
				this.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new GroupRow(),
			className: className,
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: (listElement) => Promise.resolve(false),
				swipeRight: (listElement) => Promise.resolve(false),
				enabled: false,
			},
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noEntries_msg"),
		})

		this.view = (): Children => {
			return m(
				ListColumnWrapper,
				{
					headerContent: m(
						".flex.flex-end.center-vertically.plr-l.list-border-bottom",
						m(
							".mr-negative-s",
							m(Button, {
								label: "addGroup_label",
								type: ButtonType.Primary,
								click: () => this.addButtonClicked(),
							}),
						),
					),
				},
				m(this.list),
			)
		}

		this.list.loadInitial()

		this._listId.getAsync().then((listId) => {
			locator.search.setGroupInfoRestrictionListId(listId)
		})

		this._searchResultStreamDependency = locator.search.lastSelectedGroupInfoResult.map((groupInfo) => {
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

	elementSelected(groupInfos: GroupInfo[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (groupInfos.length === 0 && this._settingsView.detailsViewer) {
			this._settingsView.detailsViewer = null
			m.redraw()
		} else if (groupInfos.length === 1 && selectionChanged) {
			const newSelectionModel = new GroupDetailsModel(groupInfos[0], locator.entityClient, m.redraw)
			this._settingsView.detailsViewer = new GroupDetailsView(newSelectionModel)

			if (elementClicked) {
				this._settingsView.focusSettingsDetailsColumn()
			}

			m.redraw()
		} else {
			this._settingsView.focusSettingsDetailsColumn()
		}
	}

	addButtonClicked() {
		if (locator.logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog(false)
		} else {
			AddGroupDialog.show()
		}
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, (update) => {
			return this.processUpdate(update)
		}).then(noOp)
	}

	processUpdate(update: EntityUpdateData): Promise<void> {
		const { instanceListId, instanceId, operation } = update

		if (isUpdateForTypeRef(GroupInfoTypeRef, update) && this._listId.getSync() === instanceListId) {
			if (!locator.logins.getUserController().isGlobalAdmin()) {
				let listEntity = this.list.getEntity(instanceId)
				return locator.entityClient.load(GroupInfoTypeRef, [neverNull(instanceListId), instanceId]).then((gi) => {
					let localAdminGroupIds = locator.logins
						.getUserController()
						.getLocalAdminGroupMemberships()
						.map((gm) => gm.group)

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
		} else if (!locator.logins.getUserController().isGlobalAdmin() && isUpdateForTypeRef(GroupMemberTypeRef, update)) {
			let oldLocalAdminGroupMembership = this._localAdminGroupMemberships.find((gm) => gm.groupMember[1] === instanceId)

			let newLocalAdminGroupMembership = locator.logins
				.getUserController()
				.getLocalAdminGroupMemberships()
				.find((gm) => gm.groupMember[1] === instanceId)
			let promise = Promise.resolve()

			if (operation === OperationType.CREATE && !oldLocalAdminGroupMembership && newLocalAdminGroupMembership) {
				promise = this.list.entityEventReceived(newLocalAdminGroupMembership.groupInfo[1], operation)
			} else if (operation === OperationType.DELETE && oldLocalAdminGroupMembership && !newLocalAdminGroupMembership) {
				promise = this.list.entityEventReceived(oldLocalAdminGroupMembership.groupInfo[1], operation)
			}

			return promise.then(() => {
				this._localAdminGroupMemberships = locator.logins.getUserController().getLocalAdminGroupMemberships()
			})
		} else {
			return Promise.resolve()
		}
	}
}

export class GroupRow implements VirtualRow<GroupInfo> {
	top: number = 0
	domElement: HTMLElement | null = null // set from List
	entity: GroupInfo | null = null
	private nameDom!: HTMLElement
	private addressDom!: HTMLElement
	private deletedIconDom!: HTMLElement
	private localAdminIconDom!: HTMLElement
	private mailIconDom!: HTMLElement
	private innerContainerDom!: HTMLElement

	constructor() {}

	update(groupInfo: GroupInfo, selected: boolean): void {
		if (!this.domElement) {
			return
		}
		setSelectedRowStyle(this.innerContainerDom, selected)

		this.nameDom.textContent = groupInfo.name
		this.addressDom.textContent = groupInfo.mailAddress ?? ""
		setVisibility(this.deletedIconDom, groupInfo.deleted != null)

		// mail group or local admin group
		if (groupInfo.mailAddress) {
			this.localAdminIconDom.style.display = "none"
			this.mailIconDom.style.display = ""
		} else {
			this.localAdminIconDom.style.display = ""
			this.mailIconDom.style.display = "none"
		}
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		return m(
			SelectableRowContainer,
			{
				oncreate: (vnode) => {
					this.innerContainerDom = vnode.dom as HTMLElement
				},
			},
			m(".flex.col.flex-grow", [
				m(".badge-line-height", [
					m("", {
						oncreate: (vnode) => (this.nameDom = vnode.dom as HTMLElement),
					}),
				]),
				m(".flex-space-between.mt-xxs", [
					m(".smaller", {
						oncreate: (vnode) => (this.addressDom = vnode.dom as HTMLElement),
					}),
					m(".icons.flex", [
						m(Icon, {
							icon: Icons.Trash,
							oncreate: (vnode) => (this.deletedIconDom = vnode.dom as HTMLElement),
							class: "svg-list-accent-fg",
							style: {
								display: "none",
							},
						}),
						m(Icon, {
							icon: BootIcons.Settings,
							oncreate: (vnode) => (this.localAdminIconDom = vnode.dom as HTMLElement),
							class: "svg-list-accent-fg",
							style: {
								display: "none",
							},
						}),
						m(Icon, {
							icon: BootIcons.Mail,
							oncreate: (vnode) => (this.mailIconDom = vnode.dom as HTMLElement),
							class: "svg-list-accent-fg",
							style: {
								display: "none",
							},
						}),
					]),
				]),
			]),
		)
	}
}
