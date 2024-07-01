import m from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import { ButtonType } from "../../gui/base/Button.js"
import { assertMainOrNode } from "../../api/common/Env"
import { show } from "../../gui/base/NotificationOverlay"
import { SettingsFacade } from "../common/generatedipc/SettingsFacade.js"

assertMainOrNode()

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
