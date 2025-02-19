import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../../gui/base/Dialog.js"
import { client } from "../../misc/ClientDetector.js"
import { BaseButton } from "../../gui/base/buttons/BaseButton.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { TUTA_CALENDAR_GOOGLE_PLAY_URL, TUTA_MAIL_GOOGLE_PLAY_URL } from "../../api/common/TutanotaConstants.js"
import { px, size } from "../../gui/size.js"
import { theme } from "../../gui/theme.js"
import { completeRatingStage, TriggerType } from "../InAppRatingUtils.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import { DateTime } from "luxon"

interface AndroidPlayStorePageAttrs {
	triggerType: TriggerType
	dialog: Dialog
}

export class AndroidPlayStorePage implements Component<AndroidPlayStorePageAttrs> {
	view({ attrs: { dialog, triggerType } }: Vnode<AndroidPlayStorePageAttrs>): Children {
		return m(".flex.flex-column.pb-ml.height-100p.text-break", [
			m(
				"section",
				m(
					".flex-center.mt-m",
					m("img.pb.pt.block.height-100p", {
						src: `${window.tutao.appState.prefixWithoutFile}/images/rating/rate-us-${client.isCalendarApp() ? "calendar" : "mail"}.png`,
						alt: "",
						rel: "noreferrer",
						loading: "lazy",
						decoding: "async",
						style: {
							width: "80%",
						},
					}),
				),
				m("h1.text-center", lang.getTranslationText("ratingGooglePlay_title")),
				m("p.text-center", lang.getTranslationText("ratingGooglePlay_msg")),
			),
			m(
				"section.flex.flex-column",
				{ style: { gap: "1em", "margin-top": "auto" } },
				m(BaseButton, {
					label: "rateUs_action",
					text: lang.getTranslationText("rateUs_action"),
					onclick: () => {
						dialog.close()
						deviceConfig.setLastRatingPromptedDate(new Date())
						completeRatingStage(triggerType)
						windowFacade.openLink(client.isCalendarApp() ? TUTA_CALENDAR_GOOGLE_PLAY_URL : TUTA_MAIL_GOOGLE_PLAY_URL)
					},
					class: "full-width border-radius-small center b flash accent-bg button-content",
					style: {
						height: px(size.button_height + size.vpad_xs * 1.5),
					},
				}),

				m(BaseButton, {
					label: "maybeLater_action",
					text: lang.getTranslationText("maybeLater_action"),
					onclick: () => {
						deviceConfig.setRetryRatingPromptAfter(DateTime.now().plus({ months: 1 }).toJSDate())
						dialog.close()
					},
					class: "full-width border-radius-small center b flash",
					style: {
						border: `2px solid ${theme.content_accent}`,
						height: px(size.button_height + size.vpad_xs * 1.5),
						color: theme.content_accent,
					},
				}),
			),
		])
	}
}
