import { Dialog } from "../../gui/base/Dialog"
import { Keys } from "../../api/common/TutanotaConstants"
import { MultiPageDialog } from "../../gui/dialogs/MultiPageDialog"
import m from "mithril"
import { VerificationErrorInfoPage } from "./dialogpages/VerificationErrorInfoPage"
import { KeyVerificationErrorModel } from "../../misc/KeyVerificationErrorModel"
import { locator } from "../../api/main/CommonLocator"
import { VerificationErrorAcceptPage } from "./dialogpages/VerificationErrorAcceptPage"
import { VerificationErrorRejectPage } from "./dialogpages/VerificationErrorRejectPage"
import { ResolvableRecipient } from "../../api/main/RecipientsModel"
import { ButtonType } from "../../gui/base/Button"

enum KeyVerificationRecoverDialogPages {
	INFO = "INFO",
	ACCEPT_CONFIRM = "ACCEPT_CONFIRM",
	REJECT_CONFIRM = "REJECT_CONFIRM",
}

/**
 * Allows a user to take action when they get some public key that does not match the identity key they have in their
 * trust database for a give mail address.
 */
export async function showKeyVerificationErrorRecoveryDialog(recipient: ResolvableRecipient): Promise<void> {
	const model = new KeyVerificationErrorModel(locator.keyVerificationFacade, locator.publicIdentityKeyProvider, recipient)
	const sourceOfTrust = await model.getSourceOfTrust()

	const KEY_VERIFICATION_DIALOG_HEIGHT = 700

	const multiPageDialog: Dialog = new MultiPageDialog<KeyVerificationRecoverDialogPages>(
		KeyVerificationRecoverDialogPages.INFO,
		(dialog, navigateToPage, goBack) => ({
			[KeyVerificationRecoverDialogPages.INFO]: {
				content: m(VerificationErrorInfoPage, {
					model,
					sourceOfTrust,
					goToAcceptPage: () => {
						navigateToPage(KeyVerificationRecoverDialogPages.ACCEPT_CONFIRM)
					},
					goToRejectPage: () => navigateToPage(KeyVerificationRecoverDialogPages.REJECT_CONFIRM),
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			[KeyVerificationRecoverDialogPages.ACCEPT_CONFIRM]: {
				content: m(VerificationErrorAcceptPage, {
					contactMailAddress: recipient.address,
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			[KeyVerificationRecoverDialogPages.REJECT_CONFIRM]: {
				content: m(VerificationErrorRejectPage, {
					contactMailAddress: recipient.address,
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
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
