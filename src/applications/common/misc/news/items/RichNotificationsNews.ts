import { NewsListItem } from "../NewsListItem.js"
import m, { Children } from "mithril"
import { NewsModel } from "../NewsModel.js"
import { NativePushServiceApp } from "../../../native/NativePushServiceApp.js"
import { ExtendedNotificationMode } from "@tutao/native-bridge/generatedIpc/types"
import { assertNotNull } from "@tutao/utils"
import { Button, ButtonType } from "../../../../../ui/base/Button.js"
import { lang } from "../../../../../ui/utils/LanguageViewModel.js"
import { NotificationContentSelector } from "../../../../mail-app/settings/NotificationContentSelector.js"
import { isApp } from "@tutao/app-env"
import { NewsId } from "@tutao/entities/tutanota"
import { SystemPermissionHandler } from "../../../native/SystemPermissionHandler"

export class RichNotificationsNews implements NewsListItem {
	private notificationMode: ExtendedNotificationMode | null = null

	constructor(
		private readonly newsModel: NewsModel,
		private readonly pushApp: NativePushServiceApp | null,
		private readonly systemPermissionHandler: SystemPermissionHandler,
	) {}

	async isShown(_newsId: NewsId): Promise<boolean> {
		return (
			isApp() &&
			this.pushApp != null &&
			(this.notificationMode = await this.pushApp.getExtendedNotificationMode()) !== ExtendedNotificationMode.SenderAndSubject
		)
	}

	render(newsId: NewsId): Children {
		// if we got here then we must have it
		const pushApp = assertNotNull(this.pushApp)
		const systemPermissionHandler = assertNotNull(this.systemPermissionHandler)
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
					pushService: pushApp,
					systemPermissionHandler: systemPermissionHandler,
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
