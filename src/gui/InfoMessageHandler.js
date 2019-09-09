//@flow
import m from "mithril"
import {worker} from "../api/main/WorkerClient"
import {show as showNotificationOverlay} from "./base/NotificationOverlay"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"

assertMainOrNode()

worker.infoMessages.map((message) => {
	showNotificationOverlay(
		{
			view: () => m("", lang.get(message.translationKey, message.args))
		},
		{label: "close_alt"},
		[])
})
