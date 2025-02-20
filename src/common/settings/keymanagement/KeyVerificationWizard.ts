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
	// CATEGORIES,
	// CATEGORY_DETAIL,
	// TOPIC_DETAIL,
	// CONTACT_SUPPORT,
	// SUPPORT_REQUEST_SENT,
	// EMAIL_SUPPORT_BEHIND_PAYWALL,
	// SOLUTION_WAS_HELPFUL,
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
	//
	const data: KeyVerificationWizardData = {
		keyVerificationFacade: keyVerificationFacade,
		mobileSystemFacade: mobileSystemFacade,
		method: KeyVerificationMethodType.text, // will be overwritten by the wizard
		reloadParent: reloadParent, // will be called after a key has been pinned
		mailAddress: "",
		publicKeyFingerprint: null,
		result: null,
		usageTest: usageTest,
	}
	// const wizardPages = [
	// 	wizardPageWrapper(MethodSelectionPage, new MethodSelectionPageAttrs(wizardData)),
	// 	wizardPageWrapper(MethodExecutionPage, new MethodExecutionPageAttrs(wizardData)),
	// 	wizardPageWrapper(VerificationResultPage, new VerificationResultPageAttrs(wizardData)),
	// ]
	//
	// console.log("USAGE TEST:", usageTest)
	//
	// return new Promise((resolve) => {
	// 	const wizardBuilder = createWizardDialog(
	// 		wizardData,
	// 		wizardPages,
	// 		() => {
	// 			return Promise.resolve()
	// 		},
	// 		DialogType.EditSmall,
	// 	)
	//
	// 	const wizard = wizardBuilder.dialog
	// 	wizard.show()
	// })

	const multiPageDialog: Dialog = new MultiPageDialog<KeyVerificationWizardPages>(KeyVerificationWizardPages.CHOOSE_METHOD)
		.buildDialog(
			(currentPage, dialog, navigateToPage, _) => {
				switch (currentPage) {
					case KeyVerificationWizardPages.CHOOSE_METHOD:
						return m(MethodSelectionPage, {
							goToEmailInputPage: () => {
								navigateToPage(KeyVerificationWizardPages.BY_TEXT_INPUT_METHOD)
							},
							goToQrScanPage: () => alert("go to qr scan page"),
						})
					case KeyVerificationWizardPages.BY_TEXT_INPUT_METHOD: // TODO: rename to EMAIL INPUT METHOD?
						return m(VerificationByTextPage, {
							keyVerificationFacade,
						})
				}
			},
			{
				getPageTitle: (currentPage) => {
					switch (currentPage) {
						case KeyVerificationWizardPages.CHOOSE_METHOD: {
							return { testId: "back_action", text: lang.get("keyManagement.selectMethodShort_label") }
						}
						case KeyVerificationWizardPages.BY_TEXT_INPUT_METHOD: {
							return { testId: "back_action", text: lang.get("keyManagement.keyVerification_label") }
						}
						default: {
							return {
								text: lang.get("keyManagement.keyVerification_label"),
								testId: "back_action",
							}
						}
					}
				},
				getLeftAction: (currentPage, dialog, navigateToPage, goBack) => {
					switch (currentPage) {
						case KeyVerificationWizardPages.CHOOSE_METHOD:
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
