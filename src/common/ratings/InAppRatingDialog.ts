import m from "mithril"
import { deviceConfig } from "../misc/DeviceConfig.js"
import { createEvent, getRatingAllowed, isEventHappyMoment, RatingCheckResult } from "./InAppRatingUtils.js"
import { isApp } from "../api/common/Env.js"
import { Keys } from "../api/common/TutanotaConstants.js"
import { DateTime } from "luxon"
import { MultiPageDialog } from "../gui/dialogs/MultiPageDialog.js"
import { HowAreWeDoingPage } from "./pages/HowAreWeDoingPage.js"
import { ButtonType } from "../gui/base/Button.js"
import { Dialog } from "../gui/base/Dialog.js"
import { AndroidPlayStorePage } from "./pages/AndroidPlayStorePage.js"

export enum RatingPages {
	HOW_ARE_WE_DOING,
	ANDROID_PLAY_STORE,
}

function handleNotNowClick(dialog: Dialog) {
	dialog.close()
	deviceConfig.setRetryRatingPromptAfter(DateTime.now().plus({ months: 1 }).toJSDate())
}

export function showAppRatingDialog(): void {
	const dialog = new MultiPageDialog<RatingPages>(RatingPages.HOW_ARE_WE_DOING).buildDialog(
		(currentPage, dialog, navigateToPage, goBack) => {
			switch (currentPage) {
				case RatingPages.HOW_ARE_WE_DOING:
					return m(HowAreWeDoingPage, { dialog, goToAndroidPlayStorePage: () => navigateToPage(RatingPages.ANDROID_PLAY_STORE) })
				case RatingPages.ANDROID_PLAY_STORE:
					return m(AndroidPlayStorePage, { dialog })
			}
		},
		{
			getPageTitle: (_) => {
				return "emptyString_msg"
			},
			getRightAction: (_, dialog) => {
				return {
					label: "notNow_label",
					click: () => handleNotNowClick(dialog),
					title: "notNow_label",
					type: ButtonType.Secondary,
				}
			},
		},
	)

	dialog.addShortcut({
		help: "close_alt",
		key: Keys.ESC,
		exec: () => handleNotNowClick(dialog),
	})

	dialog.show()
}

/**
 * If the client is on iOS, we save the current date as an event to determine if we want to trigger a "rate Tuta" dialog.
 */
export async function handleRatingByEvent() {
	if (isApp()) {
		createEvent(deviceConfig)
	}

	const now = new Date()

	if ((await getRatingAllowed(now, deviceConfig, isApp())) === RatingCheckResult.RATING_ALLOWED) {
		if (isEventHappyMoment(now, deviceConfig)) {
			showAppRatingDialog()
		}
	}
}
