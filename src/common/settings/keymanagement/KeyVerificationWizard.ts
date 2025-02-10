import { createWizardDialog, wizardPageWrapper } from "../../gui/base/WizardDialog"
import { DialogType } from "../../gui/base/Dialog"
import { MethodSelectionPage, MethodSelectionPageAttrs } from "./wizardpages/MethodSelectionPage"
import { KeyVerificationMethodType, KeyVerificationResultType } from "../../api/common/TutanotaConstants"
import { MethodExecutionPage, MethodExecutionPageAttrs } from "./wizardpages/MethodExecutionPage"
import { VerificationResultPage, VerificationResultPageAttrs } from "./wizardpages/VerificationResultPage"
import { KeyVerificationFacade, PublicKeyFingerprint } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade"
import { UsageTest, UsageTestController } from "@tutao/tutanota-usagetests"
import { completeStageNow } from "./wizardpages/KeyVerificationWizardUtils"

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

export async function showKeyVerificationWizard(
	keyVerificationFacade: KeyVerificationFacade,
	mobileSystemFacade: MobileSystemFacade,
	usageTestController: UsageTestController,
	reloadParent: () => Promise<void>,
): Promise<void> {
	const usageTest = usageTestController.getTest("crypto.keyVerification")
	const stage = usageTest.getStage(0)
	await completeStageNow(stage)

	const wizardData: KeyVerificationWizardData = {
		keyVerificationFacade: keyVerificationFacade,
		mobileSystemFacade: mobileSystemFacade,
		method: KeyVerificationMethodType.text, // will be overwritten by the wizard
		reloadParent: reloadParent, // will be called after a key has been pinned
		mailAddress: "",
		publicKeyFingerprint: null,
		result: null,
		usageTest: usageTest,
	}
	const wizardPages = [
		wizardPageWrapper(MethodSelectionPage, new MethodSelectionPageAttrs(wizardData)),
		wizardPageWrapper(MethodExecutionPage, new MethodExecutionPageAttrs(wizardData)),
		wizardPageWrapper(VerificationResultPage, new VerificationResultPageAttrs(wizardData)),
	]

	console.log("USAGE TEST:", usageTest)

	return new Promise((resolve) => {
		const wizardBuilder = createWizardDialog(
			wizardData,
			wizardPages,
			() => {
				return Promise.resolve()
			},
			DialogType.EditSmall,
		)

		const wizard = wizardBuilder.dialog
		wizard.show()
	})
}
