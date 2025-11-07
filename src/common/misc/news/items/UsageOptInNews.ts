import { NewsListItem } from "../NewsListItem.js"
import m, { Children } from "mithril"
import { NewsId } from "../../../api/entities/tutanota/TypeRefs.js"
import { InfoLink, lang } from "../../LanguageViewModel.js"
import { Dialog } from "../../../gui/base/Dialog.js"
import { Button, ButtonAttrs, ButtonType } from "../../../gui/base/Button.js"
import { NewsModel } from "../NewsModel.js"
import { UsageTestModel } from "../../UsageTestModel.js"
import { MoreInfoLink } from "../MoreInfoLink.js"
import { Checkbox, CheckboxAttrs } from "../../../gui/base/Checkbox"
import { locator } from "../../../api/main/CommonLocator"

/**
 * News item that informs users about the usage data opt-in.
 */
export class UsageOptInNews implements NewsListItem {
	private isAgeConfirmed = false

	constructor(
		private readonly newsModel: NewsModel,
		private readonly usageTestModel: UsageTestModel,
	) {}

	isShown(): Promise<boolean> {
		return Promise.resolve(locator.usageTestModel.showOptInIndicator())
	}

	render(newsId: NewsId): Children {
		const closeAction = (optedIn?: boolean) => {
			this.newsModel
				.acknowledgeNews(newsId.newsItemId)
				.then(() => {
					if (optedIn) {
						Dialog.message("userUsageDataOptInThankYouOptedIn_msg")
					} else if (optedIn !== undefined) {
						Dialog.message("userUsageDataOptInThankYouOptedOut_msg")
					}
				})
				.then(m.redraw)
		}

		const checkboxAttrs: CheckboxAttrs = {
			checked: this.isAgeConfirmed,
			label: () => lang.getTranslationText("ageConfirmation_msg"),
			onChecked: (value: boolean) => (this.isAgeConfirmed = value),
		}

		const buttonAttrs: Array<ButtonAttrs> = [
			{
				label: "decideLater_action",
				click: () => closeAction(),
				type: ButtonType.Secondary,
			},
			{
				label: "deactivate_action",
				click: () => {
					const decision = false
					this.usageTestModel.setOptInDecision(decision).then(() => closeAction(decision))
				},
				type: ButtonType.Secondary,
			},
			{
				label: "activate_action",
				click: () => {
					const decision = true
					this.usageTestModel.setOptInDecision(decision).then(() => closeAction(decision))
				},
				isDisabled: !this.isAgeConfirmed,
				type: ButtonType.Primary,
			},
		]

		return m(".full-width", [
			m(".h4", lang.get("userUsageDataOptIn_title")),
			m(".pb", lang.get("userUsageDataOptInExplanation_msg")),
			m("ul.usage-test-opt-in-bullets", [
				m("li", lang.get("userUsageDataOptInStatement1_msg")),
				m("li", lang.get("userUsageDataOptInStatement2_msg")),
				m("li", lang.get("userUsageDataOptInStatement3_msg")),
				m("li", lang.get("userUsageDataOptInStatement4_msg")),
			]),
			m(MoreInfoLink, { link: InfoLink.Privacy }),
			m(".flex-end.flex-no-grow-no-shrink-auto.flex-wrap", m(Checkbox, checkboxAttrs)),
			m(
				".flex-end.flex-no-grow-no-shrink-auto.flex-wrap",
				buttonAttrs.map((a) => m(Button, a)),
			),
		])
	}
}
