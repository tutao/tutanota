import { DropDownSelector, SelectorItemList } from "../../../../ui/base/DropDownSelector.js"
import m from "mithril"
import { Dialog } from "../../../../ui/base/Dialog.js"
import { isOfflineError, LockedError } from "../../../../platform-kit/rest-client/error"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { mailLocator } from "../../mailLocator.js"
import type { IndentedFolder } from "../../../common/api/common/mail/FolderSystem.js"
import { getPathToFolderString } from "../model/MailUtils.js"
import { MailSet } from "@tutao/entities/tutanota"
import { TextField } from "../../../../ui/base/TextField"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { ColorPickerView } from "../../../../ui/base/colorPicker/ColorPickerView"
import { MailViewModel } from "./MailViewModel"

/**
 * Dialog for Edit and Add label are the same.
 * @param label if this is null, a Label is being added, otherwise a label is being edited
 */
export async function showEditLabelDialog(
	mailBoxDetail: MailboxDetail,
	mailViewModel: MailViewModel,
	label: MailSet | null = null,
	parentLabel: MailSet | null = null,
) {
	const noParentFolderOption = lang.get("comboBoxSelectionNone_msg")
	const folders = await mailLocator.mailModel.getMailboxLabelFoldersForId(mailBoxDetail.mailbox.mailSets._id)
	let targetFolders: SelectorItemList<MailSet | null> = folders.getIndentedList(label).map((folderInfo: IndentedFolder) => {
		return {
			name: folderInfo.folder.name,
			value: folderInfo.folder,
		}
	})
	targetFolders = [{ name: noParentFolderOption, value: null }, ...targetFolders]
	let selectedParentLabel = parentLabel
	let name = label ? label.name : ""
	let color = label && label.color ? label.color : ""

	let form = () =>
		m(".flex.col.gap-16", [
			m(TextField, {
				label: "labelInput_label",
				value: name,
				oninput: (newName) => {
					name = newName
				},
				leadingIcon: {
					icon: Icons.LabelFilled,
					color: theme.on_surface_variant,
				},
			}),
			m(ColorPickerView, {
				value: color,
				onselect: (newColor: string) => {
					color = newColor
				},
			}),
			m(DropDownSelector, {
				label: "parentLabel_label",
				items: targetFolders,
				selectedValue: selectedParentLabel,
				selectedValueDisplay: selectedParentLabel ? selectedParentLabel.name : noParentFolderOption,
				selectionChangedHandler: (newFolder: MailSet | null) => (selectedParentLabel = newFolder),
				helpLabel: () => (selectedParentLabel ? getPathToFolderString(folders, selectedParentLabel) : ""),
			}),
		])

	const okAction = async (dialog: Dialog) => {
		// closing right away to prevent duplicate actions
		dialog.close()
		try {
			// if label is null, create new label
			if (label === null && mailBoxDetail.mailbox) {
				await mailViewModel.createLabel(mailBoxDetail.mailbox, { name, color, parentLabelId: selectedParentLabel?._id })
			} else if (label !== null) {
				await mailViewModel.editLabel(label, { name, color, parentFolderId: selectedParentLabel?._id })
			}
		} catch (error) {
			if (isOfflineError(error) || !(error instanceof LockedError)) {
				throw error
			}
		}
	}

	Dialog.showActionDialog({
		title: label ? "editLabel_action" : "addLabel_action",
		child: form,
		allowOkWithReturn: true,
		okAction: okAction,
	})
}

export async function showImapEditLabelDialog(
	attributes: { name: string; color: string },
	oninput: (name: string) => unknown,
	onselect: (color: string) => unknown,
) {
	Dialog.showActionDialog({
		title: "addLabel_action",
		allowCancel: false,
		okAction: (dialog: Dialog) => {
			dialog.close()
		},
		child: () =>
			m(".flex.col.gap-16", [
				m(TextField, {
					label: "labelInput_label",
					value: attributes.name,
					oninput,
					leadingIcon: {
						icon: Icons.LabelFilled,
						color: theme.on_surface_variant,
					},
					helpLabel: () => lang.getTranslationText("migrationLabelInput_helpLabel"),
				}),
				m(ColorPickerView, {
					value: attributes.color,
					onselect,
				}),
			]),
	})
}
