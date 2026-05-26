import m, { Children, Component, Vnode } from "mithril"
import { MonospaceTextDisplay } from "../../../ui/base/MonospaceTextDisplay"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { locator } from "../api/main/CommonLocator"
import { theme } from "../../../ui/theme"
import { SecondaryButton, SecondaryButtonAttrs } from "../../../ui/base/buttons/VariantButtons.js"
import { Icons } from "../../../ui/base/icons/Icons"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { copyToClipboard } from "../../../ui/utils/ClipboardUtils"
import { showSnackBar } from "../../../ui/base/SnackBar"
import { assertMainOrNode } from "@tutao/app-env"
import { px } from "../../../ui/size"

assertMainOrNode()

export type RecoverCodeDisplayAttrs = {
	column: boolean
	recoverCode: Hex
	mailAddress: string
	monoSpaceFontSize?: number
}

/**
 * displays the recovery code alongside a button for copying it to the clipboard and one button for downloading the PDF
 */
export class RecoverCodeDisplay implements Component<RecoverCodeDisplayAttrs> {
	view(vnode: Vnode<RecoverCodeDisplayAttrs>): Children {
		const { recoverCode, mailAddress, column, monoSpaceFontSize } = vnode.attrs
		return m(`.flex.gap-24${column ? ".col" : ""}`, [
			m(
				`.plr-24.pt-16.pb-16.border-radius-8.b${column ? ".full-width" : ".flex-grow"}`,
				{
					style: {
						"background-color": theme.surface_container_highest,
						color: theme.on_surface_variant,
						"font-size": monoSpaceFontSize ? px(monoSpaceFontSize) : px(20),
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
					icon: Icons.ClipboardFilled,
					text: lang.getTranslationText("copyRecoveryCode_action"),
					onclick: () => {
						copyToClipboard(recoverCode)
						void showSnackBar({
							message: "copied_msg",
							showingTime: 3000,
							leadingIcon: Icons.ClipboardFilled,
						})
					},
				}),

				m(SecondaryButton, {
					label: "recoveryCode_label",
					icon: Icons.DownloadFilled,
					text: lang.getTranslationText("downloadRecoveryCode_action"),
					onclick: () => this.saveRecoveryCodeAsPdf(recoverCode, mailAddress),
				} satisfies SecondaryButtonAttrs),
			]),
		])
	}

	private saveRecoveryCodeAsPdf(recoveryCode: string, email: string) {
		showProgressDialog(
			"pleaseWait_msg",
			locator.customerFacade.generatePdfRecoveryDocument(recoveryCode, email).then((pdfInvoice) => locator.fileController.saveDataFile(pdfInvoice)),
		)
	}
}
