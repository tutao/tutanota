import m from "mithril"
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
import { ButtonType } from "../gui/base/Button.js"
import { AndroidPlayStorePage } from "./pages/AndroidPlayStorePage.js"
import { DateTime } from "luxon"

export enum RatingPages {
	HOW_ARE_WE_DOING,
	ANDROID_PLAY_STORE,
}

export function showAppRatingDialog(triggerType: TriggerType): void {
	completeTriggerStage(triggerType)

	let currentPage: RatingPages = RatingPages.HOW_ARE_WE_DOING

	const dialog = new MultiPageDialog<RatingPages>(currentPage).buildDialog(
		(page, dialog, navigateToPage) => {
			currentPage = page
			switch (page) {
				case RatingPages.HOW_ARE_WE_DOING:
					return m(HowAreWeDoingPage, { triggerType, dialog, goToAndroidPlayStorePage: () => navigateToPage(RatingPages.ANDROID_PLAY_STORE) })
				case RatingPages.ANDROID_PLAY_STORE:
					return m(AndroidPlayStorePage, { triggerType, dialog })
			}
		},
		{
			getPageTitle: (_) => {
				return "emptyString_msg"
			},
			getRightAction: (currentPage, dialog) => {
				if (currentPage == RatingPages.HOW_ARE_WE_DOING) {
					return {
						label: "notNow_label",
						click: () => {
							dialog.close()
							deviceConfig.setRetryRatingPromptAfter(DateTime.now().plus({ months: 1 }).toJSDate())
							completeEvaluationStage(triggerType, "NotNow")
						},
						title: "notNow_label",
						type: ButtonType.Secondary,
					}
				}
			},
		},
	)

	dialog.setCloseHandler(() => {
		dialog.close()
		switch (currentPage) {
			case RatingPages.HOW_ARE_WE_DOING: {
				deviceConfig.setRetryRatingPromptAfter(DateTime.now().plus({ months: 1 }).toJSDate())
				completeEvaluationStage(triggerType, "NotNow")
				return
			}
			case RatingPages.ANDROID_PLAY_STORE: {
				deviceConfig.setRetryRatingPromptAfter(DateTime.now().plus({ months: 1 }).toJSDate())
				return
			}
		}
	})

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
