import { NewsListItem } from "../NewsListItem.js"
import m, { Children } from "mithril"
import { NewsId } from "../../../api/entities/tutanota/TypeRefs.js"
import { lang } from "../../LanguageViewModel.js"
import { Button, ButtonType } from "../../../gui/base/Button.js"
import { NewsModel } from "../NewsModel.js"
import { UserController } from "../../../api/main/UserController.js"
import { Dialog } from "../../../gui/base/Dialog.js"

/**
 * This news item informs admin users that color customization may need updating.
 */
export class UpdateColorCustomizationNews implements NewsListItem {
	constructor(
		private readonly newsModel: NewsModel,
		private readonly userController: UserController,
	) {}

	async isShown(): Promise<boolean> {
		return this.userController.isGlobalAdmin() && this.userController.isWhitelabelAccount()
	}

	render(newsId: NewsId, dialog: Dialog): Children {
		const acknowledge = () => {
			this.newsModel.acknowledgeNews(newsId.newsItemId).then(m.redraw)
		}

		return m(".full-width", [
			m(".h4.pb-16", lang.get("updateColorCustomizationNews_title")),
			m(".pb-16", lang.get("updateColorCustomizationNews_msg")),
			m(
				".flex-end.gap-12.flex-no-grow-no-shrink-auto.flex-wrap",
				m(Button, {
					label: "updateColorCustomizationNewsButton_label",
					click: async () => {
						m.route.set("/settings/whitelabel")
						acknowledge()
						dialog.close()
					},
					type: ButtonType.Primary,
				}),
				m(Button, {
					label: "close_alt",
					click: acknowledge,
					type: ButtonType.Secondary,
				}),
			),
		])
	}
}
