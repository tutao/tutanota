import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../../../../ui/base/Dialog.js"
import { ClientDetector } from "../../../../platform-kit/app-env/boot/ClientDetector.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { EnvProvider, TUTA_CALENDAR_GOOGLE_PLAY_URL, TUTA_MAIL_GOOGLE_PLAY_URL } from "@tutao/app-env"
import { completeRatingStage, TriggerType } from "../UserSatisfactionUtils.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import { ImageWithOptionsDialog } from "../../../../ui/dialogs/ImageWithOptionsDialog"
import { px } from "../../../../ui/size.js"

interface RateUsPageAttrs {
	triggerType: TriggerType
	dialog: Dialog
}

export class RateUsPage implements Component<RateUsPageAttrs> {
	private isAndroid = EnvProvider.get().isAndroidApp()
	view({ attrs: { dialog, triggerType } }: Vnode<RateUsPageAttrs>): Children {
		return m(ImageWithOptionsDialog, {
			image: `/images/dynamic-color-svg/rate-us.svg`,
			imageStyle: { maxWidth: px(320) },
			titleText: "ratingGooglePlay_title",
			messageText: this.isAndroid ? "ratingGooglePlay_msg" : "ratingTrustpilot_msg",
			mainActionText: "rateUs_action",
			mainActionClick: () => {
				this.handleRateUsClick(dialog, triggerType)
			},
			subActionText: "maybeLater_action",
			subActionClick: () => {
				dialog.close()
				completeRatingStage(triggerType, "MaybeLater")
			},
		})
	}
	private handleRateUsClick = (dialog: Dialog, triggerType: TriggerType) => {
		dialog.close()
		deviceConfig.setLastRatingPromptedDate(new Date())
		completeRatingStage(triggerType, "RateUs")
		if (this.isAndroid) {
			windowFacade.openLink(ClientDetector.get().isCalendarApp() ? TUTA_CALENDAR_GOOGLE_PLAY_URL : TUTA_MAIL_GOOGLE_PLAY_URL)
		} else {
			windowFacade.openLink("https://www.trustpilot.com/evaluate/tuta.com")
		}
	}
}
