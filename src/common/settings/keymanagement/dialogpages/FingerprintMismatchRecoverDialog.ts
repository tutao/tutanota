import { Dialog } from "../../../gui/base/Dialog"
import { MultiPageDialog } from "../../../gui/dialogs/MultiPageDialog"
import m from "mithril"
import { ButtonType } from "../../../gui/base/Button"
import { Keys } from "../../../api/common/TutanotaConstants"
import { FingerprintMismatchInfoPage } from "./FingerprintMismatchInfoPage"
import { FingerprintMismatchKeepPage } from "./FingerprintMismatchKeepPage"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { assertNotNull } from "@tutao/tutanota-utils"

enum FingerprintMismatchRecoverDialogPages {
	INFO = "INFO",
	KEEP_CONFIRM = "KEEP_CONFIRM",
}

export async function showFingerprintMismatchRecoveryDialog(
	model: KeyVerificationModel,
	reloadParent: () => void,
	closeKeyVerificationDialog: () => void,
): Promise<void> {
	let publicIdentity = assertNotNull(model.getPublicIdentity())
	const address = publicIdentity.mailAddress
	const sourceOfTrust = publicIdentity.trustDbEntry.sourceOfTrust

	const KEY_VERIFICATION_DIALOG_HEIGHT = 700

	const multiPageDialog: Dialog = new MultiPageDialog<FingerprintMismatchRecoverDialogPages>(
		FingerprintMismatchRecoverDialogPages.INFO,
		(dialog, navigateToPage, goBack) => ({
			[FingerprintMismatchRecoverDialogPages.INFO]: {
				content: m(FingerprintMismatchInfoPage, {
					model,
					goToDeletePage: () => {
						dialog.close()
						reloadParent()
					},
					sourceOfTrust,
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => {
						navigateToPage(FingerprintMismatchRecoverDialogPages.KEEP_CONFIRM)
					},
					label: "close_alt",
					title: "close_alt",
				},
			},
			[FingerprintMismatchRecoverDialogPages.KEEP_CONFIRM]: {
				content: m(FingerprintMismatchKeepPage, {
					contactMailAddress: address,
					sourceOfTrust,
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => {
						dialog.close()
						closeKeyVerificationDialog()
					},
					label: "close_alt",
					title: "close_alt",
				},
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
