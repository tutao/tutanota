import m, { Children, Component, Vnode } from "mithril"
import { client } from "../../misc/ClientDetector.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { isIOSApp } from "../../api/common/Env.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import { locator } from "../../api/main/CommonLocator.js"
import { completeEvaluationStage, TriggerType } from "../InAppRatingUtils.js"
import { DateTime } from "luxon"
import { ImageWithOptionsDialog } from "../../gui/dialogs/ImageWithOptionsDialog"

interface HowAreWeDoingPageAttrs {
	triggerType: TriggerType
	dialog: Dialog
	goToAndroidPlayStorePage: VoidFunction
}

export class HowAreWeDoingPage implements Component<HowAreWeDoingPageAttrs> {
	view({ attrs: { triggerType, dialog, goToAndroidPlayStorePage } }: Vnode<HowAreWeDoingPageAttrs>): Children {
		return m(
			"",
			{ style: { height: "666px" } },
			m(ImageWithOptionsDialog, {
				image: `${window.tutao.appState.prefixWithoutFile}/images/rating/your-opinion-${client.isCalendarApp() ? "calendar" : "mail"}.png`,
				titleText: "ratingHowAreWeDoing_title",
				messageText: "ratingExplanation_msg",
				mainActionText: "ratingLoveIt_label",
				mainActionClick: () => {
					completeEvaluationStage(triggerType, "LoveIt")
					if (isIOSApp()) {
						deviceConfig.setLastRatingPromptedDate(new Date())
						void locator.systemFacade.requestInAppRating()
						dialog.close()
					} else {
						goToAndroidPlayStorePage()
					}
				},
				subActionText: "ratingNeedsWork_label",
				subActionClick: () => {
					deviceConfig.setRetryRatingPromptAfter(DateTime.now().plus({ months: 3 }).toJSDate())
					completeEvaluationStage(triggerType, "NeedsWork")
					dialog.close()
				},
			}),
		)
	}
}
