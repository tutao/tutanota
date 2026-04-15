import { Dialog } from "../../../common/gui/base/Dialog"
import { TextField, TextFieldAttrs } from "../../../common/gui/base/TextField"
import m from "mithril"
import { tutanotaTypeRefs } from "@tutao/typerefs"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils"
import { restError } from "@tutao/rest-client"
import { MailViewModel } from "./MailViewModel"
import { ColorPickerView } from "../../../common/gui/base/colorPicker/ColorPickerView"
import { showNotAvailableForFreeDialog } from "../../../common/misc/SubscriptionDialogs"
import { UpgradePromptType } from "@tutao/app-env"

const LIMIT_EXCEEDED_ERROR = "limitReached"

export async function showEditLabelDialog(mailbox: tutanotaTypeRefs.MailBox | null, mailViewModel: MailViewModel, label: tutanotaTypeRefs.MailSet | null) {
	let name = label ? label.name : ""
	let color = label && label.color ? label.color : ""

	async function onOkClicked(dialog: Dialog) {
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
			if (error instanceof restError.PreconditionFailedError) {
				if (error.data === LIMIT_EXCEEDED_ERROR) {
					showNotAvailableForFreeDialog(UpgradePromptType.MORE_LABELS_NEEDED)
				} else {
					Dialog.message("unknownError_msg")
				}
			} else if (isOfflineError(error) || !(error instanceof restError.LockedError)) {
				throw error
			}
		}
	}

	Dialog.showActionDialog({
		title: label ? "editLabel_action" : "addLabel_action",
		allowCancel: true,
		okAction: (dialog: Dialog) => {
			onOkClicked(dialog)
		},
		child: () =>
			m(".flex.col.gap-16", [
				m(TextField, {
					label: "name_label",
					value: name,
					oninput: (newName) => {
						name = newName
					},
				} satisfies TextFieldAttrs),
				m(ColorPickerView, {
					value: color,
					onselect: (newColor: string) => {
						color = newColor
					},
				}),
			]),
	})
}
