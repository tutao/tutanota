import m, { Component, Vnode } from "mithril"
import { theme } from "../../../../ui/theme"
import { TitleSection } from "../../../../ui/TitleSection"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { Icons } from "../../../../ui/base/icons/Icons"
import { PrimaryButton, SecondaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { Dialog } from "../../../../ui/base/Dialog"
import { Keys } from "../../../../ui/utils/KeyboardKeys"

export function showMeteredConnectionWarningDialog(expectedDataInMB: number): Promise<"cancelIndexing" | "continueIndexing"> {
	return new Promise((resolve) => {
		const dialog: Dialog = Dialog.editMediumDialog(
			{
				middle: "extendSearchIndex_label",
			},
			MeteredConnectionWarningDialog,
			{
				expectedDataInMB,
				indexingChoice: (choice: "cancelIndexing" | "continueIndexing") => {
					resolve(choice)
					dialog.close()
				},
			},
			{ backgroundColor: theme.surface_container },
		)
			.addShortcut({
				key: Keys.ESC,
				exec: () => {
					resolve("cancelIndexing")
					dialog.close()
				},
				help: "close_alt",
			})
			.setCloseHandler(() => {
				resolve("cancelIndexing")
				dialog.close()
			})

		dialog.show()
	})
}

interface MeteredConnectionWarningDialogAttrs {
	expectedDataInMB: number
	indexingChoice: (choice: "cancelIndexing" | "continueIndexing") => void
}

class MeteredConnectionWarningDialog implements Component<MeteredConnectionWarningDialogAttrs> {
	view({ attrs }: Vnode<MeteredConnectionWarningDialogAttrs>) {
		return m(".pt-16.pb-16.flex.col.gap-16", { style: { backgroundColor: theme.surface_container } }, [
			m(TitleSection, {
				title: lang.getTranslationText("meteredConnectionWarning_label"),
				subTitle: [
					m(".pt-16.pb-16", lang.getTranslationText(lang.getTranslation("extendSearchDataAmount_msg", { "{1}": attrs.expectedDataInMB }))),
					m("strong.pt-8.pb-4.mb-16", lang.getTranslationText("allowDownloadingSearchMeteredConnection_msg")),
				],
				icon: Icons.InfoOutline,
				iconOptions: { color: theme.primary },
				style: { backgroundColor: theme.surface },
			}),
			m(".flex.row.gap-8", [
				m(SecondaryButton, {
					class: "flex-grow center-vertically",
					label: "allow_action",
					onclick: () => {
						attrs.indexingChoice("continueIndexing")
					},
				}),
				m(PrimaryButton, {
					class: "flex-grow center-vertically",
					label: "deny_action",
					onclick: () => {
						attrs.indexingChoice("cancelIndexing")
					},
				}),
			]),
		])
	}
}
