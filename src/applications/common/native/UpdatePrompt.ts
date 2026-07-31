import m from "mithril"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { ButtonType } from "../../../ui/base/Button.js"
import { EnvProvider } from "@tutao/app-env"
import { show } from "../../../ui/base/NotificationOverlay"
import { SettingsFacade } from "@tutao/native-bridge/generatedIpc/types"

EnvProvider.assertMainOrNode()

export async function registerForUpdates(desktopSettingsFacade: SettingsFacade) {
	const updateInfo = await desktopSettingsFacade.getUpdateInfo()

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
					click: () => desktopSettingsFacade.manualUpdate(),
					type: ButtonType.Primary,
				},
			],
		)
	}
}
