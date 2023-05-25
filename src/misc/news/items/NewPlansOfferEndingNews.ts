import { NewsListItem } from "../NewsListItem.js"
import m, { Children } from "mithril"
import { NewsId } from "../../../api/entities/tutanota/TypeRefs.js"
import { InfoLink, lang } from "../../LanguageViewModel.js"
import { Button, ButtonAttrs, ButtonType } from "../../../gui/base/Button.js"
import { NewsModel } from "../NewsModel.js"
import { UserController } from "../../../api/main/UserController.js"
import { showUpgradeWizardOrSwitchSubscriptionDialog } from "../../SubscriptionDialogs.js"

/**
 * News item that informs admin users that the new pricing offer is ending soon.
 */
export class NewPlansOfferEndingNews implements NewsListItem {
	constructor(private readonly newsModel: NewsModel, private readonly userController: UserController) {}

	async isShown(): Promise<boolean> {
		if (!this.userController.isGlobalAdmin()) {
			return false
		}

		// // Do not show this for customers that are already on a new plan
		return !(await this.userController.isNewPaidPlan())
	}

	render(newsId: NewsId): Children {
		const acknowledgeAction = () => {
			this.newsModel.acknowledgeNews(newsId.newsItemId).then(m.redraw)
		}

		const buttonAttrs: Array<ButtonAttrs> = [
			{
				label: "decideLater_action",
				click: () => acknowledgeAction(),
				type: ButtonType.Secondary,
			},
			{
				label: "showMoreUpgrade_action",
				click: async () => {
					await showUpgradeWizardOrSwitchSubscriptionDialog(this.userController)
					if (await this.userController.isNewPaidPlan()) {
						acknowledgeAction()
					}
				},
				type: ButtonType.Primary,
			},
		]

		return m(".full-width", [
			m(".h4", lang.get("newPlansOfferEndingNews_title")),
			m(
				".pb",
				lang.get("newPlansExplanationPast_msg", {
					"{plan1}": "Revolutionary",
					"{plan2}": "Legend",
				}),
			),
			m(".pb", lang.get("newPlansOfferEnding_msg")),
			m(
				".flex-end.flex-no-grow-no-shrink-auto.flex-wrap",
				buttonAttrs.map((a) => m(Button, a)),
			),
		])
	}
}
