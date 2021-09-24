//@flow
import m from "mithril"
import {show as showNotificationOverlay} from "./base/NotificationOverlay"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/common/Env"
import {locator} from "../api/main/MainLocator"

assertMainOrNode()

export function registerInfoMessageHandler() {
	locator.initializedWorker.then((worker) => {
		worker.infoMessages.map((message) => {
			showNotificationOverlay(
				{
					view: () => m("", lang.get(message.translationKey, message.args))
				},
				{label: "close_alt"},
				[])
		})
	})
}

