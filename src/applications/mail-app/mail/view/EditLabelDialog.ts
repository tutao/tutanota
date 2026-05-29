import { Dialog } from "../../../../ui/base/Dialog"
import { LegacyTextField, LegacyTextFieldAttrs } from "../../../../ui/base/LegacyTextField"
import m from "mithril"
import { isOfflineError, LockedError, PreconditionFailedError } from "../../../../platform-kit/rest-client/error"
import { MailViewModel } from "./MailViewModel"
import { LegacyColorPickerView } from "../../../../ui/base/colorPicker/LegacyColorPickerView"
import { showNotAvailableForFreeDialog } from "../../../common/misc/SubscriptionDialogs"
import { MailBox, MailSet } from "@tutao/entities/tutanota"
import { UpgradePromptType } from "@tutao/app-env"
import { TextField } from "../../../../ui/base/TextField"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { ColorPickerView } from "../../../../ui/base/colorPicker/ColorPickerView"

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
			if (error instanceof PreconditionFailedError) {
				if (error.data === LIMIT_EXCEEDED_ERROR) {
					showNotAvailableForFreeDialog(UpgradePromptType.MORE_LABELS_NEEDED)
				} else {
					Dialog.message("unknownError_msg")
				}
			} else if (isOfflineError(error) || !(error instanceof LockedError)) {
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
				m(LegacyColorPickerView, {
					value: color,
					onselect: (newColor: string) => {
						color = newColor
					},
				}),
			]),
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
