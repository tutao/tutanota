import { deviceConfig } from "../misc/DeviceConfig.js"
import { completeEvaluationStage, completeTriggerStage, createEvent, evaluateRatingEligibility, isEventHappyMoment, TriggerType } from "./InAppRatingUtils.js"
import { isApp } from "../api/common/Env.js"
import { MultiPageDialog } from "../gui/dialogs/MultiPageDialog.js"
import { HowAreWeDoingPage } from "./pages/HowAreWeDoingPage.js"
import m from "mithril"
import { DateTime } from "luxon"
import { ButtonType } from "../gui/base/Button.js"
import { AndroidPlayStorePage } from "./pages/AndroidPlayStorePage.js"
import { isEmpty } from "@tutao/tutanota-utils"
import { Const } from "../api/common/TutanotaConstants.js"

export function showAppRatingDialog(triggerType: TriggerType): void {
	completeTriggerStage(triggerType)

	const dialog = new MultiPageDialog<"howAreWeDoing" | "androidPlayStore">("howAreWeDoing", (dialog, navigateToPage, _) => ({
		howAreWeDoing: {
			content: m(HowAreWeDoingPage, {
				triggerType,
				dialog,
				goToAndroidPlayStorePage: () => navigateToPage("androidPlayStore"),
			}),
			rightAction: {
				label: "notNow_label",
				click: () => {
					dialog.close()
					deviceConfig.setRetryRatingPromptAfter(DateTime.now().plus({ months: 1 }).toJSDate())
					completeEvaluationStage(triggerType, "NotNow")
				},
				title: "notNow_label",
				type: ButtonType.Secondary,
			},
			onClose: () => {
				dialog.close()
				deviceConfig.setRetryRatingPromptAfter(DateTime.now().plus({ months: 1 }).toJSDate())
				completeEvaluationStage(triggerType, "NotNow")
			},
		},
		androidPlayStore: {
			content: m(AndroidPlayStorePage, { triggerType, dialog }),
			onClose: () => {
				dialog.close()
				deviceConfig.setRetryRatingPromptAfter(DateTime.now().plus({ months: 1 }).toJSDate())
			},
		},
	})).getDialog()

	dialog.show()
}

/**
 * If the client is on any app (Tuta Mail or Tuta Calendar), we save the current date as an event to determine if we want to trigger a "rate Tuta" dialog.
 */
export async function handleRatingByEvent(triggerType: TriggerType) {
	if (isApp()) {
		createEvent(deviceConfig)
	}

	// Allow stubbing the current date via `Const` for testing purposes.
	const currentDate = Const.CURRENT_DATE ?? new Date()

	const disallowReasons = await evaluateRatingEligibility(currentDate, deviceConfig, isApp())

	if (!isEmpty(disallowReasons)) {
		return
	}

	if (isEventHappyMoment(currentDate, deviceConfig)) {
		showAppRatingDialog(triggerType)
	}
}
