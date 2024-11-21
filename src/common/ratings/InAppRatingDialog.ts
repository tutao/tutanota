import { Dialog, DialogType } from "../gui/base/Dialog.js"
import m from "mithril"
import { deviceConfig } from "../misc/DeviceConfig.js"
import { createEvent, getRatingAllowed, isEventHappyMoment, RatingCheckResult } from "./InAppRatingUtils.js"
import { isIOSApp } from "../api/common/Env.js"
import { locator } from "../api/main/CommonLocator.js"
import { Button, ButtonType } from "../gui/base/Button.js"
import { DefaultAnimationTime } from "../gui/animation/Animations.js"
import { neverNull, resolveMaybeLazy } from "@tutao/tutanota-utils"
import { Keys } from "../api/common/TutanotaConstants.js"
import { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar.js"
import { BaseButton, BaseButtonAttrs } from "../gui/base/buttons/BaseButton.js"
import { theme } from "../gui/theme.js"
import { px, size } from "../gui/size.js"
import { client } from "../misc/ClientDetector.js"
import { lang } from "../misc/LanguageViewModel.js"
import { DateTime } from "luxon"

const enum AppRatingValue {
	Happy = "happy",
	Unhappy = "unhappy",
	NotNow = "notNow",
}

/**
 * Displays the application rating dialog to the user and handles their selection.
 *
 * The dialog provides options for users to rate their experience as positive or negative,
 * or to dismiss the dialog with actions such as "Not now"." Based on
 * the user's choice, appropriate follow-up actions are taken:
 *
 * - **Happy**: Prompts the user to leave a review on the App Store. Will not ask for a review again within one year.
 * - **Unhappy**: No immediate action; the user is not redirected. Will not ask for a review again within one year.
 * - **Not now**: Prevents the dialog from being shown for one month.
 *
 * @returns {Promise<void>} Resolves after the user makes a selection and associated actions are completed.
 */
export async function showAppRatingDialog(): Promise<void> {
	const selectedValue: AppRatingValue = await new Promise((resolve) => {
		const choose = (choice: AppRatingValue) => {
			dialog.close()
			setTimeout(() => resolve(choice), DefaultAnimationTime)
		}

		const headerBarProps: DialogHeaderBarAttrs = {
			right: [
				{
					label: "notNow_label",
					click: () => choose(AppRatingValue.NotNow),
					type: ButtonType.Secondary,
				},
			],
		}

		const columnClass = ".flex-half.overflow-hidden"

		const dialog = new Dialog(DialogType.EditSmall, {
			view: () =>
				m("", [
					m(".dialog-header.plr-l.flex-space-between.dialog-header-line-height", [
						m(columnClass + ".ml-negative-s"),
						m(
							columnClass + ".mr-negative-s.flex.justify-end",
							resolveMaybeLazy(neverNull(headerBarProps.right)).map((a) => m(Button, a)),
						),
					]),
					m(
						".plr-l.pb-ml.text-break",
						m(".flex.flex-column", [
							m(
								"#dialog-message.dialog-max-height.text-break.text-prewrap.selectable.scroll",
								m(
									"",
									m(
										".flex-center.mt-m",
										m("img.pb.pt.block.height-100p", {
											src: `${window.tutao.appState.prefixWithoutFile}/images/rating/${client.isCalendarApp() ? "calendar" : "mail"}.png`,
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
							),
							m(
								".flex.flex-column.mt",
								{ style: { gap: "1em" } },
								m(BaseButton, {
									label: lang.get("ratingLoveIt_label"),
									text: lang.get("ratingLoveIt_label"),
									onclick: () => choose(AppRatingValue.Happy),
									class: `full-width border-radius-small center b flash accent-bg button-content`,
									style: {
										height: px(size.button_height + size.vpad_xs * 1.5),
									},
								} satisfies BaseButtonAttrs),

								m(BaseButton, {
									label: lang.get("ratingNeedsWork_label"),
									text: lang.get("ratingNeedsWork_label"),
									onclick: () => choose(AppRatingValue.Unhappy),
									class: `full-width border-radius-small center b flash`,
									style: {
										border: `2px solid ${theme.content_accent}`,
										height: px(size.button_height + size.vpad_xs * 1.5),
										color: theme.content_accent,
									},
								} satisfies BaseButtonAttrs),
							),
						]),
					),
				]),
		}).addShortcut({
			help: "close_alt",
			key: Keys.ESC,
			exec: () => choose(AppRatingValue.NotNow),
		})

		dialog.show()
	})

	handleRatingDialogSelection(selectedValue)
}

function handleRatingDialogSelection(selectedValue: AppRatingValue) {
	switch (selectedValue) {
		case AppRatingValue.Unhappy:
			deviceConfig.setLastRatingPromptedDate(new Date())
			break
		case AppRatingValue.NotNow:
			// Ask again in minimum one month from now.
			deviceConfig.setRetryRatingPromptAfter(DateTime.now().plus({ months: 1 }).toJSDate())
			break
		case AppRatingValue.Happy: {
			deviceConfig.setLastRatingPromptedDate(new Date())

			void locator.systemFacade.requestInAppRating()
			break
		}
	}
}

/**
 * If the client is on iOS, we save the current date as an event to determine if we want to trigger a "rate Tuta" dialog.
 */
export async function handleRatingByEvent() {
	const isTheIOSApp = isIOSApp()

	if (isTheIOSApp) {
		createEvent(deviceConfig)
	}

	const now = new Date()

	if ((await getRatingAllowed(now, deviceConfig, isTheIOSApp)) === RatingCheckResult.RATING_ALLOWED) {
		if (isEventHappyMoment(now, deviceConfig)) {
			void showAppRatingDialog()
		}
	}
}
