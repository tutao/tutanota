import m, { ChildArray, Children } from "mithril"
import { Dialog } from "../../gui/base/Dialog.js"
import { formatDateWithMonth, formatStorageSize } from "../../misc/Formatter.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { getFirstOrThrow, neverNull } from "@tutao/tutanota-utils"
import { GroupType } from "../../api/common/TutanotaConstants.js"
import type { TableAttrs } from "../../gui/base/Table.js"
import { ColumnWidth, Table, TableLineAttrs } from "../../gui/base/Table.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { TextField } from "../../gui/base/TextField.js"
import type { DropDownSelectorAttrs } from "../../gui/base/DropDownSelector.js"
import { DropDownSelector } from "../../gui/base/DropDownSelector.js"
import { assertMainOrNode } from "../../api/common/Env.js"
import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { GroupDetailsModel } from "../../../mail-app/settings/groups/GroupDetailsModel.js"
import { showBuyDialog } from "../../subscription/BuyDialog.js"
import { EntityUpdateData } from "../../api/common/utils/EntityUpdateUtils.js"
import { UpdatableSettingsDetailsViewer } from "../Interfaces.js"

assertMainOrNode()

export class GroupDetailsView implements UpdatableSettingsDetailsViewer {
	constructor(private readonly model: GroupDetailsModel) {}

	/**
	 * render the header that tells us what type of group we have here
	 * @private
	 */
	private renderHeader(): Children {
		return m(".h4.mt-l", getGroupTypeDisplayName(this.model.getGroupType()))
	}

	renderView(): Children {
		return m("#user-viewer.fill-absolute.scroll.plr-l", [this.renderHeader(), this.renderCommonInfo(), this.renderMailGroupInfo()])
	}

	/**
	 * render the fields that are common to all group types
	 * @private
	 */
	private renderCommonInfo(): ChildArray {
		return [this.renderCreatedTextField(), this.renderNameField(), this.renderStatusSelector(), this.renderMembersTable()]
	}

	private renderCreatedTextField(): Children {
		return m(TextField, { label: "created_label", value: formatDateWithMonth(this.model.getCreationDate()), isReadOnly: true })
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
				isReadOnly: true,
			}),
			m(TextField, {
				label: "mailName_label",
				value: this.model.getGroupSenderName(),
				isReadOnly: true,
				injectionsRight: () =>
					m(IconButton, {
						icon: Icons.Edit,
						title: "setSenderName_action",
						click: () => {
							this.showChangeSenderNameDialog()
						},
					}),
			}),
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
			selectionChangedHandler: (deactivate) => this.onActivationStatusChanged(deactivate),
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
			isReadOnly: true,
			injectionsRight: () =>
				m(IconButton, {
					title: "edit_action",
					click: () => this.showChangeNameDialog(),
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				}),
		})
	}

	private showChangeNameDialog(): void {
		Dialog.showProcessTextInputDialog(
			{
				title: "edit_action",
				label: "name_label",
				defaultValue: this.model.getGroupName(),
				inputValidator: (newName) => this.model.validateGroupName(newName),
			},
			(newName) => this.model.changeGroupName(newName),
		)
	}

	private showChangeSenderNameDialog(): void {
		Dialog.showProcessTextInputDialog(
			{
				title: "edit_action",
				label: "name_label",
				defaultValue: this.model.getGroupSenderName(),
			},
			(newName) => this.model.changeGroupSenderName(newName),
		)
	}

	private renderUsedStorage(): Children {
		const usedStorage = this.model.getUsedStorage()
		const formattedStorage = usedStorage ? formatStorageSize(usedStorage) : lang.get("loading_msg")

		return m(TextField, {
			label: "storageCapacityUsed_label",
			value: formattedStorage,
			isReadOnly: true,
		})
	}

	private async showAddMemberDialog(): Promise<void> {
		const possibleMembers = await this.model.getPossibleMembers()
		if (possibleMembers.length === 0) {
			return Dialog.message("noValidMembersToAdd_msg")
		}
		let currentSelection = getFirstOrThrow(possibleMembers).value

		const addUserToGroupOkAction = (dialog: Dialog) => {
			// noinspection JSIgnoredPromiseFromCall
			showProgressDialog("pleaseWait_msg", this.model.addUserToGroup(currentSelection))
			dialog.close()
		}

		Dialog.showActionDialog({
			title: lang.get("addUserToGroup_label"),
			child: {
				view: () =>
					m(DropDownSelector, {
						label: "account_label",
						items: possibleMembers,
						selectedValue: currentSelection,
						selectionChangedHandler: (newSelected: Id) => (currentSelection = newSelected),
						dropdownWidth: 250,
					}),
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

		const lines: TableLineAttrs[] = this.model.getMembersInfo().map((userGroupInfo) => {
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

		return [m(".h5.mt-l.mb-s", lang.get("groupMembers_label")), m(Table, membersTableAttrs)]
	}
}

export function getGroupTypeDisplayName(groupType: NumberString | null): string {
	if (groupType == null) {
		return ""
	} else if (groupType === GroupType.Mail) {
		return lang.get("sharedMailbox_label")
	} else if (groupType === GroupType.User) {
		return lang.get("userColumn_label")
	} else if (groupType === GroupType.Template) {
		return lang.get("templateGroup_label")
	} else {
		return groupType // just for testing
	}
}
