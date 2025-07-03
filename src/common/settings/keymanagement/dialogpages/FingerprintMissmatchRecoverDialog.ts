import { locator } from "../../../api/main/CommonLocator"
import { Dialog } from "../../../gui/base/Dialog"
import { MultiPageDialog } from "../../../gui/dialogs/MultiPageDialog"
import m from "mithril"
import { ButtonType } from "../../../gui/base/Button"
import { Keys } from "../../../api/common/TutanotaConstants"
import { FingerprintMissmatchRecoverModel } from "../FingerprintMissmatchRecoverModel"
import { FingerprintMissmatchInfoPage } from "./FingerprintMissmatchInfoPage"
import { UntrustedKeyWarningPage } from "./UntrustedKeyWarningPage"

enum FingerprintMissmatchRecoverDialogPages {
	INFO = "INFO",
	KEEP_CONFIRM = "KEEP_CONFIRM",
	DELETE_CONFIRM = "DELETE_CONFIRM",
}

export async function showFingerprintMissmatchRecoveryDialog(address: string): Promise<void> {
	const model = new FingerprintMissmatchRecoverModel(locator.keyVerificationFacade, address)

	const KEY_VERIFICATION_DIALOG_HEIGHT = 700

	const multiPageDialog: Dialog = new MultiPageDialog<FingerprintMissmatchRecoverDialogPages>(
		FingerprintMissmatchRecoverDialogPages.INFO,
		(dialog, navigateToPage, goBack) => ({
			[FingerprintMissmatchRecoverDialogPages.INFO]: {
				content: m(FingerprintMissmatchInfoPage, {
					model,
					goToDeletePage: () => {
						navigateToPage(FingerprintMissmatchRecoverDialogPages.KEEP_CONFIRM)
					},
					goToKeepPage: () => navigateToPage(FingerprintMissmatchRecoverDialogPages.DELETE_CONFIRM),
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			[FingerprintMissmatchRecoverDialogPages.KEEP_CONFIRM]: {
				content: m(UntrustedKeyWarningPage, {
					contactMailAddress: address,
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			[FingerprintMissmatchRecoverDialogPages.DELETE_CONFIRM]: {
				//TODO got back to manual verification page?
				//or Retry automatically and show result here?
				content: m("TODO"),
			},
		}),
		KEY_VERIFICATION_DIALOG_HEIGHT,
	)
		.getDialog()
		.addShortcut({
			help: "close_alt",
			key: Keys.ESC,
			exec: () => multiPageDialog.close(),
		})
		.show()
}
