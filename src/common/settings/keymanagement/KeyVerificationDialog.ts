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
	CHOOSE_METHOD,
	MANUAL_INPUT_METHOD,
	QR_CODE_INPUT_METHOD,
	SUCCESS,
	ERROR,
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
	const multiPageDialog: Dialog = new MultiPageDialog<KeyVerificationDialogPages>(KeyVerificationDialogPages.CHOOSE_METHOD)
		.buildDialog(
			(currentPage, dialog, navigateToPage, _) => {
				switch (currentPage) {
					case KeyVerificationDialogPages.CHOOSE_METHOD:
						return m(MethodSelectionPage, {
							model,
							goToEmailInputPage: () => {
								navigateToPage(KeyVerificationDialogPages.MANUAL_INPUT_METHOD)
							},
							goToQrScanPage: () => navigateToPage(KeyVerificationDialogPages.QR_CODE_INPUT_METHOD),
						})
					case KeyVerificationDialogPages.MANUAL_INPUT_METHOD:
						return m(VerificationByManualInputPage, {
							model,
							goToSuccessPage: async () => {
								await reloadParent()
								navigateToPage(KeyVerificationDialogPages.SUCCESS)
							},
						})
					case KeyVerificationDialogPages.QR_CODE_INPUT_METHOD:
						return m(VerificationByQrCodeInputPage, {
							model,
							goToSuccessPage: async () => {
								await reloadParent()
								navigateToPage(KeyVerificationDialogPages.SUCCESS)
							},
							goToErrorPage: (err: QrCodePageErrorType) => {
								lastError = err
								navigateToPage(KeyVerificationDialogPages.ERROR)
							},
						})
					case KeyVerificationDialogPages.SUCCESS: {
						return m(VerificationResultPage, {
							model,
							close: () => {
								dialog.close()
							},
						})
					}
					case KeyVerificationDialogPages.ERROR:
						return m(VerificationErrorPage, {
							model,
							error: lastError,
							retryAction: () => navigateToPage(KeyVerificationDialogPages.QR_CODE_INPUT_METHOD),
						})
				}
			},
			{
				getPageTitle: (currentPage) => {
					return {
						testId: "keyManagement.keyVerification_label",
						text: lang.get("keyManagement.keyVerification_label"),
					}
				},
				getLeftAction: (currentPage, dialog, navigateToPage, goBack) => {
					switch (currentPage) {
						case KeyVerificationDialogPages.CHOOSE_METHOD:
							return {
								type: ButtonType.Secondary,
								click: () => dialog.close(),
								label: "back_action",
								title: "back_action",
							}
						case KeyVerificationDialogPages.MANUAL_INPUT_METHOD:
						case KeyVerificationDialogPages.QR_CODE_INPUT_METHOD:
							return {
								type: ButtonType.Secondary,
								click: () => goBack(KeyVerificationDialogPages.CHOOSE_METHOD),
								label: "back_action",
								title: "back_action",
							}
					}
				},
				getRightAction: (currentPage, dialog, navigateToPage, goBack) => {
					return {
						type: ButtonType.Secondary,
						click: () => dialog.close(),
						label: "close_alt",
						title: "close_alt",
					}
				},
			},
		)
		.addShortcut({
			help: "close_alt",
			key: Keys.ESC,
			exec: () => multiPageDialog.close(),
		})
		.show()
}
