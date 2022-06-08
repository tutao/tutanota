import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {ButtonType} from "../../gui/base/ButtonN"
import {assertMainOrNode} from "../../api/common/Env"
import type {NativeInterface} from "../common/NativeInterface"
import {show} from "../../gui/base/NotificationOverlay"

assertMainOrNode()

export async function registerForUpdates(nativeInterface: NativeInterface) {
	const updateInfo = await nativeInterface.invokeNative("isUpdateAvailable", [])

	if (updateInfo) {
		let message = {
			view: () =>
				m(
					"",
					lang.get("updateAvailable_label", {
						"{version}": updateInfo.version,
					}),
				),
		}
		show(
			message,
			{
				label: "postpone_action",
			},
			[
				{
					label: "installNow_action",
					click: () => nativeInterface.invokeNative("manualUpdate", []),
					type: ButtonType.Primary,
				},
			],
		)
	}
}