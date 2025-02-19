import m, { Children, Component, Vnode } from "mithril"
import { client } from "../../misc/ClientDetector.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { BaseButton } from "../../gui/base/buttons/BaseButton.js"
import { px, size } from "../../gui/size.js"
import { theme } from "../../gui/theme.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { isIOSApp } from "../../api/common/Env.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import { locator } from "../../api/main/CommonLocator.js"
import { completeEvaluationStage, TriggerType } from "../InAppRatingUtils.js"
import { DateTime } from "luxon"

interface HowAreWeDoingPageAttrs {
	triggerType: TriggerType
	dialog: Dialog
	goToAndroidPlayStorePage: VoidFunction
}

export class HowAreWeDoingPage implements Component<HowAreWeDoingPageAttrs> {
	view({ attrs: { triggerType, dialog, goToAndroidPlayStorePage } }: Vnode<HowAreWeDoingPageAttrs>): Children {
		return m(
			".flex.flex-column.pb-ml.text-break",
			{
				style: {
					height: "666px",
				},
			},
			[
				m(
					"section",
					m(
						".flex-center.mt-m",
						m("img.pb.pt.block.height-100p", {
							src: `${window.tutao.appState.prefixWithoutFile}/images/rating/your-opinion-${client.isCalendarApp() ? "calendar" : "mail"}.png`,
							alt: "",
							rel: "noreferrer",
							loading: "lazy",
							decoding: "async",
							style: {
								width: "80%",
							},
						}),
					),
					m("h1.text-center", lang.get("ratingHowAreWeDoing_title")),
					m("p.text-center", lang.get("ratingExplanation_msg")),
				),
				m(
					"section.flex.flex-column",
					{ style: { gap: "1em", "margin-top": "auto" } },
					m(BaseButton, {
						label: "ratingLoveIt_label",
						text: lang.get("ratingLoveIt_label"),
						onclick: () => {
							completeEvaluationStage(triggerType, "LoveIt")
							if (isIOSApp()) {
								deviceConfig.setLastRatingPromptedDate(new Date())
								void locator.systemFacade.requestInAppRating()
								dialog.close()
							} else {
								goToAndroidPlayStorePage()
							}
						},
						class: `full-width border-radius-small center b flash accent-bg button-content`,
						style: {
							height: px(size.button_height + size.vpad_xs * 1.5),
						},
					}),

					m(BaseButton, {
						label: "ratingNeedsWork_label",
						text: lang.get("ratingNeedsWork_label"),
						onclick: () => {
							deviceConfig.setRetryRatingPromptAfter(DateTime.now().plus({ months: 3 }).toJSDate())
							completeEvaluationStage(triggerType, "NeedsWork")
							dialog.close()
						},
						class: `full-width border-radius-small center b flash`,
						style: {
							border: `2px solid ${theme.content_accent}`,
							height: px(size.button_height + size.vpad_xs * 1.5),
							color: theme.content_accent,
						},
					}),
				),
			],
		)
	}
}
