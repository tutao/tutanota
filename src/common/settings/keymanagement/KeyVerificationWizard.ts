import { createWizardDialog, wizardPageWrapper } from "../../gui/base/WizardDialog"
import { DialogType } from "../../gui/base/Dialog"
import { MethodSelectionPage, MethodSelectionPageAttrs } from "./wizardpages/MethodSelectionPage"
import { KeyVerificationMethodType, KeyVerificationResultType } from "../../api/common/TutanotaConstants"
import { MethodExecutionPage, MethodExecutionPageAttrs } from "./wizardpages/MethodExecutionPage"
import { VerificationResultPage, VerificationResultPageAttrs } from "./wizardpages/VerificationResultPage"
import { KeyVerificationFacade } from "../../api/worker/facades/lazy/KeyVerificationFacade"

export type KeyVerificationWizardData = {
	keyVerificationFacade: KeyVerificationFacade
	method: KeyVerificationMethodType
	reloadParent: () => Promise<void>
	mailAddress: string
	fingerprint: string
	result: KeyVerificationResultType | null
}

export function showKeyVerificationWizard(keyVerificationFacade: KeyVerificationFacade, reloadParent: () => Promise<void>): Promise<void> {
	const wizardData: KeyVerificationWizardData = {
		keyVerificationFacade: keyVerificationFacade,
		method: KeyVerificationMethodType.text, // will be overwritten by the wizard
		reloadParent: reloadParent, // will be called after a key has been pinned
		mailAddress: "",
		fingerprint: "",
		result: null,
	}
	const wizardPages = [
		wizardPageWrapper(MethodSelectionPage, new MethodSelectionPageAttrs(wizardData)),
		wizardPageWrapper(MethodExecutionPage, new MethodExecutionPageAttrs(wizardData)),
		wizardPageWrapper(VerificationResultPage, new VerificationResultPageAttrs(wizardData)),
	]

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
