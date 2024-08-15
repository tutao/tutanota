import { NewsListItem } from "../NewsListItem.js"
import { NewsId } from "../../../api/entities/tutanota/TypeRefs.js"
import m, { Children } from "mithril"
import { NewsModel } from "../NewsModel.js"
import { NativePushServiceApp } from "../../../native/main/NativePushServiceApp.js"
import { ExtendedNotificationMode } from "../../../native/common/generatedipc/ExtendedNotificationMode.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { Button, ButtonType } from "../../../gui/base/Button.js"
import { lang } from "../../LanguageViewModel.js"
import { NotificationContentSelector } from "../../../../mail-app/settings/NotificationContentSelector.js"
import { isApp } from "../../../api/common/Env.js"

export class RichNotificationsNews implements NewsListItem {
	private notificationMode: ExtendedNotificationMode | null = null

	constructor(private readonly newsModel: NewsModel, private readonly pushApp: NativePushServiceApp | null) {}

	async isShown(_newsId: NewsId): Promise<boolean> {
		return (
			isApp() &&
			this.pushApp != null &&
			(this.notificationMode = await this.pushApp.getExtendedNotificationMode()) != ExtendedNotificationMode.SenderAndSubject
		)
	}

	render(newsId: NewsId): Children {
		// if we got here then we must have it
		const pushApp = assertNotNull(this.pushApp)
		return m(".full-width", [
			m(".h4", { style: { "text-transform": "capitalize" } }, lang.get("richNotifications_title")),
			m("p", lang.get("richNotificationsNewsItem_msg")),
			m(
				".max-width-s",
				m(NotificationContentSelector, {
					extendedNotificationMode: this.notificationMode ?? ExtendedNotificationMode.NoSenderOrSubject,
					onChange: (mode) => {
						this.notificationMode = mode
						pushApp.setExtendedNotificationMode(mode)
					},
				}),
			),
			m(
				".flex-end",
				m(Button, {
					label: "close_alt",
					click: () => this.acknowledge(newsId),
					type: ButtonType.Secondary,
				}),
			),
		])
	}

	private async acknowledge(newsId: NewsId) {
		await this.newsModel.acknowledgeNews(newsId.newsItemId)
		m.redraw()
	}
}
