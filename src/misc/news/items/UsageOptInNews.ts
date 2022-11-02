import {NewsListItem} from "../NewsListItem.js"
import m, {Children} from "mithril"
import {NewsId} from "../../../api/entities/tutanota/TypeRefs.js"
import {locator} from "../../../api/main/MainLocator.js"
import {InfoLink, lang} from "../../LanguageViewModel.js"
import {logins} from "../../../api/main/LoginController.js"
import {Dialog} from "../../../gui/base/Dialog.js"
import {Button, ButtonAttrs, ButtonType} from "../../../gui/base/Button.js"

export default class UsageOptInNews extends NewsListItem {
	isShown(): boolean {
		return locator.usageTestModel.showOptInIndicator()
	}

	render(newsId: NewsId): Children {
		const lnk = InfoLink.Privacy
		const userSettingsGroupRoot = logins.getUserController().userSettingsGroupRoot

		const closeAction = (optedIn?: boolean) => {
			this.acknowledge(newsId).then(() => {
				if (optedIn) {
					Dialog.message("userUsageDataOptInThankYouOptedIn_msg")
				} else if (optedIn !== undefined) {
					Dialog.message("userUsageDataOptInThankYouOptedOut_msg")
				}
			})
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
					userSettingsGroupRoot.usageDataOptedIn = false
					locator.entityClient.update(userSettingsGroupRoot)

					closeAction(false)
				},
				type: ButtonType.Secondary,
			},
			{
				label: "activate_action",
				click: () => {
					userSettingsGroupRoot.usageDataOptedIn = true
					locator.entityClient.update(userSettingsGroupRoot)

					closeAction(true)
				},
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
				m("p", lang.get("moreInfo_msg") + " ", m("small.text-break", [m(`a[href=${lnk}][target=_blank]`, lnk)])),
			]),
			m(
				".flex-end.flex-no-grow-no-shrink-auto",
				buttonAttrs.map(a => m(Button, a)),
			),
		])

	}

}