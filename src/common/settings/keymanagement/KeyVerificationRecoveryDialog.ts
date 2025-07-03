import { Dialog } from "../../gui/base/Dialog"
import { Keys } from "../../api/common/TutanotaConstants"
import { MultiPageDialog } from "../../gui/dialogs/MultiPageDialog"
import m from "mithril"
import { RecipientKeyVerificationRecoveryInfoPage } from "./dialogpages/RecipientKeyVerificationRecoveryInfoPage"
import { RecipientKeyVerificationRecoveryModel } from "../../misc/RecipientKeyVerificationRecoveryModel"
import { locator } from "../../api/main/CommonLocator"
import { RecipientKeyVerificationRecoveryAcceptPage } from "./dialogpages/RecipientKeyVerificationRecoveryAcceptPage"
import { RecipientKeyVerificationRecoveryRejectPage } from "./dialogpages/RecipientKeyVerificationRecoveryRejectPage"
import { ResolvableRecipient } from "../../api/main/RecipientsModel"
import { ButtonType } from "../../gui/base/Button"
import { MailAddressAndName } from "../../api/common/CommonMailUtils"
import { SenderKeyVerificationRecoveryModel } from "../../misc/SenderKeyVerificationRecoveryModel"
import { SenderKeyVerificationRecoverySuccessPage } from "./dialogpages/SenderKeyVerificationRecoverySuccessPage"
import { SenderKeyVerificationRecoveryInfoPage } from "./dialogpages/SenderKeyVerificationRecoveryInfoPage"

export enum RecipientKeyVerificationRecoveryDialogPages {
	INFO = "INFO",
	ACCEPT_CONFIRM = "ACCEPT_CONFIRM",
	REJECT_CONFIRM = "REJECT_CONFIRM",
}

export enum SenderKeyVerificationRecoveryDialogPages {
	INFO = "INFO",
	SUCCESS = "SUCCESS",
	ACCEPT_CONFIRM = "ACCEPT_CONFIRM",
	REJECT_CONFIRM = "REJECT_CONFIRM",
}

const KEY_VERIFICATION_DIALOG_HEIGHT = 700

/**
 * Allows a user to take action when they get some public key that does not match the identity key they have in their
 * trust database for a give mail address.
 */
export async function showRecipientKeyVerificationRecoveryDialog(recipient: ResolvableRecipient): Promise<void> {
	const model = new RecipientKeyVerificationRecoveryModel(locator.keyVerificationFacade, locator.publicIdentityKeyProvider, recipient)
	const sourceOfTrust = await model.getSourceOfTrust()

	const multiPageDialog: Dialog = new MultiPageDialog<RecipientKeyVerificationRecoveryDialogPages>(
		RecipientKeyVerificationRecoveryDialogPages.INFO,
		(dialog, navigateToPage, goBack) => ({
			[RecipientKeyVerificationRecoveryDialogPages.INFO]: {
				content: m(RecipientKeyVerificationRecoveryInfoPage, {
					model,
					sourceOfTrust,
					goToAcceptPage: () => {
						navigateToPage(RecipientKeyVerificationRecoveryDialogPages.ACCEPT_CONFIRM)
					},
					goToRejectPage: () => navigateToPage(RecipientKeyVerificationRecoveryDialogPages.REJECT_CONFIRM),
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			[RecipientKeyVerificationRecoveryDialogPages.ACCEPT_CONFIRM]: {
				content: m(RecipientKeyVerificationRecoveryAcceptPage, {
					contactMailAddress: recipient.address,
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			[RecipientKeyVerificationRecoveryDialogPages.REJECT_CONFIRM]: {
				content: m(RecipientKeyVerificationRecoveryRejectPage, {
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

export async function showSenderKeyVerificationRecoveryDialog(
	sender: MailAddressAndName,
	startPage: SenderKeyVerificationRecoveryDialogPages = SenderKeyVerificationRecoveryDialogPages.INFO,
): Promise<void> {
	const model = new SenderKeyVerificationRecoveryModel(locator.keyVerificationFacade, locator.publicIdentityKeyProvider, sender)
	const sourceOfTrust = await model.getSourceOfTrust()

	const multiPageDialog: Dialog = new MultiPageDialog<SenderKeyVerificationRecoveryDialogPages>(
		startPage,
		(dialog, navigateToPage, goBack) => ({
			[SenderKeyVerificationRecoveryDialogPages.INFO]: {
				content: m(SenderKeyVerificationRecoveryInfoPage, {
					model,
					sourceOfTrust,
					goToAcceptPage: () => {
						navigateToPage(SenderKeyVerificationRecoveryDialogPages.ACCEPT_CONFIRM)
					},
					goToRejectPage: () => {
						navigateToPage(SenderKeyVerificationRecoveryDialogPages.REJECT_CONFIRM)
					},
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			// we reuse the component from the recipient version because its the same path and same behaviour
			[SenderKeyVerificationRecoveryDialogPages.ACCEPT_CONFIRM]: {
				content: m(RecipientKeyVerificationRecoveryAcceptPage, {
					contactMailAddress: sender.address,
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			// we reuse the component from the recipient version because its the same path and same behaviour
			[SenderKeyVerificationRecoveryDialogPages.REJECT_CONFIRM]: {
				content: m(RecipientKeyVerificationRecoveryRejectPage, {
					contactMailAddress: sender.address,
				}),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			[SenderKeyVerificationRecoveryDialogPages.SUCCESS]: {
				content: m(SenderKeyVerificationRecoverySuccessPage, {
					model,
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
