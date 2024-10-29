import { Dialog } from "../../../common/gui/base/Dialog"
import { TextField, TextFieldAttrs } from "../../../common/gui/base/TextField"
import { ColorPicker } from "../../../common/gui/base/ColorPicker"
import m from "mithril"
import { theme } from "../../../common/gui/theme"
import type { MailBox, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils"
import { LockedError } from "../../../common/api/common/error/RestError"
import { MailViewModel } from "./MailViewModel"
import { lang } from "../../../common/misc/LanguageViewModel"

export async function showEditLabelDialog(mailbox: MailBox | null, mailViewModel: MailViewModel, label: MailFolder | null): Promise<void> {
	return new Promise((resolve) => {
		let name = label ? label.name : ""
		let color = label && label.color ? label.color : theme.content_accent
		Dialog.showActionDialog({
			title: lang.get(label ? "editLabel_action" : "addLabel_action"),
			allowCancel: true,
			okAction: async (dialog: Dialog) => {
				dialog.close()
				try {
					if (label) {
						// editing a label
						await mailViewModel.editLabel(label, { name, color })
					} else if (mailbox) {
						// adding a label
						await mailViewModel.createLabel(mailbox, { name, color })
					}
				} catch (error) {
					if (isOfflineError(error) || !(error instanceof LockedError)) {
						throw error
					}
				}
			},
			child: () =>
				m(".flex.col.gap-vpad", [
					m(TextField, {
						label: "name_label",
						value: name,
						oninput: (newName) => {
							name = newName
						},
					} satisfies TextFieldAttrs),
					m(ColorPicker, {
						value: color,
						onValueChange: (newColor) => {
							color = newColor
						},
					}),
				]),
		})
	})
}
