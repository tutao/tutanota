import { Dialog } from "../../../../ui/base/Dialog"
import { LegacyTextField, LegacyTextFieldAttrs } from "../../../../ui/base/LegacyTextField"
import m from "mithril"
import * as restError from "../../../../platform-kits/rest-client/error"
import { isOfflineError } from "../../../../platform-kits/rest-client/error"
import { MailViewModel } from "./MailViewModel"
import { ColorPickerView } from "../../../../ui/base/colorPicker/ColorPickerView"
import { showNotAvailableForFreeDialog } from "../../../common/misc/SubscriptionDialogs"
import { UpgradePromptType } from "../../../../platform-kits/app-env"
import { MailBox, MailSet } from "@tutao/entities/tutanota"

const LIMIT_EXCEEDED_ERROR = "limitReached"

export async function showEditLabelDialog(mailbox: MailBox | null, mailViewModel: MailViewModel, label: MailSet | null) {
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
				m(LegacyTextField, {
					label: "name_label",
					value: name,
					oninput: (newName) => {
						name = newName
					},
				} satisfies LegacyTextFieldAttrs),
				m(ColorPickerView, {
					value: color,
					onselect: (newColor: string) => {
						color = newColor
					},
				}),
			]),
	})
}
