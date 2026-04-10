import { Dialog, DialogType } from "../../gui/base/Dialog.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { DialogHeaderBar } from "../../gui/base/DialogHeaderBar.js"
import { ButtonType } from "../../gui/base/Button.js"
import m from "mithril"
import { DropDownSelector, DropDownSelectorAttrs } from "../../gui/base/DropDownSelector.js"
import { tutanotaTypeRefs } from "@tutao/typeRefs"
import { IndentedFolder } from "../../api/common/mail/FolderSystem"
import { repeat } from "@tutao/utils"
import { Icons } from "../../gui/base/icons/Icons"

/**
 * Shows a dialog with the users mailSets that are able to import mails.
 * @param indentedFolders List of user's mailSets
 * @param okAction
 */
export function folderSelectionDialog(indentedFolders: IndentedFolder[], okAction: (dialog: Dialog, selectedMailFolder: tutanotaTypeRefs.MailSet) => unknown) {
	let selectedIndentedFolder = indentedFolders[0]

	const dialog = new Dialog(DialogType.EditSmall, {
		view: () => [
			m(DialogHeaderBar, {
				left: [
					{
						type: ButtonType.Secondary,
						label: "cancel_action",
						click: () => {
							dialog.close()
						},
					},
				],
				middle: "mailFolder_label",
				right: [
					{
						type: ButtonType.Primary,
						label: "pricing.select_action",
						click: () => {
							okAction(dialog, selectedIndentedFolder.folder)
						},
					},
				],
			}),

			m(".dialog-max-height.plr-24.pt-16.pb-16.text-break.scroll", [
				m(".text-break.selectable", lang.get("mailImportSelection_label")),
				m(DropDownSelector, {
					label: "mailFolder_label",
					items: indentedFolders.map((mailFolder) => {
						return {
							name: repeat(".", mailFolder.level) + mailFolder.folder.name,
							value: mailFolder.folder,
						}
					}),
					selectedValue: selectedIndentedFolder.folder,
					selectionChangedHandler: (v) => (selectedIndentedFolder.folder = v),
					icon: Icons.ArrowDown,
				} satisfies DropDownSelectorAttrs<tutanotaTypeRefs.MailSet>),
			]),
		],
	}).show()
}
