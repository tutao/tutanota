import m, {ChildArray, Children} from "mithril"
import {Dialog} from "../../gui/base/Dialog.js"
import {formatDateWithMonth, formatStorageSize} from "../../misc/Formatter.js"
import {lang} from "../../misc/LanguageViewModel.js"
import {getFirstOrThrow, neverNull} from "@tutao/tutanota-utils"
import {GroupType} from "../../api/common/TutanotaConstants.js"
import type {TableAttrs} from "../../gui/base/Table.js"
import {ColumnWidth, Table, TableLineAttrs} from "../../gui/base/Table.js"
import {logins} from "../../api/main/LoginController.js"
import {Icons} from "../../gui/base/icons/Icons.js"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog.js"
import type {EntityUpdateData} from "../../api/main/EventController.js"
import {TextField} from "../../gui/base/TextField.js"
import type {DropDownSelectorAttrs} from "../../gui/base/DropDownSelector.js"
import {DropDownSelector} from "../../gui/base/DropDownSelector.js"
import type {UpdatableSettingsDetailsViewer} from "../SettingsView.js"
import {locator} from "../../api/main/MainLocator.js"
import {assertMainOrNode} from "../../api/common/Env.js"
import {IconButton, IconButtonAttrs} from "../../gui/base/IconButton.js"
import {ButtonSize} from "../../gui/base/ButtonSize.js"
import {GroupDetailsModel} from "./GroupDetailsModel.js"
import {showBuyDialog} from "../../subscription/BuyDialog.js"

assertMainOrNode()

export class GroupDetailsView implements UpdatableSettingsDetailsViewer {
	constructor(
		private readonly model: GroupDetailsModel,
	) {
	}

	/**
	 * render the header that tells us what type of group we have here
	 * @private
	 */
	private renderHeader(): Children {
		return m(".h4.mt-l", getGroupTypeDisplayName(this.model.getGroupType()))
	}

	renderView(): Children {
		return m("#user-viewer.fill-absolute.scroll.plr-l", [
			this.renderHeader(),
			this.renderCommonInfo(),
			this.renderTypeDependentInfo()
		])
	}

	private renderTypeDependentInfo(): ChildArray {
		return this.model.isMailGroup()
			? this.renderMailGroupInfo()
			: this.renderLocalAdminGroupInfo()
	}

	/**
	 * render the fields that are common to all group types
	 * @private
	 */
	private renderCommonInfo(): ChildArray {
		return [
			this.renderCreatedTextField(),
			this.renderNameField(),
			this.renderAdministratedByDropdown(),
			this.renderStatusSelector(),
			this.renderMembersTable(),
		]
	}

	private renderCreatedTextField(): Children {
		return m(TextField, {label: "created_label", value: formatDateWithMonth(this.model.getCreationDate()), disabled: true})
	}

	private renderAdministratedByDropdown(): Children {
		const administratedByInfo = this.model.createAdministratedByInfo()
		if (!administratedByInfo) return null
		const {options, currentVal} = administratedByInfo
		const attrs: DropDownSelectorAttrs<Id | null> = {
			label: "administratedBy_label",
			items: options,
			selectedValue: currentVal,
			selectionChangedHandler: async id => showProgressDialog("pleaseWait_msg", this.model.changeAdministratedBy(id)),
		}
		return m(DropDownSelector, attrs)
	}

	/**
	 * render the information that only shared mailboxes have
	 * @private
	 */
	private renderMailGroupInfo(): ChildArray {
		return [
			this.renderUsedStorage(),
			m(TextField, {
				label: "mailAddress_label",
				value: this.model.getGroupMailAddress(),
				disabled: true,
			}),
			m(TextField, {
				label: "mailName_label",
				value: this.model.getGroupSenderName(),
				disabled: true,
				injectionsRight: () => m(IconButton, {
					icon: Icons.Edit,
					title: "setSenderName_action",
					click: () => {
						this.showChangeSenderNameDialog()
					}
				})
			})
		]
	}

	/**
	 * render the information that only local admin groups have
	 * @private
	 */
	private renderLocalAdminGroupInfo(): ChildArray {
		return [
			m(".h5.mt-l.mb-s", lang.get("administratedGroups_label")),
			this.renderAdministratedGroupsTable(),
		]
	}

	private renderStatusSelector(): Children {
		const attrs: DropDownSelectorAttrs<boolean> = {
			label: "state_label",
			items: [
				{
					name: lang.get("activated_label"),
					value: false,
				},
				{
					name: lang.get("deactivated_label"),
					value: true,
				},
			],
			selectedValue: !this.model.isGroupActive(),
			selectionChangedHandler: deactivate => this.onActivationStatusChanged(deactivate)
		}
		return m(DropDownSelector, attrs)
	}

	private async onActivationStatusChanged(deactivate: boolean): Promise<void> {
		const buyParams = await showProgressDialog("pleaseWait_msg", this.model.validateGroupActivationStatus(deactivate))
		if (!buyParams) return
		const confirmed = await showBuyDialog(buyParams)
		if (!confirmed) return
		await showProgressDialog("pleaseWait_msg", this.model.executeGroupBuy(deactivate))
	}

	private renderNameField(): Children {
		return m(TextField, {
			label: "name_label",
			value: this.model.getGroupName(),
			disabled: true,
			injectionsRight: () => m(IconButton, {
				title: "edit_action",
				click: () => this.showChangeNameDialog(),
				icon: Icons.Edit,
				size: ButtonSize.Compact,
			}),
		})
	}

	private showChangeNameDialog(): void {
		Dialog.showProcessTextInputDialog("edit_action", "name_label", null, this.model.getGroupName(),
			(newName) => this.model.changeGroupName(newName),
			newName => this.model.validateGroupName(newName)
		)
	}

	private showChangeSenderNameDialog(): void {
		Dialog.showProcessTextInputDialog("edit_action", "name_label", null, this.model.getGroupSenderName(),
			(newName) => this.model.changeGroupSenderName(newName)
		)
	}

	private renderUsedStorage(): Children {
		const usedStorage = this.model.getUsedStorage()
		const formattedStorage = usedStorage ? formatStorageSize(usedStorage) : lang.get("loading_msg")

		return m(TextField, {
			label: "storageCapacityUsed_label",
			value: formattedStorage,
			disabled: true
		})
	}

	private async showAddMemberDialog(): Promise<void> {
		const possibleMembers = await this.model.getPossibleMembers()
		let currentSelection = getFirstOrThrow(possibleMembers).value

		const addUserToGroupOkAction = (dialog: Dialog) => {
			// noinspection JSIgnoredPromiseFromCall
			showProgressDialog("pleaseWait_msg", this.model.addUserToGroup(currentSelection))
			dialog.close()
		}

		Dialog.showActionDialog({
			title: lang.get("addUserToGroup_label"),
			child: {
				view: () => m(DropDownSelector, {
						label: "userSettings_label",
						items: possibleMembers,
						selectedValue: currentSelection,
						selectionChangedHandler: (newSelected: Id) => currentSelection = newSelected,
						dropdownWidth: 250,
					}
				),
			},
			allowOkWithReturn: true,
			okAction: addUserToGroupOkAction,
		})
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return this.model.entityEventsReceived(updates)
	}

	private renderMembersTable(): Children {
		if (!this.model.isGroupActive()) return null

		const addUserButtonAttrs: IconButtonAttrs = {
			title: "addUserToGroup_label",
			click: () => this.showAddMemberDialog(),
			icon: Icons.Add,
			size: ButtonSize.Compact,
		} as const

		const lines: TableLineAttrs[] = this.model.getMembersInfo().map(userGroupInfo => {
			const removeButtonAttrs: IconButtonAttrs = {
				title: "remove_action",
				click: () => showProgressDialog("pleaseWait_msg", this.model.removeGroupMember(userGroupInfo)),
				icon: Icons.Cancel,
				size: ButtonSize.Compact,
			}
			return {
				cells: [userGroupInfo.name, neverNull(userGroupInfo.mailAddress)],
				actionButtonAttrs: removeButtonAttrs,
			}
		})

		const membersTableAttrs: TableAttrs = {
			columnHeading: ["name_label", "mailAddress_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
			showActionButtonColumn: true,
			addButtonAttrs: addUserButtonAttrs,
			lines,
		}

		return [
			m(".h5.mt-l.mb-s", lang.get("groupMembers_label")),
			m(Table, membersTableAttrs)
		]
	}

	private renderAdministratedGroupsTable(): Children {
		let lines: TableLineAttrs[] = this.model.getAdministratedGroups().map(groupInfo => {
			let removeButtonAttrs: IconButtonAttrs | null = null

			if (logins.getUserController().isGlobalAdmin()) {
				removeButtonAttrs = {
					title: "remove_action",
					click: () => {
						let adminGroupId = neverNull(logins.getUserController().user.memberships.find(m => m.groupType === GroupType.Admin)).group
						// noinspection JSIgnoredPromiseFromCall
						showProgressDialog("pleaseWait_msg", locator.userManagementFacade.updateAdminship(groupInfo.group, adminGroupId))
					},
					icon: Icons.Cancel,
					size: ButtonSize.Compact,
				}
			}

			return {
				cells: [getGroupTypeDisplayName(neverNull(groupInfo.groupType)), groupInfo.name, neverNull(groupInfo.mailAddress)],
				actionButtonAttrs: removeButtonAttrs,
			}
		})

		return m(Table, {
			columnHeading: ["type_label", "name_label", "mailAddress_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
			showActionButtonColumn: true,
			lines,
		})
	}
}

export function getGroupTypeDisplayName(groupType: NumberString | null): string {
	if (groupType == null) {
		return ""
	} else if (groupType === GroupType.Mail) {
		return lang.get("sharedMailbox_label")
	} else if (groupType === GroupType.LocalAdmin) {
		return lang.get("localAdmin_label")
	} else if (groupType === GroupType.User) {
		return lang.get("userColumn_label")
	} else if (groupType === GroupType.Template) {
		return lang.get("templateGroup_label")
	} else {
		return groupType // just for testing
	}
}