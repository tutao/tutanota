import m from "mithril"
import { show as showNotificationOverlay } from "./base/NotificationOverlay"
import { lang, TranslationKey } from "../misc/LanguageViewModel"
import { assertMainOrNode } from "../api/common/Env"
import { SearchModel } from "../../mail-app/search/model/SearchModel.js"
import { SearchIndexStateInfo } from "../api/worker/search/SearchTypes.js"
import { CalendarSearchModel } from "../../calendar-app/calendar/search/model/CalendarSearchModel.js"

assertMainOrNode()

export interface InfoMessage {
	translationKey: TranslationKey
	args: Record<string, any>
}

export class InfoMessageHandler {
	constructor(private readonly handleIndexStateUpdate: (state: SearchIndexStateInfo) => void) {}

	async onInfoMessage(message: InfoMessage): Promise<void> {
		showNotificationOverlay(
			{
				view: () => m("", lang.get(message.translationKey, message.args)),
			},
			{
				label: "close_alt",
			},
			[],
		)
	}

	async onSearchIndexStateUpdate(state: SearchIndexStateInfo): Promise<void> {
		this.handleIndexStateUpdate(state)
	}
}
