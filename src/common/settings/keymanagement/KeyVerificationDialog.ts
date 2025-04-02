import { Dialog } from "../../gui/base/Dialog"
import { Keys } from "../../api/common/TutanotaConstants"
import { KeyVerificationFacade } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade"
import { UsageTestController } from "@tutao/tutanota-usagetests"
import { MultiPageDialog } from "../../gui/dialogs/MultiPageDialog"
import m from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import { ButtonType } from "../../gui/base/Button"
import { MethodSelectionPage } from "./dialogpages/MethodSelectionPage"
import { VerificationByManualInputPage } from "./dialogpages/VerificationByManualInputPage"
import { KeyVerificationModel } from "./KeyVerificationModel"
import { VerificationResultPage } from "./dialogpages/VerificationResultPage"
import { QrCodePageErrorType, VerificationByQrCodeInputPage } from "./dialogpages/VerificationByQrCodeInputPage"
import { VerificationErrorPage } from "./dialogpages/VerificationErrorPage"
import { KeyVerificationUsageTestUtils } from "./KeyVerificationUsageTestUtils"

enum KeyVerificationDialogPages {
	CHOOSE_METHOD = "CHOOSE_METHOD",
	MANUAL_INPUT_METHOD = "MANUAL_INPUT_METHOD",
	QR_CODE_INPUT_METHOD = "QR_CODE_INPUT_METHOD",
	SUCCESS = "SUCCESS",
	ERROR = "ERROR",
}

/**
 * Entry point to the key verification dialog, which guides the user through the process of verifying a contact.
 */
export async function showKeyVerificationDialog(
	keyVerificationFacade: KeyVerificationFacade,
	mobileSystemFacade: MobileSystemFacade,
	usageTestController: UsageTestController,
	reloadParent: () => Promise<void>,
): Promise<void> {
	const textUsageTest = usageTestController.getTest("crypto.keyVerification.text")
	const qrUsageTest = usageTestController.getTest("crypto.keyVerification.qr")
	const regretUsageTest = usageTestController.getTest("crypto.keyVerification.regret")
	const keyVerificationUsageTestUtils = new KeyVerificationUsageTestUtils(textUsageTest, qrUsageTest, regretUsageTest)

	const model = new KeyVerificationModel(keyVerificationFacade, mobileSystemFacade, keyVerificationUsageTestUtils)
	let lastError: QrCodePageErrorType | null = null
	const multiPageDialog: Dialog = new MultiPageDialog<KeyVerificationDialogPages>(
		KeyVerificationDialogPages.CHOOSE_METHOD,
		(dialog, navigateToPage, goBack) => ({
			[KeyVerificationDialogPages.CHOOSE_METHOD]: {
				content: m(MethodSelectionPage, {
					model,
					goToEmailInputPage: () => {
						navigateToPage(KeyVerificationDialogPages.MANUAL_INPUT_METHOD)
					},
					goToQrScanPage: () => navigateToPage(KeyVerificationDialogPages.QR_CODE_INPUT_METHOD),
				}),
				title: lang.get("keyManagement.keyVerification_label"),
				leftAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "back_action",
					title: "back_action",
				},
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			[KeyVerificationDialogPages.MANUAL_INPUT_METHOD]: {
				content: m(VerificationByManualInputPage, {
					model,
					goToSuccessPage: async () => {
						await reloadParent()
						navigateToPage(KeyVerificationDialogPages.SUCCESS)
					},
				}),
				title: lang.get("keyManagement.keyVerification_label"),
				leftAction: {
					type: ButtonType.Secondary,
					click: () => goBack(KeyVerificationDialogPages.CHOOSE_METHOD),
					label: "back_action",
					title: "back_action",
				},
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			[KeyVerificationDialogPages.QR_CODE_INPUT_METHOD]: {
				content: m(VerificationByQrCodeInputPage, {
					model,
					goToSuccessPage: async () => {
						await reloadParent()
						navigateToPage(KeyVerificationDialogPages.SUCCESS)
					},
					goToErrorPage: (err: QrCodePageErrorType) => {
						lastError = err
						navigateToPage(KeyVerificationDialogPages.ERROR)
					},
				}),
				title: lang.get("keyManagement.keyVerification_label"),
				leftAction: {
					type: ButtonType.Secondary,
					click: () => goBack(KeyVerificationDialogPages.CHOOSE_METHOD),
					label: "back_action",
					title: "back_action",
				},
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			[KeyVerificationDialogPages.SUCCESS]: {
				content: m(VerificationResultPage, {
					model,
					close: () => {
						dialog.close()
					},
				}),
				title: lang.get("keyManagement.keyVerification_label"),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			[KeyVerificationDialogPages.ERROR]: {
				content: m(VerificationErrorPage, {
					model,
					error: lastError,
					retryAction: () => navigateToPage(KeyVerificationDialogPages.QR_CODE_INPUT_METHOD),
				}),
				title: lang.get("keyManagement.keyVerification_label"),
				rightAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
		}),
	)
		.getDialog()
		.addShortcut({
			help: "close_alt",
			key: Keys.ESC,
			exec: () => multiPageDialog.close(),
		})
		.show()
}
