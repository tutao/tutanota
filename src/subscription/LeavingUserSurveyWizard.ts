import { createWizardDialog, wizardPageWrapper } from "../gui/base/WizardDialog.js"
import { LeavingUserSurveyCategoryPage, LeavingUserSurveyPageAttrs } from "./LeavingUserSurveyCategoryPage.js"
import { defer } from "@tutao/tutanota-utils"
import { LeavingUserSurveyReasonPage } from "./LeavingUserSurveyReasonPage.js"

export type LeavingUserSurveyData = {
	category: NumberString | null
	reason: NumberString | null
	details: string | null
	submitted: boolean // we need a separate submit flag, because the user might go back from page 2 and cancel the dialog, in which case the values will be set
}

export async function showLeavingUserSurveyWizard(): Promise<LeavingUserSurveyData> {
	let category: NumberString | null = null
	let reason: string | null = null
	let details: string | null = null
	let submitted: boolean = false

	const leavingUserSurveyData: LeavingUserSurveyData = {
		category,
		reason,
		details,
		submitted,
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
