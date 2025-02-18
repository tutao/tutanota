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

interface AndroidPlayStorePageAttrs {
	triggerType: TriggerType
	dialog: Dialog
}

export class AndroidPlayStorePage implements Component<AndroidPlayStorePageAttrs> {
	view({ attrs: { dialog, triggerType } }: Vnode<AndroidPlayStorePageAttrs>): Children {
		return m(".flex.flex-column.pb-ml.text-break", [
			m(
				"section",
				m(
					".flex-center.mt-m",
					m("img.pb.pt.block.height-100p", {
						src: `placeholder-404.png`,
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
				"section.flex.flex-column.mt",
				{ style: { gap: "1em" } },
				m(BaseButton, {
					label: "rateUs_action",
					text: lang.getTranslationText("rateUs_action"),
					onclick: () => {
						completeRatingStage(triggerType)
						dialog.close()
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
