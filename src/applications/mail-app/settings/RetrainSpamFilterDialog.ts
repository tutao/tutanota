import m, { Component, Vnode } from "mithril"
import { theme } from "../../../ui/theme"
import { TitleSection } from "../../../ui/TitleSection"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { Icons } from "../../../ui/base/icons/Icons"
import { PrimaryButton, SecondaryButton } from "../../../ui/base/buttons/VariantButtons"
import { Dialog } from "../../../ui/base/Dialog"
import { Keys } from "../../../ui/utils/KeyboardKeys"

export type RetrainSpamFilterChoice = "retrain" | "cancel"

/** Intended to explain how to properly make use of the retrain button before doing so. */
export function showRetrainSpamFilterDialog(): Promise<RetrainSpamFilterChoice> {
	return new Promise((resolve) => {
		const dialog: Dialog = Dialog.editMediumDialog(
			{
				middle: "retrainSpamFilter_action",
			},
			RetrainSpamFilterDialog,
			{
				choice: (choice: RetrainSpamFilterChoice) => {
					resolve(choice)
					dialog.close()
				},
			},
			{ backgroundColor: theme.surface_container },
		)
			.addShortcut({
				key: Keys.ESC,
				exec: () => {
					resolve("cancel")
					dialog.close()
				},
				help: "close_alt",
			})
			.setCloseHandler(() => {
				resolve("cancel")
				dialog.close()
			})

		dialog.show()
	})
}

interface RetrainSpamFilterDialogAttrs {
	choice: (choice: RetrainSpamFilterChoice) => void
}

class RetrainSpamFilterDialog implements Component<RetrainSpamFilterDialogAttrs> {
	view({ attrs }: Vnode<RetrainSpamFilterDialogAttrs>) {
		return m(".pt-16.pb-16.flex.col.gap-16", { style: { backgroundColor: theme.surface_container } }, [
			m(TitleSection, {
				title: lang.getTranslationText("retrainSpamFilterConfirmTitle_label"),
				subTitle: [
					// // TODO: replace the placeholder with the real example image
					// m(
					// 	".flex.items-center.justify-center.mt-16.mb-16.border-radius",
					// 	{
					// 		style: {
					// 			minHeight: "160px",
					// 			border: `2px dashed ${theme.outline}`,
					// 			color: theme.on_surface_variant,
					// 		},
					// 	},
					// 	lang.getTranslationText("retrainSpamFilterConfirmExample_label"),
					// ),
					m(".pb-16", lang.getTranslationText("retrainSpamFilterConfirm_msg")),
				],
				icon: Icons.InfoOutline,
				iconOptions: { color: theme.primary },
				style: { backgroundColor: theme.surface },
			}),
			m(".flex.row.gap-8", [
				m(SecondaryButton, {
					class: "flex-grow center-vertically",
					label: "retrainSpamFilter_action",
					onclick: () => attrs.choice("retrain"),
				}),
				m(PrimaryButton, {
					class: "flex-grow center-vertically",
					label: "retrainSpamFilterNotYet_action",
					onclick: () => attrs.choice("cancel"),
				}),
			]),
		])
	}
}
