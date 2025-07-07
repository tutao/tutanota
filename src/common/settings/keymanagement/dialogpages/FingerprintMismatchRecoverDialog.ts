import { locator } from "../../../api/main/CommonLocator"
import { Dialog } from "../../../gui/base/Dialog"
import { MultiPageDialog } from "../../../gui/dialogs/MultiPageDialog"
import m from "mithril"
import { ButtonType } from "../../../gui/base/Button"
import { IdentityKeySourceOfTrust, Keys } from "../../../api/common/TutanotaConstants"
import { FingerprintMismatchRecoverModel } from "../FingerprintMismatchRecoverModel"
import { FingerprintMismatchInfoPage } from "./FingerprintMismatchInfoPage"
import { UntrustedKeyWarningPage } from "./UntrustedKeyWarningPage"

enum FingerprintMismatchRecoverDialogPages {
	INFO = "INFO",
	KEEP_CONFIRM = "KEEP_CONFIRM",
	DELETE_CONFIRM = "DELETE_CONFIRM",
}

export async function showFingerprintMismatchRecoveryDialog(address: string, sourceOfTrust: IdentityKeySourceOfTrust): Promise<void> {
	const model = new FingerprintMismatchRecoverModel(locator.keyVerificationFacade, address)

	const KEY_VERIFICATION_DIALOG_HEIGHT = 700

	const multiPageDialog: Dialog = new MultiPageDialog<FingerprintMismatchRecoverDialogPages>(
		FingerprintMismatchRecoverDialogPages.INFO,
		(dialog, navigateToPage, goBack) => ({
			[FingerprintMismatchRecoverDialogPages.INFO]: {
				content: m(FingerprintMismatchInfoPage, {
					model,
					goToDeletePage: () => {
						navigateToPage(FingerprintMismatchRecoverDialogPages.KEEP_CONFIRM)
					},
					goToKeepPage: () => navigateToPage(FingerprintMismatchRecoverDialogPages.DELETE_CONFIRM),
					sourceOfTrust,
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			[FingerprintMismatchRecoverDialogPages.KEEP_CONFIRM]: {
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
			[FingerprintMismatchRecoverDialogPages.DELETE_CONFIRM]: {
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
