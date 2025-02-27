import { deviceConfig } from "../misc/DeviceConfig.js"
import {
	completeEvaluationStage,
	completeTriggerStage,
	createEvent,
	getRatingAllowed,
	isEventHappyMoment,
	RatingCheckResult,
	TriggerType,
} from "./InAppRatingUtils.js"
import { isApp } from "../api/common/Env.js"
import { MultiPageDialog } from "../gui/dialogs/MultiPageDialog.js"
import { HowAreWeDoingPage } from "./pages/HowAreWeDoingPage.js"
import m from "mithril"
import { DateTime } from "luxon"
import { ButtonType } from "../gui/base/Button.js"
import { AndroidPlayStorePage } from "./pages/AndroidPlayStorePage.js"

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
 * If the client is on iOS, we save the current date as an event to determine if we want to trigger a "rate Tuta" dialog.
 */
export async function handleRatingByEvent(triggerType: TriggerType) {
	if (isApp()) {
		createEvent(deviceConfig)
	}

	const now = new Date()

	if ((await getRatingAllowed(now, deviceConfig, isApp())) === RatingCheckResult.RATING_ALLOWED) {
		if (isEventHappyMoment(now, deviceConfig)) {
			showAppRatingDialog(triggerType)
		}
	}
}
