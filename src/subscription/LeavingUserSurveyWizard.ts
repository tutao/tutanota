import { createWizardDialog, wizardPageWrapper } from "../gui/base/WizardDialog.js"
import { LeavingUserSurveyCategoryPage, LeavingUserSurveyPageAttrs } from "./LeavingUserSurveyCategoryPage.js"
import { defer } from "@tutao/tutanota-utils"
import { LeavingUserSurveyReasonPage } from "./LeavingUserSurveyReasonPage.js"

export type LeavingUserSurveyData = {
	category: NumberString | null
	reason: NumberString | null
	details: string | null
}

export async function showLeavingUserSurveyWizard(): Promise<LeavingUserSurveyData> {
	let category: NumberString | null = null
	let reason: string | null = null
	let details: string | null = null

	const leavingUserSurveyData: LeavingUserSurveyData = {
		category,
		reason,
		details,
	}

	const wizardPages = [
		wizardPageWrapper(LeavingUserSurveyCategoryPage, new LeavingUserSurveyPageAttrs(leavingUserSurveyData)),
		wizardPageWrapper(LeavingUserSurveyReasonPage, new LeavingUserSurveyPageAttrs(leavingUserSurveyData)),
	]
	const deferred = defer<LeavingUserSurveyData>()

	const wizardBuilder = createWizardDialog(leavingUserSurveyData, wizardPages, async () => {
		deferred.resolve(leavingUserSurveyData)
	})

	wizardBuilder.dialog.show()
	return deferred.promise
}
