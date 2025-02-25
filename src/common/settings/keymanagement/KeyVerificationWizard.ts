import { Dialog } from "../../gui/base/Dialog"
import { Keys, KeyVerificationMethodType, KeyVerificationResultType } from "../../api/common/TutanotaConstants"
import { KeyVerificationFacade, PublicKeyFingerprint } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade"
import { UsageTest, UsageTestController } from "@tutao/tutanota-usagetests"
import { MultiPageDialog } from "../../gui/dialogs/MultiPageDialog"
import m from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import { ButtonType } from "../../gui/base/Button"
import { MethodSelectionPage } from "./dialogpages/MethodSelectionPage"
import { VerificationByTextPage } from "./dialogpages/VerificationByTextPage"
import { KeyVerificationModel } from "./KeyVerificationModel"
import { VerificationResultPage } from "./dialogpages/VerificationResultPage"
import { VerificationByQrCodePage } from "./dialogpages/VerificationByQrCodePage"

export type KeyVerificationWizardData = {
	keyVerificationFacade: KeyVerificationFacade
	mobileSystemFacade: MobileSystemFacade
	method: KeyVerificationMethodType
	reloadParent: () => Promise<void>
	mailAddress: string
	publicKeyFingerprint: PublicKeyFingerprint | null
	result: KeyVerificationResultType | null
	usageTest: UsageTest
}

enum KeyVerificationWizardPages {
	CHOOSE_METHOD,
	BY_TEXT_INPUT_METHOD,
	BY_QR_CODE_INPUT_METHOD,
	SUCCESS,
}

export async function showKeyVerificationWizard(
	keyVerificationFacade: KeyVerificationFacade,
	mobileSystemFacade: MobileSystemFacade,
	usageTestController: UsageTestController,
	reloadParent: () => Promise<void>,
): Promise<void> {
	const usageTest = usageTestController.getTest("crypto.keyVerification")
	// const stage = usageTest.getStage(0)
	// await completeStageNow(stage)

	const model = new KeyVerificationModel(keyVerificationFacade, mobileSystemFacade)
	const multiPageDialog: Dialog = new MultiPageDialog<KeyVerificationWizardPages>(KeyVerificationWizardPages.CHOOSE_METHOD)
		.buildDialog(
			(currentPage, dialog, navigateToPage, _) => {
				switch (currentPage) {
					case KeyVerificationWizardPages.CHOOSE_METHOD:
						return m(MethodSelectionPage, {
							goToEmailInputPage: () => {
								navigateToPage(KeyVerificationWizardPages.BY_TEXT_INPUT_METHOD)
							},
							goToQrScanPage: () => navigateToPage(KeyVerificationWizardPages.BY_QR_CODE_INPUT_METHOD),
						})
					case KeyVerificationWizardPages.BY_TEXT_INPUT_METHOD: // TODO: rename to EMAIL INPUT METHOD?
						return m(VerificationByTextPage, {
							model,
							goToSuccessPage: () => {
								reloadParent()
								navigateToPage(KeyVerificationWizardPages.SUCCESS)
							},
						})
					case KeyVerificationWizardPages.BY_QR_CODE_INPUT_METHOD:
						return m(VerificationByQrCodePage, {
							model,
							goToSuccessPage: () => {
								reloadParent()
								navigateToPage(KeyVerificationWizardPages.SUCCESS)
							},
						})
					case KeyVerificationWizardPages.SUCCESS: {
						reloadParent()
						return m(VerificationResultPage, {
							model,
							back: () => {
								navigateToPage(KeyVerificationWizardPages.BY_TEXT_INPUT_METHOD)
							},
						})
					}
				}
			},
			{
				getPageTitle: (currentPage) => {
					return { testId: "back_action", text: lang.get("keyManagement.keyVerification_label") }
				},
				getLeftAction: (currentPage, dialog, navigateToPage, goBack) => {
					switch (currentPage) {
						case KeyVerificationWizardPages.CHOOSE_METHOD:
							return {
								type: ButtonType.Secondary,
								click: () => dialog.close(),
								label: "back_action",
								title: "back_action",
							}
						case KeyVerificationWizardPages.BY_TEXT_INPUT_METHOD:
							return {
								type: ButtonType.Secondary,
								click: () => goBack(),
								label: "back_action",
								title: "back_action",
							}
						case KeyVerificationWizardPages.BY_QR_CODE_INPUT_METHOD:
							return {
								type: ButtonType.Secondary,
								click: () => goBack(),
								label: "back_action",
								title: "back_action",
							}
					}
				},
				getRightAction: (currentPage, dialog, navigateToPage, goBack) => {
					switch (currentPage) {
						case KeyVerificationWizardPages.SUCCESS:
							return {
								type: ButtonType.Secondary,
								click: () => dialog.close(),
								label: "close_alt",
								title: "close_alt",
							}
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
