import m, { Children, Component, Vnode } from "mithril"
import { Hex } from "@tutao/tutanota-utils"
import { MonospaceTextDisplay } from "../gui/base/MonospaceTextDisplay"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { locator } from "../api/main/CommonLocator"
import { styles } from "../gui/styles"
import { theme } from "../gui/theme"
import { px } from "../gui/size"
import { SecondaryButton, SecondaryButtonAttrs } from "../gui/base/buttons/LoginButton"
import { Icons } from "../gui/base/icons/Icons"
import { lang } from "../misc/LanguageViewModel"
import { copyToClipboard } from "../misc/ClipboardUtils"
import { showSnackBar } from "../gui/base/SnackBar"

export type RecoverCodeDisplayAttrs = {
	column: boolean
	recoverCode: Hex
	mailAddress: string
}

/**
 * displays the recovery code alongside a button for copying it to the clipboard and one button for downloading the PDF
 */
export class RecoverCodeDisplay implements Component<RecoverCodeDisplayAttrs> {
	view(vnode: Vnode<RecoverCodeDisplayAttrs>): Children {
		const { recoverCode, mailAddress, column } = vnode.attrs
		return m(".flex.col.gap-8", [
			m(
				`.flex.items-start.pt-24.pb-24.plr-32.border-radius-16.gap-24${column ? ".col" : ""}`,
				{
					style: {
						"background-color": theme.surface_container_high,
					},
				},
				[
					m(
						`.plr-24.pt-16.pb-16.border-radius-8.b${column ? ".full-width" : ".flex-grow"}`,
						{
							style: {
								"background-color": theme.surface_container_highest,
								color: theme.on_surface_variant,
								"font-size": px(20),
							},
						},

						m(MonospaceTextDisplay, {
							text: recoverCode,
							chunksPerLine: 4,
							chunkSize: 4,
							border: false,
						}),
					),
					m(".flex.col.items-start.full-width.gap-16.flex-grow", [
						m(SecondaryButton, {
							label: "recoveryCode_label",
							icon: Icons.Clipboard,
							text: lang.getTranslationText("copyRecoveryCode_action"),
							onclick: () => {
								copyToClipboard(recoverCode)
								void showSnackBar({
									message: "copied_msg",
									showingTime: 3000,
									leadingIcon: Icons.Clipboard,
								})
							},
							class: "flex-grow",
						}),

						m(SecondaryButton, {
							label: "recoveryCode_label",
							icon: Icons.Download,
							text: lang.getTranslationText("downloadRecoveryCode_action"),
							onclick: () => this.saveRecoveryCodeAsPdf(recoverCode, mailAddress),
							class: "flex-grow",
						} satisfies SecondaryButtonAttrs),
					]),
				],
			),
		])
	}

	private saveRecoveryCodeAsPdf(recoveryCode: string, email: string) {
		showProgressDialog(
			"pleaseWait_msg",
			locator.customerFacade.generatePdfRecoveryDocument(recoveryCode, email).then((pdfInvoice) => locator.fileController.saveDataFile(pdfInvoice)),
		)
	}
}
